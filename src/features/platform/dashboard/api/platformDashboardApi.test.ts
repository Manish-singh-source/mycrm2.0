import { beforeEach, describe, expect, it, vi } from 'vitest';

import { platformClient } from '@/lib/api/platformClient';

import { platformDashboardApi } from './platformDashboardApi';

vi.mock('@/lib/api/platformClient', () => ({
  platformClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

const mockedGet = vi.mocked(platformClient.get);

describe('platformDashboardApi', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('reads subscription status data from the backend tenant_status aggregate key', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        tenant_status: [
          { status: 'active', count: 3 },
          { status: 'trial', count: 1 }
        ]
      }
    } as never);

    const response = await platformDashboardApi.subscriptionStatus({});

    expect(mockedGet).toHaveBeenCalledWith('/dashboard/charts/subscription-status', { query: {} });
    expect(response.data).toEqual([
      { status: 'active', count: 3 },
      { status: 'trial', count: 1 }
    ]);
  });

  it('uses plain status query parameters for failed queue jobs', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] } as never);

    await platformDashboardApi.failedJobs({ date_from: '2026-08-01' });

    expect(mockedGet).toHaveBeenCalledWith('/monitoring/queue-jobs', {
      query: { date_from: '2026-08-01', date_to: undefined, status: 'failed' }
    });
  });

  it('uses plain status query parameters for dashboard incidents', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] } as never);

    await platformDashboardApi.incidents({});

    expect(mockedGet).toHaveBeenCalledWith('/monitoring/incidents', {
      query: { date_from: undefined, date_to: undefined, status: ['open', 'investigating', 'active'] }
    });
  });
});
