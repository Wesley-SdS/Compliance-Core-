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
exports.VektusAdapterService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const config_js_1 = require("../shared/config.js");
const logger_js_1 = require("../shared/logger.js");
let VektusAdapterService = class VektusAdapterService {
    config;
    logger;
    client;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.logger.setContext('VektusAdapterService');
        this.client = axios_1.default.create({
            baseURL: this.config.vektus.baseUrl,
            headers: {
                Authorization: `Bearer ${this.config.vektus.apiKey}`,
                'Content-Type': 'application/json',
                'X-Project-Id': this.config.vektus.projectId,
            },
            timeout: 30000,
        });
    }
    async search(query, options) {
        try {
            const response = await this.client.post('/api/rag/search', {
                query,
                filters: options?.filters,
                topK: options?.topK ?? 10,
                threshold: options?.threshold ?? 0.7,
            });
            this.logger.log(`Vektus search completed: ${response.data.results?.length ?? 0} results`, {
                query: query.substring(0, 100),
            });
            return response.data.results ?? [];
        }
        catch (error) {
            this.logger.error(`Vektus search failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async ingest(content, metadata) {
        try {
            const response = await this.client.post('/api/rag/ingest', {
                content,
                metadata,
            });
            this.logger.log(`Vektus ingest queued: ${metadata.fileName}`, {
                fileId: response.data.fileId,
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Vektus ingest failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getFileStatus(fileId) {
        try {
            const response = await this.client.get(`/api/rag/files/${fileId}/status`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Vektus getFileStatus failed for ${fileId}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async injectSkills(level, context, options) {
        try {
            const response = await this.client.post('/api/rag/skills/inject', {
                level,
                context,
                maxTokens: options?.maxTokens ?? 4096,
                vertical: options?.vertical ?? this.config.vertical,
            });
            this.logger.log(`Vektus skills injected at level ${level}`, {
                tokens: response.data.tokens,
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Vektus skills injection failed: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.VektusAdapterService = VektusAdapterService;
exports.VektusAdapterService = VektusAdapterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_js_1.ComplianceCoreConfigService,
        logger_js_1.ComplianceLogger])
], VektusAdapterService);
//# sourceMappingURL=vektus-adapter.service.js.map