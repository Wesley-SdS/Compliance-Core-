'use client';
import React from 'react';

export type BadgeStatus = 'CONFORME' | 'NAO_CONFORME' | 'PARCIAL' | 'NAO_APLICAVEL';

export interface ComplianceBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  BadgeStatus,
  { label: string; bg: string; color: string; border: string; icon: string }
> = {
  CONFORME: {
    label: 'Conforme',
    bg: '#F0FDF4',
    color: '#166534',
    border: '#BBF7D0',
    icon: '\u2713',
  },
  NAO_CONFORME: {
    label: 'N\u00e3o Conforme',
    bg: '#FEF2F2',
    color: '#991B1B',
    border: '#FECACA',
    icon: '\u2717',
  },
  PARCIAL: {
    label: 'Parcial',
    bg: '#FFFBEB',
    color: '#92400E',
    border: '#FDE68A',
    icon: '\u26A0',
  },
  NAO_APLICAVEL: {
    label: 'N\u00e3o Aplic\u00e1vel',
    bg: '#F9FAFB',
    color: '#4B5563',
    border: '#D1D5DB',
    icon: '\u2014',
  },
};

const FALLBACK_CONFIG = {
  label: 'Desconhecido',
  bg: '#F9FAFB',
  color: '#4B5563',
  border: '#D1D5DB',
  icon: '?',
};

const SIZE_STYLES: Record<'sm' | 'md' | 'lg', { fontSize: number; padding: string; iconSize: number }> = {
  sm: { fontSize: 11, padding: '2px 8px', iconSize: 11 },
  md: { fontSize: 13, padding: '4px 12px', iconSize: 13 },
  lg: { fontSize: 15, padding: '6px 16px', iconSize: 15 },
};

export function ComplianceBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: ComplianceBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 9999,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {showIcon && (
        <span style={{ fontSize: sizeStyle.iconSize, lineHeight: 1 }}>{config.icon}</span>
      )}
      {config.label}
    </span>
  );
}
