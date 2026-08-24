import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import type { ZodType } from 'zod';

import type { DataTableColumn } from '@/shared/components/data-table';
import type { TabItem } from '@/shared/components/layout';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type EnterpriseRecord = {
  id: string;
  status?: string;
  [key: string]: unknown;
};

export type EnterpriseActionKey =
  | 'assign'
  | 'status'
  | 'clone'
  | 'archive'
  | 'restore'
  | 'delete'
  | 'import'
  | 'export'
  | 'activity';

export type EnterpriseAction<TRow> = {
  key: EnterpriseActionKey | string;
  label: string;
  permission?: Permission;
  tone?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onRun?: (record?: TRow) => void;
};

export type EnterpriseListState = {
  page: number;
  perPage: number;
  search: string;
  sort?: string;
  selectedIds: string[];
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort?: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
};

export type EnterpriseFormField<TForm extends FieldValues> = {
  name: Path<TForm>;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  hint?: ReactNode;
};

export type EnterpriseModuleAdapter<TRow extends EnterpriseRecord, TForm extends FieldValues> = {
  id: string;
  label: string;
  guard: AuthGuard;
  permissions?: {
    view?: Permission;
    create?: Permission;
    edit?: Permission;
    delete?: Permission;
    export?: Permission;
    import?: Permission;
  };
  getRowId: (row: TRow) => string;
  columns: DataTableColumn<TRow>[];
  fields: EnterpriseFormField<TForm>[];
  schema: ZodType<TForm>;
  defaultValues: TForm;
  toFormValues: (record?: TRow) => TForm;
  getTitle: (record?: TRow) => string;
  getSubtitle?: (record?: TRow) => ReactNode;
  getStatus?: (record: TRow) => { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' };
  getTabs?: (record: TRow) => TabItem[];
  renderTab?: (tabId: string, record: TRow) => ReactNode;
  actions?: EnterpriseAction<TRow>[];
  list: (state: EnterpriseListState) => Promise<{ data: TRow[]; total: number }>;
  create: (values: TForm, options?: { continueEditing?: boolean }) => Promise<TRow>;
  update: (id: string, values: TForm, options?: { continueEditing?: boolean }) => Promise<TRow>;
  remove?: (ids: string[]) => Promise<void>;
  duplicateCheck?: (values: Partial<TForm>) => Promise<{ duplicate: boolean; message?: string }>;
};

export type EnterpriseFormRenderProps<TForm extends FieldValues> = {
  form: UseFormReturn<TForm>;
  fields: EnterpriseFormField<TForm>[];
};
