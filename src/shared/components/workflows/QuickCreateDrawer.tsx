import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type QuickCreateDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave: () => void;
  onSaveAndOpen?: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function QuickCreateDrawer(props: QuickCreateDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title={props.title} guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={<><Button type="button" variant="secondary" onClick={props.onClose}>Cancel</Button>{props.onSaveAndOpen ? <Button type="button" variant="secondary" onClick={props.onSaveAndOpen}>Save and open</Button> : null}<Button type="button" onClick={props.onSave}>Save</Button></>}>
      {props.children}
    </AppDrawer>
  );
}
