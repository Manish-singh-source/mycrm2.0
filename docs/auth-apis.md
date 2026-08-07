# Auth APIs

This document defines the unified authentication API flow for the SaaS CRM.

The login flow is email-first:

1. User enters email and continues.
2. Backend discovers all accounts attached to that email.
3. Backend returns a safe list of account choices, such as platform super admin/staff, tenant owner/staff, and client portal accounts.
4. User chooses one account.
5. User enters the password for that selected account.
6. Backend verifies credentials and returns a session/token for the selected account context.
7. Frontend loads permissions/modules and routes the user to the correct surface.

This flow supports one email being used across multiple account contexts without exposing passwords, tenant IDs, or sensitive account data during discovery.

## Base URL

Recommended shared auth base:

```http
/api/auth/v1
```

After login, authenticated platform APIs use:

```http
/api/platform/v1
```

Authenticated tenant/client APIs use:

```http
/api/tenant/v1
```

## Account Types


| Account Type   | Auth Table       | Surface                               | Notes                                       |
| ---------------- | ------------------ | --------------------------------------- | --------------------------------------------- |
| `platform`     | `platform_users` | Platform Admin                        | SaaS owner/staff/super admin users          |
| `tenant_owner` | `users`          | Tenant CRM                            | Tenant owner account,`account_type=owner`   |
| `tenant_staff` | `users`          | Tenant CRM                            | Tenant staff account,`account_type=staff`   |
| `client`       | `users`          | Client Portal/Tenant CRM limited area | Client portal account,`account_type=client` |

Use `account_type` in the response as a UI-friendly category. Use `auth_guard` internally to decide which table/guard verifies the password.

## Common Public Headers

```http
Accept: application/json
Content-Type: application/json
X-Request-Id: {uuid}
X-Client-Version: web/1.0.0
X-Timezone: Asia/Kolkata
X-Locale: en
```

For mobile:

```http
X-Client-Version: flutter/1.0.0
X-Device-Name: iPhone 15
```

## Common Authenticated Headers

Platform session:

```http
Authorization: Bearer {platform_access_token}
Accept: application/json
Content-Type: application/json
X-Request-Id: {uuid}
X-Client-Version: web-admin/1.0.0
```

Tenant/client session:

```http
Authorization: Bearer {tenant_access_token}
Accept: application/json
Content-Type: application/json
X-Tenant: {tenant_uuid_or_slug}
X-Request-Id: {uuid}
X-Client-Version: web-tenant/1.0.0
```

## Standard Response Envelope

Success:

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-08-06T12:00:00Z"
  }
}
```

Error:

```json
{
  "message": "Validation failed.",
  "error_code": "VALIDATION_FAILED",
  "errors": {
    "email": ["The email field is required."]
  },
  "request_id": "uuid"
}
```

## 1. Discover Accounts by Email

Checks both `platform_users.email` and tenant `users.email`.


| Method | Endpoint             | Auth   | Purpose                                         |
| -------- | ---------------------- | -------- | ------------------------------------------------- |
| POST   | `/accounts/discover` | Public | Find login-capable account choices for an email |

Request body:

```json
{
  "email": "user@example.com",
  "device_name": "Chrome on Windows"
}
```

Successful response when accounts exist:

```json
{
  "data": {
    "email": "user@example.com",
    "discovery_token": "short_lived_discovery_token",
    "expires_in_seconds": 300,
    "accounts": [
      {
        "account_ref": "opaque_platform_account_ref",
        "account_type": "platform",
        "auth_guard": "platform",
        "label": "SaaS Super Admin",
        "display_name": "Sahil Admin",
        "email": "user@example.com",
        "avatar_url": null,
        "organization": null,
        "tenant": null,
        "roles": ["super_admin"],
        "status": "active",
        "last_login_at": "2026-08-05T10:00:00Z"
      },
      {
        "account_ref": "opaque_tenant_owner_account_ref",
        "account_type": "tenant_owner",
        "auth_guard": "tenant",
        "label": "Acme Pvt Ltd - Owner",
        "display_name": "Sahil Owner",
        "email": "user@example.com",
        "avatar_url": null,
        "organization": "Acme Pvt Ltd",
        "tenant": {
          "uuid": "tenant_uuid",
          "slug": "acme",
          "status": "active"
        },
        "roles": ["owner"],
        "status": "active",
        "last_login_at": "2026-08-04T09:00:00Z"
      },
      {
        "account_ref": "opaque_client_account_ref",
        "account_type": "client",
        "auth_guard": "tenant",
        "label": "Acme Pvt Ltd - Client Portal",
        "display_name": "Sahil Client",
        "email": "user@example.com",
        "organization": "Acme Pvt Ltd",
        "tenant": {
          "uuid": "tenant_uuid",
          "slug": "acme",
          "status": "active"
        },
        "roles": ["client_user"],
        "status": "active",
        "last_login_at": null
      }
    ]
  }
}
```

Response when no accounts exist:

```json
{
  "data": {
    "email": "user@example.com",
    "discovery_token": null,
    "expires_in_seconds": 0,
    "accounts": []
  }
}
```

Security rules:

- Apply rate limiting by email, IP, and device fingerprint if available.
- Do not return internal numeric IDs.
- `account_ref` must be opaque and signed/encrypted; it must not expose table names or IDs.
- `discovery_token` must be short-lived, single purpose, and bound to email/IP/device where practical.
- Do not reveal disabled/deleted accounts as login choices unless business wants a specific disabled message after selection.
- Tenant status may be returned only as a safe enum needed for UI messaging.

## 2. Verify Selected Account Password

Verifies password against the selected account from discovery.


| Method | Endpoint          | Auth                     | Purpose                            |
| -------- | ------------------- | -------------------------- | ------------------------------------ |
| POST   | `/accounts/login` | Public + discovery token | Verify password and create session |

Request body:

```json
{
  "email": "user@example.com",
  "discovery_token": "short_lived_discovery_token",
  "account_ref": "opaque_tenant_owner_account_ref",
  "password": "StrongPassword#123",
  "remember": true,
  "device_name": "Chrome on Windows"
}
```

Successful platform login response:

```json
{
  "data": {
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-07T12:00:00Z",
    "surface": "platform",
    "redirect_to": "/platform/dashboard",
    "account": {
      "account_type": "platform",
      "auth_guard": "platform",
      "uuid": "platform_user_uuid",
      "display_name": "Sahil Admin",
      "email": "user@example.com",
      "status": "active",
      "roles": ["super_admin"],
      "permissions": ["dashboard.view", "tenant.view", "platform_user.view"]
    },
    "tenant": null,
    "modules": ["dashboard", "tenants", "subscriptions", "billing", "settings"]
  }
}
```

Successful tenant owner/staff login response:

```json
{
  "data": {
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-07T12:00:00Z",
    "surface": "tenant",
    "redirect_to": "/tenant/dashboard",
    "account": {
      "account_type": "tenant_owner",
      "auth_guard": "tenant",
      "uuid": "user_uuid",
      "display_name": "Sahil Owner",
      "email": "user@example.com",
      "status": "active",
      "roles": ["owner"],
      "permissions": ["dashboard.view", "client.view", "project.view"]
    },
    "tenant": {
      "uuid": "tenant_uuid",
      "slug": "acme",
      "organization_name": "Acme Pvt Ltd",
      "status": "active",
      "default_currency": "INR",
      "default_timezone": "Asia/Kolkata"
    },
    "modules": ["dashboard", "crm", "projects", "finance", "settings"]
  }
}
```

Successful client portal login response:

```json
{
  "data": {
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-07T12:00:00Z",
    "surface": "client_portal",
    "redirect_to": "/client/dashboard",
    "account": {
      "account_type": "client",
      "auth_guard": "tenant",
      "uuid": "user_uuid",
      "display_name": "Sahil Client",
      "email": "user@example.com",
      "status": "active",
      "roles": ["client_user"],
      "permissions": ["profile.view", "document.view", "issue.create"]
    },
    "tenant": {
      "uuid": "tenant_uuid",
      "slug": "acme",
      "organization_name": "Acme Pvt Ltd",
      "status": "active"
    },
    "modules": ["profile", "documents", "issues"]
  }
}
```

2FA required response:

```json
{
  "data": {
    "requires_2fa": true,
    "challenge_token": "short_lived_2fa_challenge_token",
    "methods": ["totp"],
    "account_type": "tenant_owner",
    "surface": "tenant"
  }
}
```

Common failure responses:

```json
{
  "message": "Invalid password.",
  "error_code": "INVALID_CREDENTIALS",
  "request_id": "uuid"
}
```

```json
{
  "message": "This account is suspended.",
  "error_code": "ACCOUNT_SUSPENDED",
  "request_id": "uuid"
}
```

```json
{
  "message": "This tenant is suspended.",
  "error_code": "TENANT_SUSPENDED",
  "request_id": "uuid"
}
```

Security rules:

- Validate `discovery_token`, email, and `account_ref` match.
- Password must be checked only after selected account is resolved safely.
- Apply rate limiting by selected account, email, IP, and device.
- Write login success/failure logs to `security_events` and/or `activity_logs`.
- Invalidate discovery token after successful login or repeated failure threshold.
- Never return password hashes or raw internal account IDs.

## 3. Verify 2FA Challenge


| Method | Endpoint              | Auth                     | Purpose                  |
| -------- | ----------------------- | -------------------------- | -------------------------- |
| POST   | `/accounts/login/2fa` | Public + challenge token | Complete login after 2FA |

Request body:

```json
{
  "challenge_token": "short_lived_2fa_challenge_token",
  "code": "123456",
  "remember_device": true,
  "device_name": "Chrome on Windows"
}
```

Response body is the same as successful login response from `/accounts/login`.

Failure:

```json
{
  "message": "Invalid authentication code.",
  "error_code": "INVALID_2FA_CODE",
  "request_id": "uuid"
}
```

## 4. Current Session

Platform current user:


| Method | Endpoint | Auth         | Purpose                              |
| -------- | ---------- | -------------- | -------------------------------------- |
| GET    | `/me`    | Bearer token | Return current authenticated account |

Use same endpoint under shared auth base. The backend determines token guard/surface.

Response:

```json
{
  "data": {
    "surface": "tenant",
    "account": {
      "account_type": "tenant_staff",
      "uuid": "user_uuid",
      "display_name": "Staff User",
      "email": "staff@example.com",
      "roles": ["sales_user"],
      "permissions": ["lead.view", "lead.create"]
    },
    "tenant": {
      "uuid": "tenant_uuid",
      "slug": "acme",
      "organization_name": "Acme Pvt Ltd"
    },
    "modules": ["dashboard", "crm", "projects"],
    "preferences": {
      "timezone": "Asia/Kolkata",
      "locale": "en"
    }
  }
}
```

## 5. Logout


| Method | Endpoint  | Auth         | Purpose                      |
| -------- | ----------- | -------------- | ------------------------------ |
| POST   | `/logout` | Bearer token | Revoke current token/session |

Request body:

```json
{
  "all_devices": false
}
```

Response:

```json
{
  "data": {
    "logged_out": true
  }
}
```

## 6. Password Reset

### 6.1 Request Reset Link


| Method | Endpoint           | Auth   | Purpose                                                    |
| -------- | -------------------- | -------- | ------------------------------------------------------------ |
| POST   | `/password/forgot` | Public | Send reset link after account selection or email discovery |

Request body when user has not selected account:

```json
{
  "email": "user@example.com"
}
```

Request body when account is selected:

```json
{
  "email": "user@example.com",
  "account_ref": "opaque_tenant_owner_account_ref",
  "discovery_token": "short_lived_discovery_token"
}
```

Response should be generic:

```json
{
  "data": {
    "sent": true,
    "message": "If this account can receive password reset instructions, an email has been sent."
  }
}
```

### 6.2 Reset Password


| Method | Endpoint          | Auth                 | Purpose                         |
| -------- | ------------------- | ---------------------- | --------------------------------- |
| POST   | `/password/reset` | Public + reset token | Reset selected account password |

Request body:

```json
{
  "token": "password_reset_token",
  "email": "user@example.com",
  "password": "NewStrongPassword#123",
  "password_confirmation": "NewStrongPassword#123"
}
```

## 7. Account Choice UI Contract

Frontend should render each account choice using:


| Field           | UI Use                                          |
| ----------------- | ------------------------------------------------- |
| `account_ref`   | Hidden value used for login request             |
| `account_type`  | Badge: Super Admin, Tenant Owner, Staff, Client |
| `label`         | Primary account choice label                    |
| `display_name`  | User name                                       |
| `organization`  | Tenant/company name where applicable            |
| `tenant.slug`   | Safe tenant identifier for UI                   |
| `roles`         | Secondary text/badges                           |
| `status`        | Disabled state if not active                    |
| `last_login_at` | Optional secondary hint                         |

Do not display internal IDs or raw guard names to normal users.

## 8. Routing After Login


| Surface         | Condition                                    | Redirect                                             |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `platform`      | account_type`platform`                       | `/platform/dashboard`                                |
| `tenant`        | account_type`tenant_owner` or `tenant_staff` | `/tenant/dashboard`                                  |
| `client_portal` | account_type`client`                         | `/client/dashboard` or restricted tenant client area |

If a user has a valid token but lacks required route permission:

- Web/Flutter should show Forbidden page/screen.
- Backend must still return 403 for protected APIs.

## 9. Rate Limiting

Recommended limits:


| Endpoint              | Limit                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `/accounts/discover`  | 5 attempts/minute by IP, 10 attempts/hour by email                  |
| `/accounts/login`     | 5 attempts/minute by account_ref/IP, lockout after repeated failure |
| `/accounts/login/2fa` | 5 attempts/5 minutes per challenge                                  |
| `/password/forgot`    | 3 attempts/hour by email/IP                                         |
| `/password/reset`     | 5 attempts/hour by email/IP                                         |

Adjust limits by environment and business needs.

## 10. Audit and Security Events

Log these events:

- Account discovery requested.
- Account discovery returned multiple accounts.
- Login failed: invalid password.
- Login blocked: suspended account.
- Login blocked: suspended tenant.
- Login success.
- 2FA challenge created.
- 2FA success/failure.
- Password reset requested.
- Password reset completed.
- Logout.
- Token revoked.

Recommended `security_events.event` names:

- `auth.discovery_requested`
- `auth.login_failed`
- `auth.login_success`
- `auth.login_blocked`
- `auth.2fa_required`
- `auth.2fa_failed`
- `auth.2fa_success`
- `auth.password_reset_requested`
- `auth.password_reset_completed`
- `auth.logout`

## 11. Validation Rules

`/accounts/discover`:

- `email`: required, valid email, max 150.
- `device_name`: nullable, string, max 150.

`/accounts/login`:

- `email`: required, valid email.
- `discovery_token`: required, valid, not expired.
- `account_ref`: required, valid, matches discovery email.
- `password`: required, string.
- `remember`: boolean.
- `device_name`: nullable, string, max 150.

`/accounts/login/2fa`:

- `challenge_token`: required, valid, not expired.
- `code`: required, string, 6 to 8 chars depending method.
- `remember_device`: boolean.

## 12. Implementation Notes

- `platform_users.email` is globally unique.
- `users.email` is unique per tenant, so the same email can exist across many tenants.
- Account discovery must query both tables and create safe account choices.
- `account_ref` should be generated from signed encrypted payload containing account table/type, UUID/ID, email, expiry, and nonce.
- Prefer UUIDs in account choice payloads where possible.
- Do not reveal whether a password exists until user selects the account and submits password.
- If different accounts with same email have different passwords, verify against the selected account only.
- If business later wants one global identity password across accounts, introduce a separate identity table; do not mix that into the current table design without a migration plan.

## 13. Tenant Registration APIs

Tenant registration is public and only creates tenant/company accounts in the SaaS. Platform users and super admins must not self-register through this flow.

Registration creates:

- A `tenants` organization record.
- A tenant owner `users` record with `account_type=owner`.
- A default head office in `tenant_offices` when office fields are provided or generated.
- Default tenant roles, permissions, settings, lookups, and module defaults.
- A trial or pending subscription based on SaaS signup rules.
- Optional email verification and onboarding checklist.

### 13.1 Check Registration Email

Use this before the full registration form if the UI wants to detect existing accounts.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register/check-email` | Public | Check whether an email already has SaaS accounts |

Request body:

```json
{
  "email": "owner@example.com"
}
```

Response:

```json
{
  "data": {
    "email": "owner@example.com",
    "has_existing_accounts": true,
    "can_register_new_tenant": true,
    "message": "This email already has accounts. You can still register a new tenant or continue to login."
  }
}
```

Rules:

- Do not expose account details here. Use `/accounts/discover` for login account choices.
- Existing platform or tenant accounts should not block registration unless business rules require it.
- If the same email registers a new tenant, it creates a new tenant owner account under the new tenant.

### 13.2 Register Tenant

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register/tenant` | Public | Register a new tenant organization and owner account |

Request body:

```json
{
  "organization": {
    "organization_name": "Acme Pvt Ltd",
    "legal_name": "Acme Private Limited",
    "display_name": "Acme",
    "organization_code": null,
    "slug": "acme",
    "business_type_id": "business_type_uuid",
    "industry_id": "industry_uuid",
    "company_size": "small",
    "gst_number": "27AAAAA0000A1Z5",
    "pan_number": "AAAAA0000A",
    "registration_number": "REG123",
    "website": "https://acme.example",
    "default_currency": "INR",
    "default_timezone": "Asia/Kolkata"
  },
  "owner": {
    "first_name": "Sahil",
    "last_name": "Owner",
    "display_name": "Sahil Owner",
    "email": "owner@example.com",
    "mobile": "+919999999999",
    "password": "StrongPassword#123",
    "password_confirmation": "StrongPassword#123"
  },
  "head_office": {
    "office_name": "Head Office",
    "office_code": "HO",
    "address_line_1": "Address line 1",
    "address_line_2": null,
    "landmark": null,
    "country_id": "country_uuid",
    "state_id": "state_uuid",
    "city_id": "city_uuid",
    "postal_code": "400001",
    "contact_person": "Sahil Owner",
    "contact_email": "owner@example.com",
    "contact_phone": "+919999999999",
    "gst_number": "27AAAAA0000A1Z5"
  },
  "subscription": {
    "plan_id": "plan_uuid",
    "billing_cycle": "monthly",
    "coupon_code": null,
    "start_trial": true
  },
  "acceptances": {
    "terms": true,
    "privacy_policy": true,
    "marketing_opt_in": false
  }
}
```

Successful response with immediate login disabled until email verification:

```json
{
  "data": {
    "registered": true,
    "requires_email_verification": true,
    "auto_login": false,
    "tenant": {
      "uuid": "tenant_uuid",
      "slug": "acme",
      "organization_name": "Acme Pvt Ltd",
      "status": "pending"
    },
    "owner": {
      "uuid": "user_uuid",
      "email": "owner@example.com",
      "account_type": "tenant_owner",
      "status": "invited"
    },
    "message": "Registration completed. Please verify your email to continue."
  }
}
```

Successful response with immediate login enabled:

```json
{
  "data": {
    "registered": true,
    "requires_email_verification": false,
    "auto_login": true,
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-07T12:00:00Z",
    "surface": "tenant",
    "redirect_to": "/tenant/dashboard",
    "tenant": {
      "uuid": "tenant_uuid",
      "slug": "acme",
      "organization_name": "Acme Pvt Ltd",
      "status": "trial"
    },
    "account": {
      "uuid": "user_uuid",
      "account_type": "tenant_owner",
      "email": "owner@example.com",
      "roles": ["owner"],
      "permissions": ["dashboard.view", "setting.edit"]
    },
    "modules": ["dashboard", "crm", "projects", "finance", "settings"]
  }
}
```

Validation/conflict errors:

```json
{
  "message": "Validation failed.",
  "error_code": "VALIDATION_FAILED",
  "errors": {
    "organization.slug": ["This workspace URL is already taken."],
    "owner.email": ["The owner email field is required."],
    "acceptances.terms": ["You must accept the terms to continue."]
  },
  "request_id": "uuid"
}
```

```json
{
  "message": "Workspace slug is already taken.",
  "error_code": "TENANT_SLUG_TAKEN",
  "request_id": "uuid"
}
```

Rules:

- This endpoint only registers tenant organizations and tenant owner accounts.
- It must never create platform/super admin accounts.
- Use a database transaction for tenant, owner, office, subscription, settings, roles, and seed data creation.
- Create owner user with `account_type=owner`.
- Enforce unique tenant slug and organization code globally.
- Enforce unique owner email only inside the new tenant, not globally across all tenants.
- If email already exists in another tenant or as platform user, allow registration but show login option in UI.
- Password must be hashed and never logged.
- Send verification email if verification is enabled.
- Apply rate limiting, captcha if needed, and abuse prevention.

### 13.3 Suggest Tenant Slug

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register/suggest-slug` | Public | Suggest available tenant workspace slug |

Request body:

```json
{
  "organization_name": "Acme Pvt Ltd"
}
```

Response:

```json
{
  "data": {
    "suggestions": ["acme", "acme-pvt", "acme-crm"]
  }
}
```

### 13.4 Verify Registered Owner Email

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register/verify-email` | Public + verification token | Verify owner email after registration |

Request body:

```json
{
  "token": "email_verification_token",
  "email": "owner@example.com"
}
```

Response:

```json
{
  "data": {
    "verified": true,
    "can_login": true,
    "message": "Email verified. You can now login."
  }
}
```

### 13.5 Resend Registration Verification

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register/resend-verification` | Public | Resend tenant owner verification email |

Request body:

```json
{
  "email": "owner@example.com",
  "tenant_slug": "acme"
}
```

Response:

```json
{
  "data": {
    "sent": true,
    "message": "If this registration requires verification, a new email has been sent."
  }
}
```

## 14. Registration Rate Limiting

Recommended limits:

| Endpoint | Limit |
| --- | --- |
| `/register/check-email` | 10 attempts/hour by email/IP |
| `/register/suggest-slug` | 20 attempts/hour by IP |
| `/register/tenant` | 3 attempts/hour by IP and email |
| `/register/verify-email` | 10 attempts/hour by email/IP |
| `/register/resend-verification` | 3 attempts/hour by email/IP |

Use captcha or bot protection on `/register/tenant` when public abuse becomes a risk.

## 15. Registration Audit and Security Events

Log these events:

- Tenant registration started.
- Tenant registration completed.
- Tenant registration failed validation or duplicate slug.
- Owner email verification sent.
- Owner email verified.
- Verification resend requested.

Recommended event names:

- `auth.registration_check_email`
- `auth.tenant_registration_started`
- `auth.tenant_registration_completed`
- `auth.tenant_registration_failed`
- `auth.registration_verification_sent`
- `auth.registration_email_verified`
- `auth.registration_verification_resent`

## 16. Registration Validation Rules

`/register/tenant`:

- `organization.organization_name`: required, string, max 200.
- `organization.legal_name`: nullable, string, max 200.
- `organization.display_name`: nullable, string, max 200.
- `organization.slug`: required, string, slug format, max 150, unique in `tenants.slug`.
- `organization.business_type_id`: nullable, valid business type.
- `organization.industry_id`: nullable, valid industry.
- `organization.company_size`: nullable, enum `self`, `small`, `medium`, `large`, `enterprise`.
- `organization.gst_number`: nullable, GST format if country is India.
- `organization.pan_number`: nullable, PAN format if country is India.
- `organization.website`: nullable, URL.
- `organization.default_currency`: required, 3 chars.
- `organization.default_timezone`: required, valid timezone.
- `owner.first_name`: required, string, max 100.
- `owner.last_name`: nullable, string, max 100.
- `owner.display_name`: nullable, string, max 200.
- `owner.email`: required, valid email, max 150.
- `owner.mobile`: nullable, phone format.
- `owner.password`: required, strong password, confirmed.
- `head_office.office_name`: nullable or required depending signup step.
- `head_office.office_code`: nullable, default `HO`.
- `subscription.plan_id`: required if plans are public/selectable.
- `subscription.billing_cycle`: required if plan supports multiple cycles.
- `acceptances.terms`: accepted.
- `acceptances.privacy_policy`: accepted.

## 17. Updated Implementation Notes

- Registration is tenant-only self-service signup.
- Platform users and super admins must be created by existing platform admins, seeders, or controlled internal workflows.
- After registration, normal login still uses the email-first account discovery flow.
- If the same email registers multiple tenants, `/accounts/discover` will show each tenant owner account separately.
- If auto-login is enabled after registration, return the same session payload shape as `/accounts/login`.
- If email verification is required, do not issue a full session until verification is complete, unless using a restricted onboarding session.
