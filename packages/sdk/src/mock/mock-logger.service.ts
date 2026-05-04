import { Injectable, Scope, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MockComplianceLogger implements NestLoggerService {
  private context = 'Mock';
  private silent = process.env.MOCK_SILENT === 'true';

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, ..._args: any[]) {
    if (!this.silent) console.log(`[MOCK:${this.context}] ${message}`);
  }

  error(message: string, trace?: string, ..._args: any[]) {
    if (!this.silent) console.error(`[MOCK:${this.context}] ERROR: ${message}`);
  }

  warn(message: string, ..._args: any[]) {
    if (!this.silent) console.warn(`[MOCK:${this.context}] WARN: ${message}`);
  }

  debug(message: string, ..._args: any[]) {
    if (!this.silent) console.debug(`[MOCK:${this.context}] DEBUG: ${message}`);
  }

  verbose(message: string, ..._args: any[]) {
    if (!this.silent) console.log(`[MOCK:${this.context}] VERBOSE: ${message}`);
  }
}
