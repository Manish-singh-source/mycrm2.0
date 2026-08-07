import type { PropsWithChildren, ReactNode } from 'react';

type ChartCardProps = PropsWithChildren<{
  title: ReactNode;
  action?: ReactNode;
}>;

export function ChartCard({ title, action, children }: ChartCardProps) {
  return (
    <section className="chart-panel">
      <header className="surface-header">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
