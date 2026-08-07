import type { ReactNode } from 'react';

type SummaryCardProps = {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
};

export function SummaryCard({ label, value, trend, icon, footer, loading }: SummaryCardProps) {
  return (
    <section className="summary-card" aria-busy={loading}>
      <div className="summary-card__top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{loading ? 'Loading...' : value}</strong>
      {trend ? <div className="summary-card__trend">{trend}</div> : null}
      {footer ? <div className="summary-card__footer">{footer}</div> : null}
    </section>
  );
}
