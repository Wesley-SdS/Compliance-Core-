import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AlertEngineService } from '@compliancecore/sdk';

@Processor('alerts')
export class AlertProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertProcessor.name);

  constructor(
    private readonly alertEngine: AlertEngineService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing alert job: ${job.name}`);

    switch (job.name) {
      case 'check-due':
        return this.checkDueAlerts();
      default:
        this.logger.warn(`Unknown alert job: ${job.name}`);
        return { skipped: true };
    }
  }

  private async checkDueAlerts() {
    const dueAlerts = await this.alertEngine.checkDue();
    this.logger.log(`Found ${dueAlerts.length} due alerts`);
    return { dueAlerts: dueAlerts.length };
  }
}
