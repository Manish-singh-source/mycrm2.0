import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { authClient } from '@/lib/api/authClient';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { PageHeader, StatusBadge } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui';
import { markPlatformNotificationRead } from '@/features/platform/notifications/platformNotificationRead';

export type PlatformNotification = {
  id: string;
  title: string;
  message: string;
  type: 'announcement';
  status: 'published';
  created_at?: string | null;
};

type PublishedAnnouncement = {
  uuid: string;
  title: string;
  body: string;
  published_at?: string | null;
};

async function fetchPlatformNotifications() {
  const response = await authClient.get<PublishedAnnouncement[]>('/announcements');
  return (response.data ?? []).map<PlatformNotification>((announcement) => ({
    id: announcement.uuid,
    title: announcement.title,
    message: announcement.body,
    type: 'announcement',
    status: 'published',
    created_at: announcement.published_at
  }));
}

function notificationColumns(onView: (notification: PlatformNotification) => void): DataTableColumn<PlatformNotification>[] {
  return [
    { id: 'type', header: 'Type', accessor: (row) => row.type, enableSorting: true, cell: () => <StatusBadge tone="info">Announcement</StatusBadge> },
    { id: 'title', header: 'Title', accessor: (row) => row.title, enableSorting: true, cell: (row) => <strong>{row.title}</strong> },
    { id: 'message', header: 'Message', accessor: (row) => row.message, cell: (row) => <span>{row.message}</span> },
    { id: 'created_at', header: 'Published', accessor: (row) => row.created_at, enableSorting: true, cell: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : '-' },
    { id: 'status', header: 'Status', accessor: (row) => row.status, cell: () => <StatusBadge tone="success">Published</StatusBadge> },
    { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <Button type="button" variant="secondary" size="sm" onClick={() => onView(row)}>View</Button> }
  ];
}

export function PlatformNotificationsPage() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['platform-notifications'], queryFn: fetchPlatformNotifications });
  const rows = query.data ?? [];

  return (
    <section className="enterprise-module-page">
      <PageHeader title="Notifications" description="Published platform announcements and notifications available to platform users." meta={<StatusBadge tone="info">{`${rows.length} notification${rows.length === 1 ? '' : 's'}`}</StatusBadge>} />
      <DataTable columns={notificationColumns((notification) => navigate(`/platform/notifications/${notification.id}`))} data={rows} getRowId={(row) => row.id} loading={query.isLoading} error={query.isError ? 'Notifications are currently unavailable.' : undefined} emptyState="No notifications are available." total={rows.length} />
    </section>
  );
}

export function PlatformNotificationDetailPage() {
  const navigate = useNavigate();
  const { notificationId = '' } = useParams();
  const query = useQuery({ queryKey: ['platform-notifications'], queryFn: fetchPlatformNotifications });
  const notification = query.data?.find((item) => item.id === notificationId);

  useEffect(() => {
    if (notificationId) markPlatformNotificationRead(notificationId);
  }, [notificationId]);

  if (query.isLoading) return <div className="surface-state">Loading notification...</div>;
  if (query.isError) return <div className="surface-error">Notification is currently unavailable.</div>;
  if (!notification) return <div className="empty-state">Notification not found.</div>;

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={notification.title}
        description="Platform announcement"
        meta={<StatusBadge tone="success">Published</StatusBadge>}
        actions={<Button type="button" variant="secondary" onClick={() => navigate('/platform/notifications')}>Back to notifications</Button>}
      />
      <article className="settings-panel">
        {notification.created_at ? <small>Published {new Date(notification.created_at).toLocaleString()}</small> : null}
        <div className="surface-body"><p>{notification.message}</p></div>
      </article>
    </section>
  );
}