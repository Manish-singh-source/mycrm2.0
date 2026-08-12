import { describe, expect, it } from 'vitest';

import { hasAllPermissions, hasAnyPermission, hasPermission, isModuleEnabled } from './permissions';
import type { AuthState } from '@/features/auth/types/authTypes';

const auth: AuthState = {
  platform: {
    accessToken: 'platform-token',
    user: null,
    permissions: ['tenant.view', 'billing.invoice.view'],
    roles: [],
    locale: 'en',
    timezone: 'Asia/Kolkata',
    expiresAt: null,
    status: 'authenticated'
  },
  tenant: {
    accessToken: 'tenant-token',
    user: null,
    permissions: ['client.view', 'project.create'],
    roles: [],
    locale: 'en',
    timezone: 'Asia/Kolkata',
    expiresAt: null,
    status: 'authenticated',
    office: null,
    tenant: {
      uuid: 'tenant-1',
      slug: 'acme',
      organizationName: 'Acme',
      enabledModules: ['crm', 'projects']
    }
  }
};

describe('permission helpers', () => {
  it('checks guard-specific permissions', () => {
    expect(hasPermission(auth, 'platform', 'tenant.view')).toBe(true);
    expect(hasPermission(auth, 'tenant', 'tenant.view')).toBe(false);
  });

  it('supports any/all permission checks', () => {
    expect(hasAnyPermission(auth, 'tenant', ['missing', 'client.view'])).toBe(true);
    expect(hasAllPermissions(auth, 'tenant', ['client.view', 'project.create'])).toBe(true);
    expect(hasAllPermissions(auth, 'tenant', ['client.view', 'missing'])).toBe(false);
  });

  it('supports wildcard permissions and enabled modules', () => {
    expect(hasPermission({ ...auth, platform: { ...auth.platform, permissions: ['*'] } }, 'platform', 'anything')).toBe(true);
    expect(isModuleEnabled(auth, 'crm')).toBe(true);
    expect(isModuleEnabled(auth, 'payroll')).toBe(false);
  });
});
