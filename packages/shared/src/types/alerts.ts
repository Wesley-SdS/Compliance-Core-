export type AlertChannel = 'push' | 'email' | 'in_app';
export type AlertStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'EXPIRED';

export interface AlertConfig {
  entityId: string;
  entityType: string;
  vertical: string;
  alertType: string;
  dueDate: Date;
  daysBeforeAlert: number[];
  channels: AlertChannel[];
  metadata?: Record<string, unknown>;
}

export interface DueAlert {
  id: string;
  entityId: string;
  entityType: string;
  alertType: string;
  dueDate: Date;
  daysUntilDue: number;
  status: AlertStatus;
  channels: AlertChannel[];
}
