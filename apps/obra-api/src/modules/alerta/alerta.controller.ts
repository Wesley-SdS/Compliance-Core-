import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BetterAuthGuard, AlertEngineService, DatabaseService } from '@compliancecore/sdk';

@ApiTags('alertas')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('alertas')
export class AlertaController {
  constructor(
    private readonly alertEngine: AlertEngineService,
    private readonly db: DatabaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(@Query('status') status?: string, @Query('type') type?: string) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (type) {
      conditions.push(`alert_type = $${idx}`);
      params.push(type);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return this.db.query(
      `SELECT * FROM compliance_alerts ${where} ORDER BY due_date ASC LIMIT 100`,
      params,
    );
  }

  @Post(':alertId/acknowledge')
  @ApiOperation({ summary: 'Reconhecer alerta' })
  acknowledge(@Param('alertId') alertId: string) {
    return this.alertEngine.acknowledge(alertId);
  }
}
