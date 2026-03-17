import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR');
}

export function scoreLevel(score: number): 'CRITICO' | 'ATENCAO' | 'BOM' | 'EXCELENTE' {
  if (score >= 80) return 'EXCELENTE';
  if (score >= 60) return 'BOM';
  if (score >= 40) return 'ATENCAO';
  return 'CRITICO';
}

export function scoreLevelColor(level: string): string {
  switch (level) {
    case 'EXCELENTE': return 'text-green-600';
    case 'BOM': return 'text-blue-600';
    case 'ATENCAO': return 'text-amber-600';
    case 'CRITICO': return 'text-red-600';
    default: return 'text-slate-600';
  }
}

export function scoreLevelBg(level: string): string {
  switch (level) {
    case 'EXCELENTE': return 'bg-green-50 border-green-200';
    case 'BOM': return 'bg-blue-50 border-blue-200';
    case 'ATENCAO': return 'bg-amber-50 border-amber-200';
    case 'CRITICO': return 'bg-red-50 border-red-200';
    default: return 'bg-slate-50 border-slate-200';
  }
}
