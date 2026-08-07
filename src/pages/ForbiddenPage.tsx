import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">403</p>
        <h1>Access forbidden</h1>
        <p>You do not have permission to open this area.</p>
        <Link to="/">Return to workspace</Link>
      </header>
    </section>
  );
}
