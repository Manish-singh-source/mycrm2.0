export type AuthGuard = 'platform' | 'tenant';
export type AuthSurface = 'platform' | 'tenant' | 'client_portal';

export type Permission = string;

export type AuthUser = {
  uuid: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
  permissions: Permission[];
  locale?: string;
  timezone?: string;
  twoFactorEnabled?: boolean;
};

export type TenantContext = {
  uuid: string;
  slug: string;
  organizationName: string;
  enabledModules: string[];
  status?: string;
  defaultCurrency?: string;
  defaultLocale?: string;
  defaultTimezone?: string;
};

export type GuardSession = {
  accessToken: string | null;
  refreshToken?: string | null;
  user: AuthUser | null;
  permissions: Permission[];
  roles: string[];
  locale: string;
  timezone: string;
  expiresAt: string | null;
  status: 'anonymous' | 'authenticated';
};

export type TenantSession = GuardSession & {
  tenant: TenantContext | null;
  office: string | null;
};

export type AuthState = {
  platform: GuardSession;
  tenant: TenantSession;
};

export type LoginResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  expires_at?: string | null;
  user: AuthUser;
  roles?: string[];
  permissions?: Permission[];
  locale?: string;
  timezone?: string;
  tenant?: TenantContext;
  office?: string | null;
};

export type DiscoveredAccount = {
  accountRef: string;
  accountType: string;
  authGuard: AuthGuard;
  label: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  organization?: string | null;
  tenant?: {
    uuid: string;
    slug: string;
    status?: string;
  } | null;
  roles: string[];
  status: string;
  lastLoginAt?: string | null;
};

export type AccountDiscovery = {
  email: string;
  discoveryToken: string | null;
  expiresInSeconds: number;
  accounts: DiscoveredAccount[];
};

export type UnifiedLoginResponse = LoginResponse & {
  surface: AuthSurface;
  redirect_to?: string;
  modules?: string[];
  preferences?: {
    locale?: string;
    timezone?: string;
  };
};

export type TwoFactorChallenge = {
  requires_2fa: true;
  challenge_token: string;
  methods: string[];
  account_type: string;
  surface: AuthSurface;
};

export type LoginResult =
  | { type: 'logged_in'; session: UnifiedLoginResponse }
  | { type: '2fa_required'; challenge: TwoFactorChallenge };

export type DiscoverAccountsRequest = {
  email: string;
  device_name?: string;
};

export type UnifiedLoginRequest = {
  email: string;
  discovery_token: string;
  account_ref: string;
  password: string;
  remember?: boolean;
  device_name?: string;
};

export type VerifyLoginTwoFactorRequest = {
  challenge_token: string;
  code: string;
  remember_device?: boolean;
  device_name?: string;
};

export type ForgotPasswordRequest = {
  email: string;
  account_ref?: string;
  discovery_token?: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

export type PublicPlan = {
  uuid: string;
  name: string;
  code?: string | null;
  billing_cycle?: string | null;
  base_price?: number | string | null;
  currency?: string | null;
  trial_days?: number | null;
  description?: string | null;
};
export type TenantRegistrationRequest = {
  organization_name: string;
  legal_name?: string;
  display_name?: string;
  organization_code?: string;
  slug: string;
  business_type_id?: number | string;
  industry_id?: number | string;
  company_size: string;
  gst_number?: string;
  pan_number?: string;
  registration_number?: string;
  website?: string;
  default_currency: string;
  default_timezone: string;
  plan_uuid?: string;
  trial_days?: number;
  subscription?: {
    type?: 'free' | 'trial' | 'paid' | string;
    billing_cycle?: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | string;
  };
  payment?: {
    method?: 'free' | 'cash' | 'online' | string;
  };
  owner: {
    first_name: string;
    last_name: string;
    display_name: string;
    email: string;
    mobile?: string;
    password: string;
    password_confirmation: string;
  };
  office: {
    office_name: string;
    address_line_1?: string;
    address_line_2?: string;
    landmark?: string;
    country_id?: number | string;
    state_id?: number | string;
    city_id?: number | string;
    postal_code?: string;
    contact_phone?: string;
  };
};

export type TenantRegistrationResponse = {
  access_token?: string;
  token_type?: string;
  expires_at?: string | null;
  tenant?: {
    uuid?: string;
    organization_name?: string;
    display_name?: string;
    organization_code?: string;
    slug?: string;
    default_currency?: string;
    default_timezone?: string;
    status?: string;
    trial_ends_at?: string | null;
  };
  subscription?: Record<string, unknown>;
  payment_order?: {
    id?: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  } | null;
  payment?: Record<string, unknown> | null;
  razorpay_key?: string | null;
  owner?: {
    uuid?: string;
    display_name?: string;
    email?: string;
    mobile?: string;
    account_type?: string;
    status?: string;
  };
  roles?: string[];
  permissions?: Permission[];
  registered?: boolean;
  requires_email_verification?: boolean;
  auto_login?: boolean;
  message?: string;
};

