import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../auth/token-manager';
import { refreshTokens } from '../auth/auth-service';
import { emitSessionInvalidated } from '../auth/session-events';

let inflight: Promise<string> | null = null;

export async function getToken(): Promise<string> {
  const cached = await getAccessToken();
  if (cached) return cached;

  if (!inflight) {
    inflight = refreshWithStoredToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function refreshWithStoredToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token — user must sign in');
  }
  const { accessToken, refreshToken: newRefresh } = await refreshTokens(refreshToken);
  await saveTokens(accessToken, newRefresh);
  return accessToken;
}

export async function clearAuth(): Promise<void> {
  await clearTokens();
  emitSessionInvalidated();
}
