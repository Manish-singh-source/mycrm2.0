import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { authClient } from '@/lib/api/authClient';

const documentLabels: Record<string, string> = {
  terms_and_conditions: 'Terms and Conditions',
  privacy_policy: 'Privacy Policy',
  dpa: 'Data Processing Agreement',
  tenant_agreement: 'Tenant Agreement'
};

type LegalDocument = { title: string; document_type: string; version: string; content: string; published_at?: string | null };

export function PublicLegalDocumentPage() {
  const { documentType = '' } = useParams();
  const query = useQuery({
    queryKey: ['public-legal-document', documentType],
    queryFn: async () => (await authClient.get<{ document: LegalDocument }>(`/legal/${encodeURIComponent(documentType)}`)).data.document,
    enabled: Boolean(documentLabels[documentType])
  });
  const title = documentLabels[documentType];

  if (!title) return <section className="auth-card"><h1>Document not found</h1><Link to="/auth/login">Return to login</Link></section>;
  if (query.isLoading) return <section className="auth-card"><p>Loading {title}...</p></section>;
  if (query.isError || !query.data) return <section className="auth-card"><h1>{title}</h1><p>This published document is not available.</p><Link to="/auth/login">Return to login</Link></section>;

  return (
    <main className="auth-card legal-document-page">
      <header><p className="eyebrow">Published legal document</p><h1>{query.data.title}</h1><p>Version {query.data.version}</p></header>
      <article className="legal-document-content">{query.data.content}</article>
      <Link to="/auth/login">Return to login</Link>
    </main>
  );
}