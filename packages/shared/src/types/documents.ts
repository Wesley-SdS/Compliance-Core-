export interface DocMetadata {
  aggregateId: string;
  aggregateType: string;
  vertical: string;
  category: string;
  expiresAt?: Date;
  tags?: string[];
}

export interface Document {
  id: string;
  aggregateId: string;
  aggregateType: string;
  vertical: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  category: string;
  expiresAt?: Date;
  vektusFileId?: string;
  version: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocVersion {
  version: number;
  fileKey: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ExpiringDoc {
  document: Document;
  daysUntilExpiry: number;
}
