import { useEffect, useState, type ReactNode } from 'react';

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
  onSaveCurrent: (name?: string) => void;
  onDelete?: (id: string) => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function SavedViewsModal(props: SavedViewsModalProps) {
  const [activeId, setActiveId] = useState<string | undefined>(
    props.activeViewId ?? props.views[0]?.id
  );
  const [draftId, setDraftId] = useState<string | undefined>(
    props.activeViewId ?? props.views[0]?.id
  );
  const [viewName, setViewName] = useState('');

  useEffect(() => {
    if (props.open) {
      const nextActiveId = props.activeViewId ?? activeId ?? props.views[0]?.id;
      setActiveId(nextActiveId);
      setDraftId(nextActiveId);
    }
  }, [activeId, props.activeViewId, props.open, props.views]);

  function applySelectedView() {
    if (!draftId) return;
    setActiveId(draftId);
    props.onSelect(draftId);
  }

  function saveCurrentView() {
    const name =
      viewName.trim() ||
      `Custom view ${props.views.filter((view) => view.visibility === 'personal').length + 1}`;
    setViewName('');
    props.onSaveCurrent(name);
  }

  function deleteView(id: string) {
    const view = props.views.find((item) => item.id === id);
    if (!view || view.isDefault) return;
    const nextViews = props.views.filter((item) => item.id !== id);
    props.onDelete?.(id);
    if (draftId === id) setDraftId(activeId && activeId !== id ? activeId : nextViews[0]?.id);
    if (activeId === id) setActiveId(nextViews[0]?.id);
  }

  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Saved views"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={applySelectedView} disabled={!draftId}>
            Apply view
          </Button>
          <Button type="button" onClick={saveCurrentView}>
            Save current view
          </Button>
        </>
      }
    >
      <div className="table-popup-intro">
        <strong>Switch table layouts quickly</strong>
        <span>Select a view, then apply it when you are ready.</span>
      </div>
      <label className="saved-view-name-field">
        <span>View name</span>
        <input
          value={viewName}
          onChange={(event) => setViewName(event.target.value)}
          placeholder="Name this table view"
        />
      </label>
      {props.views.length > 0 ? (
        <div className="option-list saved-view-list">
          {props.views.map((view) => {
            const active = view.id === activeId;
            const selected = view.id === draftId;
            return (
              <div
                className="view-row"
                key={view.id}
                data-active={active || undefined}
                data-selected={selected || undefined}
              >
                <button
                  type="button"
                  onClick={() => setDraftId(view.id)}
                  aria-current={active ? 'true' : undefined}
                  aria-pressed={selected}
                >
                  <strong>{view.name}</strong>
                  <span>
                    {view.visibility}
                    {view.isDefault ? ' default' : ''}
                    {active ? ' active' : ''}
                  </span>
                </button>
                {!view.isDefault ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteView(view.id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">No saved views yet.</div>
      )}
    </AppModal>
  );
}
