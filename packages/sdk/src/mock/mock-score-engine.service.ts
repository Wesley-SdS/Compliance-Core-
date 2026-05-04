import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
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
export class MockScoreEngineService {
  private scores: ComplianceScore[] = [];

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

    this.scores.push(score);
    return score;
  }

  async getHistory(aggregateId: string, range: DateRange): Promise<ScoreHistory> {
    const scores = this.scores
      .filter(s => s.aggregateId === aggregateId)
      .filter(s => new Date(s.calculatedAt) >= range.start && new Date(s.calculatedAt) <= range.end)
      .sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime());

    if (scores.length === 0) {
      return { scores: [], trend: 'ESTAVEL' as ScoreTrend, average: 0, min: 0, max: 0 };
    }

    const overalls = scores.map(s => s.overall);
    const average = Math.round((overalls.reduce((a, b) => a + b, 0) / overalls.length) * 100) / 100;

    return {
      scores,
      trend: this.computeTrendFromValues(overalls.slice(-3)),
      average,
      min: Math.min(...overalls),
      max: Math.max(...overalls),
    };
  }

  async saveScore(score: ComplianceScore): Promise<void> {
    this.scores.push(score);
  }

  async determineTrend(aggregateId: string, currentScore: number): Promise<ScoreTrend> {
    const recent = this.scores
      .filter(s => s.aggregateId === aggregateId)
      .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())
      .slice(0, 3)
      .map(s => s.overall);

    if (recent.length < 2) return 'ESTAVEL' as ScoreTrend;
    return this.computeTrendFromValues([currentScore, ...recent].slice(0, 3));
  }

  private determineLevel(score: number): ComplianceLevel {
    if (score < 40) return 'CRITICO' as ComplianceLevel;
    if (score < 60) return 'ATENCAO' as ComplianceLevel;
    if (score < 80) return 'BOM' as ComplianceLevel;
    return 'EXCELENTE' as ComplianceLevel;
  }

  private computeTrendFromValues(values: number[]): ScoreTrend {
    if (values.length < 2) return 'ESTAVEL' as ScoreTrend;
    let increasing = 0;
    let decreasing = 0;
    for (let i = 1; i < values.length; i++) {
      const diff = values[i - 1] - values[i];
      if (diff > 1) increasing++;
      else if (diff < -1) decreasing++;
    }
    if (increasing > decreasing) return 'MELHORANDO' as ScoreTrend;
    if (decreasing > increasing) return 'PIORANDO' as ScoreTrend;
    return 'ESTAVEL' as ScoreTrend;
  }
}
