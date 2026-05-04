import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import type {
  Document as ComplianceDocument,
  DocMetadata,
  DocVersion,
  ExpiringDoc,
} from '@compliancecore/shared';

@Injectable()
export class MockDocumentManagerService {
  private documents: ComplianceDocument[] = [];
  private versions: Array<DocVersion & { documentId: string }> = [];
  private vertical = process.env.VERTICAL ?? 'mock';

  async upload(
    fileName: string,
    fileKey: string,
    fileSize: number,
    mimeType: string,
    uploadedBy: string,
    metadata: DocMetadata,
  ): Promise<ComplianceDocument> {
    const id = ulid();
    const existing = this.documents.filter(
      d => d.aggregateId === metadata.aggregateId &&
           d.aggregateType === metadata.aggregateType &&
           d.category === metadata.category &&
           d.fileName === fileName,
    );
    const version = existing.length + 1;

    const doc: ComplianceDocument = {
      id,
      aggregateId: metadata.aggregateId,
      aggregateType: metadata.aggregateType,
      vertical: metadata.vertical || this.vertical,
      fileName,
      fileKey,
      fileSize,
      mimeType,
      category: metadata.category,
      expiresAt: metadata.expiresAt,
      vektusFileId: undefined,
      version,
      uploadedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ComplianceDocument;

    this.documents.push(doc);
    this.versions.push({ documentId: id, version, fileKey, uploadedBy, uploadedAt: new Date() } as DocVersion & { documentId: string });

    return doc;
  }

  async indexInVektus(documentId: string, _content: string): Promise<void> {
    const doc = this.documents.find(d => d.id === documentId);
    if (doc) (doc as any).vektusFileId = ulid();
  }

  async checkExpiry(daysAhead: number = 30): Promise<ExpiringDoc[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return this.documents
      .filter(d => d.expiresAt && new Date(d.expiresAt) >= now && new Date(d.expiresAt) <= futureDate)
      .map(d => ({
        document: d,
        daysUntilExpiry: Math.ceil((new Date(d.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  async getVersionHistory(documentId: string): Promise<DocVersion[]> {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) throw new Error(`Document not found: ${documentId}`);

    return this.versions
      .filter(v => {
        const d = this.documents.find(dd => dd.id === v.documentId);
        return d && d.aggregateId === doc.aggregateId &&
               d.aggregateType === doc.aggregateType &&
               d.fileName === doc.fileName &&
               d.category === doc.category;
      })
      .sort((a, b) => b.version - a.version);
  }
}
