import { describe, expect, it } from 'vitest';

import { toQueryString } from './queryString';

describe('toQueryString', () => {
  it('serializes pagination, search, and filters', () => {
    expect(toQueryString({ page: 2, per_page: 25, search: 'acme', filter: { status: 'active', owner: 'u-1' } })).toBe(
      '?page=2&per_page=25&search=acme&filter%5Bstatus%5D=active&filter%5Bowner%5D=u-1'
    );
  });

  it('drops empty values and joins arrays', () => {
    expect(toQueryString({ search: '', filter: { ids: ['a', '', 'b'], empty: null } })).toBe('?filter%5Bids%5D=a%2Cb');
  });

  it('returns an empty string without query params', () => {
    expect(toQueryString()).toBe('');
    expect(toQueryString({ filter: { status: '' } })).toBe('');
  });
});
