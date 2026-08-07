import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';

type AppShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  topbar?: ReactNode | ((context: { sidebarOpen: boolean; toggleSidebar: () => void }) => ReactNode);
}>;

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function syncSidebar() {
      const desktop = window.innerWidth >= 960;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    }

    syncSidebar();
    window.addEventListener('resize', syncSidebar);
    return () => window.removeEventListener('resize', syncSidebar);
  }, []);

  return (
    <div className={`app-shell ${sidebarOpen ? 'app-shell--sidebar-open' : 'app-shell--sidebar-collapsed'}`}>
      <div className={`app-shell__sidebar ${sidebarOpen ? 'is-open' : 'is-collapsed'}`}>{sidebar}</div>
      {!isDesktop && sidebarOpen ? (
        <button type="button" className="app-shell__backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <div className="app-workspace">
        {topbar ? (
          <header className="app-topbar">
            {typeof topbar === 'function'
              ? topbar({ sidebarOpen, toggleSidebar: () => setSidebarOpen((current) => !current) })
              : topbar}
          </header>
        ) : null}
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
