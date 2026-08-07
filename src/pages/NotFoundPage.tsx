import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The route is not registered yet.</p>
        <Link to="/platform/dashboard">Go to platform dashboard</Link>
      </header>
    </section>
  );
}
