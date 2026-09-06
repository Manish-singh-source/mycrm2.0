import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { authClient } from '@/lib/api/authClient';

type Announcement = { uuid: string; title: string; body: string; published_at?: string | null };

export function PublicAnnouncementsPage() {
  const query = useQuery({
    queryKey: ['public-announcements'],
    queryFn: async () => (await authClient.get<Announcement[]>('/announcements')).data
  });

  return (
    <main className="auth-card public-announcements-page">
      <header><p className="eyebrow">Platform updates</p><h1>Announcements</h1><p>Important updates and service information from the platform.</p></header>
      {query.isLoading ? <p>Loading announcements...</p> : null}
      {query.isError ? <p className="field-error">Announcements are currently unavailable.</p> : null}
      {!query.isLoading && !query.isError && query.data?.length === 0 ? <p>No published announcements are available.</p> : null}
      <div className="record-list">
        {query.data?.map((announcement) => (
          <article key={announcement.uuid} className="settings-panel">
            <h2>{announcement.title}</h2>
            {announcement.published_at ? <small>Published {new Date(announcement.published_at).toLocaleDateString()}</small> : null}
            <p className="legal-document-content">{announcement.body}</p>
          </article>
        ))}
      </div>
      <Link to="/auth/login">Return to login</Link>
    </main>
  );
}