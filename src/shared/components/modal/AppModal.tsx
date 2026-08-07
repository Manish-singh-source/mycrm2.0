import type { PropsWithChildren, ReactNode } from 'react';

import { PermissionDeniedState } from '@/shared/components/state/PermissionDeniedState';
import { usePermission } from '@/features/auth/hooks/usePermission';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type AppModalProps = PropsWithChildren<{
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}>;

export function AppModal({
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
}: AppModalProps) {
  const permissions = usePermission(guard ?? 'platform');
  if (!open) return null;
  const allowed = !guard || !permission || permissions.can(permission);

  return (
    <div className="overlay" role="presentation">
      <section className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <header className="surface-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal">
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
      </section>
    </div>
  );
}
