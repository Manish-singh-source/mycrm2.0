import { Bell, ChevronDown, CircleHelp, LogOut, Moon, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';


type TopbarNotification = {
  id?: string | number;
  title?: unknown;
  message?: unknown;
  type?: unknown;
  read_at?: unknown;
  created_at?: unknown;
};

type AppTopbarProps = {
  title: string;
  locale: string;
  timezone: string;
  notificationCount?: number;
  profileName?: string;
  notifications?: TopbarNotification[];
  notificationsLoading?: boolean;
  onNotificationRead?: (id: string | number) => void;
  onNotificationOpen?: (notification: TopbarNotification) => void;
  onNotificationsOpen?: () => void;
  onLogout?: () => void;
  quickActions?: ReactNode;
};

export function AppTopbar({
  title,
  locale,
  timezone,
  notificationCount = 0,
  profileName,
  notifications = [],
  notificationsLoading = false,
  onNotificationRead,
  onNotificationOpen,
  onNotificationsOpen,
  onLogout,
  quickActions
}: AppTopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar__left" aria-hidden="true" />
      <div className="topbar__right">
        {quickActions ? <div className="topbar-quick-actions">{quickActions}</div> : null}
        <button type="button" className="topbar-icon-button" aria-label="Toggle theme">
          <Moon size={18} aria-hidden />
        </button>
        <div
          className="topbar-notification-menu"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setNotificationsOpen(false);
          }}
        >
          <button type="button" className="topbar-icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((current) => !current)}>
            <Bell size={18} aria-hidden />
            {notificationCount > 0 ? <span className="topbar-count">{notificationCount}</span> : null}
          </button>
          {notificationsOpen ? (
            <div className="topbar-notification-dropdown">
              <header>
                <div>
                  <strong>Notifications</strong>
                  <small>{notificationCount} unread</small>
                </div>
                <button type="button" onClick={() => { setNotificationsOpen(false); onNotificationsOpen?.(); }}>View all</button>
              </header>
              <div className="topbar-notification-list">
                {notificationsLoading ? <div className="topbar-notification-state">Loading notifications...</div> : null}
                {!notificationsLoading && notifications.length === 0 ? <div className="topbar-notification-state">No notifications found.</div> : null}
                {!notificationsLoading ? notifications.slice(0, 6).map((notification, index) => (
                  <article key={notification.id ?? index} className={notification.read_at ? undefined : 'is-unread'}>
                    <button type="button" onClick={() => { setNotificationsOpen(false); if (notification.id !== undefined) onNotificationRead?.(notification.id); onNotificationOpen?.(notification); }}>
                      <strong>{String(notification.title ?? notification.type ?? 'Notification')}</strong>
                      <span>{String(notification.message ?? notification.created_at ?? '-')}</span>
                      <small>{notification.read_at ? 'Read' : 'Unread'}</small>
                    </button>
                  </article>
                )) : null}
              </div>
            </div>
          ) : null}
        </div>
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



