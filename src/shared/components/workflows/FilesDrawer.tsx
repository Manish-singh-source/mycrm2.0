import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type FileItem = { id: string; name: string; size?: string; uploadedAt?: string; label?: string };

type FilesDrawerProps = {
  open: boolean;
  onClose: () => void;
  files: FileItem[];
  onUpload: () => void;
  onPreview?: (id: string) => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function FilesDrawer(props: FilesDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title="Files" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={<Button type="button" onClick={props.onUpload}>Upload file</Button>}>
      <div className="record-list">
        {props.files.map((file) => (
          <article key={file.id}>
            <strong>{file.name}</strong>
            <span>{file.label ?? file.size ?? 'File'}</span>
            {props.onPreview ? <button type="button" onClick={() => props.onPreview?.(file.id)}>Preview</button> : null}
          </article>
        ))}
      </div>
    </AppDrawer>
  );
}
