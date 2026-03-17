import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DatabaseService } from '../shared/database.js';
import { ComplianceLogger } from '../shared/logger.js';
import type {
  ComplianceCriterion,
  CriterionResult,
  ComplianceScore,
  ComplianceLevel,
  ScoreTrend,
  ScoreHistory,
  DateRange,
} from '@compliancecore/shared';

@Injectable()
export class ScoreEngineService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: ComplianceLogger,
  ) {
    this.logger.setContext('ScoreEngineService');
  }

  async calculate(
    aggregateId: string,
    criteria: ComplianceCriterion[],
    entity: any,
  ): Promise<ComplianceScore> {
    const breakdown: CriterionResult[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    for (const criterion of criteria) {
      const result = criterion.evaluate(entity);
      breakdown.push(result);
      totalWeight += criterion.weight;
      weightedSum += result.score * criterion.weight;
    }

    const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
    const level = this.determineLevel(overall);
    const trend = await this.determineTrend(aggregateId, overall);

    const score: ComplianceScore = {
      id: ulid(),
      aggregateId,
      overall,
      level,
      breakdown,
      trend,
      calculatedAt: new Date(),
    };

    await this.saveScore(score);

    this.logger.log(`Score calculated for ${aggregateId}: ${overall} (${level})`, {
      aggregateId,
      overall,
      level,
      trend,
    });

    return score;
  }

  async getHistory(aggregateId: string, range: DateRange): Promise<ScoreHistory> {
    const scores = await this.db.query<ComplianceScore>(
      `SELECT id, aggregate_id AS "aggregateId", overall, level, breakdown, trend,
              calculated_at AS "calculatedAt"
       FROM compliance_scores
       WHERE aggregate_id = $1 AND calculated_at >= $2 AND calculated_at <= $3
       ORDER BY calculated_at ASC`,
      [aggregateId, range.start, range.end],
    );

    if (scores.length === 0) {
      return {
        scores: [],
        trend: 'ESTAVEL',
        average: 0,
        min: 0,
        max: 0,
      };
    }

    const overalls = scores.map(s => s.overall);
    const average = Math.round((overalls.reduce((a, b) => a + b, 0) / overalls.length) * 100) / 100;
    const min = Math.min(...overalls);
    const max = Math.max(...overalls);
    const trend = this.computeTrendFromScores(scores);

    return { scores, trend, average, min, max };
  }

  async saveScore(score: ComplianceScore): Promise<void> {
    await this.db.query(
      `INSERT INTO compliance_scores (id, aggregate_id, overall, level, breakdown, trend, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        score.id,
        score.aggregateId,
        score.overall,
        score.level,
        JSON.stringify(score.breakdown),
        score.trend,
        score.calculatedAt,
      ],
    );
  }

  async determineTrend(aggregateId: string, currentScore: number): Promise<ScoreTrend> {
    const recentScores = await this.db.query<{ overall: number }>(
      `SELECT overall
       FROM compliance_scores
       WHERE aggregate_id = $1
       ORDER BY calculated_at DESC
       LIMIT 3`,
      [aggregateId],
    );

    if (recentScores.length < 2) {
      return 'ESTAVEL';
    }

    const allScores = [currentScore, ...recentScores.map(s => s.overall)].slice(0, 3);
    return this.computeTrendFromValues(allScores);
  }

  private determineLevel(score: number): ComplianceLevel {
    if (score < 40) return 'CRITICO';
    if (score < 60) return 'ATENCAO';
    if (score < 80) return 'BOM';
    return 'EXCELENTE';
  }

  private computeTrendFromScores(scores: ComplianceScore[]): ScoreTrend {
    if (scores.length < 2) return 'ESTAVEL';
    const last3 = scores.slice(-3).map(s => s.overall);
    return this.computeTrendFromValues(last3);
  }

  private computeTrendFromValues(values: number[]): ScoreTrend {
    if (values.length < 2) return 'ESTAVEL';

    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < values.length; i++) {
      const diff = values[i - 1] - values[i];
      if (diff > 1) increasing++;
      else if (diff < -1) decreasing++;
    }

    if (increasing > decreasing) return 'MELHORANDO';
    if (decreasing > increasing) return 'PIORANDO';
    return 'ESTAVEL';
  }
}
