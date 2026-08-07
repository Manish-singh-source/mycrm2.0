type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Foundation</p>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
    </section>
  );
}
