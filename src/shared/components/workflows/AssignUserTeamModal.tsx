import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type AssignUserTeamModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  userSelect: ReactNode;
  teamSelect?: ReactNode;
  roleSelect?: ReactNode;
  onAssign: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function AssignUserTeamModal(props: AssignUserTeamModalProps) {
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
          <Button type="button" onClick={props.onAssign}>
            Assign
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label>User{props.userSelect}</label>
        {props.teamSelect ? <label>Team{props.teamSelect}</label> : null}
        {props.roleSelect ? <label>Role{props.roleSelect}</label> : null}
        <label>
          Effective date
          <input type="date" />
        </label>
        <label>
          <input type="checkbox" /> Notify assignee
        </label>
        <label>
          Remarks
          <textarea />
        </label>
      </div>
    </AppModal>
  );
}
