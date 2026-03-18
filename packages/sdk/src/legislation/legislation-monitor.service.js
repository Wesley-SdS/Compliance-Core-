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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegislationMonitorService = void 0;
const common_1 = require("@nestjs/common");
const ulid_1 = require("ulid");
const axios_1 = __importDefault(require("axios"));
const database_js_1 = require("../shared/database.js");
const config_js_1 = require("../shared/config.js");
const logger_js_1 = require("../shared/logger.js");
const vektus_adapter_service_js_1 = require("../vektus/vektus-adapter.service.js");
let LegislationMonitorService = class LegislationMonitorService {
    db;
    config;
    logger;
    vektus;
    sources = new Map();
    constructor(db, config, logger, vektus) {
        this.db = db;
        this.config = config;
        this.logger = logger;
        this.vektus = vektus;
        this.logger.setContext('LegislationMonitorService');
    }
    async registerSource(source) {
        const id = (0, ulid_1.ulid)();
        const fullSource = { id, ...source };
        await this.db.query(`INSERT INTO legislation_sources (id, name, affected_verticals, cron_expression, url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = $2, affected_verticals = $3, cron_expression = $4, url = $5`, [id, source.name, JSON.stringify(source.affectedVerticals), source.cronExpression, source.url ?? null]);
        this.sources.set(id, fullSource);
        this.logger.log(`Legislation source registered: ${source.name}`, { sourceId: id });
        return fullSource;
    }
    async check() {
        const allSources = await this.loadSources();
        const newLegislation = [];
        for (const source of allSources) {
            try {
                const items = await this.fetchFromSource(source);
                for (const item of items) {
                    const exists = await this.db.queryOne(`SELECT id FROM legislation_items WHERE source_id = $1 AND title = $2`, [source.id, item.title]);
                    if (!exists) {
                        const legislation = {
                            id: (0, ulid_1.ulid)(),
                            sourceId: source.id,
                            title: item.title,
                            summary: item.summary,
                            url: item.url,
                            publishedAt: item.publishedAt,
                            affectedVerticals: source.affectedVerticals,
                        };
                        await this.db.query(`INSERT INTO legislation_items (id, source_id, title, summary, url, published_at, affected_verticals, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, [
                            legislation.id,
                            legislation.sourceId,
                            legislation.title,
                            legislation.summary,
                            legislation.url ?? null,
                            legislation.publishedAt,
                            JSON.stringify(legislation.affectedVerticals),
                        ]);
                        newLegislation.push(legislation);
                        this.logger.log(`New legislation found: ${legislation.title}`, {
                            legislationId: legislation.id,
                            sourceId: source.id,
                        });
                    }
                }
            }
            catch (error) {
                this.logger.error(`Failed to check source ${source.name}: ${error.message}`, error.stack);
            }
        }
        return newLegislation;
    }
    async ingestToVektus(legislation) {
        const content = `# ${legislation.title}\n\n${legislation.summary}\n\nPublicado em: ${legislation.publishedAt.toISOString()}\nFonte: ${legislation.url ?? 'N/A'}`;
        const result = await this.vektus.ingest(content, {
            fileName: `legislation-${legislation.id}.md`,
            vertical: this.config.vertical,
            category: 'legislation',
            tags: ['legislation', ...legislation.affectedVerticals],
            legislationId: legislation.id,
            sourceId: legislation.sourceId,
        });
        await this.db.query(`UPDATE legislation_items SET vektus_file_id = $1 WHERE id = $2`, [result.fileId, legislation.id]);
        this.logger.log(`Legislation ingested to Vektus: ${legislation.title}`, {
            legislationId: legislation.id,
            vektusFileId: result.fileId,
        });
    }
    async analyzeImpact(legislationId, entityId) {
        const legislation = await this.db.queryOne(`SELECT id, source_id AS "sourceId", title, summary, url, published_at AS "publishedAt",
              affected_verticals AS "affectedVerticals"
       FROM legislation_items WHERE id = $1`, [legislationId]);
        if (!legislation) {
            throw new Error(`Legislation not found: ${legislationId}`);
        }
        const searchResults = await this.vektus.search(`Impacto da legislação "${legislation.title}" no compliance: ${legislation.summary}`, {
            filters: { vertical: this.config.vertical },
            topK: 5,
        });
        const contextChunks = searchResults.map(r => r.content).join('\n\n');
        const skillsContext = await this.vektus.injectSkills('L3', contextChunks, {
            vertical: this.config.vertical,
        });
        const impactAnalysis = this.parseImpactFromContext(skillsContext.context, legislation, entityId);
        await this.db.query(`INSERT INTO legislation_impact_reports (id, legislation_id, entity_id, impact_level, affected_areas, required_actions, deadline, analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`, [
            (0, ulid_1.ulid)(),
            legislationId,
            entityId,
            impactAnalysis.impactLevel,
            JSON.stringify(impactAnalysis.affectedAreas),
            JSON.stringify(impactAnalysis.requiredActions),
            impactAnalysis.deadline ?? null,
            impactAnalysis.analysis,
        ]);
        this.logger.log(`Impact analysis completed for legislation ${legislationId}`, {
            entityId,
            impactLevel: impactAnalysis.impactLevel,
        });
        return impactAnalysis;
    }
    async loadSources() {
        const rows = await this.db.query(`SELECT id, name, affected_verticals AS "affectedVerticals", cron_expression AS "cronExpression", url
       FROM legislation_sources`);
        for (const source of rows) {
            this.sources.set(source.id, source);
        }
        return rows;
    }
    async fetchFromSource(source) {
        if (!source.url) {
            return [];
        }
        try {
            const response = await axios_1.default.get(source.url, { timeout: 15000 });
            const data = response.data;
            if (Array.isArray(data)) {
                return data.map((item) => ({
                    title: item.title || item.nome || '',
                    summary: item.summary || item.ementa || item.resumo || '',
                    url: item.url || item.link,
                    publishedAt: new Date(item.publishedAt || item.dataPublicacao || item.date || Date.now()),
                }));
            }
            if (data.items && Array.isArray(data.items)) {
                return data.items.map((item) => ({
                    title: item.title || item.nome || '',
                    summary: item.summary || item.ementa || item.resumo || '',
                    url: item.url || item.link,
                    publishedAt: new Date(item.publishedAt || item.dataPublicacao || item.date || Date.now()),
                }));
            }
            return [];
        }
        catch (error) {
            this.logger.warn(`Failed to fetch from source ${source.name}: ${error.message}`);
            return [];
        }
    }
    parseImpactFromContext(context, legislation, entityId) {
        const hasHighImpactKeywords = /obrigatório|multa|sanção|penalidade|imediato/i.test(context);
        const hasMediumImpactKeywords = /recomendado|adequação|prazo|atualização/i.test(context);
        let impactLevel = 'BAIXO';
        if (hasHighImpactKeywords)
            impactLevel = 'ALTO';
        else if (hasMediumImpactKeywords)
            impactLevel = 'MEDIO';
        const affectedAreas = [];
        const areaKeywords = {
            'Documentação': /documento|registro|arquivo|certidão/i,
            'Licenciamento': /licença|alvará|autorização|permissão/i,
            'Tributário': /imposto|tributo|fiscal|contribuição/i,
            'Trabalhista': /trabalho|empregado|funcionário|CLT/i,
            'Ambiental': /ambiental|meio ambiente|resíduo|poluição/i,
            'Sanitário': /sanitário|saúde|anvisa|vigilância/i,
            'Segurança': /segurança|proteção|EPI|norma regulamentadora/i,
        };
        for (const [area, regex] of Object.entries(areaKeywords)) {
            if (regex.test(context) || regex.test(legislation.summary)) {
                affectedAreas.push(area);
            }
        }
        if (affectedAreas.length === 0) {
            affectedAreas.push('Geral');
        }
        const requiredActions = [];
        if (impactLevel === 'ALTO') {
            requiredActions.push('Revisar procedimentos internos imediatamente');
            requiredActions.push('Atualizar documentação de compliance');
            requiredActions.push('Notificar responsáveis');
        }
        else if (impactLevel === 'MEDIO') {
            requiredActions.push('Avaliar necessidade de adequação');
            requiredActions.push('Planejar atualização de processos');
        }
        else {
            requiredActions.push('Monitorar atualizações futuras');
        }
        return {
            legislationId: legislation.id,
            entityId,
            impactLevel,
            affectedAreas,
            requiredActions,
            deadline: impactLevel === 'ALTO' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
            analysis: context.substring(0, 2000),
        };
    }
};
exports.LegislationMonitorService = LegislationMonitorService;
exports.LegislationMonitorService = LegislationMonitorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_js_1.DatabaseService,
        config_js_1.ComplianceCoreConfigService,
        logger_js_1.ComplianceLogger,
        vektus_adapter_service_js_1.VektusAdapterService])
], LegislationMonitorService);
//# sourceMappingURL=legislation-monitor.service.js.map