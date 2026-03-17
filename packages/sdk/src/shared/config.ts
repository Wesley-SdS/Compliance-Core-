import { Injectable } from '@nestjs/common';

export interface ComplianceCoreConfig {
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  vektus: {
    baseUrl: string;
    apiKey: string;
    webhookSecret: string;
    projectId: string;
  };
  storage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    publicUrl: string;
  };
  vertical: string;
  selfUrl: string;
}

@Injectable()
export class ComplianceCoreConfigService {
  private config: ComplianceCoreConfig;

  constructor(config: ComplianceCoreConfig) {
    this.config = config;
  }

  get database() { return this.config.database; }
  get redis() { return this.config.redis; }
  get vektus() { return this.config.vektus; }
  get storage() { return this.config.storage; }
  get vertical() { return this.config.vertical; }
  get selfUrl() { return this.config.selfUrl; }

  static fromEnv(): ComplianceCoreConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    // Fail-fast validation in production
    if (isProduction) {
      const required: Record<string, string | undefined> = {
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
    } else {
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
}
