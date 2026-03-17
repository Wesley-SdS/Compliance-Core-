'use client';
import React from 'react';
import type { ComplianceLevel } from '@compliancecore/shared';

export interface DossierPreviewProps {
  entityName: string;
  period: { start: string; end: string };
  score: number;
  level: ComplianceLevel;
  documentCount: number;
  eventCount: number;
  checklistCount: number;
  onGenerate: () => void;
  onDownload?: () => void;
  generating?: boolean;
  className?: string;
}

const LEVEL_COLORS: Record<ComplianceLevel, { bg: string; color: string; border: string }> = {
  CRITICO: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  ATENCAO: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  BOM: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  EXCELENTE: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
};

const LEVEL_LABELS: Record<ComplianceLevel, string> = {
  CRITICO: 'Critico',
  ATENCAO: 'Atenção',
  BOM: 'Bom',
  EXCELENTE: 'Excelente',
};

function StatBlock({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        flex: 1,
        minWidth: 100,
      }}
    >
      <span style={{ fontSize: 20, marginBottom: 4 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export function DossierPreview({
  entityName,
  period,
  score,
  level,
  documentCount,
  eventCount,
  checklistCount,
  onGenerate,
  onDownload,
  generating = false,
  className,
}: DossierPreviewProps) {
  const levelColors = LEVEL_COLORS[level];
  const styleInjected = React.useRef(false);

  React.useEffect(() => {
    if (styleInjected.current) return;
    if (typeof document === 'undefined') return;

    const existingStyle = document.getElementById('compliancecore-spinner');
    if (existingStyle) { styleInjected.current = true; return; }

    const style = document.createElement('style');
    style.id = 'compliancecore-spinner';
    style.textContent = '@keyframes cc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    styleInjected.current = true;
  }, []);

  return (
    <div
      className={className}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        maxWidth: 480,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
              {entityName}
            </h3>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              {period.start} — {period.end}
            </div>
          </div>

          {/* Score badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: levelColors.bg,
              border: `1px solid ${levelColors.border}`,
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: levelColors.color,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: levelColors.color,
                marginTop: 2,
              }}
            >
              {LEVEL_LABELS[level]}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '16px 24px',
        }}
      >
        <StatBlock label="Documentos" value={documentCount} icon={'\uD83D\uDCC4'} />
        <StatBlock label="Eventos" value={eventCount} icon={'\uD83D\uDDD3\uFE0F'} />
        <StatBlock label="Checklists" value={checklistCount} icon={'\u2611\uFE0F'} />
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: generating ? '#9CA3AF' : '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            cursor: generating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {generating ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                  animation: 'cc-spin 0.8s linear infinite',
                }}
              />
              Gerando...
            </>
          ) : (
            <>
              <span style={{ fontSize: 16 }}>{'\uD83D\uDCC3'}</span>
              Gerar Dossiê PDF
            </>
          )}
        </button>

        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>{'\u2B07\uFE0F'}</span>
            Baixar
          </button>
        )}
      </div>
    </div>
  );
}
