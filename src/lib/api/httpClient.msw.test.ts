import { describe, expect, it } from 'vitest';

import { authStore } from '@/features/auth/store/authStore';
import { platformClient } from '@/lib/api/platformClient';
import { createTenantClient } from '@/lib/api/tenantClient';

describe('MSW API mocking strategy', () => {
  it('mocks platform endpoints through the shared test server', async () => {
    authStore.setPlatformSession({ accessToken: 'platform-token', permissions: ['tenant.view'] });

    const response = await platformClient.get<{ uuid: string; organization_name: string }[]>('/tenants');

    expect(response.data[0]).toMatchObject({ uuid: 'tenant-1', organization_name: 'Acme CRM' });
  });

  it('mocks tenant endpoints and preserves tenant isolation headers', async () => {
    authStore.setTenantSession({
      accessToken: 'tenant-token',
      permissions: ['dashboard.view'],
      tenant: { uuid: 'tenant-1', slug: 'acme', organizationName: 'Acme', enabledModules: ['crm'] }
    });

    const response = await createTenantClient('acme').get<{ tenant: string | null; cards: Record<string, number> }>('/dashboard');

    expect(response.data.tenant).toBe('acme');
    expect(response.data.cards.clients).toBe(3);
  });
});
