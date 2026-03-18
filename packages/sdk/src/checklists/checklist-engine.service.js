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
exports.ChecklistEngineService = void 0;
const common_1 = require("@nestjs/common");
const ulid_1 = require("ulid");
const database_js_1 = require("../shared/database.js");
const config_js_1 = require("../shared/config.js");
const logger_js_1 = require("../shared/logger.js");
const vektus_adapter_service_js_1 = require("../vektus/vektus-adapter.service.js");
let ChecklistEngineService = class ChecklistEngineService {
    db;
    config;
    logger;
    vektus;
    constructor(db, config, logger, vektus) {
        this.db = db;
        this.config = config;
        this.logger = logger;
        this.vektus = vektus;
        this.logger.setContext('ChecklistEngineService');
    }
    async generate(aggregateId, entityType, context) {
        const vertical = this.config.vertical;
        // Search Vektus for requirements applicable to this entity type
        const searchQuery = `Requisitos de compliance para ${entityType} no setor ${vertical}${context ? ': ' + context : ''}`;
        const searchResults = await this.vektus.search(searchQuery, {
            filters: { vertical },
            topK: 20,
        });
        // Build checklist items from search results
        const items = [];
        const seenQuestions = new Set();
        for (const result of searchResults) {
            const extractedItems = this.extractChecklistItems(result.content, result.metadata);
            for (const item of extractedItems) {
                const normalizedQuestion = item.question.toLowerCase().trim();
                if (!seenQuestions.has(normalizedQuestion)) {
                    seenQuestions.add(normalizedQuestion);
                    items.push({
                        id: (0, ulid_1.ulid)(),
                        question: item.question,
                        category: item.category,
                        required: item.required,
                        helpText: item.helpText,
                        regulationRef: item.regulationRef,
                    });
                }
            }
        }
        // If no items found from Vektus, generate default compliance items
        if (items.length === 0) {
            items.push(...this.getDefaultItems(entityType, vertical));
        }
        const checklistId = (0, ulid_1.ulid)();
        const checklist = {
            id: checklistId,
            aggregateId,
            entityType,
            vertical,
            items,
            status: 'PENDING',
            createdAt: new Date(),
        };
        // Persist checklist
        await this.db.query(`INSERT INTO compliance_checklists (id, aggregate_id, entity_type, vertical, items, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            checklist.id,
            checklist.aggregateId,
            checklist.entityType,
            checklist.vertical,
            JSON.stringify(checklist.items),
            checklist.status,
            checklist.createdAt,
        ]);
        this.logger.log(`Checklist generated with ${items.length} items for ${entityType}/${aggregateId}`, {
            checklistId,
        });
        return checklist;
    }
    async evaluate(checklistId, responses) {
        // Load the checklist
        const checklist = await this.db.queryOne(`SELECT id, aggregate_id AS "aggregateId", entity_type AS "entityType",
              vertical, items, status, created_at AS "createdAt"
       FROM compliance_checklists
       WHERE id = $1`, [checklistId]);
        if (!checklist) {
            throw new Error(`Checklist not found: ${checklistId}`);
        }
        const items = typeof checklist.items === 'string'
            ? JSON.parse(checklist.items)
            : checklist.items;
        const responseMap = new Map(responses.map(r => [r.itemId, r]));
        let conformeCount = 0;
        let naoConformeCount = 0;
        let parcialCount = 0;
        let naCount = 0;
        let answered = 0;
        for (const item of items) {
            const response = responseMap.get(item.id);
            if (!response)
                continue;
            answered++;
            switch (response.answer) {
                case 'SIM':
                    conformeCount++;
                    break;
                case 'NAO':
                    naoConformeCount++;
                    break;
                case 'PARCIAL':
                    parcialCount++;
                    break;
                case 'NA':
                    naCount++;
                    break;
            }
        }
        // Calculate conformity score: (conforme + 0.5*parcial) / (total - NA) * 100
        const applicableItems = answered - naCount;
        const score = applicableItems > 0
            ? Math.round(((conformeCount + parcialCount * 0.5) / applicableItems) * 10000) / 100
            : 100;
        const result = {
            checklistId,
            totalItems: items.length,
            answered,
            conformeCount,
            naoConformeCount,
            parcialCount,
            naCount,
            score,
            completedAt: new Date(),
        };
        // Persist result, responses, and status update atomically
        const newStatus = answered >= items.length ? 'COMPLETED' : 'IN_PROGRESS';
        await this.db.transaction(async (query) => {
            await query(`INSERT INTO checklist_results
           (checklist_id, total_items, answered, conforme_count, nao_conforme_count,
            parcial_count, na_count, score, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                result.checklistId,
                result.totalItems,
                result.answered,
                result.conformeCount,
                result.naoConformeCount,
                result.parcialCount,
                result.naCount,
                result.score,
                result.completedAt,
            ]);
            // Save individual responses
            for (const response of responses) {
                await query(`INSERT INTO checklist_responses (id, checklist_id, item_id, answer, notes, evidence_ids, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
                    (0, ulid_1.ulid)(),
                    checklistId,
                    response.itemId,
                    response.answer,
                    response.notes ?? null,
                    JSON.stringify(response.evidenceIds ?? []),
                ]);
            }
            // Update checklist status
            await query(`UPDATE compliance_checklists SET status = $1 WHERE id = $2`, [newStatus, checklistId]);
        });
        this.logger.log(`Checklist evaluated: ${checklistId}, score: ${score}%`, {
            checklistId,
            score,
            answered,
            totalItems: items.length,
        });
        return result;
    }
    extractChecklistItems(content, metadata) {
        const items = [];
        // Extract questions/requirements from content chunks
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            const trimmed = line.trim();
            // Match lines that look like requirements or questions
            if (trimmed.endsWith('?') ||
                /^(deve|obrigatório|necessário|requer|exige)/i.test(trimmed) ||
                /^\d+[\.\)]\s+/.test(trimmed)) {
                const cleaned = trimmed.replace(/^\d+[\.\)]\s+/, '').replace(/^[-*]\s+/, '');
                if (cleaned.length > 10 && cleaned.length < 500) {
                    const isRequired = /obrigatório|deve|exige|necessário/i.test(cleaned);
                    const category = metadata.category || 'Geral';
                    const regulationRef = metadata.regulationRef || undefined;
                    items.push({
                        question: cleaned.endsWith('?') ? cleaned : `${cleaned}?`,
                        category,
                        required: isRequired,
                        helpText: regulationRef ? `Ref: ${regulationRef}` : undefined,
                        regulationRef,
                    });
                }
            }
        }
        return items;
    }
    getDefaultItems(entityType, vertical) {
        const defaults = [
            {
                id: (0, ulid_1.ulid)(),
                question: 'A entidade possui todos os alvarás e licenças de funcionamento válidos?',
                category: 'Licenciamento',
                required: true,
                helpText: 'Verificar validade de todos os documentos de funcionamento',
            },
            {
                id: (0, ulid_1.ulid)(),
                question: 'O cadastro da entidade está atualizado junto aos órgãos reguladores?',
                category: 'Cadastro',
                required: true,
                helpText: 'Confirmar atualização cadastral',
            },
            {
                id: (0, ulid_1.ulid)(),
                question: 'Existem pendências fiscais ou tributárias?',
                category: 'Tributário',
                required: true,
                helpText: 'Consultar certidões negativas de débito',
            },
            {
                id: (0, ulid_1.ulid)(),
                question: 'Os profissionais responsáveis possuem habilitação válida?',
                category: 'Habilitação',
                required: true,
                helpText: 'Verificar registros profissionais e habilitações',
            },
            {
                id: (0, ulid_1.ulid)(),
                question: 'Os processos internos estão documentados e atualizados?',
                category: 'Processos',
                required: false,
                helpText: 'Avaliar procedimentos operacionais padrão',
            },
            {
                id: (0, ulid_1.ulid)(),
                question: 'Existe um plano de contingência para não-conformidades?',
                category: 'Gestão de Riscos',
                required: false,
                helpText: 'Verificar planos de ação para situações de não-conformidade',
            },
        ];
        return defaults;
    }
};
exports.ChecklistEngineService = ChecklistEngineService;
exports.ChecklistEngineService = ChecklistEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_js_1.DatabaseService,
        config_js_1.ComplianceCoreConfigService,
        logger_js_1.ComplianceLogger,
        vektus_adapter_service_js_1.VektusAdapterService])
], ChecklistEngineService);
//# sourceMappingURL=checklist-engine.service.js.map