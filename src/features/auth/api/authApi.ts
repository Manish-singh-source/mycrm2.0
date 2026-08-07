import { authStore } from '@/features/auth/store/authStore';
import type {
  AuthGuard,
  LoginResponse,
  PlatformLoginRequest,
  TenantLoginRequest
} from '@/features/auth/types/authTypes';
import { platformClient } from '@/lib/api/platformClient';
import { createTenantClient } from '@/lib/api/tenantClient';

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

export const authApi = {
  loginPlatform: async (body: PlatformLoginRequest) => {
    const response = await platformClient.post<LoginResponse, PlatformLoginRequest>('/auth/login', body);
    applyPlatformSession(response.data);
    return response;
  },
  loginTenant: async (body: TenantLoginRequest) => {
    const tenantClient = createTenantClient(body.tenant);
    const response = await tenantClient.post<LoginResponse, TenantLoginRequest>('/auth/login', body);
    applyTenantSession(response.data);
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
      return platformClient.get<LoginResponse>('/auth/me');
    }

    const tenant = authStore.getSnapshot().tenant.tenant;
    if (!tenant) throw new Error('Cannot load tenant profile without tenant context.');
    return createTenantClient(tenant.slug ?? tenant.uuid).get<LoginResponse>('/auth/me');
  }
};
