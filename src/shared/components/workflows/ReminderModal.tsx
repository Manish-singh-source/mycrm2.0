import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type ReminderModalProps = {
  open: boolean;
  onClose: () => void;
  assigneeSelect?: ReactNode;
  onSave: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ReminderModal(props: ReminderModalProps) {
  return (
    <AppModal open={props.open} onClose={props.onClose} title="Reminder" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={<Button type="button" onClick={props.onSave}>Save reminder</Button>}>
      <div className="form-grid">
        <label>Date<input type="date" /></label>
        <label>Time<input type="time" /></label>
        <label>Channel<select><option>Browser</option><option>Email</option><option>SMS</option></select></label>
        {props.assigneeSelect ? <label>Assignee{props.assigneeSelect}</label> : null}
        <label>Repeat<select><option>Never</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label>
      </div>
    </AppModal>
  );
}
