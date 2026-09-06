import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionPreferences } from '@/features/auth/hooks/useSessionPreferences';
import { useProfileSession } from '@/features/auth/hooks/useProfileSession';
import { authClient } from '@/lib/api/authClient';
import { platformNavigation } from '@/features/platform/navigation/platformNavigation';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { AppShell, AppTopbar } from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';
import { getReadPlatformNotificationIds, markPlatformNotificationRead, platformNotificationReadEvent } from '@/features/platform/notifications/platformNotificationRead';

type Announcement = { uuid: string; title: string; body: string; published_at?: string | null };

export function PlatformLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth('platform');
  useProfileSession('platform');
  const { locale, timezone } = useSessionPreferences('platform');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => getReadPlatformNotificationIds());
  useEffect(() => {
    const refreshReadState = () => setReadNotificationIds(getReadPlatformNotificationIds());
    window.addEventListener(platformNotificationReadEvent(), refreshReadState);
    return () => window.removeEventListener(platformNotificationReadEvent(), refreshReadState);
  }, []);
  const announcementsQuery = useQuery({
    queryKey: ['platform-topbar-announcements'],
    queryFn: async () => (await authClient.get<Announcement[]>('/announcements')).data
  });
  const announcementNotifications = (announcementsQuery.data ?? []).map((announcement) => ({
    id: announcement.uuid,
    title: announcement.title,
    message: announcement.body,
    type: 'announcement',
    created_at: announcement.published_at,
    read_at: readNotificationIds.includes(announcement.uuid) ? announcement.published_at : null
  }));

  async function handleLogout() {
    await logout();
    navigate('/auth/login', { replace: true });
  }

  return (
    <AppShell
      sidebar={({ sidebarOpen, toggleSidebar }) => (
        <AppSidebar guard="platform" groups={platformNavigation} title="SaaS CRM" isCollapsed={!sidebarOpen} onToggleCollapse={toggleSidebar} />
      )}
      topbar={() => (
        <AppTopbar
          title="Platform"
          locale={locale}
          timezone={timezone}
          notificationCount={announcementNotifications.filter((notification) => !notification.read_at).length}
          notifications={announcementNotifications}
          notificationsLoading={announcementsQuery.isLoading}
          onNotificationOpen={(notification) => notification.id !== undefined && navigate(`${PLATFORM_ROUTES.notifications}/${notification.id}`)}
          onNotificationsOpen={() => navigate(PLATFORM_ROUTES.notifications)}
          profileName={user?.displayName}
          onLogout={handleLogout}
        />
      )}
    >
      <div className="layout-page-chrome"><Outlet /></div>
    </AppShell>
  );
}