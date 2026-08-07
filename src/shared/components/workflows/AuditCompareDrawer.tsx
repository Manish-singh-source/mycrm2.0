import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type AuditCompareDrawerProps = {
  open: boolean;
  onClose: () => void;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function AuditCompareDrawer(props: AuditCompareDrawerProps) {
  const fields = Array.from(new Set([...Object.keys(props.oldValues), ...Object.keys(props.newValues)]));

  return (
    <AppDrawer open={props.open} onClose={props.onClose} title="Audit compare" size="lg" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error}>
      <div className="compare-grid">
        <strong>Field</strong><strong>Before</strong><strong>After</strong>
        {fields.map((field) => (
          <div className="compare-grid__row" key={field}>
            <span>{field}</span>
            <code>{JSON.stringify(props.oldValues[field] ?? null)}</code>
            <code>{JSON.stringify(props.newValues[field] ?? null)}</code>
          </div>
        ))}
      </div>
    </AppDrawer>
  );
}
