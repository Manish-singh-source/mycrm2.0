import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll } from 'vitest';

import { authStore } from '@/features/auth/store/authStore';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  authStore.clear();
  localStorage.clear();
});

afterAll(() => server.close());
