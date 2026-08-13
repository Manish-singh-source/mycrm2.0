import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';

type SidebarRenderContext = { sidebarOpen: boolean; toggleSidebar: () => void };

type AppShellProps = PropsWithChildren<{
  sidebar: ReactNode | ((context: SidebarRenderContext) => ReactNode);
  topbar?: ReactNode | ((context: SidebarRenderContext) => ReactNode);
}>;

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const toggleSidebar = () => setSidebarOpen((current) => !current);
  const sidebarHidden = !isDesktop && !sidebarOpen;

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
      <div
        className={`app-shell__sidebar ${sidebarOpen ? 'is-open' : 'is-collapsed'}`}
        aria-hidden={sidebarHidden}
      >
        {typeof sidebar === 'function' ? sidebar({ sidebarOpen, toggleSidebar }) : sidebar}
      </div>
      {!isDesktop && sidebarOpen ? (
        <button type="button" className="app-shell__backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <div className="app-workspace">
        {topbar ? (
          <header className="app-topbar">
            {typeof topbar === 'function'
              ? topbar({ sidebarOpen, toggleSidebar })
              : topbar}
          </header>
        ) : null}
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
