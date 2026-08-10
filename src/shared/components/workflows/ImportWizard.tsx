import type { ReactNode } from 'react';

import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';
import { FileDropzone } from '@/shared/components/file';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type ImportWizardProps = {
  open: boolean;
  onClose: () => void;
  step: 'upload' | 'mapping' | 'preview' | 'progress' | 'complete';
  onFilesSelected: (files: File[]) => void;
  onNext: () => void;
  onBack?: () => void;
  children?: ReactNode;
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ImportWizard(props: ImportWizardProps) {
  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Import records"
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
          {props.onBack ? (
            <Button type="button" variant="secondary" onClick={props.onBack}>
              Back
            </Button>
          ) : null}
          <Button type="button" onClick={props.onNext}>
            Continue
          </Button>
        </>
      }
    >
      <div className="wizard-steps" aria-label="Import progress">
        {['upload', 'mapping', 'preview', 'progress', 'complete'].map((step) => (
          <span key={step} aria-current={step === props.step}>
            {step}
          </span>
        ))}
      </div>
      {props.step === 'upload' ? (
        <FileDropzone
          label="Upload import file"
          accept=".csv,.xlsx"
          onFilesSelected={props.onFilesSelected}
        />
      ) : (
        props.children
      )}
    </AppModal>
  );
}
