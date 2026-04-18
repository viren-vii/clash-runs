import { API_BASE_URL } from '../api/config';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface SigninResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function post<T>(path: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(res.status, (data as { message?: string }).message ?? 'Request failed');
  }
  return data as T;
}

export async function signup(email: string, password: string): Promise<void> {
  await post('/auth/signup', { email, password });
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  await post('/auth/verify-email', { email, code });
}

export async function signin(email: string, password: string): Promise<SigninResponse> {
  return post<SigninResponse>('/auth/signin', { email, password });
}

export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  return post<RefreshResponse>('/auth/refresh', { refreshToken });
}

export async function signout(refreshToken: string): Promise<void> {
  await post('/auth/signout', { refreshToken });
}

export async function resendVerification(email: string): Promise<void> {
  await post('/auth/resend-verification', { email });
}
