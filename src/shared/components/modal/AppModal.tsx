import { useEffect, useId, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusableElements = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
      );

    const focusTarget = getFocusableElements()[0] ?? dialog;
    window.setTimeout(() => focusTarget?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  const allowed = !guard || !permission || permissions.can(permission);

  return createPortal(
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="surface-header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="surface-close-button"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="surface-body">
          {!allowed ? <PermissionDeniedState compact /> : null}
          {allowed && loading ? (
            <div className="surface-state" role="status">
              Loading...
            </div>
          ) : null}
          {allowed && error ? (
            <div className="surface-error" role="alert">
              {error}
            </div>
          ) : null}
          {allowed && !loading ? children : null}
        </div>
        {allowed && footer ? <footer className="surface-footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body
  );
}
