import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type FilePreviewDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  metadata?: ReactNode;
  preview: ReactNode;
  onDownload?: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function FilePreviewDrawer(props: FilePreviewDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title={props.title} size="xl" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={props.onDownload ? <Button type="button" onClick={props.onDownload}>Download</Button> : null}>
      {props.metadata ? <div className="metadata-strip">{props.metadata}</div> : null}
      <div className="preview-panel">{props.preview}</div>
    </AppDrawer>
  );
}
