import type { PropsWithChildren, ReactNode } from 'react';

type AppDrawerProps = PropsWithChildren<{
  open: boolean;
  title: ReactNode;
  onClose: () => void;
}>;

export function AppDrawer({ open, title, onClose, children }: AppDrawerProps) {
  if (!open) return null;

  return (
    <div className="overlay" role="presentation">
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <header className="surface-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close drawer">
            x
          </button>
        </header>
        <div className="surface-body">{children}</div>
      </aside>
    </div>
  );
}
