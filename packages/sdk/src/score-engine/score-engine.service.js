"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreEngineService = void 0;
const common_1 = require("@nestjs/common");
const ulid_1 = require("ulid");
const database_js_1 = require("../shared/database.js");
const logger_js_1 = require("../shared/logger.js");
let ScoreEngineService = class ScoreEngineService {
    db;
    logger;
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
        this.logger.setContext('ScoreEngineService');
    }
    async calculate(aggregateId, criteria, entity) {
        const breakdown = [];
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
        const score = {
            id: (0, ulid_1.ulid)(),
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
    async getHistory(aggregateId, range) {
        const scores = await this.db.query(`SELECT id, aggregate_id AS "aggregateId", overall, level, breakdown, trend,
              calculated_at AS "calculatedAt"
       FROM compliance_scores
       WHERE aggregate_id = $1 AND calculated_at >= $2 AND calculated_at <= $3
       ORDER BY calculated_at ASC`, [aggregateId, range.start, range.end]);
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
    async saveScore(score) {
        await this.db.query(`INSERT INTO compliance_scores (id, aggregate_id, overall, level, breakdown, trend, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            score.id,
            score.aggregateId,
            score.overall,
            score.level,
            JSON.stringify(score.breakdown),
            score.trend,
            score.calculatedAt,
        ]);
    }
    async determineTrend(aggregateId, currentScore) {
        const recentScores = await this.db.query(`SELECT overall
       FROM compliance_scores
       WHERE aggregate_id = $1
       ORDER BY calculated_at DESC
       LIMIT 3`, [aggregateId]);
        if (recentScores.length < 2) {
            return 'ESTAVEL';
        }
        const allScores = [currentScore, ...recentScores.map(s => s.overall)].slice(0, 3);
        return this.computeTrendFromValues(allScores);
    }
    determineLevel(score) {
        if (score < 40)
            return 'CRITICO';
        if (score < 60)
            return 'ATENCAO';
        if (score < 80)
            return 'BOM';
        return 'EXCELENTE';
    }
    computeTrendFromScores(scores) {
        if (scores.length < 2)
            return 'ESTAVEL';
        const last3 = scores.slice(-3).map(s => s.overall);
        return this.computeTrendFromValues(last3);
    }
    computeTrendFromValues(values) {
        if (values.length < 2)
            return 'ESTAVEL';
        let increasing = 0;
        let decreasing = 0;
        for (let i = 1; i < values.length; i++) {
            const diff = values[i - 1] - values[i];
            if (diff > 1)
                increasing++;
            else if (diff < -1)
                decreasing++;
        }
        if (increasing > decreasing)
            return 'MELHORANDO';
        if (decreasing > increasing)
            return 'PIORANDO';
        return 'ESTAVEL';
    }
};
exports.ScoreEngineService = ScoreEngineService;
exports.ScoreEngineService = ScoreEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_js_1.DatabaseService,
        logger_js_1.ComplianceLogger])
], ScoreEngineService);
//# sourceMappingURL=score-engine.service.js.map