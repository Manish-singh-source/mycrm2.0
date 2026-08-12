import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PermissionGate } from '@/features/auth/guards/PermissionGate';
import { RequireAuth } from '@/features/auth/guards/RequireAuth';
import { RequirePermission } from '@/features/auth/guards/RequirePermission';
import { authStore } from '@/features/auth/store/authStore';
import { AppSidebar } from '@/shared/components/navigation';

function setPlatform(permissions: string[] = []) {
  authStore.setPlatformSession({
    accessToken: 'platform-token',
    permissions,
    roles: [],
    user: null
  });
}

function setTenant(permissions: string[] = [], enabledModules: string[] = ['crm']) {
  authStore.setTenantSession({
    accessToken: 'tenant-token',
    permissions,
    roles: [],
    user: null,
    tenant: {
      uuid: 'tenant-1',
      slug: 'acme',
      organizationName: 'Acme',
      enabledModules
    }
  });
}

describe('auth and permission guards', () => {
  it('redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={['/platform/dashboard']}>
        <Routes>
          <Route path="/auth/login" element={<div>Login</div>} />
          <Route path="/platform/dashboard" element={<RequireAuth guard="platform"><div>Dashboard</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('allows platform access when authenticated', () => {
    setPlatform(['dashboard.view']);
    render(
      <MemoryRouter initialEntries={['/platform/dashboard']}>
        <Routes>
          <Route path="/platform/dashboard" element={<RequireAuth guard="platform"><div>Platform dashboard</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Platform dashboard')).toBeInTheDocument();
  });

  it('blocks cross-tenant route leakage', () => {
    setTenant(['dashboard.view']);
    render(
      <MemoryRouter initialEntries={['/t/other/dashboard']}>
        <Routes>
          <Route path="/forbidden" element={<div>Forbidden</div>} />
          <Route path="/t/:tenantSlug/dashboard" element={<RequireAuth guard="tenant"><div>Tenant dashboard</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('redirects forbidden permission states', () => {
    setTenant(['client.view']);
    render(
      <MemoryRouter initialEntries={['/t/acme/projects']}>
        <Routes>
          <Route path="/forbidden" element={<div>Forbidden</div>} />
          <Route path="/t/:tenantSlug/projects" element={<RequirePermission guard="tenant" anyOf={['project.view']}><div>Projects</div></RequirePermission>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('renders PermissionGate fallback and hides disabled modules in navigation', () => {
    setTenant(['client.view', 'project.view'], ['crm']);
    render(
      <MemoryRouter>
        <PermissionGate guard="tenant" anyOf={['project.create']} fallback={<span>No access</span>}>
          <span>Create Project</span>
        </PermissionGate>
        <AppSidebar
          guard="tenant"
          title="Tenant"
          groups={[{ label: 'Work', items: [
            { label: 'Clients', to: '/t/acme/clients', permission: 'client.view', moduleCode: 'crm' },
            { label: 'Projects', to: '/t/acme/projects', permission: 'project.view', moduleCode: 'projects' }
          ] }]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('No access')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /clients/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /projects/i })).not.toBeInTheDocument();
  });
});
