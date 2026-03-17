'use client';
import React from 'react';
import type { ComplianceLevel, ScoreTrend } from '@compliancecore/shared';

export interface ScoreGaugeProps {
  score: number;
  level: ComplianceLevel;
  size?: number;
  showLabel?: boolean;
  trend?: ScoreTrend;
  className?: string;
}

const LEVEL_COLORS: Record<ComplianceLevel, string> = {
  CRITICO: '#DC2626',
  ATENCAO: '#F59E0B',
  BOM: '#3B82F6',
  EXCELENTE: '#16A34A',
};

const LEVEL_LABELS: Record<ComplianceLevel, string> = {
  CRITICO: 'Critico',
  ATENCAO: 'Atenção',
  BOM: 'Bom',
  EXCELENTE: 'Excelente',
};

const TREND_ARROWS: Record<ScoreTrend, string> = {
  MELHORANDO: '\u2191',
  ESTAVEL: '\u2192',
  PIORANDO: '\u2193',
};

const TREND_COLORS: Record<ScoreTrend, string> = {
  MELHORANDO: '#16A34A',
  ESTAVEL: '#6B7280',
  PIORANDO: '#DC2626',
};

export function ScoreGauge({
  score,
  level,
  size = 160,
  showLabel = true,
  trend,
  className,
}: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedScore / 100) * circumference;
  const center = size / 2;
  const color = LEVEL_COLORS[level];

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>

      {/* Center content overlaid on SVG */}
      <div
        style={{
          position: 'relative',
          marginTop: -size,
          width: size,
          height: size,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: color,
            lineHeight: 1,
          }}
        >
          {clampedScore}
        </span>

        {showLabel && (
          <span
            style={{
              fontSize: size * 0.1,
              fontWeight: 500,
              color: '#6B7280',
              marginTop: 2,
            }}
          >
            {LEVEL_LABELS[level]}
          </span>
        )}

        {trend && (
          <span
            style={{
              fontSize: size * 0.12,
              fontWeight: 600,
              color: TREND_COLORS[trend],
              marginTop: 2,
            }}
          >
            {TREND_ARROWS[trend]} {trend.toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );
}
