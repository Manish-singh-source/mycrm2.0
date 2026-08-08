import { authStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';
import { platformClient } from '@/lib/api/platformClient';
import { createTenantClient } from '@/lib/api/tenantClient';

export type ProfilePatch = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  mobile?: string;
  profile_photo_file_id?: number;
  timezone?: string;
  locale?: string;
};

export type PasswordChange = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type PreferencesPatch = {
  timezone?: string;
  locale?: string;
  [key: string]: unknown;
};

export type ApiTokenPayload = {
  name: string;
  abilities: string[];
  expires_at?: string | null;
};

export type ApiTokenRecord = {
  uuid: string;
  name: string;
  abilities?: string[];
  token?: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  last_used_at?: string | null;
};

function tenantClient() {
  const tenant = authStore.getSnapshot().tenant.tenant;
  if (!tenant) throw new Error('Tenant context is required.');
  return createTenantClient(tenant.slug || tenant.uuid);
}

function clientFor(guard: AuthGuard) {
  return guard === 'platform' ? platformClient : tenantClient();
}

function preferencesPath(guard: AuthGuard) {
  return guard === 'platform' ? '/settings/preferences' : '/profile/preferences';
}

function apiTokensPath(guard: AuthGuard) {
  return guard === 'platform' ? '/api-tokens' : '/profile/api-tokens';
}

export const accountApi = {
  profile: (guard: AuthGuard) => clientFor(guard).get<Record<string, unknown>>('/profile'),
  updateProfile: (guard: AuthGuard, body: ProfilePatch) =>
    clientFor(guard).patch<Record<string, unknown>, ProfilePatch>('/profile', body),
  changePassword: (guard: AuthGuard, body: PasswordChange) =>
    clientFor(guard).put<Record<string, unknown>, PasswordChange>('/profile/password', body),
  preferences: (guard: AuthGuard) => clientFor(guard).get<Record<string, unknown>>(preferencesPath(guard)),
  updatePreferences: (guard: AuthGuard, body: PreferencesPatch) =>
    clientFor(guard).put<Record<string, unknown>, PreferencesPatch>(preferencesPath(guard), body),
  sessions: (guard: AuthGuard) => clientFor(guard).get<unknown[]>('/profile/sessions'),
  revokeSession: (guard: AuthGuard, sessionId: string) =>
    clientFor(guard).delete<Record<string, unknown>>(`/profile/sessions/${encodeURIComponent(sessionId)}`),
  enableTwoFactor: (guard: AuthGuard) =>
    clientFor(guard).post<{ secret: string; provisioning_uri: string }>('/auth/2fa/enable'),
  confirmTwoFactor: (guard: AuthGuard, code: string) =>
    clientFor(guard).post<Record<string, unknown>, { code: string }>('/auth/2fa/confirm', { code }),
  disableTwoFactor: (guard: AuthGuard, password: string) =>
    clientFor(guard).post<Record<string, unknown>, { password: string }>('/auth/2fa/disable', { password }),
  resendVerification: (guard: AuthGuard) =>
    clientFor(guard).post<Record<string, unknown>>('/auth/verify-email/resend'),
  apiTokens: (guard: AuthGuard) => clientFor(guard).get<ApiTokenRecord[]>(apiTokensPath(guard)),
  createApiToken: (guard: AuthGuard, body: ApiTokenPayload) =>
    clientFor(guard).post<ApiTokenRecord, ApiTokenPayload>(apiTokensPath(guard), body),
  rotateApiToken: (guard: AuthGuard, tokenUuid: string) =>
    clientFor(guard).post<ApiTokenRecord>(`${apiTokensPath(guard)}/${encodeURIComponent(tokenUuid)}/rotate`),
  revokeApiToken: (guard: AuthGuard, tokenUuid: string) =>
    clientFor(guard).post<Record<string, unknown>>(`${apiTokensPath(guard)}/${encodeURIComponent(tokenUuid)}/revoke`)
};
