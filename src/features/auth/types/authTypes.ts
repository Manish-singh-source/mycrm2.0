export type AuthGuard = 'platform' | 'tenant';

export type Permission = string;

export type AuthUser = {
  uuid: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
  permissions: Permission[];
  locale?: string;
  timezone?: string;
};

export type TenantContext = {
  uuid: string;
  slug: string;
  organizationName: string;
  enabledModules: string[];
  defaultLocale?: string;
  defaultTimezone?: string;
};

export type GuardSession = {
  accessToken: string | null;
  refreshToken?: string | null;
  user: AuthUser | null;
  permissions: Permission[];
  roles: string[];
  locale: string;
  timezone: string;
  expiresAt: string | null;
  status: 'anonymous' | 'authenticated';
};

export type TenantSession = GuardSession & {
  tenant: TenantContext | null;
  office: string | null;
};

export type AuthState = {
  platform: GuardSession;
  tenant: TenantSession;
};

export type LoginResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  expires_at?: string | null;
  user: AuthUser;
  roles?: string[];
  permissions?: Permission[];
  locale?: string;
  timezone?: string;
  tenant?: TenantContext;
  office?: string | null;
};

export type PlatformLoginRequest = {
  email: string;
  password: string;
  remember?: boolean;
  device_name?: string;
};

export type TenantLoginRequest = PlatformLoginRequest & {
  tenant: string;
};
