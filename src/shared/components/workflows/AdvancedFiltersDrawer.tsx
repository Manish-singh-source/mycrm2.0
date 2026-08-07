import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
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
    <AppDrawer
      open={props.open}
      onClose={props.onClose}
      title="Advanced filters"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={props.onReset}>Reset</Button>
          <Button type="button" onClick={props.onApply}>Apply filters</Button>
        </>
      }
    >
      <div className="form-grid">
        {props.fields.map((field) => (
          <div className="filter-field" key={field.name}>
            <label>{field.label}</label>
            {field.input}
          </div>
        ))}
      </div>
    </AppDrawer>
  );
}
