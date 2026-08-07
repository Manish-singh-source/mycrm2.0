export type AuthGuard = 'platform' | 'tenant';

export type Permission = string;

export type AuthUser = {
  uuid: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
  permissions: Permission[];
};

export type TenantContext = {
  uuid: string;
  slug: string;
  organizationName: string;
  enabledModules: string[];
};

export type GuardSession = {
  accessToken: string | null;
  user: AuthUser | null;
  permissions: Permission[];
  roles: string[];
  expiresAt: string | null;
};

export type TenantSession = GuardSession & {
  tenant: TenantContext | null;
};

export type AuthState = {
  platform: GuardSession;
  tenant: TenantSession;
};
