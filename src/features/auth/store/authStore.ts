import { useSyncExternalStore } from 'react';

import type { AuthState, AuthGuard, GuardSession, TenantSession } from '@/features/auth/types/authTypes';

const emptyGuardSession: GuardSession = {
  accessToken: null,
  user: null,
  permissions: [],
  roles: [],
  expiresAt: null
};

const emptyTenantSession: TenantSession = {
  ...emptyGuardSession,
  tenant: null
};

let authState: AuthState = {
  platform: emptyGuardSession,
  tenant: emptyTenantSession
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getSnapshot: () => authState,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setPlatformSession: (session: Partial<GuardSession>) => {
    authState = { ...authState, platform: { ...authState.platform, ...session } };
    emit();
  },
  setTenantSession: (session: Partial<TenantSession>) => {
    authState = { ...authState, tenant: { ...authState.tenant, ...session } };
    emit();
  },
  clear: (guard?: AuthGuard) => {
    authState = guard
      ? { ...authState, [guard]: guard === 'tenant' ? emptyTenantSession : emptyGuardSession }
      : { platform: emptyGuardSession, tenant: emptyTenantSession };
    emit();
  }
};

export function useAuthStore() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
}
