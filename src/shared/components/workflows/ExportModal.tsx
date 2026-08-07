import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  columns: string[];
  selectedCount?: number;
  onExport: () => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ExportModal({ columns, selectedCount = 0, onExport, ...props }: ExportModalProps) {
  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Export records"
      guard={props.guard}
      permission={props.permission}
      loading={props.loading}
      error={props.error}
      footer={<Button type="button" onClick={onExport}>Export</Button>}
    >
      <div className="form-grid">
        <label>Format<select><option>CSV</option><option>XLSX</option><option>PDF</option></select></label>
        <label>Scope<select><option>Filtered results</option><option>Selected rows ({selectedCount})</option></select></label>
        <label>Timezone<input defaultValue="Asia/Kolkata" /></label>
        <label><input type="checkbox" /> Email file when ready</label>
        <div className="chip-list">{columns.map((column) => <span key={column}>{column}</span>)}</div>
      </div>
    </AppModal>
  );
}
