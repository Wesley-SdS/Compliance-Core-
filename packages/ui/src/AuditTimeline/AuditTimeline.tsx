'use client';
import React from 'react';
import type { TimelineEvent } from '@compliancecore/shared';

export interface AuditTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
  onEventClick?: (event: TimelineEvent) => void;
  className?: string;
}

const EVENT_ICONS: Record<string, string> = {
  CREATED: '\uD83D\uDCDD',
  UPDATED: '\u270F\uFE0F',
  DELETED: '\uD83D\uDDD1\uFE0F',
  APPROVED: '\u2705',
  REJECTED: '\u274C',
  UPLOADED: '\uD83D\uDCC2',
  ALERT: '\u26A0\uFE0F',
  SCORE_CHANGED: '\uD83D\uDCCA',
  CHECKLIST_COMPLETED: '\u2611\uFE0F',
};

function formatTimestamp(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditTimeline({
  events,
  maxItems,
  onEventClick,
  className,
}: AuditTimelineProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '8px 0',
      }}
    >
      {displayEvents.length === 0 && (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: 14,
          }}
        >
          Nenhum evento encontrado.
        </div>
      )}

      {displayEvents.map((event, index) => {
        const isLast = index === displayEvents.length - 1;
        const icon = EVENT_ICONS[event.type] ?? '\uD83D\uDD35';

        return (
          <div
            key={event.id}
            style={{
              display: 'flex',
              gap: 16,
              cursor: onEventClick ? 'pointer' : 'default',
              minHeight: 72,
            }}
            onClick={() => onEventClick?.(event)}
            role={onEventClick ? 'button' : undefined}
            tabIndex={onEventClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onEventClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onEventClick(event);
              }
            }}
          >
            {/* Timeline track */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 40,
                flexShrink: 0,
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              {/* Line */}
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: '#D1D5DB',
                    minHeight: 16,
                  }}
                />
              )}
            </div>

            {/* Event card */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 12,
                transition: 'box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (onEventClick) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    '0 2px 8px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#111827',
                      marginBottom: 4,
                    }}
                  >
                    {event.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#6B7280',
                      lineHeight: 1.4,
                    }}
                  >
                    {event.description}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                  fontSize: 12,
                  color: '#9CA3AF',
                }}
              >
                <span>{event.actor}</span>
                <span>{formatTimestamp(event.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {maxItems && events.length > maxItems && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#6B7280',
            padding: '8px 0',
          }}
        >
          +{events.length - maxItems} eventos anteriores
        </div>
      )}
    </div>
  );
}
