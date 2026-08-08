import { useCallback } from 'react';

import { authApi } from '@/features/auth/api/authApi';
import { authStore, useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';

export function useAuth(guard?: AuthGuard) {
  const auth = useAuthStore();

  const logout = useCallback(async (targetGuard?: AuthGuard) => {
    const logoutGuard = targetGuard ?? guard;
    if (!logoutGuard) {
      authStore.clear();
      return;
    }

    await authApi.logout(logoutGuard);
  }, [guard]);

  if (!guard) {
    return {
      auth,
      logout,
      isPlatformAuthenticated: auth.platform.status === 'authenticated',
      isTenantAuthenticated: auth.tenant.status === 'authenticated'
    };
  }

  const session = guard === 'platform' ? auth.platform : auth.tenant;

  return {
    auth,
    session,
    user: session.user,
    roles: session.roles,
    permissions: session.permissions,
    locale: session.locale,
    timezone: session.timezone,
    isAuthenticated: session.status === 'authenticated',
    logout
  };
}
