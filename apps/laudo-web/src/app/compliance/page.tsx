'use client';

import { useState } from 'react';
import { ScoreGauge, DossierPreview, ComplianceBadge } from '@compliancecore/ui';
import { useLabScore, useLabDossier } from '@/hooks/use-laboratorio';
import { useAppStore } from '@/lib/store';
import { apiUrl } from '@/lib/api';
import type { ComplianceLevel, ScoreTrend } from '@compliancecore/shared';

export default function CompliancePage() {
  const labId = useAppStore((s) => s.laboratorioId) || 'default';
  const { data: score, isLoading } = useLabScore(labId);
  const { data: dossier } = useLabDossier(labId);
  const [expandedCriterio, setExpandedCriterio] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateDossier = async () => {
    setGenerating(true);
    try {
      window.open(apiUrl(`/laboratorios/${labId}/dossier`), '_blank');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-slate-200 rounded-xl" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Score de Compliance Laboratorial</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score grande */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 flex items-center justify-center">
          <ScoreGauge
            score={score?.value ?? 0}
            level={(score?.level ?? 'CRITICO') as ComplianceLevel}
            trend={(score?.trend ?? 'ESTAVEL') as ScoreTrend}
            size={200}
          />
        </div>

        {/* Criterios */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Criterios de Avaliacao</h3>
          <div className="space-y-3">
            {(score?.criteria ?? []).map((criterion) => {
              const isExpanded = expandedCriterio === criterion.criterionId;
              return (
                <div key={criterion.criterionId}>
                  <button
                    type="button"
                    onClick={() => setExpandedCriterio(isExpanded ? null : criterion.criterionId)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{criterion.name}</span>
                        <ComplianceBadge status={criterion.status as any} size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Peso: {criterion.weight}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{criterion.score}%</span>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          criterion.score >= 80 ? 'bg-green-500' : criterion.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${criterion.score}%` }}
                      />
                    </div>
                  </button>
                  {isExpanded && criterion.details && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                      {criterion.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dossier Preview */}
      <div className="flex justify-center">
        <DossierPreview
          entityName="Laboratorio"
          period={{ start: '01/01/2026', end: '17/03/2026' }}
          score={score?.value ?? 0}
          level={(score?.level ?? 'CRITICO') as ComplianceLevel}
          documentCount={dossier?.documentCount ?? 0}
          eventCount={dossier?.eventCount ?? 0}
          checklistCount={dossier?.checklistCount ?? 0}
          onGenerate={handleGenerateDossier}
          generating={generating}
        />
      </div>
    </div>
  );
}
