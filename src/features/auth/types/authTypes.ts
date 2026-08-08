export type AuthGuard = 'platform' | 'tenant';
export type AuthSurface = 'platform' | 'tenant' | 'client_portal';

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
  twoFactorEnabled?: boolean;
};

export type TenantContext = {
  uuid: string;
  slug: string;
  organizationName: string;
  enabledModules: string[];
  status?: string;
  defaultCurrency?: string;
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

export type DiscoveredAccount = {
  accountRef: string;
  accountType: string;
  authGuard: AuthGuard;
  label: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  organization?: string | null;
  tenant?: {
    uuid: string;
    slug: string;
    status?: string;
  } | null;
  roles: string[];
  status: string;
  lastLoginAt?: string | null;
};

export type AccountDiscovery = {
  email: string;
  discoveryToken: string | null;
  expiresInSeconds: number;
  accounts: DiscoveredAccount[];
};

export type UnifiedLoginResponse = LoginResponse & {
  surface: AuthSurface;
  redirect_to?: string;
  modules?: string[];
  preferences?: {
    locale?: string;
    timezone?: string;
  };
};

export type TwoFactorChallenge = {
  requires_2fa: true;
  challenge_token: string;
  methods: string[];
  account_type: string;
  surface: AuthSurface;
};

export type LoginResult =
  | { type: 'logged_in'; session: UnifiedLoginResponse }
  | { type: '2fa_required'; challenge: TwoFactorChallenge };

export type DiscoverAccountsRequest = {
  email: string;
  device_name?: string;
};

export type UnifiedLoginRequest = {
  email: string;
  discovery_token: string;
  account_ref: string;
  password: string;
  remember?: boolean;
  device_name?: string;
};

export type VerifyLoginTwoFactorRequest = {
  challenge_token: string;
  code: string;
  remember_device?: boolean;
  device_name?: string;
};

export type ForgotPasswordRequest = {
  email: string;
  account_ref?: string;
  discovery_token?: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};
