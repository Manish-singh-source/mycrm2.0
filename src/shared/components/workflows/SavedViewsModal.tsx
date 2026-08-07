import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type SavedView = {
  id: string;
  name: string;
  visibility: 'personal' | 'shared';
  isDefault?: boolean;
};

type SavedViewsModalProps = {
  open: boolean;
  onClose: () => void;
  views: SavedView[];
  activeViewId?: string;
  onSelect: (id: string) => void;
  onSaveCurrent: () => void;
  onDelete?: (id: string) => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function SavedViewsModal(props: SavedViewsModalProps) {
  return (
    <AppModal open={props.open} onClose={props.onClose} title="Saved views" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error}>
      <div className="option-list">
        {props.views.map((view) => (
          <div className="view-row" key={view.id}>
            <button type="button" onClick={() => props.onSelect(view.id)} aria-current={view.id === props.activeViewId}>
              <strong>{view.name}</strong>
              <span>{view.visibility}{view.isDefault ? ' default' : ''}</span>
            </button>
            {props.onDelete ? <button type="button" onClick={() => props.onDelete?.(view.id)}>Delete</button> : null}
          </div>
        ))}
      </div>
      <div className="surface-actions">
        <Button type="button" onClick={props.onSaveCurrent}>Save current view</Button>
      </div>
    </AppModal>
  );
}
