import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_URL = 'http://localhost:3001';

export async function getApiUrl(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync('apiUrl');
    return stored || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setApiUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync('apiUrl', url);
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

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = await getApiUrl();
  const token = await getAuthToken();

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Erro na API: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function uploadFile(path: string, fileUri: string, fields?: Record<string, string>): Promise<void> {
  const baseUrl = await getApiUrl();
  const token = await getAuthToken();

  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'photo.jpg';
  formData.append('file', {
    uri: fileUri,
    type: 'image/jpeg',
    name: filename,
  } as unknown as Blob);

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Erro no upload: ${res.status}`);
  }
}
