import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { AlertEngineService, DatabaseService } from '@compliancecore/sdk';

@Processor('obra-alerts')
export class AlertProcessor {
  private readonly logger = new Logger('AlertProcessor');

  constructor(
    private readonly alertEngine: AlertEngineService,
    private readonly db: DatabaseService,
  ) {}

  @Process()
  async process(job: { name: string; data: any }): Promise<void> {
    this.logger.log(`Processing alert job: ${job.name}`);

    if (job.name === 'check-due') {
      await this.checkDueAlerts();
    }
  }

  private async checkDueAlerts(): Promise<void> {
    const obras = await this.db.query(`SELECT id FROM obras WHERE status != 'CONCLUIDA'`);
    let totalAlerts = 0;

    for (const obra of obras) {
      try {
        const upcoming = await this.alertEngine.getUpcoming(obra.id, 30);
        totalAlerts += upcoming?.length || 0;
      } catch (err) {
        this.logger.warn(`Alert check failed for obra ${obra.id}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Alert check complete: ${totalAlerts} upcoming alerts for ${obras.length} obras`);
  }
}
