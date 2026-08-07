import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type NoteItem = { id: string; author: string; body: string; createdAt: string; pinned?: boolean };

type NotesDrawerProps = {
  open: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onAdd: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function NotesDrawer(props: NotesDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title="Notes" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error} footer={<Button type="button" onClick={props.onAdd}>Add note</Button>}>
      <div className="record-list">
        {props.notes.map((note) => (
          <article key={note.id}>
            <header><strong>{note.author}</strong><time>{note.createdAt}</time>{note.pinned ? <span>Pinned</span> : null}</header>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
    </AppDrawer>
  );
}
