import { useMemo, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, CheckCircle2, Globe2, Mail, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { authApi } from '@/features/auth/api/authApi';
import type { TenantRegistrationRequest } from '@/features/auth/types/authTypes';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { ApiError } from '@/lib/api/apiError';
import { Button } from '@/shared/components/ui';

const registrationSchema = z
  .object({
    organization_name: z.string().min(2, 'Organization name is required.'),
    legal_name: z.string().optional(),
    display_name: z.string().optional(),
    organization_code: z.string().optional(),
    slug: z
      .string()
      .min(3, 'Workspace slug must be at least 3 characters.')
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.'),
    company_size: z.string().min(1, 'Company size is required.'),
    website: z.string().url('Enter a valid website URL.').optional().or(z.literal('')),
    default_currency: z.string().min(3, 'Currency is required.'),
    default_timezone: z.string().min(1, 'Timezone is required.'),
    owner: z.object({
      first_name: z.string().min(2, 'First name is required.'),
      last_name: z.string().min(1, 'Last name is required.'),
      display_name: z.string().min(2, 'Display name is required.'),
      email: z.string().email('Enter a valid owner email.'),
      mobile: z.string().optional(),
      password: z.string().min(8, 'Password must be at least 8 characters.'),
      password_confirmation: z.string().min(8, 'Confirm the password.')
    }),
    office: z.object({
      office_name: z.string().min(2, 'Office name is required.'),
      address_line_1: z.string().optional(),
      address_line_2: z.string().optional(),
      postal_code: z.string().optional(),
      contact_phone: z.string().optional()
    }),
    accept_terms: z.boolean().refine(Boolean, 'Accept terms to continue.')
  })
  .refine((data) => data.owner.password === data.owner.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['owner', 'password_confirmation']
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const defaultValues: RegistrationFormValues = {
  organization_name: '',
  legal_name: '',
  display_name: '',
  organization_code: '',
  slug: '',
  company_size: 'small',
  website: '',
  default_currency: 'INR',
  default_timezone: 'Asia/Kolkata',
  owner: {
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    mobile: '',
    password: '',
    password_confirmation: ''
  },
  office: {
    office_name: 'Head Office',
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
    contact_phone: ''
  },
  accept_terms: false
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Registration failed. Please try again.';
}

function cleanPayload(values: RegistrationFormValues): TenantRegistrationRequest {
  const { accept_terms: _acceptTerms, ...payload } = values;
  return {
    ...payload,
    display_name: payload.display_name || payload.organization_name,
    legal_name: payload.legal_name || payload.organization_name,
    organization_code: payload.organization_code || undefined,
    website: payload.website || undefined,
    owner: {
      ...payload.owner,
      mobile: payload.owner.mobile || undefined
    },
    office: {
      ...payload.office,
      address_line_1: payload.office.address_line_1 || undefined,
      address_line_2: payload.office.address_line_2 || undefined,
      postal_code: payload.office.postal_code || undefined,
      contact_phone: payload.office.contact_phone || payload.owner.mobile || undefined
    }
  };
}

export function TenantRegistrationPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setValue,
    watch
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues
  });

  const organizationName = watch('organization_name');
  const slug = watch('slug');
  const ownerFirstName = watch('owner.first_name');
  const ownerLastName = watch('owner.last_name');

  const workspaceUrl = useMemo(() => {
    const safeSlug = slug || 'your-workspace';
    return `${safeSlug}.saas-mycrm.local`;
  }, [slug]);

  function autofillSlug(value: string) {
    setValue('organization_name', value);
    if (!slug) {
      setValue(
        'slug',
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 40)
      );
    }
  }

  function autofillOwnerDisplayName() {
    const displayName = [ownerFirstName, ownerLastName].filter(Boolean).join(' ').trim();
    if (displayName) setValue('owner.display_name', displayName);
  }

  async function submit(values: RegistrationFormValues) {
    setMessage('');
    setServerError('');

    try {
      const response = await authApi.registerTenant(cleanPayload(values));
      const tenantSlug = response.data.tenant?.slug;

      if (response.data.access_token && tenantSlug) {
        navigate(TENANT_ROUTES.dashboard(tenantSlug), { replace: true });
        return;
      }

      setMessage(response.data.message ?? 'Tenant registered. Please verify your email before login.');
    } catch (error) {
      if (error instanceof ApiError && error.validationErrors) {
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          setError(field as Parameters<typeof setError>[0], {
            message: Array.isArray(messages) ? messages[0] : messages
          });
        });
      }
      setServerError(errorMessage(error));
    }
  }

  return (
    <section className="auth-experience auth-experience--register" aria-labelledby="registration-title">
      <aside className="auth-hero auth-hero--compact" aria-label="Tenant signup">
        <div className="auth-logo">MyCRM</div>
        <div>
          <h2>Launch a Secure Tenant Workspace</h2>
          <p>Create the organization, owner account, default head office, and trial workspace in one guided flow.</p>
        </div>
        <div className="auth-hero__preview">
          <span>Workspace</span>
          <strong>{workspaceUrl}</strong>
          <div />
        </div>
      </aside>

      <div className="auth-stage auth-stage--scroll">
        <div className="auth-stage__top">
          <Link to="/auth/login">Back to login</Link>
          <span>Public Tenant Registration</span>
        </div>

        <section className="auth-card auth-card--wide" aria-labelledby="registration-title">
          <header>
            <div className="auth-card__brand">MyCRM</div>
            <h1 id="registration-title">Register Tenant</h1>
            <p>Create the SaaS tenant and first owner account from the completed auth API.</p>
          </header>

          {serverError ? <div className="surface-error">{serverError}</div> : null}
          {message ? <div className="surface-state">{message}</div> : null}

          <form className="auth-form tenant-registration-form" onSubmit={handleSubmit(submit)}>
            <fieldset>
              <legend><Building2 size={18} aria-hidden="true" /> Organization</legend>
              <div className="form-grid form-grid--two">
                <FormField error={errors.organization_name?.message} label="Organization name">
                  <input {...register('organization_name')} onChange={(event) => autofillSlug(event.target.value)} placeholder="Acme Pvt Ltd" />
                </FormField>
                <FormField error={errors.slug?.message} label="Workspace slug">
                  <input {...register('slug')} placeholder="acme" />
                </FormField>
                <FormField error={errors.legal_name?.message} label="Legal name">
                  <input {...register('legal_name')} placeholder={organizationName || 'Acme Private Limited'} />
                </FormField>
                <FormField error={errors.display_name?.message} label="Display name">
                  <input {...register('display_name')} placeholder="Acme" />
                </FormField>
                <FormField error={errors.organization_code?.message} label="Organization code">
                  <input {...register('organization_code')} placeholder="ACME" />
                </FormField>
                <FormField error={errors.company_size?.message} label="Company size">
                  <select {...register('company_size')}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </FormField>
                <FormField error={errors.website?.message} label="Website">
                  <span className="auth-input">
                    <Globe2 size={18} aria-hidden="true" />
                    <input {...register('website')} placeholder="https://acme.example.com" />
                  </span>
                </FormField>
                <div className="registration-inline">
                  <strong>{workspaceUrl}</strong>
                  <span>Generated workspace URL</span>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend><UserRound size={18} aria-hidden="true" /> Owner</legend>
              <div className="form-grid form-grid--two">
                <FormField error={errors.owner?.first_name?.message} label="First name">
                  <input {...register('owner.first_name')} onBlur={autofillOwnerDisplayName} placeholder="Sahil" />
                </FormField>
                <FormField error={errors.owner?.last_name?.message} label="Last name">
                  <input {...register('owner.last_name')} onBlur={autofillOwnerDisplayName} placeholder="Owner" />
                </FormField>
                <FormField error={errors.owner?.display_name?.message} label="Display name">
                  <input {...register('owner.display_name')} placeholder="Sahil Owner" />
                </FormField>
                <FormField error={errors.owner?.email?.message} label="Email">
                  <span className="auth-input">
                    <Mail size={18} aria-hidden="true" />
                    <input {...register('owner.email')} autoComplete="email" placeholder="owner@example.com" type="email" />
                  </span>
                </FormField>
                <FormField error={errors.owner?.mobile?.message} label="Mobile">
                  <input {...register('owner.mobile')} placeholder="+919999999999" />
                </FormField>
                <FormField error={errors.owner?.password?.message} label="Password">
                  <input {...register('owner.password')} autoComplete="new-password" type="password" />
                </FormField>
                <FormField error={errors.owner?.password_confirmation?.message} label="Confirm password">
                  <input {...register('owner.password_confirmation')} autoComplete="new-password" type="password" />
                </FormField>
              </div>
            </fieldset>

            <fieldset>
              <legend><MapPin size={18} aria-hidden="true" /> Head Office</legend>
              <div className="form-grid form-grid--two">
                <FormField error={errors.office?.office_name?.message} label="Office name">
                  <input {...register('office.office_name')} placeholder="Head Office" />
                </FormField>
                <FormField error={errors.office?.address_line_1?.message} label="Address line 1">
                  <input {...register('office.address_line_1')} placeholder="Main Street" />
                </FormField>
                <FormField error={errors.office?.address_line_2?.message} label="Address line 2">
                  <input {...register('office.address_line_2')} placeholder="Business Park" />
                </FormField>
                <FormField error={errors.office?.postal_code?.message} label="Postal code">
                  <input {...register('office.postal_code')} placeholder="400001" />
                </FormField>
                <FormField error={errors.office?.contact_phone?.message} label="Contact phone">
                  <input {...register('office.contact_phone')} placeholder="+919999999999" />
                </FormField>
                <div className="registration-inline registration-inline--secure">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>Tenant token is stored only after a successful registration response.</span>
                </div>
              </div>
            </fieldset>

            <div className="registration-preferences">
              <FormField error={errors.default_currency?.message} label="Currency">
                <select {...register('default_currency')}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </FormField>
              <FormField error={errors.default_timezone?.message} label="Timezone">
                <select {...register('default_timezone')}>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </FormField>
            </div>

            <label className="check-row registration-terms">
              <input type="checkbox" {...register('accept_terms')} />
              <span>I accept the terms and privacy policy.</span>
            </label>
            {errors.accept_terms?.message ? <strong className="field-error">{errors.accept_terms.message}</strong> : null}

            <div className="auth-form__actions">
              <Button disabled={isSubmitting} type="submit" size="lg">
                {isSubmitting ? 'Registering...' : 'Register tenant'}
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/auth/login')}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}

function FormField({
  children,
  error,
  label
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label>
      <span>{label}</span>
      {children}
      {error ? <strong className="field-error">{error}</strong> : null}
    </label>
  );
}
