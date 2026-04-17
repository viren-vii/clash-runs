import { createClient, type Client } from '@viren-vii/api';
import { API_BASE_URL } from './config';
import { getToken } from './auth';

let cached: Client | null = null;

export function getApiClient(): Client {
  if (cached) return cached;
  cached = createClient({
    baseUrl: API_BASE_URL,
    getToken: () => getToken(),
  });
  return cached;
}
