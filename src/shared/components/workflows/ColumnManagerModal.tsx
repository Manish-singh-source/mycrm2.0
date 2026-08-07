import type { ReactNode } from 'react';

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
          <Button type="button" variant="secondary" onClick={props.onReset}>Reset</Button>
          <Button type="button" onClick={props.onSave}>Save columns</Button>
        </>
      }
    >
      <div className="option-list">
        {props.columns.map((column) => (
          <label key={column.id}>
            <input
              type="checkbox"
              checked={column.visible}
              disabled={column.locked}
              onChange={() => props.onToggle(column.id)}
            />
            <span>{column.label}</span>
          </label>
        ))}
      </div>
    </AppModal>
  );
}
