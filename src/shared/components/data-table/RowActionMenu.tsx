import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export type RowActionMenuItem = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

type RowActionMenuProps = {
  label: string;
  items: RowActionMenuItem[];
  width?: number;
};

export function RowActionMenu({ items, label, width = 232 }: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
      setPosition({ left: left + window.scrollX, top: rect.bottom + 8 + window.scrollY });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, width]);

  function run(item: RowActionMenuItem) {
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
  }

  return (
    <div className="action-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open
        ? createPortal(
            <div className="action-menu-portal" style={{ left: position.left, top: position.top }}>
              <button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={() => setOpen(false)} />
              <div className="action-menu tenant-action-menu" role="menu" style={{ minWidth: width }}>
                {items.map((item) => (
                  <div key={item.label}>
                    {item.separatorBefore ? <hr /> : null}
                    <button
                      type="button"
                      role="menuitem"
                      className={item.danger ? 'is-danger' : undefined}
                      disabled={item.disabled}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => run(item)}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
