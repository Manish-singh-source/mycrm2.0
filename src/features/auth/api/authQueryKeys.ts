import type { AuthGuard } from '@/features/auth/types/authTypes';

export const authQueryKeys = {
  all: ['auth'] as const,
  session: (guard: AuthGuard) => [...authQueryKeys.all, guard, 'session'] as const,
  profile: (guard: AuthGuard) => [...authQueryKeys.all, guard, 'profile'] as const,
  preferences: (guard: AuthGuard) => [...authQueryKeys.all, guard, 'preferences'] as const
};
