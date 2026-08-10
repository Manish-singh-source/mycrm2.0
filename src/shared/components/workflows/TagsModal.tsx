import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type TagOption = { id: string; label: string; color?: string; selected?: boolean };

type TagsModalProps = {
  open: boolean;
  onClose: () => void;
  tags: TagOption[];
  onToggle: (id: string) => void;
  onSave: () => void;
  onCreateTag?: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function TagsModal(props: TagsModalProps) {
  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Tags"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={props.onCreateTag}
            disabled={!props.onCreateTag}
          >
            Create tag
          </Button>
          <Button type="button" onClick={props.onSave}>
            Save tags
          </Button>
        </>
      }
    >
      <div className="option-list">
        {props.tags.map((tag) => (
          <label key={tag.id}>
            <input type="checkbox" checked={tag.selected} onChange={() => props.onToggle(tag.id)} />
            <span className="tag-dot" style={{ backgroundColor: tag.color }} />
            <span>{tag.label}</span>
          </label>
        ))}
      </div>
    </AppModal>
  );
}
