import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type BulkUpdateModalProps = {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  fieldSelect: ReactNode;
  valueInput: ReactNode;
  onSubmit: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function BulkUpdateModal(props: BulkUpdateModalProps) {
  return (
    <AppModal open={props.open} onClose={props.onClose} title="Bulk update" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={<Button type="button" onClick={props.onSubmit}>Update {props.selectedCount} records</Button>}>
      <div className="form-grid">
        <p>{props.selectedCount} records will be updated.</p>
        <label>Target field{props.fieldSelect}</label>
        <label>New value{props.valueInput}</label>
        <label>Reason<textarea required /></label>
      </div>
    </AppModal>
  );
}
