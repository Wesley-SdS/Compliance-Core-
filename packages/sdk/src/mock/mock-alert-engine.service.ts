import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import type { AlertConfig, DueAlert, AlertStatus } from '@compliancecore/shared';

@Injectable()
export class MockAlertEngineService {
  private alerts: Array<AlertConfig & { id: string; status: AlertStatus; createdAt: Date }> = [];

  async register(alertConfig: AlertConfig): Promise<string> {
    const id = ulid();
    this.alerts.push({ ...alertConfig, id, status: 'PENDING' as AlertStatus, createdAt: new Date() });
    return id;
  }

  async checkDue(): Promise<DueAlert[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueAlerts: DueAlert[] = [];

    for (const alert of this.alerts) {
      if (alert.status !== 'PENDING') continue;

      const dueDate = new Date(alert.dueDate);
      const diffMs = dueDate.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (alert.daysBeforeAlert.includes(daysUntilDue)) {
        alert.status = 'SENT' as AlertStatus;
        dueAlerts.push({
          id: alert.id,
          entityId: alert.entityId,
          entityType: alert.entityType,
          alertType: alert.alertType,
          dueDate,
          daysUntilDue,
          status: 'SENT' as AlertStatus,
          channels: alert.channels,
        });
      }
    }

    return dueAlerts;
  }

  async acknowledge(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) alert.status = 'ACKNOWLEDGED' as AlertStatus;
  }

  async getUpcoming(entityId: string, days: number = 30): Promise<DueAlert[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.alerts
      .filter(a => a.entityId === entityId && ['PENDING', 'SENT'].includes(a.status))
      .filter(a => {
        const d = new Date(a.dueDate);
        return d >= now && d <= futureDate;
      })
      .map(a => {
        const dueDate = new Date(a.dueDate);
        return {
          id: a.id,
          entityId: a.entityId,
          entityType: a.entityType,
          alertType: a.alertType,
          dueDate,
          daysUntilDue: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          status: a.status,
          channels: a.channels,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
}
