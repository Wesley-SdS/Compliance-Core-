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
exports.ComplianceCoreConfigService = void 0;
const common_1 = require("@nestjs/common");
let ComplianceCoreConfigService = class ComplianceCoreConfigService {
    config;
    constructor(config) {
        this.config = config;
    }
    get database() { return this.config.database; }
    get redis() { return this.config.redis; }
    get vektus() { return this.config.vektus; }
    get storage() { return this.config.storage; }
    get vertical() { return this.config.vertical; }
    get selfUrl() { return this.config.selfUrl; }
    static fromEnv() {
        const isProduction = process.env.NODE_ENV === 'production';
        // Fail-fast validation in production
        if (isProduction) {
            const required = {
                DB_PASSWORD: process.env.DB_PASSWORD,
                VEKTUS_API_KEY: process.env.VEKTUS_API_KEY,
                BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
                VEKTUS_WEBHOOK_SECRET: process.env.VEKTUS_WEBHOOK_SECRET,
            };
            const missing = Object.entries(required)
                .filter(([, value]) => !value)
                .map(([key]) => key);
            if (missing.length > 0) {
                throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
            }
            if (process.env.DB_PASSWORD === 'postgres') {
                throw new Error('DB_PASSWORD cannot be "postgres" in production');
            }
        }
        else {
            // Development warnings for optional vars
            const optional = ['VEKTUS_API_KEY', 'BETTER_AUTH_SECRET', 'VEKTUS_WEBHOOK_SECRET', 'R2_ENDPOINT', 'R2_ACCESS_KEY', 'R2_SECRET_KEY'];
            const missingOptional = optional.filter(key => !process.env[key]);
            if (missingOptional.length > 0) {
                console.warn(`[ComplianceCore] Missing optional env vars (dev mode): ${missingOptional.join(', ')}`);
            }
        }
        return {
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'compliancecore',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
            },
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
            },
            vektus: {
                baseUrl: process.env.VEKTUS_BASE_URL || 'https://vektus.adalink.com',
                apiKey: process.env.VEKTUS_API_KEY || '',
                webhookSecret: process.env.VEKTUS_WEBHOOK_SECRET || '',
                projectId: process.env.VEKTUS_PROJECT_ID || '',
            },
            storage: {
                endpoint: process.env.R2_ENDPOINT || '',
                accessKey: process.env.R2_ACCESS_KEY || '',
                secretKey: process.env.R2_SECRET_KEY || '',
                bucket: process.env.R2_BUCKET || 'compliancecore',
                publicUrl: process.env.R2_PUBLIC_URL || '',
            },
            vertical: process.env.VERTICAL || '',
            selfUrl: process.env.SELF_URL || 'http://localhost:3000',
        };
    }
};
exports.ComplianceCoreConfigService = ComplianceCoreConfigService;
exports.ComplianceCoreConfigService = ComplianceCoreConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], ComplianceCoreConfigService);
//# sourceMappingURL=config.js.map