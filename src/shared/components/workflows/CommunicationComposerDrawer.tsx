import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type CommunicationComposerDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  recipientInput: ReactNode;
  templateSelect?: ReactNode;
  onSend: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function CommunicationComposerDrawer(props: CommunicationComposerDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title={props.title ?? 'Compose message'} size="lg" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={<Button type="button" onClick={props.onSend}>Send</Button>}>
      <div className="form-grid">
        <label>Channel<select><option>Email</option><option>SMS</option><option>WhatsApp</option></select></label>
        <label>Recipient{props.recipientInput}</label>
        {props.templateSelect ? <label>Template{props.templateSelect}</label> : null}
        <label>Subject<input /></label>
        <label>Body<textarea rows={8} /></label>
        <label>Attachments<input type="file" multiple /></label>
      </div>
    </AppDrawer>
  );
}
