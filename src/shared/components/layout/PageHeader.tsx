import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: ReactNode;
  tabs?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ title, eyebrow, description, breadcrumbs, tabs, actions, meta }: PageHeaderProps) {
  return (
    <header className="enterprise-page-header">
      {breadcrumbs}
      <div className="enterprise-page-header__main">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
          {meta ? <div className="page-meta">{meta}</div> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {tabs}
    </header>
  );
}
