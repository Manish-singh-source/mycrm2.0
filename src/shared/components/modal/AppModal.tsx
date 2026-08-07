import type { PropsWithChildren, ReactNode } from 'react';

type AppModalProps = PropsWithChildren<{
  open: boolean;
  title: ReactNode;
  onClose: () => void;
}>;

export function AppModal({ open, title, onClose, children }: AppModalProps) {
  if (!open) return null;

  return (
    <div className="overlay" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <header className="surface-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </header>
        <div className="surface-body">{children}</div>
      </section>
    </div>
  );
}
