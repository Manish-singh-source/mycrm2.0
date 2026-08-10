import { useEffect, useState, type ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type ManagedColumn = {
  id: string;
  label: ReactNode;
  visible: boolean;
  locked?: boolean;
};

type ColumnManagerModalProps = {
  open: boolean;
  onClose: () => void;
  columns: ManagedColumn[];
  onToggle: (id: string) => void;
  onReset: () => void;
  onSave: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ColumnManagerModal(props: ColumnManagerModalProps) {
  const [draftVisibleIds, setDraftVisibleIds] = useState<string[]>([]);
  const visibleCount = props.columns.filter((column) => draftVisibleIds.includes(column.id)).length;

  useEffect(() => {
    if (props.open) {
      setDraftVisibleIds(
        props.columns.filter((column) => column.visible || column.locked).map((column) => column.id)
      );
    }
  }, [props.columns, props.open]);

  function toggleDraft(id: string) {
    const column = props.columns.find((item) => item.id === id);
    if (!column || column.locked) return;
    setDraftVisibleIds((current) =>
      current.includes(id) ? current.filter((columnId) => columnId !== id) : [...current, id]
    );
  }

  function resetDraft() {
    props.onReset();
    setDraftVisibleIds(props.columns.map((column) => column.id));
  }

  function saveDraft() {
    props.columns.forEach((column) => {
      const nextVisible = draftVisibleIds.includes(column.id) || column.locked;
      if (column.visible !== nextVisible) props.onToggle(column.id);
    });
    props.onSave();
  }

  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Manage columns"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={resetDraft}>
            Reset
          </Button>
          <Button type="button" onClick={saveDraft} disabled={visibleCount === 0}>
            Save columns
          </Button>
        </>
      }
    >
      <div className="table-popup-intro">
        <strong>{visibleCount} columns visible</strong>
        <span>Locked columns stay visible so table actions remain available.</span>
      </div>
      <div className="option-list column-manager-list">
        {props.columns.map((column) => {
          const checked = draftVisibleIds.includes(column.id) || column.locked;
          return (
            <label key={column.id} data-locked={column.locked || undefined}>
              <input
                type="checkbox"
                checked={checked}
                disabled={column.locked}
                onChange={() => toggleDraft(column.id)}
              />
              <span>{column.label}</span>
              {column.locked ? <small>Locked</small> : null}
            </label>
          );
        })}
      </div>
    </AppModal>
  );
}
