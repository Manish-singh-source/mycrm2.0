import { authStore } from '@/features/auth/store/authStore';
import type {
  AuthGuard,
  AccountDiscovery,
  DiscoveredAccount,
  DiscoverAccountsRequest,
  ForgotPasswordRequest,
  LoginResponse,
  LoginResult,
  ResetPasswordRequest,
  TenantRegistrationRequest,
  TenantRegistrationResponse,
  TenantContext,
  TwoFactorChallenge,
  UnifiedLoginRequest,
  UnifiedLoginResponse,
  VerifyLoginTwoFactorRequest
} from '@/features/auth/types/authTypes';
import { authClient } from '@/lib/api/authClient';
import { platformClient } from '@/lib/api/platformClient';
import { createTenantClient } from '@/lib/api/tenantClient';

type RawTenantContext = {
  uuid?: string;
  slug?: string;
  organization_name?: string;
  organizationName?: string;
  enabled_modules?: string[];
  enabledModules?: string[];
  status?: string;
  default_currency?: string;
  defaultCurrency?: string;
  default_locale?: string;
  defaultLocale?: string;
  default_timezone?: string;
  defaultTimezone?: string;
};

type RawAccount = {
  account_ref?: string;
  accountRef?: string;
  account_type?: string;
  accountType?: string;
  auth_guard?: AuthGuard;
  authGuard?: AuthGuard;
  label?: string;
  display_name?: string;
  displayName?: string;
  email?: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  organization?: string | null;
  tenant?: RawTenantContext | null;
  roles?: string[];
  status?: string;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
  uuid?: string;
  permissions?: string[];
  two_factor_enabled?: boolean;
  twoFactorEnabled?: boolean;
};

type RawLoginResponse = Omit<UnifiedLoginResponse, 'user' | 'tenant'> & {
  account?: RawAccount;
  user?: RawAccount;
  tenant?: RawTenantContext | null;
};

type RawLoginResult = RawLoginResponse | TwoFactorChallenge;

function normalizeTenant(raw?: RawTenantContext | null, modules: string[] = []): TenantContext | null {
  if (!raw?.uuid && !raw?.slug) return null;

  return {
    uuid: raw.uuid ?? raw.slug ?? '',
    slug: raw.slug ?? raw.uuid ?? '',
    organizationName: raw.organizationName ?? raw.organization_name ?? raw.slug ?? raw.uuid ?? 'Tenant',
    enabledModules: raw.enabledModules ?? raw.enabled_modules ?? modules,
    status: raw.status,
    defaultCurrency: raw.defaultCurrency ?? raw.default_currency,
    defaultLocale: raw.defaultLocale ?? raw.default_locale,
    defaultTimezone: raw.defaultTimezone ?? raw.default_timezone
  };
}

function normalizeAccount(raw: RawAccount): DiscoveredAccount {
  return {
    accountRef: raw.accountRef ?? raw.account_ref ?? '',
    accountType: raw.accountType ?? raw.account_type ?? 'tenant',
    authGuard: raw.authGuard ?? raw.auth_guard ?? 'tenant',
    label: raw.label ?? raw.displayName ?? raw.display_name ?? raw.email ?? 'Account',
    displayName: raw.displayName ?? raw.display_name ?? raw.email ?? 'User',
    email: raw.email ?? '',
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? null,
    organization: raw.organization ?? null,
    tenant: raw.tenant
      ? {
          uuid: raw.tenant.uuid ?? raw.tenant.slug ?? '',
          slug: raw.tenant.slug ?? raw.tenant.uuid ?? '',
          status: raw.tenant.status
        }
      : null,
    roles: raw.roles ?? [],
    status: raw.status ?? 'active',
    lastLoginAt: raw.lastLoginAt ?? raw.last_login_at ?? null
  };
}

function normalizeLoginResponse(response: RawLoginResponse): UnifiedLoginResponse {
  const rawUser = response.user ?? response.account;
  if (!rawUser) {
    throw new Error('Login response did not include an account.');
  }

  const modules = response.modules ?? [];
  const tenant = normalizeTenant(response.tenant, modules);
  const preferences = response.preferences ?? {};

  return {
    ...response,
    user: {
      uuid: rawUser.uuid ?? '',
      displayName: rawUser.displayName ?? rawUser.display_name ?? rawUser.email ?? 'User',
      email: rawUser.email ?? '',
      avatarUrl: rawUser.avatarUrl ?? rawUser.avatar_url ?? null,
      roles: rawUser.roles ?? [],
      permissions: rawUser.permissions ?? [],
      locale: preferences.locale,
      timezone: preferences.timezone,
      twoFactorEnabled: rawUser.twoFactorEnabled ?? rawUser.two_factor_enabled
    },
    roles: response.roles ?? rawUser.roles ?? [],
    permissions: response.permissions ?? rawUser.permissions ?? [],
    locale: response.locale ?? preferences.locale,
    timezone: response.timezone ?? preferences.timezone,
    tenant: tenant ?? undefined
  };
}

function applyPlatformSession(response: LoginResponse) {
  authStore.setPlatformSession({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    user: response.user,
    roles: response.roles ?? response.user.roles,
    permissions: response.permissions ?? response.user.permissions,
    locale: response.locale ?? response.user.locale ?? 'en',
    timezone: response.timezone ?? response.user.timezone ?? 'Asia/Kolkata',
    expiresAt: response.expires_at ?? null
  });
}

function applyTenantSession(response: LoginResponse) {
  authStore.setTenantSession({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    user: response.user,
    roles: response.roles ?? response.user.roles,
    permissions: response.permissions ?? response.user.permissions,
    locale: response.locale ?? response.user.locale ?? response.tenant?.defaultLocale ?? 'en',
    timezone: response.timezone ?? response.user.timezone ?? response.tenant?.defaultTimezone ?? 'Asia/Kolkata',
    expiresAt: response.expires_at ?? null,
    tenant: response.tenant ?? null,
    office: response.office ?? null
  });
}

function applyUnifiedSession(response: RawLoginResponse) {
  const normalized = normalizeLoginResponse(response);

  if (normalized.surface === 'platform') {
    applyPlatformSession(normalized);
    return normalized;
  }

  applyTenantSession(normalized);
  return normalized;
}

function isTwoFactorChallenge(response: RawLoginResult): response is TwoFactorChallenge {
  return 'requires_2fa' in response && response.requires_2fa === true;
}

function normalizeLoginResult(response: RawLoginResult): LoginResult {
  if (isTwoFactorChallenge(response)) {
    return { type: '2fa_required', challenge: response };
  }

  return { type: 'logged_in', session: applyUnifiedSession(response) };
}

export const authApi = {
  discoverAccounts: async (body: DiscoverAccountsRequest) => {
    const response = await authClient.post<
      { email: string; discovery_token: string | null; expires_in_seconds: number; accounts: RawAccount[] },
      DiscoverAccountsRequest
    >('/accounts/discover', body);

    return {
      ...response,
      data: {
        email: response.data.email,
        discoveryToken: response.data.discovery_token,
        expiresInSeconds: response.data.expires_in_seconds,
        accounts: response.data.accounts.map(normalizeAccount)
      } satisfies AccountDiscovery
    };
  },
  loginAccount: async (body: UnifiedLoginRequest) => {
    const response = await authClient.post<RawLoginResult, UnifiedLoginRequest>(
      '/accounts/login',
      body
    );

    return {
      ...response,
      data: normalizeLoginResult(response.data)
    };
  },
  verifyLoginTwoFactor: async (body: VerifyLoginTwoFactorRequest) => {
    const response = await authClient.post<RawLoginResponse, VerifyLoginTwoFactorRequest>('/accounts/login/2fa', body);
    return {
      ...response,
      data: { type: 'logged_in', session: applyUnifiedSession(response.data) } satisfies LoginResult
    };
  },
  forgotPassword: (body: ForgotPasswordRequest) =>
    authClient.post<{ sent: boolean; message: string; reset_token?: string }, ForgotPasswordRequest>(
      '/password/forgot',
      body
    ),
  resetPassword: (body: ResetPasswordRequest) =>
    authClient.post<{ reset: boolean }, ResetPasswordRequest>('/password/reset', body),
  registerTenant: async (body: TenantRegistrationRequest) => {
    const response = await authClient.post<TenantRegistrationResponse, TenantRegistrationRequest>('/tenants/register', body);
    const payload = response.data;

    if (payload.access_token && payload.owner && payload.tenant) {
      applyTenantSession({
        access_token: payload.access_token,
        token_type: payload.token_type,
        expires_at: payload.expires_at,
        user: {
          uuid: payload.owner.uuid ?? '',
          displayName: payload.owner.display_name ?? payload.owner.email ?? 'Owner',
          email: payload.owner.email ?? '',
          avatarUrl: null,
          roles: payload.roles ?? [],
          permissions: payload.permissions ?? []
        },
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
        tenant: {
          uuid: payload.tenant.uuid ?? payload.tenant.slug ?? '',
          slug: payload.tenant.slug ?? payload.tenant.uuid ?? '',
          organizationName:
            payload.tenant.organization_name ??
            payload.tenant.display_name ??
            payload.tenant.slug ??
            'Tenant',
          enabledModules: [],
          status: payload.tenant.status,
          defaultCurrency: payload.tenant.default_currency,
          defaultTimezone: payload.tenant.default_timezone
        },
        office: null
      });
    }

    return response;
  },
  loginPlatform: async (body: UnifiedLoginRequest) => {
    const response = await authClient.post<RawLoginResult, UnifiedLoginRequest>(
      '/accounts/login',
      body
    );
    if ('requires_2fa' in response.data) return response;
    applyUnifiedSession(response.data);
    return response;
  },
  logout: async (guard: AuthGuard) => {
    try {
      if (guard === 'platform') {
        await platformClient.post('/auth/logout');
      } else {
        const tenant = authStore.getSnapshot().tenant.tenant;
        if (tenant) {
          await createTenantClient(tenant.slug ?? tenant.uuid).post('/auth/logout');
        }
      }
    } finally {
      authStore.clear(guard);
    }
  },
  refresh: async (guard: AuthGuard) => {
    if (guard === 'platform') {
      const response = await platformClient.post<LoginResponse>('/auth/refresh');
      applyPlatformSession(response.data);
      return response;
    }

    const tenant = authStore.getSnapshot().tenant.tenant;
    if (!tenant) throw new Error('Cannot refresh tenant session without tenant context.');
    const response = await createTenantClient(tenant.slug ?? tenant.uuid).post<LoginResponse>('/auth/refresh');
    applyTenantSession(response.data);
    return response;
  },
  me: async (guard: AuthGuard) => {
    if (guard === 'platform') {
      const response = await platformClient.get<RawLoginResponse>('/auth/me');
      return { ...response, data: normalizeLoginResponse(response.data) };
    }

    const tenant = authStore.getSnapshot().tenant.tenant;
    if (!tenant) throw new Error('Cannot load tenant profile without tenant context.');
    const response = await createTenantClient(tenant.slug ?? tenant.uuid).get<RawLoginResponse>('/auth/me');
    return { ...response, data: normalizeLoginResponse(response.data) };
  }
};
