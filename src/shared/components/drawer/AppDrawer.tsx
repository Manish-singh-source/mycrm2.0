import type { PropsWithChildren, ReactNode } from 'react';

import { usePermission } from '@/features/auth/hooks/usePermission';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';
import { PermissionDeniedState } from '@/shared/components/state/PermissionDeniedState';

type AppDrawerProps = PropsWithChildren<{
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}>;

export function AppDrawer({
  open,
  title,
  onClose,
  guard,
  permission,
  loading,
  error,
  footer,
  size = 'md',
  children
}: AppDrawerProps) {
  const permissions = usePermission(guard ?? 'platform');
  if (!open) return null;
  const allowed = !guard || !permission || permissions.can(permission);

  return (
    <div className="overlay" role="presentation">
      <aside className={`drawer drawer--${size}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <header className="surface-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close drawer">
            x
          </button>
        </header>
        <div className="surface-body">
          {!allowed ? <PermissionDeniedState compact /> : null}
          {allowed && loading ? <div className="surface-state" role="status">Loading...</div> : null}
          {allowed && error ? <div className="surface-error" role="alert">{error}</div> : null}
          {allowed && !loading ? children : null}
        </div>
        {allowed && footer ? <footer className="surface-footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
