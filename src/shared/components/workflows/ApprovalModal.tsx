import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type ApprovalModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  onApprove: () => void;
  onReject: () => void;
  nextApproverSelect?: ReactNode;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ApprovalModal(props: ApprovalModalProps) {
  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title={props.title ?? 'Approval'}
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={props.onReject}>
            Reject
          </Button>
          <Button type="button" onClick={props.onApprove}>
            Approve
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          Remarks
          <textarea required />
        </label>
        {props.nextApproverSelect ? <label>Next approver{props.nextApproverSelect}</label> : null}
        <label>
          <input type="checkbox" /> Notify requester
        </label>
      </div>
    </AppModal>
  );
}
