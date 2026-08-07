import { useQuery } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api/authApi';
import { authQueryKeys } from '@/features/auth/api/authQueryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';

export function useProfileSession(guard: AuthGuard) {
  const auth = useAuthStore();
  const session = guard === 'platform' ? auth.platform : auth.tenant;

  return useQuery({
    queryKey: authQueryKeys.profile(guard),
    queryFn: () => authApi.me(guard),
    enabled: session.status === 'authenticated',
    staleTime: 5 * 60_000
  });
}
