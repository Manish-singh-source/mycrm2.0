import { useEffect, useState, type ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type AssignUserTeamModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  userSelect?: ReactNode;
  teamSelect?: ReactNode;
  roleSelect?: ReactNode;
  onAssign: (payload: { effective_date?: string; notify: boolean; remarks?: string }) => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function AssignUserTeamModal(props: AssignUserTeamModalProps) {
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notify, setNotify] = useState(true);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!props.open) {
      setEffectiveDate('');
      setNotify(true);
      setRemarks('');
    }
  }, [props.open]);

  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title={props.title ?? 'Assign user or team'}
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={props.loading} onClick={() => props.onAssign({ effective_date: effectiveDate || undefined, notify, remarks: remarks.trim() || undefined })}>
            {props.loading ? 'Assigning...' : 'Assign'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        {props.userSelect ? <label>User{props.userSelect}</label> : null}
        {props.teamSelect ? <label>Team{props.teamSelect}</label> : null}
        {props.roleSelect ? <label>Role{props.roleSelect}</label> : null}
        <label>
          Effective date
          <input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} /> Notify assignee
        </label>
        <label>
          Remarks
          <textarea rows={4} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </label>
      </div>
    </AppModal>
  );
}
