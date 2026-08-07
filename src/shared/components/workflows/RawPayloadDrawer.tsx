import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type RawPayloadDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  payload: unknown;
  onCopy?: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function RawPayloadDrawer(props: RawPayloadDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title={props.title ?? 'Raw payload'} size="lg" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={props.onCopy ? <Button type="button" onClick={props.onCopy}>Copy</Button> : null}>
      <pre className="raw-payload">{JSON.stringify(props.payload, null, 2)}</pre>
    </AppDrawer>
  );
}
