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
exports.DocumentManagerService = void 0;
const common_1 = require("@nestjs/common");
const ulid_1 = require("ulid");
const database_js_1 = require("../shared/database.js");
const config_js_1 = require("../shared/config.js");
const logger_js_1 = require("../shared/logger.js");
const vektus_adapter_service_js_1 = require("../vektus/vektus-adapter.service.js");
let DocumentManagerService = class DocumentManagerService {
    db;
    config;
    logger;
    vektus;
    constructor(db, config, logger, vektus) {
        this.db = db;
        this.config = config;
        this.logger = logger;
        this.vektus = vektus;
        this.logger.setContext('DocumentManagerService');
    }
    async upload(fileName, fileKey, fileSize, mimeType, uploadedBy, metadata) {
        const id = (0, ulid_1.ulid)();
        const vertical = metadata.vertical || this.config.vertical;
        // Check if a previous version exists
        const existing = await this.db.queryOne(`SELECT MAX(version) as version
       FROM compliance_documents
       WHERE aggregate_id = $1 AND aggregate_type = $2 AND category = $3 AND file_name = $4`, [metadata.aggregateId, metadata.aggregateType, metadata.category, fileName]);
        const version = (existing?.version ?? 0) + 1;
        const document = await this.db.queryOne(`INSERT INTO compliance_documents
         (id, aggregate_id, aggregate_type, vertical, file_name, file_key, file_size, mime_type,
          category, expires_at, version, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
                 vertical, file_name AS "fileName", file_key AS "fileKey",
                 file_size AS "fileSize", mime_type AS "mimeType", category,
                 expires_at AS "expiresAt", vektus_file_id AS "vektusFileId",
                 version, uploaded_by AS "uploadedBy",
                 created_at AS "createdAt", updated_at AS "updatedAt"`, [
            id,
            metadata.aggregateId,
            metadata.aggregateType,
            vertical,
            fileName,
            fileKey,
            fileSize,
            mimeType,
            metadata.category,
            metadata.expiresAt ?? null,
            version,
            uploadedBy,
        ]);
        // Save version history
        await this.db.query(`INSERT INTO document_versions (document_id, version, file_key, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())`, [id, version, fileKey, uploadedBy]);
        this.logger.log(`Document uploaded: ${fileName} v${version}`, {
            documentId: id,
            aggregateId: metadata.aggregateId,
        });
        return document;
    }
    async indexInVektus(documentId, content) {
        const document = await this.db.queryOne(`SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              vertical, file_name AS "fileName", category
       FROM compliance_documents
       WHERE id = $1`, [documentId]);
        if (!document) {
            throw new Error(`Document not found: ${documentId}`);
        }
        const result = await this.vektus.ingest(content, {
            fileName: document.fileName,
            vertical: document.vertical,
            category: document.category,
            documentId: document.id,
            aggregateId: document.aggregateId,
            aggregateType: document.aggregateType,
        });
        await this.db.query(`UPDATE compliance_documents SET vektus_file_id = $1, updated_at = NOW() WHERE id = $2`, [result.fileId, documentId]);
        this.logger.log(`Document indexed in Vektus: ${document.fileName}`, {
            documentId,
            vektusFileId: result.fileId,
        });
    }
    async checkExpiry(daysAhead = 30) {
        const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
        const rows = await this.db.query(`SELECT id, aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              vertical, file_name AS "fileName", file_key AS "fileKey",
              file_size AS "fileSize", mime_type AS "mimeType", category,
              expires_at AS "expiresAt", vektus_file_id AS "vektusFileId",
              version, uploaded_by AS "uploadedBy",
              created_at AS "createdAt", updated_at AS "updatedAt",
              EXTRACT(DAY FROM expires_at - NOW()) AS days_until_expiry
       FROM compliance_documents
       WHERE expires_at IS NOT NULL
         AND expires_at <= $1
         AND expires_at >= NOW()
       ORDER BY expires_at ASC`, [futureDate]);
        return rows.map(row => ({
            document: {
                id: row.id,
                aggregateId: row.aggregateId,
                aggregateType: row.aggregateType,
                vertical: row.vertical,
                fileName: row.fileName,
                fileKey: row.fileKey,
                fileSize: row.fileSize,
                mimeType: row.mimeType,
                category: row.category,
                expiresAt: row.expiresAt,
                vektusFileId: row.vektusFileId,
                version: row.version,
                uploadedBy: row.uploadedBy,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            },
            daysUntilExpiry: Math.ceil(row.days_until_expiry),
        }));
    }
    async getVersionHistory(documentId) {
        // Find all versions for the same logical document (same aggregate, name, category)
        const doc = await this.db.queryOne(`SELECT aggregate_id AS "aggregateId", aggregate_type AS "aggregateType",
              file_name AS "fileName", category
       FROM compliance_documents WHERE id = $1`, [documentId]);
        if (!doc) {
            throw new Error(`Document not found: ${documentId}`);
        }
        return this.db.query(`SELECT dv.version, dv.file_key AS "fileKey",
              dv.uploaded_by AS "uploadedBy", dv.uploaded_at AS "uploadedAt"
       FROM document_versions dv
       JOIN compliance_documents cd ON cd.id = dv.document_id
       WHERE cd.aggregate_id = $1 AND cd.aggregate_type = $2
         AND cd.file_name = $3 AND cd.category = $4
       ORDER BY dv.version DESC`, [doc.aggregateId, doc.aggregateType, doc.fileName, doc.category]);
    }
};
exports.DocumentManagerService = DocumentManagerService;
exports.DocumentManagerService = DocumentManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_js_1.DatabaseService,
        config_js_1.ComplianceCoreConfigService,
        logger_js_1.ComplianceLogger,
        vektus_adapter_service_js_1.VektusAdapterService])
], DocumentManagerService);
//# sourceMappingURL=document-manager.service.js.map