import { Bell, Clock3, Globe2, LogOut, Plus, Search, UserCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/shared/components/ui';

type AppTopbarProps = {
  title: string;
  searchPlaceholder?: string;
  locale: string;
  timezone: string;
  notificationCount?: number;
  profileName?: string;
  onToggleSidebar: () => void;
  onLogout?: () => void;
  quickActions?: ReactNode;
};

export function AppTopbar({
  title,
  searchPlaceholder = 'Search records, commands, or pages',
  locale,
  timezone,
  notificationCount = 0,
  profileName,
  onToggleSidebar,
  onLogout,
  quickActions
}: AppTopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar__left">
        <Button type="button" variant="ghost" size="sm" className="sidebar-toggle" onClick={onToggleSidebar}>
          Menu
        </Button>
        <div className="topbar__title">{title}</div>
        <label className="topbar-search">
          <Search size={16} aria-hidden />
          <span className="sr-only">Search</span>
          <input type="search" placeholder={searchPlaceholder} aria-label="Search" />
        </label>
      </div>

      <div className="topbar__right">
        {quickActions ? <div className="topbar-quick-actions">{quickActions}</div> : null}
        <div className="topbar-chip">
          <Globe2 size={14} aria-hidden />
          <span>{locale.toUpperCase()}</span>
        </div>
        <div className="topbar-chip">
          <Clock3 size={14} aria-hidden />
          <span>{timezone}</span>
        </div>
        <button type="button" className="topbar-icon-button" aria-label="Notifications">
          <Bell size={18} aria-hidden />
          {notificationCount > 0 ? <span className="topbar-count">{notificationCount}</span> : null}
        </button>
        <button type="button" className="topbar-icon-button" aria-label="Quick actions">
          <Plus size={18} aria-hidden />
        </button>
        <div className="topbar-profile" aria-label="Profile">
          <UserCircle2 size={20} aria-hidden />
          <span>{profileName ?? 'User'}</span>
        </div>
        {onLogout ? (
          <Button type="button" variant="danger" size="sm" onClick={onLogout}>
            <LogOut size={16} aria-hidden />
            Logout
          </Button>
        ) : null}
      </div>
    </div>
  );
}
