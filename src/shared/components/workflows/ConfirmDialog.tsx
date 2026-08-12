import { useEffect, useState, type ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  confirmTone?: 'primary' | 'danger';
  typedConfirmation?: string;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (payload: { reason?: string }) => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('');
  const typedOk = !props.typedConfirmation || typed.trim() === props.typedConfirmation;
  const reasonOk = !props.reasonRequired || reason.trim().length > 0;

  useEffect(() => {
    if (!props.open) {
      setTyped('');
      setReason('');
    }
  }, [props.open]);

  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={props.confirmTone ?? 'danger'}
            disabled={props.loading || !typedOk || !reasonOk}
            onClick={() => props.onConfirm({ reason: reason.trim() })}
          >
            {props.loading ? 'Working...' : props.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <p>{props.description}</p>
        {props.typedConfirmation ? (
          <label>
            Type {props.typedConfirmation}
            <input value={typed} onChange={(event) => setTyped(event.target.value)} />
          </label>
        ) : null}
        {props.reasonRequired ? (
          <label>
            {props.reasonLabel ?? 'Reason'}
            <textarea rows={4} placeholder={props.reasonPlaceholder ?? 'Add the operational reason for this action.'} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        ) : null}
      </div>
    </AppModal>
  );
}
