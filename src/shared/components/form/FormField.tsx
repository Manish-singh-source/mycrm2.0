import type { PropsWithChildren, ReactNode } from 'react';

type FormFieldProps = PropsWithChildren<{
  label: string;
  htmlFor?: string;
  error?: ReactNode;
  hint?: ReactNode;
}>;

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <label className="form-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  );
}
