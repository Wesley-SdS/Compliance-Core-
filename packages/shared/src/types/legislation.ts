export interface LegislationSource {
  id: string;
  name: string;
  affectedVerticals: string[];
  cronExpression: string;
  url?: string;
}

export interface NewLegislation {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  url?: string;
  publishedAt: Date;
  affectedVerticals: string[];
}

export interface ImpactReport {
  legislationId: string;
  entityId: string;
  impactLevel: 'ALTO' | 'MEDIO' | 'BAIXO' | 'NENHUM';
  affectedAreas: string[];
  requiredActions: string[];
  deadline?: Date;
  analysis: string;
}
