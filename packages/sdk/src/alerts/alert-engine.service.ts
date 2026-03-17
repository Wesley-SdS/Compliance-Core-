import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DatabaseService } from '../shared/database.js';
import { ComplianceCoreConfigService } from '../shared/config.js';
import { ComplianceLogger } from '../shared/logger.js';
import type { AlertConfig, DueAlert, AlertStatus } from '@compliancecore/shared';

@Injectable()
export class AlertEngineService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ComplianceCoreConfigService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('AlertEngineService');
  }

  async register(alertConfig: AlertConfig): Promise<string> {
    const id = ulid();

    await this.db.query(
      `INSERT INTO compliance_alerts (id, entity_id, entity_type, vertical, alert_type, due_date, days_before_alert, channels, metadata, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', NOW())`,
      [
        id,
        alertConfig.entityId,
        alertConfig.entityType,
        alertConfig.vertical,
        alertConfig.alertType,
        alertConfig.dueDate,
        JSON.stringify(alertConfig.daysBeforeAlert),
        JSON.stringify(alertConfig.channels),
        JSON.stringify(alertConfig.metadata ?? {}),
      ],
    );

    this.logger.log(`Alert registered: ${alertConfig.alertType} for ${alertConfig.entityId}`, {
      alertId: id,
      dueDate: alertConfig.dueDate.toISOString(),
    });

    return id;
  }

  async checkDue(): Promise<DueAlert[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts = await this.db.query<{
      id: string;
      entity_id: string;
      entity_type: string;
      alert_type: string;
      due_date: Date;
      days_before_alert: number[];
      channels: string[];
      status: AlertStatus;
    }>(
      `SELECT id, entity_id, entity_type, alert_type, due_date, days_before_alert, channels, status
       FROM compliance_alerts
       WHERE status = 'PENDING'
         AND due_date >= NOW()`,
    );

    const dueAlerts: DueAlert[] = [];

    for (const alert of alerts) {
      const dueDate = new Date(alert.due_date);
      const diffMs = dueDate.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const daysBeforeAlert = typeof alert.days_before_alert === 'string'
        ? JSON.parse(alert.days_before_alert as unknown as string)
        : alert.days_before_alert;

      if (daysBeforeAlert.includes(daysUntilDue)) {
        const channels = typeof alert.channels === 'string'
          ? JSON.parse(alert.channels as unknown as string)
          : alert.channels;

        dueAlerts.push({
          id: alert.id,
          entityId: alert.entity_id,
          entityType: alert.entity_type,
          alertType: alert.alert_type,
          dueDate,
          daysUntilDue,
          status: 'SENT',
          channels,
        });
      }
    }

    // Update all due alert statuses in a single transaction
    if (dueAlerts.length > 0) {
      await this.db.transaction(async (query) => {
        for (const alert of dueAlerts) {
          await query(
            `UPDATE compliance_alerts SET status = 'SENT', updated_at = NOW() WHERE id = $1`,
            [alert.id],
          );
        }
      });

      this.logger.log(`Found ${dueAlerts.length} due alerts`);
    }

    return dueAlerts;
  }

  async acknowledge(alertId: string): Promise<void> {
    await this.db.query(
      `UPDATE compliance_alerts SET status = 'ACKNOWLEDGED', updated_at = NOW() WHERE id = $1`,
      [alertId],
    );

    this.logger.log(`Alert acknowledged: ${alertId}`);
  }

  async getUpcoming(entityId: string, days: number = 30): Promise<DueAlert[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const alerts = await this.db.query<{
      id: string;
      entity_id: string;
      entity_type: string;
      alert_type: string;
      due_date: Date;
      status: AlertStatus;
      channels: string[];
    }>(
      `SELECT id, entity_id, entity_type, alert_type, due_date, status, channels
       FROM compliance_alerts
       WHERE entity_id = $1
         AND due_date >= $2
         AND due_date <= $3
         AND status IN ('PENDING', 'SENT')
       ORDER BY due_date ASC`,
      [entityId, now, futureDate],
    );

    return alerts.map(alert => {
      const dueDate = new Date(alert.due_date);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const channels = typeof alert.channels === 'string'
        ? JSON.parse(alert.channels as unknown as string)
        : alert.channels;

      return {
        id: alert.id,
        entityId: alert.entity_id,
        entityType: alert.entity_type,
        alertType: alert.alert_type,
        dueDate,
        daysUntilDue,
        status: alert.status,
        channels,
      };
    });
  }
}
