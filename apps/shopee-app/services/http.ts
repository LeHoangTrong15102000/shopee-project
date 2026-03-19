import { API_BASE_URL } from '@/config/env';

class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export async function httpGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status}`, res.status);
  }

  const json = await res.json();
  return json as T;
}
