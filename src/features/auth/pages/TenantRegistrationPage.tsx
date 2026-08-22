import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Globe2,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { authApi } from '@/features/auth/api/authApi';
import type { PublicPlan, TenantRegistrationRequest, TenantRegistrationResponse } from '@/features/auth/types/authTypes';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { ApiError } from '@/lib/api/apiError';
import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';

const steps = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'owner', label: 'Owner', icon: UserRound },
  { id: 'office', label: 'Office', icon: MapPin },
  { id: 'plan', label: 'Plan', icon: ClipboardCheck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'review', label: 'Review', icon: CheckCircle2 }
] as const;

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
    plan_uuid: z.string().min(1, 'Plan is required.'),
    trial_days: z.coerce.number().min(0).max(365),
    subscription_type: z.enum(['free', 'trial', 'paid']),
    billing_cycle: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly']),
    payment_method: z.enum(['free', 'cash', 'online']),
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
type BillingCycle = RegistrationFormValues['billing_cycle'];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const billingCycles: BillingCycle[] = ['monthly', 'quarterly', 'half-yearly', 'yearly'];

function normalizeBillingCycle(value?: string | null): BillingCycle {
  return billingCycles.includes(value as BillingCycle) ? (value as BillingCycle) : 'monthly';
}

function planAmount(plan?: PublicPlan | null) {
  return Number(plan?.base_price ?? 0) || 0;
}

function formatMoney(amount: number, currency?: string | null) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

function planLabel(plan: PublicPlan) {
  const cycle = plan.billing_cycle ? ` / ${plan.billing_cycle}` : '';
  return `${plan.name} - ${formatMoney(planAmount(plan), plan.currency)}${cycle}`;
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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
  plan_uuid: '',
  trial_days: 15,
  subscription_type: 'trial',
  billing_cycle: 'monthly',
  payment_method: 'free',
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

const stepFields: Array<Array<keyof RegistrationFormValues | `owner.${keyof RegistrationFormValues['owner']}` | `office.${keyof RegistrationFormValues['office']}`>> = [
  ['organization_name', 'slug', 'legal_name', 'display_name', 'organization_code', 'company_size', 'website', 'default_currency', 'default_timezone'],
  ['owner.first_name', 'owner.last_name', 'owner.display_name', 'owner.email', 'owner.mobile', 'owner.password', 'owner.password_confirmation'],
  ['office.office_name', 'office.address_line_1', 'office.address_line_2', 'office.postal_code', 'office.contact_phone'],
  ['plan_uuid', 'trial_days', 'subscription_type', 'billing_cycle'],
  ['payment_method'],
  ['accept_terms']
];

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Registration failed. Please try again.';
}

function cleanPayload(values: RegistrationFormValues): TenantRegistrationRequest {
  const { accept_terms: _acceptTerms, subscription_type, billing_cycle, payment_method, trial_days, plan_uuid, ...payload } = values;
  return {
    ...payload,
    display_name: payload.display_name || payload.organization_name,
    legal_name: payload.legal_name || payload.organization_name,
    organization_code: payload.organization_code || undefined,
    website: payload.website || undefined,
    plan_uuid: plan_uuid || undefined,
    trial_days,
    subscription: {
      type: subscription_type,
      billing_cycle
    },
    payment: {
      method: payment_method
    },
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
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState<TenantRegistrationResponse | null>(null);
  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    setError,
    setValue,
    trigger,
    watch
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues
  });

  const organizationName = watch('organization_name');
  const slug = watch('slug');
  const ownerFirstName = watch('owner.first_name');
  const ownerLastName = watch('owner.last_name');
  const selectedPlanType = watch('subscription_type');
  const selectedPlanUuid = watch('plan_uuid');
  const paymentMethod = watch('payment_method');

  const plansQuery = useQuery({ queryKey: ['public-tenant-plans'], queryFn: authApi.publicPlans });
  const plans = plansQuery.data ?? [];
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.uuid === selectedPlanUuid) ?? null,
    [plans, selectedPlanUuid]
  );
  const selectedPlanPrice = planAmount(selectedPlan);

  const workspaceUrl = useMemo(() => `${slug || 'your-workspace'}.saas-mycrm.local`, [slug]);
  const tenantSlug = success?.tenant?.slug;

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

  function selectPlan(uuid: string) {
    const plan = plans.find((item) => item.uuid === uuid);
    setValue('plan_uuid', uuid, { shouldDirty: true, shouldValidate: true });

    if (!plan) return;

    const amount = planAmount(plan);
    setValue('billing_cycle', normalizeBillingCycle(plan.billing_cycle), { shouldDirty: true, shouldValidate: true });
    setValue('trial_days', Number(plan.trial_days ?? 15), { shouldDirty: true, shouldValidate: true });
    if (plan.currency) setValue('default_currency', plan.currency, { shouldDirty: true, shouldValidate: true });

    if (amount <= 0) {
      setValue('subscription_type', 'free', { shouldDirty: true, shouldValidate: true });
      setValue('payment_method', 'free', { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (selectedPlanType === 'free') {
      setValue('subscription_type', 'trial', { shouldDirty: true, shouldValidate: true });
    }
  }

  async function openRazorpayCheckout(payload: TenantRegistrationResponse) {
    if (!payload.payment_order?.id || !payload.razorpay_key) return false;

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setServerError('Unable to load Razorpay checkout. Please use the payment option from the confirmation popup.');
      return false;
    }

    const checkout = new window.Razorpay({
      key: payload.razorpay_key,
      amount: payload.payment_order.amount,
      currency: payload.payment_order.currency,
      name: payload.tenant?.display_name ?? payload.tenant?.organization_name ?? 'MyCRM',
      description: 'Tenant subscription payment',
      order_id: payload.payment_order.id,
      prefill: {
        name: payload.owner?.display_name,
        email: payload.owner?.email,
        contact: payload.owner?.mobile
      },
      notes: {
        tenant_uuid: payload.tenant?.uuid
      },
      handler: () => {
        if (payload.tenant?.slug) navigate(TENANT_ROUTES.dashboard(payload.tenant.slug), { replace: true });
      },
      modal: {
        ondismiss: () => setSuccess(payload)
      },
      theme: { color: '#2554e8' }
    });

    checkout.open();
    return true;
  }

  async function nextStep() {
    const valid = await trigger(stepFields[step] as Parameters<typeof trigger>[0], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(values: RegistrationFormValues) {
    setServerError('');

    try {
      const response = await authApi.registerTenant(cleanPayload(values));
      setSuccess(response.data);
      if (values.payment_method === 'online' && response.data.payment_order?.id) {
        await openRazorpayCheckout(response.data);
      }
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
          <p>Create the organization, owner, office, subscription and payment preference in one guided flow.</p>
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
            <p>Complete each step, review the workspace, then open the dashboard from the confirmation popup.</p>
          </header>

          <RegistrationStepper active={step} onSelect={setStep} />
          {serverError ? <div className="surface-error">{serverError}</div> : null}

          <form className="auth-form tenant-registration-form tenant-registration-form--stepped" onSubmit={handleSubmit(submit)}>
            {step === 0 ? (
              <StepPanel title="Organization" icon={<Building2 size={18} aria-hidden="true" />}>
                <div className="form-grid form-grid--two">
                  <FormField error={errors.organization_name?.message} label="Organization name" required>
                    <input {...register('organization_name')} onChange={(event) => autofillSlug(event.target.value)} placeholder="Acme Pvt Ltd" />
                  </FormField>
                  <FormField error={errors.slug?.message} label="Workspace slug" required>
                    <input {...register('slug')} placeholder="acme" />
                  </FormField>
                  <FormField error={errors.legal_name?.message} label="Legal name">
                    <input {...register('legal_name')} placeholder={organizationName || 'Acme Private Limited'} />
                  </FormField>
                  <FormField error={errors.display_name?.message} label="Display name">
                    <input {...register('display_name')} placeholder="Acme" />
                  </FormField>
                  <FormField error={errors.organization_code?.message} label="Organization code">
                    <input {...register('organization_code')} placeholder="Generated if blank" />
                  </FormField>
                  <FormField error={errors.company_size?.message} label="Company size" required>
                    <select {...register('company_size')}>
                      <option value="self">Self</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </FormField>
                  <FormField error={errors.website?.message} label="Website">
                    <span className="auth-input"><Globe2 size={18} aria-hidden="true" /><input {...register('website')} placeholder="https://acme.example.com" /></span>
                  </FormField>
                  <div className="registration-inline"><strong>{workspaceUrl}</strong><span>Generated workspace URL</span></div>
                </div>
                <div className="registration-preferences">
                  <FormField error={errors.default_currency?.message} label="Currency" required>
                    <select {...register('default_currency')}><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option></select>
                  </FormField>
                  <FormField error={errors.default_timezone?.message} label="Timezone" required>
                    <select {...register('default_timezone')}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option></select>
                  </FormField>
                </div>
              </StepPanel>
            ) : null}

            {step === 1 ? (
              <StepPanel title="Owner" icon={<UserRound size={18} aria-hidden="true" />}>
                <div className="form-grid form-grid--two">
                  <FormField error={errors.owner?.first_name?.message} label="First name" required><input {...register('owner.first_name')} onBlur={autofillOwnerDisplayName} placeholder="Sahil" /></FormField>
                  <FormField error={errors.owner?.last_name?.message} label="Last name" required><input {...register('owner.last_name')} onBlur={autofillOwnerDisplayName} placeholder="Owner" /></FormField>
                  <FormField error={errors.owner?.display_name?.message} label="Display name" required><input {...register('owner.display_name')} placeholder="Sahil Owner" /></FormField>
                  <FormField error={errors.owner?.email?.message} label="Email" required><span className="auth-input"><Mail size={18} aria-hidden="true" /><input {...register('owner.email')} autoComplete="email" placeholder="owner@example.com" type="email" /></span></FormField>
                  <FormField error={errors.owner?.mobile?.message} label="Mobile"><input {...register('owner.mobile')} placeholder="+919999999999" /></FormField>
                  <FormField error={errors.owner?.password?.message} label="Password" required><input {...register('owner.password')} autoComplete="new-password" type="password" /></FormField>
                  <FormField error={errors.owner?.password_confirmation?.message} label="Confirm password" required><input {...register('owner.password_confirmation')} autoComplete="new-password" type="password" /></FormField>
                </div>
              </StepPanel>
            ) : null}

            {step === 2 ? (
              <StepPanel title="Head Office" icon={<MapPin size={18} aria-hidden="true" />}>
                <div className="form-grid form-grid--two">
                  <FormField error={errors.office?.office_name?.message} label="Office name" required><input {...register('office.office_name')} placeholder="Head Office" /></FormField>
                  <FormField error={errors.office?.address_line_1?.message} label="Address line 1"><input {...register('office.address_line_1')} placeholder="Main Street" /></FormField>
                  <FormField error={errors.office?.address_line_2?.message} label="Address line 2"><input {...register('office.address_line_2')} placeholder="Business Park" /></FormField>
                  <FormField error={errors.office?.postal_code?.message} label="Postal code"><input {...register('office.postal_code')} placeholder="400001" /></FormField>
                  <FormField error={errors.office?.contact_phone?.message} label="Contact phone"><input {...register('office.contact_phone')} placeholder="+919999999999" /></FormField>
                  <div className="registration-inline registration-inline--secure"><ShieldCheck size={18} aria-hidden="true" /><span>Tenant token is stored only after successful registration.</span></div>
                </div>
              </StepPanel>
            ) : null}

            {step === 3 ? (
              <StepPanel title="Plan" icon={<ClipboardCheck size={18} aria-hidden="true" />}>
                <div className="registration-choice-grid">
                  <PlanChoice active={selectedPlanType === 'free'} title="Free" text="Create a free workspace." onClick={() => { setValue('subscription_type', 'free'); setValue('payment_method', 'free'); }} />
                  <PlanChoice active={selectedPlanType === 'trial'} title="Trial" text="Start with trial access." onClick={() => { setValue('subscription_type', 'trial'); setValue('trial_days', selectedPlan?.trial_days ?? 15); setValue('payment_method', 'free'); }} />
                  <PlanChoice active={selectedPlanType === 'paid'} title="Paid" text="Pay online after workspace creation." onClick={() => { setValue('subscription_type', 'paid'); setValue('payment_method', selectedPlanPrice > 0 ? 'online' : 'free'); }} />
                </div>
                <div className="form-grid form-grid--two">
                  <FormField error={errors.plan_uuid?.message} label="Plan" required>
                    <select disabled={plansQuery.isLoading || plans.length === 0} value={selectedPlanUuid} onChange={(event) => selectPlan(event.target.value)}>
                      <option value="">{plansQuery.isLoading ? 'Loading plans...' : 'Select a public plan'}</option>
                      {plans.map((plan) => <option key={plan.uuid} value={plan.uuid}>{planLabel(plan)}</option>)}
                    </select>
                  </FormField>
                  <FormField error={errors.trial_days?.message} label="Trial days"><input type="number" {...register('trial_days')} /></FormField>
                  <FormField error={errors.billing_cycle?.message} label="Billing cycle" required>
                    <select {...register('billing_cycle')}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="half-yearly">Half-yearly</option><option value="yearly">Yearly</option></select>
                  </FormField>
                </div>
                {plansQuery.isError ? <div className="surface-error">Unable to load public plans. Please try again.</div> : null}
                {!plansQuery.isLoading && plans.length === 0 ? <div className="surface-state">No public plans are available right now.</div> : null}
                {selectedPlan ? (
                  <div className="surface-state">
                    {selectedPlan.name} is {formatMoney(selectedPlanPrice, selectedPlan.currency)}{selectedPlan.billing_cycle ? ` / ${selectedPlan.billing_cycle}` : ''}.
                    {selectedPlan.description ? ` ${selectedPlan.description}` : ''}
                  </div>
                ) : null}
              </StepPanel>
            ) : null}

            {step === 4 ? (
              <StepPanel title="Payment" icon={<CreditCard size={18} aria-hidden="true" />}>
                <div className="registration-choice-grid">
                  <PlanChoice active={paymentMethod === 'free'} title="No payment now" text="Use free or trial access." onClick={() => setValue('payment_method', 'free')} />
                  <PlanChoice active={paymentMethod === 'online'} title="Online" text="Prepare Razorpay payment after workspace creation." onClick={() => setValue('payment_method', 'online')} />
                  <PlanChoice active={paymentMethod === 'cash'} title="Cash" text="Record offline payment from platform billing." onClick={() => setValue('payment_method', 'cash')} />
                </div>
                <div className="surface-state">Online payment is initialized after the workspace exists, using the configured Razorpay keys.</div>
              </StepPanel>
            ) : null}

            {step === 5 ? (
              <StepPanel title="Review" icon={<CheckCircle2 size={18} aria-hidden="true" />}>
                <ReviewGrid planName={selectedPlan?.name} values={getValues()} workspaceUrl={workspaceUrl} />
                <label className="check-row registration-terms">
                  <input type="checkbox" {...register('accept_terms')} />
                  <span>I accept the terms and privacy policy. <span className="required-mark" aria-hidden="true">*</span></span>
                </label>
                {errors.accept_terms?.message ? <strong className="field-error">{errors.accept_terms.message}</strong> : null}
              </StepPanel>
            ) : null}

            <div className="auth-form__actions registration-step-actions">
              <Button type="button" variant="secondary" onClick={() => (step === 0 ? navigate('/auth/login') : setStep((current) => current - 1))}>
                <ArrowLeft size={18} aria-hidden="true" />
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>Next <ArrowRight size={18} aria-hidden="true" /></Button>
              ) : (
                <Button disabled={isSubmitting} type="submit" size="lg">{isSubmitting ? 'Registering...' : 'Register tenant'} <ArrowRight size={18} aria-hidden="true" /></Button>
              )}
            </div>
          </form>
        </section>
      </div>

      <AppModal
        open={Boolean(success)}
        onClose={() => undefined}
        title="Tenant registered"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => navigate('/auth/login')}>Back to login</Button>
            {success?.payment_order?.id ? (
              <Button type="button" onClick={() => success && openRazorpayCheckout(success)}>Complete payment</Button>
            ) : null}
            <Button type="button" onClick={() => tenantSlug && navigate(TENANT_ROUTES.dashboard(tenantSlug), { replace: true })}>Open dashboard</Button>
          </>
        }
      >
        <div className="registration-success-module">
          <CheckCircle2 size={34} aria-hidden="true" />
          <div>
            <strong>{success?.tenant?.display_name ?? success?.tenant?.organization_name ?? 'Workspace'} is ready.</strong>
            <span>{success?.message ?? 'Tenant registered successfully.'}</span>
            <code>{success?.tenant?.slug ? `${success.tenant.slug}.saas-mycrm.local` : workspaceUrl}</code>
          </div>
        </div>
      </AppModal>
    </section>
  );
}

function RegistrationStepper({ active, onSelect }: { active: number; onSelect: (step: number) => void }) {
  return (
    <div className="registration-stepper" aria-label="Registration steps">
      {steps.map((item, index) => {
        const Icon = item.icon;
        return (
          <button key={item.id} type="button" className={index === active ? 'is-active' : ''} onClick={() => onSelect(index)}>
            <Icon size={16} aria-hidden="true" />
            <span>{index + 1}. {item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StepPanel({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <fieldset className="registration-step-panel">
      <legend>{icon} {title}</legend>
      {children}
    </fieldset>
  );
}

function PlanChoice({ active, onClick, text, title }: { active: boolean; onClick: () => void; text: string; title: string }) {
  return (
    <button type="button" className={`registration-choice ${active ? 'is-active' : ''}`} onClick={onClick}>
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}

function ReviewGrid({ planName, values, workspaceUrl }: { planName?: string; values: RegistrationFormValues; workspaceUrl: string }) {
  const rows = [
    ['Organization', values.organization_name],
    ['Workspace', workspaceUrl],
    ['Owner', values.owner.display_name || values.owner.email],
    ['Office', values.office.office_name],
    ['Plan', planName || values.plan_uuid],
    ['Plan type', values.subscription_type],
    ['Billing cycle', values.billing_cycle],
    ['Payment', values.payment_method]
  ];
  return (
    <dl className="registration-review-grid">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || '-'}</dd>
        </div>
      ))}
    </dl>
  );
}

function FormField({ children, error, label, required = false }: { children: ReactNode; error?: string; label: string; required?: boolean }) {
  return (
    <label>
      <span>{label}{required ? <span className="required-mark" aria-hidden="true">*</span> : null}</span>
      {children}
      {error ? <strong className="field-error">{error}</strong> : null}
    </label>
  );
}
