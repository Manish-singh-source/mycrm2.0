import { useSyncExternalStore } from 'react';

import type { AuthState, AuthGuard, GuardSession, TenantSession } from '@/features/auth/types/authTypes';

const storageKey = 'enterprise-crm.auth';
const defaultLocale = 'en';
const defaultTimezone = 'Asia/Kolkata';

const emptyGuardSession: GuardSession = {
  accessToken: null,
  refreshToken: null,
  user: null,
  permissions: [],
  roles: [],
  locale: defaultLocale,
  timezone: defaultTimezone,
  expiresAt: null,
  status: 'anonymous'
};

const emptyTenantSession: TenantSession = {
  ...emptyGuardSession,
  tenant: null,
  office: null
};

const emptyAuthState: AuthState = {
  platform: emptyGuardSession,
  tenant: emptyTenantSession
};

function readStoredState(): AuthState {
  if (typeof localStorage === 'undefined') return emptyAuthState;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return emptyAuthState;
    const parsed = JSON.parse(stored) as Partial<AuthState>;
    const platform = { ...emptyGuardSession, ...parsed.platform };
    const tenant = { ...emptyTenantSession, ...parsed.tenant };
    return {
      platform: {
        ...platform,
        status: platform.accessToken ? 'authenticated' : 'anonymous'
      },
      tenant: {
        ...tenant,
        status: tenant.accessToken ? 'authenticated' : 'anonymous'
      }
    };
  } catch {
    return emptyAuthState;
  }
}

function persistState(state: AuthState) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(state));
}

let authState: AuthState = readStoredState();

const listeners = new Set<() => void>();

function emit() {
  persistState(authState);
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getSnapshot: () => authState,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setPlatformSession: (session: Partial<GuardSession>) => {
    authState = {
      ...authState,
      platform: {
        ...authState.platform,
        ...session,
        status: session.accessToken ?? authState.platform.accessToken ? 'authenticated' : 'anonymous'
      }
    };
    emit();
  },
  setTenantSession: (session: Partial<TenantSession>) => {
    authState = {
      ...authState,
      tenant: {
        ...authState.tenant,
        ...session,
        status: session.accessToken ?? authState.tenant.accessToken ? 'authenticated' : 'anonymous'
      }
    };
    emit();
  },
  setTenantOffice: (office: string | null) => {
    authState = { ...authState, tenant: { ...authState.tenant, office } };
    emit();
  },
  clear: (guard?: AuthGuard) => {
    authState = guard
      ? { ...authState, [guard]: guard === 'tenant' ? emptyTenantSession : emptyGuardSession }
      : emptyAuthState;
    emit();
  }
};

export function useAuthStore() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
}
