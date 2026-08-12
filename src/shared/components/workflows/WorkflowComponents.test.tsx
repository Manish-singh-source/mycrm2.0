import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ActivityDrawer,
  AssignUserTeamModal,
  ConfirmDialog,
  ExportModal,
  FilesDrawer,
  ImportWizard
} from '@/shared/components/workflows';

describe('workflow components', () => {
  it('requires typed confirmation and reason before confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        title="Void payment?"
        description="This action changes finance data."
        typedConfirmation="VOID"
        reasonRequired
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    await user.type(screen.getByLabelText(/type void/i), 'VOID');
    await user.type(screen.getByLabelText(/reason/i), 'Duplicate gateway callback');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledWith({ reason: 'Duplicate gateway callback' });
  });

  it('returns assignment metadata from AssignUserTeamModal', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();

    render(
      <AssignUserTeamModal
        open
        onClose={vi.fn()}
        userSelect={<select aria-label="User"><option value="u-1">Priya Shah</option></select>}
        teamSelect={<select aria-label="Team"><option value="t-1">Sales</option></select>}
        onAssign={onAssign}
      />
    );

    await user.type(screen.getByLabelText(/effective date/i), '2026-08-12');
    await user.type(screen.getByLabelText(/remarks/i), 'Pipeline reassignment');
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    expect(onAssign).toHaveBeenCalledWith({ effective_date: '2026-08-12', notify: true, remarks: 'Pipeline reassignment' });
  });

  it('supports import upload and export options', async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();
    const onExport = vi.fn();

    const { rerender } = render(<ImportWizard open step="upload" onClose={vi.fn()} onFilesSelected={onFilesSelected} onNext={vi.fn()} />);
    await user.upload(screen.getByLabelText(/upload import file/i), new File(['name'], 'clients.csv', { type: 'text/csv' }));
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: 'clients.csv' })]);

    rerender(<ExportModal open onClose={vi.fn()} columns={['Name', 'Status']} selectedCount={2} onExport={onExport} />);
    await user.selectOptions(screen.getByLabelText(/scope/i), 'selected');
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledWith(expect.objectContaining({ format: 'CSV', scope: 'selected', delivery: 'job' }));
  });

  it('renders activity and files drawers with actions', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const onUpload = vi.fn();

    const { rerender } = render(
      <ActivityDrawer open onClose={vi.fn()} items={[{ id: 'a1', actor: 'Sahil', event: 'updated', subject: 'Invoice', occurredAt: '2026-08-12T10:00:00Z' }]} />
    );
    expect(screen.getByRole('dialog', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByText('Sahil')).toBeInTheDocument();

    rerender(<FilesDrawer open onClose={vi.fn()} files={[{ id: 'f1', name: 'contract.pdf', size: '42 KB' }]} onUpload={onUpload} onPreview={onPreview} />);
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Files' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    await user.click(screen.getByRole('button', { name: 'Upload file' }));
    expect(onPreview).toHaveBeenCalledWith('f1');
    expect(onUpload).toHaveBeenCalled();
  });
});
