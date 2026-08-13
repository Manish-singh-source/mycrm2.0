import { RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRouter } from '@/app/router/appRouter';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} future={{ v7_startTransition: true }} />
    </AppProviders>
  );
}
