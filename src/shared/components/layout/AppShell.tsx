import type { PropsWithChildren, ReactNode } from 'react';

type AppShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  topbar?: ReactNode;
}>;

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      {sidebar}
      <div className="app-workspace">
        {topbar ? <header className="app-topbar">{topbar}</header> : null}
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
