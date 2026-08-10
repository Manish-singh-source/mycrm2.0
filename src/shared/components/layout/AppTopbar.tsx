import { Bell, ChevronDown, CircleHelp, LogOut, Moon, Search, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
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
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar__left">
        <Button type="button" variant="ghost" size="sm" className="sidebar-toggle" onClick={onToggleSidebar}>
          Menu
        </Button>
        <label className="topbar-search">
          <Search size={16} aria-hidden />
          <span className="sr-only">Search</span>
          <input type="search" placeholder={searchPlaceholder} aria-label="Search" />
          <kbd>Ctrl K</kbd>
        </label>
      </div>

      <div className="topbar__right">
        {quickActions ? <div className="topbar-quick-actions">{quickActions}</div> : null}
        <button type="button" className="topbar-icon-button" aria-label="Toggle theme">
          <Moon size={18} aria-hidden />
        </button>
        <button type="button" className="topbar-icon-button" aria-label="Notifications">
          <Bell size={18} aria-hidden />
          {notificationCount > 0 ? <span className="topbar-count">{notificationCount}</span> : null}
        </button>
        <button type="button" className="topbar-icon-button" aria-label="Help">
          <CircleHelp size={18} aria-hidden />
        </button>
        <div
          className="topbar-profile-menu"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false);
          }}
        >
          <button type="button" className="topbar-profile" aria-label="Profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((current) => !current)}>
            <UserCircle2 size={24} aria-hidden />
            <span>
              <strong>{profileName ?? 'User'}</strong>
              <small>{title}</small>
            </span>
            <ChevronDown size={14} aria-hidden />
          </button>
          {profileOpen ? (
            <div className="topbar-profile-dropdown">
              <div>
                <strong>{profileName ?? 'User'}</strong>
                <small>{locale.toUpperCase()} / {timezone}</small>
              </div>
              {onLogout ? (
                <button type="button" onClick={onLogout}>
                  <LogOut size={16} aria-hidden />
                  Logout
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
