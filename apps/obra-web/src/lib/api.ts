'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include', // Send session cookie automatically
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
