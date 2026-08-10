import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type StatusChangeModalProps = {
  open: boolean;
  onClose: () => void;
  statusSelect: ReactNode;
  onSubmit: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function StatusChangeModal(props: StatusChangeModalProps) {
  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Change status"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={props.onSubmit}>
            Update status
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label>New status{props.statusSelect}</label>
        <label>
          Effective date
          <input type="date" />
        </label>
        <label>
          Reason
          <textarea required />
        </label>
        <label>
          <input type="checkbox" /> Notify related users
        </label>
      </div>
    </AppModal>
  );
}
