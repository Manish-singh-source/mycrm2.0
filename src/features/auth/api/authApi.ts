import { authStore } from '@/features/auth/store/authStore';
import type {
  AuthGuard,
  AccountDiscovery,
  DiscoveredAccount,
  DiscoverAccountsRequest,
  ForgotPasswordRequest,
  LoginResponse,
  LoginResult,
  PublicPlan,
  ResetPasswordRequest,
  TenantRegistrationRequest,
  TenantRegistrationResponse,
  TenantContext,
  AuthSurface,
  TwoFactorChallenge,
  TwoFactorSetupRequired,
  UnifiedLoginRequest,
  UnifiedLoginResponse,
  VerifyLoginTwoFactorRequest
} from '@/features/auth/types/authTypes';
import { authClient } from '@/lib/api/authClient';
import { commonClient } from '@/lib/api/commonClient';
import { platformClient } from '@/lib/api/platformClient';
import type { ApiRequestOptions } from '@/lib/api/apiTypes';

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

type RawPermission = string | { name?: string; code?: string };

export type CurrencyOption = { id: number; name: string; code: string; symbol?: string | null; decimal_places?: number };
export type TimezoneOption = { id: number; name: string; identifier: string; utc_offset?: string | null };

function normalizeNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && typeof item === 'object') {
      const named = item as { name?: unknown; code?: unknown };
      const name = named.name ?? named.code;
      return typeof name === 'string' ? [name] : [];
    }
    return [];
  }))];
}

type RawAccount = {
  account_ref?: string;
  accountRef?: string;
  account_type?: string;
  accountType?: string;
  auth_guard?: AuthGuard;
  authGuard?: AuthGuard;
  label?: string;
  display_name?: string;
  display_label?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  displayName?: string;
  email?: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  organization?: string | null;
  tenant?: RawTenantContext | null;
  roles?: RawPermission[];
  status?: string;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
  uuid?: string;
  id?: string | number;
  tenant_id?: string | number | null;
  permissions?: RawPermission[];
  two_factor_enabled?: boolean;
  twoFactorEnabled?: boolean;
};

type RawLoginResponse = Omit<UnifiedLoginResponse, 'user' | 'tenant'> & {
  account?: RawAccount;
  user?: RawAccount;
  tenant?: RawTenantContext | null;
  account_type?: string;
  tenant_id?: string | number | null;
  surface?: AuthSurface;
};

type RawLoginResult = RawLoginResponse | TwoFactorChallenge | TwoFactorSetupRequired;

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
  const displayName = raw.displayName ?? raw.display_name ?? raw.name ?? ([raw.first_name, raw.last_name].filter(Boolean).join(' ') || raw.email || 'User');
  return {
    accountRef: raw.accountRef ?? raw.account_ref ?? '',
    accountType: raw.accountType ?? raw.account_type ?? 'tenant',
    authGuard: raw.authGuard ?? raw.auth_guard ?? 'tenant',
    label: raw.label ?? raw.display_label ?? displayName,
    displayName,
    email: raw.email ?? '',
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? null,
    organization: raw.organization ?? null,
    tenant: raw.tenant
      ? {
          uuid: raw.tenant.uuid ?? raw.tenant.slug ?? '',
          slug: raw.tenant.slug ?? raw.tenant.uuid ?? '',
          status: raw.tenant.status
        }
      : raw.tenant_id != null ? { uuid: String(raw.tenant_id), slug: String(raw.tenant_id) } : null,
    roles: normalizeNames(raw.roles),
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
  const surface = response.surface ?? (response.account_type === 'platform' ? 'platform' : 'tenant');
  const tenant = normalizeTenant(response.tenant, modules) ?? (surface === 'tenant' && response.tenant_id != null
    ? { uuid: String(response.tenant_id), slug: String(response.tenant_id), organizationName: 'Tenant', enabledModules: modules }
    : null);
  const preferences = response.preferences ?? {};

  return {
    ...response,
    user: {
      uuid: rawUser.uuid ?? (rawUser.id != null ? String(rawUser.id) : ''),
      displayName: rawUser.displayName ?? rawUser.display_name ?? rawUser.name ?? ([rawUser.first_name, rawUser.last_name].filter(Boolean).join(' ') || rawUser.email || 'User'),
      email: rawUser.email ?? '',
      avatarUrl: rawUser.avatarUrl ?? rawUser.avatar_url ?? null,
      roles: normalizeNames(rawUser.roles),
      permissions: normalizeNames(rawUser.permissions),
      locale: preferences.locale,
      timezone: preferences.timezone,
      twoFactorEnabled: rawUser.twoFactorEnabled ?? rawUser.two_factor_enabled
    },
    roles: normalizeNames(response.roles ?? rawUser.roles),
    permissions: normalizeNames(response.permissions ?? rawUser.permissions),
    locale: response.locale ?? preferences.locale,
    timezone: response.timezone ?? preferences.timezone,
    tenant: tenant ?? undefined,
    surface
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

function authenticatedAuthOptions(guard: AuthGuard): ApiRequestOptions {
  const session = guard === 'platform' ? authStore.getSnapshot().platform : authStore.getSnapshot().tenant;
  if (!session.accessToken) throw new Error('An authenticated session is required.');
  return { headers: { Authorization: 'Bearer ' + session.accessToken } };
}

function isTwoFactorChallenge(response: RawLoginResult): response is TwoFactorChallenge {
  return 'requires_2fa' in response && response.requires_2fa === true;
}

function isTwoFactorSetupRequired(response: RawLoginResult): response is TwoFactorSetupRequired {
  return 'requires_2fa_setup' in response && response.requires_2fa_setup === true;
}

function normalizeLoginResult(response: RawLoginResult): LoginResult {
  if (isTwoFactorSetupRequired(response)) {
    return { type: '2fa_setup_required', setup: response };
  }

  if (isTwoFactorChallenge(response)) {
    return { type: '2fa_required', challenge: response };
  }

  return { type: 'logged_in', session: applyUnifiedSession(response) };
}

export const authApi = {
  publicCurrencies: async () => {
    const response = await commonClient.get<CurrencyOption[]>('/currencies');
    return Array.isArray(response.data) ? response.data : [];
  },
  publicTimezones: async () => {
    const response = await commonClient.get<TimezoneOption[]>('/timezones');
    return Array.isArray(response.data) ? response.data : [];
  },
  confirmRegistrationPayment: (body: { tenant_uuid: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    authClient.post<{ payment: Record<string, unknown> }, typeof body>('/tenants/register/payment/confirm', body),  publicPlans: async () => {
    const response = await authClient.get<{ plans: PublicPlan[] }>('/tenants/plans');
    return Array.isArray(response.data?.plans) ? response.data.plans : [];
  },
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
  enableRequiredTwoFactor: (email: string, password: string) => platformClient.post<{ setup_token: string; secret: string; provisioning_uri: string }, { email: string; password: string }>('/2fa/enable', { email, password }),
  confirmRequiredTwoFactor: (setupToken: string, code: string) => platformClient.post<Record<string, unknown>, { setup_token: string; code: string }>('/2fa/confirm', { setup_token: setupToken, code }),
  verifyLoginTwoFactor: async (body: VerifyLoginTwoFactorRequest) => {
    const response = await authClient.post<RawLoginResponse, VerifyLoginTwoFactorRequest>('/accounts/login/2fa', body);
    return {
      ...response,
      data: { type: 'logged_in', session: applyUnifiedSession(response.data) } satisfies LoginResult
    };
  },
  forgotPassword: (body: ForgotPasswordRequest) =>
    authClient.post<{ email: string; reset_token?: string }, ForgotPasswordRequest>(
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
    if ('requires_2fa' in response.data || 'requires_2fa_setup' in response.data) return response;
    applyUnifiedSession(response.data);
    return response;
  },
  logout: async (guard: AuthGuard) => {
    try {
      await authClient.post('/logout', undefined, authenticatedAuthOptions(guard));
    } finally {
      authStore.clear(guard);
    }
  },
  refresh: async (guard: AuthGuard) => {
    const response = await authClient.post<{ access_token: string; token_type?: string }>('/refresh', undefined, authenticatedAuthOptions(guard));
    const session = guard === 'platform' ? authStore.getSnapshot().platform : authStore.getSnapshot().tenant;
    if (guard === 'platform') authStore.setPlatformSession({ accessToken: response.data.access_token, expiresAt: null });
    else authStore.setTenantSession({ accessToken: response.data.access_token, expiresAt: null });
    return { ...response, data: { ...session, accessToken: response.data.access_token, expiresAt: null } };
  },
  me: async (guard: AuthGuard) => {
    const response = await authClient.get<RawLoginResponse>('/me', authenticatedAuthOptions(guard));
    const normalized = normalizeLoginResponse(response.data);
    const session = guard === 'platform' ? authStore.getSnapshot().platform : authStore.getSnapshot().tenant;
    const tenantSession = authStore.getSnapshot().tenant;
    const rawUser = response.data.user ?? response.data.account;
    const roles: string[] = Array.isArray(rawUser?.roles) || Array.isArray(response.data.roles)
      ? normalized.roles ?? []
      : session.roles;
    const permissions: string[] = Array.isArray(rawUser?.permissions) || Array.isArray(response.data.permissions)
      ? normalized.permissions ?? []
      : session.permissions;
    const hydrated = {
      ...normalized,
      roles,
      permissions,
      user: { ...normalized.user, roles, permissions }
    };
    if (guard === 'platform') {
      authStore.setPlatformSession({ user: hydrated.user, roles, permissions });
    } else {
      authStore.setTenantSession({ user: hydrated.user, roles, permissions, tenant: normalized.tenant ?? tenantSession.tenant });
    }
    return { ...response, data: hydrated };
  }
};



