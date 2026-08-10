import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type FilterField = {
  name: string;
  label: string;
  input: ReactNode;
};

type AdvancedFiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  fields: FilterField[];
  onApply: () => void;
  onReset: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function AdvancedFiltersDrawer(props: AdvancedFiltersDrawerProps) {
  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Filters"
      size="lg"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={props.onReset}>
            Reset
          </Button>
          <Button type="button" onClick={props.onApply}>
            Apply filters
          </Button>
        </>
      }
    >
      <div className="table-popup-intro">
        <strong>Refine table records</strong>
        <span>Choose filter values, then apply them to refresh the table.</span>
      </div>
      {props.fields.length > 0 ? (
        <div className="form-grid table-filter-grid">
          {props.fields.map((field) => (
            <div className="filter-field" key={field.name}>
              <label>{field.label}</label>
              {field.input}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No filters are available for this table.</div>
      )}
    </AppModal>
  );
}
