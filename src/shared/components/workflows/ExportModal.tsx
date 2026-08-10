import { useEffect, useState, type ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export type ExportOptions = {
  format: string;
  scope: 'filtered' | 'selected';
  timezone: string;
  emailWhenReady: boolean;
};

type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  columns: string[];
  selectedCount?: number;
  onExport: (options: ExportOptions) => void;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ExportModal({ columns, selectedCount = 0, onExport, ...props }: ExportModalProps) {
  const [format, setFormat] = useState('CSV');
  const [scope, setScope] = useState<'filtered' | 'selected'>('filtered');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [emailWhenReady, setEmailWhenReady] = useState(false);

  useEffect(() => {
    if (props.open && selectedCount === 0) setScope('filtered');
  }, [props.open, selectedCount]);

  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Export records"
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
            onClick={() => onExport({ format, scope, timezone, emailWhenReady })}
            disabled={columns.length === 0}
          >
            Export
          </Button>
        </>
      }
    >
      <div className="table-popup-intro">
        <strong>{columns.length} columns ready</strong>
        <span>
          {selectedCount > 0
            ? `${selectedCount} selected records can be exported.`
            : 'Export the current filtered table.'}
        </span>
      </div>
      <div className="form-grid export-options-grid">
        <label>
          Format
          <select value={format} onChange={(event) => setFormat(event.target.value)}>
            <option>CSV</option>
            <option>XLSX</option>
            <option>PDF</option>
          </select>
        </label>
        <label>
          Scope
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as 'filtered' | 'selected')}
          >
            <option value="filtered">Filtered results</option>
            <option value="selected" disabled={selectedCount === 0}>
              Selected rows ({selectedCount})
            </option>
          </select>
        </label>
        <label>
          Timezone
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
        </label>
        <label className="inline-check-field">
          <input
            type="checkbox"
            checked={emailWhenReady}
            onChange={(event) => setEmailWhenReady(event.target.checked)}
          />
          <span>Email file when ready</span>
        </label>
        <div className="chip-list table-export-columns" aria-label="Columns included in export">
          {columns.length > 0 ? (
            columns.map((column) => <span key={column}>{column}</span>)
          ) : (
            <span>No columns selected</span>
          )}
        </div>
      </div>
    </AppModal>
  );
}
