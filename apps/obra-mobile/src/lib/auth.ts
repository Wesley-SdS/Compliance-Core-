import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from './api';

const AUTH_TOKEN_KEY = 'authToken';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function signIn(credentials: LoginCredentials): Promise<AuthSession> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao fazer login');
  }

  const data = await res.json();
  const token = data.token || data.session?.token;

  if (token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  }

  return { token, user: data.user };
}

export async function signUp(data: SignUpData): Promise<AuthSession> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao criar conta');
  }

  const result = await res.json();
  const token = result.token || result.session?.token;

  if (token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  }

  return { token, user: result.user };
}

export async function signOut(): Promise<void> {
  const baseUrl = await getApiUrl();
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  if (token) {
    await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {});
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export async function getSession(): Promise<AuthSession | null> {
  const baseUrl = await getApiUrl();
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  if (!token) return null;

  try {
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      return null;
    }

    const data = await res.json();
    return { token, user: data.user };
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return !!token;
}
