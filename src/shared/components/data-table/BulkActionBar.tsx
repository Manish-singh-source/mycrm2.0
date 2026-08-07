import type { ReactNode } from 'react';

type BulkActionBarProps = {
  selectedCount: number;
  actions: ReactNode;
  onClear?: () => void;
};

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar">
      <strong>{selectedCount} selected</strong>
      <div>{actions}</div>
      {onClear ? (
        <button type="button" onClick={onClear}>
          Clear
        </button>
      ) : null}
    </div>
  );
}
