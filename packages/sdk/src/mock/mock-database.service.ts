import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class MockDatabaseService implements OnModuleInit, OnModuleDestroy {
  private tables = new Map<string, any[]>();
  private debug = process.env.MOCK_DEBUG === 'true';

  async onModuleInit() {
    if (this.debug) console.log('[MockDB] Initialized (in-memory mode)');
  }

  async onModuleDestroy() {
    this.tables.clear();
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (this.debug) console.log('[MockDB]', text.trim().substring(0, 80), params?.slice(0, 3));

    const table = this.extractTable(text);
    if (!table) return [];

    if (/^\s*INSERT/i.test(text)) {
      return this.handleInsert<T>(table, text, params);
    }
    if (/^\s*SELECT\s+COUNT/i.test(text)) {
      return this.handleCount<T>(table, text, params);
    }
    if (/^\s*SELECT/i.test(text)) {
      return this.handleSelect<T>(table, text, params);
    }
    if (/^\s*UPDATE/i.test(text)) {
      return this.handleUpdate<T>(table, text, params);
    }
    if (/^\s*DELETE/i.test(text)) {
      return this.handleDelete<T>(table, text, params);
    }

    return [];
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] ?? null;
  }

  async transaction<T>(fn: (query: (text: string, params?: any[]) => Promise<any[]>) => Promise<T>): Promise<T> {
    return fn((text, params) => this.query(text, params));
  }

  // --- internal helpers ---

  private getTable(name: string): any[] {
    if (!this.tables.has(name)) {
      this.tables.set(name, []);
    }
    return this.tables.get(name)!;
  }

  private extractTable(sql: string): string | null {
    const match = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
    return match?.[1] ?? null;
  }

  private handleInsert<T>(table: string, sql: string, params?: any[]): T[] {
    const rows = this.getTable(table);

    // Build a row from params - use column names from SQL
    const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    const columns = colMatch?.[1]?.split(',').map(c => c.trim()) ?? [];

    const row: any = {};
    columns.forEach((col, i) => {
      if (params && i < params.length) {
        // Try to parse JSON strings back to objects
        const val = params[i];
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { row[col] = JSON.parse(val); } catch { row[col] = val; }
        } else {
          row[col] = val;
        }
      }
    });

    // Add timestamps if not present
    if (!row.created_at) row.created_at = new Date();
    if (!row.updated_at) row.updated_at = new Date();

    rows.push(row);

    // Handle RETURNING clause - map column aliases
    if (/RETURNING/i.test(sql)) {
      const mapped = this.applyAliases(row, sql);
      return [mapped as T];
    }

    return [];
  }

  private handleSelect<T>(table: string, sql: string, params?: any[]): T[] {
    const rows = this.getTable(table);
    let filtered = [...rows];

    // Apply WHERE filters
    if (params && params.length > 0) {
      filtered = this.applyWhereFilters(filtered, sql, params);
    }

    // Apply ORDER BY
    if (/ORDER BY.*DESC/i.test(sql)) {
      filtered.reverse();
    }

    // Apply LIMIT
    const limitMatch = sql.match(/LIMIT\s+\$(\d+)/i);
    if (limitMatch && params) {
      const limitIdx = parseInt(limitMatch[1]) - 1;
      const limit = params[limitIdx];
      const offsetMatch = sql.match(/OFFSET\s+\$(\d+)/i);
      const offset = offsetMatch && params ? params[parseInt(offsetMatch[1]) - 1] : 0;
      filtered = filtered.slice(offset, offset + limit);
    }

    // Apply aliases from SELECT clause
    return filtered.map(row => this.applyAliases(row, sql) as T);
  }

  private handleCount<T>(table: string, sql: string, params?: any[]): T[] {
    const rows = this.getTable(table);
    let filtered = [...rows];

    if (params && params.length > 0) {
      filtered = this.applyWhereFilters(filtered, sql, params);
    }

    return [{ count: String(filtered.length) } as T];
  }

  private handleUpdate<T>(table: string, sql: string, params?: any[]): T[] {
    const rows = this.getTable(table);

    // Find rows matching WHERE clause and update them
    if (params && params.length > 0) {
      for (const row of rows) {
        if (this.matchesWhere(row, sql, params)) {
          // Apply SET clause values
          const setMatch = sql.match(/SET\s+(.*?)\s+WHERE/is);
          if (setMatch) {
            const assignments = setMatch[1].split(',');
            for (const assignment of assignments) {
              const m = assignment.match(/(\w+)\s*=\s*\$(\d+)/);
              if (m && params) {
                row[m[1]] = params[parseInt(m[2]) - 1];
              }
              // Handle NOW()
              const nowMatch = assignment.match(/(\w+)\s*=\s*NOW\(\)/i);
              if (nowMatch) {
                row[nowMatch[1]] = new Date();
              }
            }
          }
        }
      }
    }

    return [];
  }

  private handleDelete<T>(table: string, _sql: string, params?: any[]): T[] {
    if (params && params.length > 0) {
      const rows = this.getTable(table);
      const filtered = rows.filter(row => !this.matchesWhere(row, _sql, params));
      this.tables.set(table, filtered);
    }
    return [];
  }

  private applyWhereFilters(rows: any[], sql: string, params: any[]): any[] {
    // Extract WHERE conditions like column = $N, column >= $N, etc.
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s*$)/is);
    if (!whereMatch) return rows;

    return rows.filter(row => this.matchesWhere(row, sql, params));
  }

  private matchesWhere(row: any, sql: string, params: any[]): boolean {
    // Match simple conditions: column = $N
    const conditions = sql.match(/(\w+)\s*=\s*\$(\d+)/g) ?? [];
    for (const cond of conditions) {
      const m = cond.match(/(\w+)\s*=\s*\$(\d+)/);
      if (m) {
        const col = m[1];
        const val = params[parseInt(m[2]) - 1];
        if (row[col] !== val && String(row[col]) !== String(val)) return false;
      }
    }
    return true;
  }

  private applyAliases(row: any, sql: string): any {
    const result = { ...row };
    // Match patterns like: column AS "aliasName"
    const aliasPattern = /(\w+)\s+AS\s+"(\w+)"/gi;
    let match;
    while ((match = aliasPattern.exec(sql)) !== null) {
      const col = match[1];
      const alias = match[2];
      if (col in result) {
        result[alias] = result[col];
      }
    }
    return result;
  }
}
