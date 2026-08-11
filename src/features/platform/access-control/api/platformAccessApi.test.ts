import { beforeEach, describe, expect, it, vi } from 'vitest';

import { platformClient } from '@/lib/api/platformClient';

import { platformAccessApi, type AccessExportPayload } from './platformAccessApi';

vi.mock('@/lib/api/platformClient', () => ({
  platformClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

const mockedGet = vi.mocked(platformClient.get);
const mockedPost = vi.mocked(platformClient.post);

describe('platformAccessApi', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('sends roles list filters, sorting, and pagination to the backend', async () => {
    mockedGet.mockResolvedValueOnce({ data: [], meta: { pagination: { total: 0 } } } as never);

    await platformAccessApi.roles.list({
      search: 'admin',
      page: 2,
      per_page: 25,
      sort: 'display_name',
      direction: 'desc',
      filter: { status: 'active', type: 'custom', guard_name: 'platform' }
    });

    expect(mockedGet).toHaveBeenCalledWith('/access-control/roles', {
      query: {
        search: 'admin',
        page: 2,
        per_page: 25,
        sort: 'display_name',
        direction: 'desc',
        filter: { status: 'active', type: 'custom', guard_name: 'platform' }
      }
    });
  });

  it('sends permissions list module, guard, status filters and backend sorting', async () => {
    mockedGet.mockResolvedValueOnce({ data: [], meta: { pagination: { total: 0 } } } as never);

    await platformAccessApi.permissions.list({
      search: 'invoice',
      sort: 'module',
      direction: 'asc',
      filter: { module: 'billing', guard_name: 'platform', status: 'active' }
    });

    expect(mockedGet).toHaveBeenCalledWith('/access-control/permissions', {
      query: {
        search: 'invoice',
        sort: 'module',
        direction: 'asc',
        filter: { module: 'billing', guard_name: 'platform', status: 'active' }
      }
    });
  });

  it('posts role and permission exports with delivery, selected ids, filters, and sort', async () => {
    mockedPost.mockResolvedValue({ data: { export: { report_code: 'platform-roles' } } } as never);
    const payload: AccessExportPayload = {
      format: 'csv',
      delivery: 'job',
      scope: 'selected',
      selected_ids: ['role-1'],
      filters: { status: 'active' },
      sort: 'name',
      direction: 'asc',
      columns: ['uuid', 'name'],
      timezone: 'Asia/Calcutta',
      email_when_ready: true
    };

    await platformAccessApi.roles.export(payload);
    await platformAccessApi.permissions.export({ ...payload, selected_ids: ['permission-1'] });

    expect(mockedPost).toHaveBeenNthCalledWith(1, '/access-control/roles/export', payload);
    expect(mockedPost).toHaveBeenNthCalledWith(2, '/access-control/permissions/export', {
      ...payload,
      selected_ids: ['permission-1']
    });
  });

  it('uses the real audit activity and export endpoints', async () => {
    mockedGet.mockResolvedValueOnce({ data: [], meta: { pagination: { total: 0 } } } as never);
    mockedPost.mockResolvedValueOnce({ data: { download: { mime_type: 'text/csv' } } } as never);

    await platformAccessApi.audit.list({ sort: 'created_at', direction: 'desc', filter: { event: 'platform_role_created' } });
    await platformAccessApi.audit.export({
      format: 'csv',
      delivery: 'download',
      scope: 'filtered',
      filters: { event: 'platform_role_created' },
      columns: ['event', 'description']
    });

    expect(mockedGet).toHaveBeenCalledWith('/audit/activity-logs', {
      query: { sort: 'created_at', direction: 'desc', filter: { event: 'platform_role_created' } }
    });
    expect(mockedPost).toHaveBeenCalledWith('/audit/export', {
      format: 'csv',
      delivery: 'download',
      scope: 'filtered',
      filters: { event: 'platform_role_created' },
      columns: ['event', 'description']
    });
  });
});