import { authStore, useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';

type PreferencePatch = {
  locale?: string;
  timezone?: string;
  office?: string | null;
};

export function useSessionPreferences(guard: AuthGuard) {
  const auth = useAuthStore();
  const session = guard === 'platform' ? auth.platform : auth.tenant;

  return {
    locale: session.locale,
    timezone: session.timezone,
    office: guard === 'tenant' ? auth.tenant.office : null,
    setPreferences: (preferences: PreferencePatch) => {
      if (guard === 'platform') {
        authStore.setPlatformSession(preferences);
        return;
      }

      authStore.setTenantSession(preferences);
    }
  };
}
