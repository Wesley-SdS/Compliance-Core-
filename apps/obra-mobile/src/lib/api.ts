import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_URL = 'http://localhost:3002';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('authToken', token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('authToken');
}

export async function getApiUrl(): Promise<string> {
  try {
    const url = await SecureStore.getItemAsync('apiUrl');
    return url || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const [token, baseUrl] = await Promise.all([getAuthToken(), getApiUrl()]);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API Error: ${res.status}`);
  }

  return res.json();
}

export async function uploadFile(path: string, fileUri: string, fields?: Record<string, string>): Promise<any> {
  const [token, baseUrl] = await Promise.all([getAuthToken(), getApiUrl()]);

  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'file';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri: fileUri, name: filename, type } as any);

  if (fields) {
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Upload Error: ${res.status}`);
  }

  return res.json();
}
