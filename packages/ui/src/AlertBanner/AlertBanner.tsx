'use client';
import React, { useState } from 'react';
import type { DueAlert } from '@compliancecore/shared';

export interface AlertBannerProps {
  alerts: DueAlert[];
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

function getUrgencyColor(daysUntilDue: number): {
  bg: string;
  border: string;
  text: string;
  accent: string;
} {
  if (daysUntilDue <= 0) {
    return { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', accent: '#DC2626' };
  }
  if (daysUntilDue <= 3) {
    return { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', accent: '#EA580C' };
  }
  if (daysUntilDue <= 7) {
    return { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', accent: '#D97706' };
  }
  return { bg: '#F0F9FF', border: '#93C5FD', text: '#1E40AF', accent: '#2563EB' };
}

function formatDueText(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `Vencido há ${Math.abs(daysUntilDue)} dia(s)`;
  if (daysUntilDue === 0) return 'Vence hoje';
  if (daysUntilDue === 1) return 'Vence amanhã';
  return `Vence em ${daysUntilDue} dias`;
}

export function AlertBanner({
  alerts,
  onAcknowledge,
  onDismiss,
  className,
}: AlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts
    .filter((a) => !dismissedIds.has(a.id))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  if (visibleAlerts.length === 0) return null;

  const mostUrgent = visibleAlerts[0];
  const colors = getUrgencyColor(mostUrgent.daysUntilDue);

  function handleDismiss(alertId: string) {
    setDismissedIds((prev) => new Set(prev).add(alertId));
    onDismiss?.(alertId);
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: '12px 20px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: visibleAlerts.length > 1 ? 8 : 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>{mostUrgent.daysUntilDue <= 0 ? '\uD83D\uDEA8' : '\u26A0\uFE0F'}</span>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: colors.text,
            }}
          >
            {visibleAlerts.length === 1
              ? '1 alerta pendente'
              : `${visibleAlerts.length} alertas pendentes`}
          </span>
        </div>
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleAlerts.map((alert) => {
          const alertColors = getUrgencyColor(alert.daysUntilDue);
          return (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderRadius: 6,
                borderLeft: `3px solid ${alertColors.accent}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: alertColors.text,
                  }}
                >
                  {alert.alertType} — {alert.entityType}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: alertColors.accent,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {formatDueText(alert.daysUntilDue)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {onAcknowledge && alert.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => onAcknowledge(alert.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: alertColors.accent,
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Reconhecer
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => handleDismiss(alert.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      color: alertColors.text,
                      border: `1px solid ${alertColors.border}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Dispensar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
