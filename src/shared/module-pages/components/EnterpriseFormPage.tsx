import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { AlertTriangle, Save } from 'lucide-react';

import { PageHeader } from '@/shared/components/layout';
import { Button, PermissionButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/workflows';
import { applyApiValidationErrors } from '@/shared/module-pages/utils/apiValidation';
import { useUnsavedChangesPrompt } from '@/shared/module-pages/hooks/useUnsavedChangesPrompt';
import type { EnterpriseModuleAdapter, EnterpriseRecord } from '@/shared/module-pages/types';

type EnterpriseFormPageProps<TRow extends EnterpriseRecord, TForm extends FieldValues> = {
  adapter: EnterpriseModuleAdapter<TRow, TForm>;
  record?: TRow;
  onCancel: () => void;
  onSaved: (record: TRow, options?: { continueEditing?: boolean }) => void;
};

export function EnterpriseFormPage<TRow extends EnterpriseRecord, TForm extends FieldValues>({
  adapter,
  record,
  onCancel,
  onSaved
}: EnterpriseFormPageProps<TRow, TForm>) {
  const isEdit = Boolean(record);
  const [savingMode, setSavingMode] = useState<'save' | 'continue' | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [error, setError] = useState('');

  const form = useForm<TForm>({
    resolver: zodResolver(adapter.schema),
    defaultValues: adapter.toFormValues(record) as DefaultValues<TForm>
  });

  useUnsavedChangesPrompt(form.formState.isDirty);

  useEffect(() => {
    form.reset(adapter.toFormValues(record));
  }, [adapter, form, record]);

  async function runDuplicateCheck(values: TForm) {
    if (!adapter.duplicateCheck) return true;
    const result = await adapter.duplicateCheck(values);
    setDuplicateMessage(result.duplicate ? result.message ?? 'A similar record already exists.' : '');
    return !result.duplicate;
  }

  async function submit(values: TForm, continueEditing: boolean) {
    setError('');
    setDuplicateMessage('');
    setSavingMode(continueEditing ? 'continue' : 'save');

    try {
      const unique = await runDuplicateCheck(values);
      if (!unique) return;
      const saved = isEdit && record
        ? await adapter.update(adapter.getRowId(record), values, { continueEditing })
        : await adapter.create(values, { continueEditing });
      form.reset(adapter.toFormValues(saved));
      onSaved(saved, { continueEditing });
    } catch (err) {
      if (!applyApiValidationErrors(form as UseFormReturn<TForm>, err)) {
        setError(err instanceof Error ? err.message : 'Unable to save record.');
      }
    } finally {
      setSavingMode(null);
    }
  }

  function requestCancel() {
    if (form.formState.isDirty) {
      setConfirmCancel(true);
      return;
    }
    onCancel();
  }

  return (
    <section className="enterprise-module-page">
      <PageHeader
        eyebrow={adapter.guard}
        title={isEdit ? `Edit ${adapter.getTitle(record)}` : `Create ${adapter.label}`}
        description="Reusable create/edit pattern with RHF, Zod, API validation errors, duplicate checks, save variants, and unsaved-change protection."
      />

      {error ? <div className="surface-error">{error}</div> : null}
      {duplicateMessage ? (
        <div className="surface-error">
          <AlertTriangle size={16} aria-hidden="true" />
          {duplicateMessage}
        </div>
      ) : null}

      <form className="enterprise-form" onSubmit={form.handleSubmit((values) => submit(values as TForm, false))}>
        <div className="enterprise-form__grid">
          {adapter.fields.map((field) => {
            const errorMessage = form.formState.errors[field.name]?.message;
            return (
              <label key={field.name}>
                <span>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea placeholder={field.placeholder} {...form.register(field.name)} />
                ) : field.type === 'select' ? (
                  <select {...form.register(field.name)}>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input type={field.type ?? 'text'} placeholder={field.placeholder} {...form.register(field.name)} />
                )}
                {field.hint ? <small>{field.hint}</small> : null}
                {errorMessage ? <strong role="alert">{String(errorMessage)}</strong> : null}
              </label>
            );
          })}
        </div>

        <footer className="enterprise-form__footer">
          <Button type="button" variant="secondary" onClick={requestCancel}>Cancel</Button>
          <PermissionButton
            guard={adapter.guard}
            permission={isEdit ? adapter.permissions?.edit ?? '' : adapter.permissions?.create ?? ''}
            type="button"
            variant="secondary"
            disabled={savingMode !== null}
            onClick={form.handleSubmit((values) => submit(values as TForm, true))}
          >
            <Save size={16} aria-hidden="true" />
            {savingMode === 'continue' ? 'Saving...' : 'Save and continue'}
          </PermissionButton>
          <PermissionButton
            guard={adapter.guard}
            permission={isEdit ? adapter.permissions?.edit ?? '' : adapter.permissions?.create ?? ''}
            type="submit"
            disabled={savingMode !== null}
          >
            <Save size={16} aria-hidden="true" />
            {savingMode === 'save' ? 'Saving...' : 'Save'}
          </PermissionButton>
        </footer>
      </form>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Discard unsaved changes?"
        description="You have unsaved changes on this form."
        confirmLabel="Discard"
        typedConfirmation="DISCARD"
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
      />
    </section>
  );
}
