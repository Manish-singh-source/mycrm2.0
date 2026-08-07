import { authStore, useAuthStore } from '@/features/auth/store/authStore';

export function useTenantContext() {
  const auth = useAuthStore();

  return {
    tenant: auth.tenant.tenant,
    office: auth.tenant.office,
    setOffice: authStore.setTenantOffice,
    tenantHeader: auth.tenant.tenant?.slug ?? auth.tenant.tenant?.uuid ?? null
  };
}
