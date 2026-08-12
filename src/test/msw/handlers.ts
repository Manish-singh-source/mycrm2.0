import { http, HttpResponse } from 'msw';

export const platformHandlers = [
  http.get('/api/platform/v1/tenants', () =>
    HttpResponse.json({
      data: [{ uuid: 'tenant-1', organization_name: 'Acme CRM', status: 'active' }],
      meta: { current_page: 1, per_page: 25, total: 1, last_page: 1 }
    })
  ),
  http.get('/api/platform/v1/dashboard', () =>
    HttpResponse.json({ data: { cards: { active_tenants: 1 } } })
  )
];

export const tenantHandlers = [
  http.get('/api/tenant/v1/dashboard', ({ request }) =>
    HttpResponse.json({
      data: {
        tenant: request.headers.get('X-Tenant'),
        cards: { clients: 3, projects: 2 }
      }
    })
  ),
  http.get('/api/tenant/v1/clients', () =>
    HttpResponse.json({
      data: [{ uuid: 'client-1', display_name: 'Acme Ltd', status: 'active' }],
      meta: { current_page: 1, per_page: 25, total: 1, last_page: 1 }
    })
  )
];

export const handlers = [...platformHandlers, ...tenantHandlers];
