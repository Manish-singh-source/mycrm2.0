# Auth System Setup

This document explains how to implement the SaaS CRM unified authentication system.

Auth API contract:

- `docs/auth-apis.md`

Related docs:

- `docs/database.md`
- `docs/platform-apis.md`
- `docs/tenant-apis.md`
- `docs/react-js-setup.md`
- `docs/flutter-setup.md`
- `docs/laravel-setup.md`

## 1. Auth Goal

The system must support one email address belonging to multiple account contexts:

- Platform super admin or platform staff account from `platform_users`.
- Tenant owner/staff account from tenant `users`.
- Client portal account from tenant `users` with `account_type=client`.

Login must be account-choice based:

1. User enters email.
2. Backend discovers accounts for that email.
3. UI shows a list of account choices.
4. User selects one account.
5. User enters password for that selected account.
6. Backend verifies the selected account.
7. Backend returns token, surface, tenant context if applicable, roles, permissions, modules, and redirect target.

## 2. Why This Flow Is Needed

The database design has two auth tables:

| Table | Purpose |
| --- | --- |
| `platform_users` | SaaS owner/staff users |
| `users` | Tenant owner, tenant staff, and client portal users |

A single email may exist in:

- `platform_users` as a super admin.
- `users` for tenant A as owner.
- `users` for tenant B as staff.
- `users` for tenant C as client portal user.

Because of this, email plus password alone is not enough to know which account context the user wants. The account selection step makes the login explicit and safe.

## 3. User Experience Flow

### Step 1: Email Screen

Fields:

- Email.
- Continue button.

Behavior:

- Submit `POST /api/auth/v1/accounts/discover`.
- Show loading state.
- Show validation errors for invalid email.
- If no accounts are returned, show generic message.
- If one account is returned, the UI may auto-select it and move to password step.
- If multiple accounts are returned, show account choice screen.

Do not ask for password on the first screen.

### Step 2: Account Choice Screen

Show safe account cards:

- Account label, such as `SaaS Super Admin`, `Acme Pvt Ltd - Owner`, `Acme Pvt Ltd - Staff`, `Acme Pvt Ltd - Client Portal`.
- Display name.
- Organization name when applicable.
- Role badges.
- Last login if available.
- Disabled state if account cannot log in.

Hidden data:

- `account_ref`.
- `discovery_token`.

Behavior:

- User selects an account.
- UI moves to password screen.
- Allow back to email screen.
- Do not expose internal IDs, table names, or numeric IDs.

### Step 3: Password Screen

Fields:

- Password.
- Remember me.
- Login button.

Context shown:

- Selected account label.
- Email.
- Organization name if tenant/client account.
- Change account link.

Behavior:

- Submit `POST /api/auth/v1/accounts/login` with email, discovery_token, account_ref, password, remember, device_name.
- If password is valid and 2FA is not required, store token and redirect.
- If 2FA is required, move to 2FA challenge screen.
- If password is invalid, show error and keep user on password screen.
- If discovery token expired, send user back to email screen.

### Step 4: 2FA Screen

Fields:

- Authentication code.
- Remember this device toggle.

Behavior:

- Submit `POST /api/auth/v1/accounts/login/2fa`.
- On success, store token and redirect.
- On failure, show invalid code error.

### Step 5: Redirect and Module Access

Use `surface` and `redirect_to` from login response.

| Surface | Redirect |
| --- | --- |
| `platform` | Platform Admin dashboard |
| `tenant` | Tenant CRM dashboard |
| `client_portal` | Client portal dashboard or limited tenant area |

After login:

- Store token securely.
- Store account type, roles, permissions, modules.
- Store tenant context if returned.
- Load current session from `/api/auth/v1/me` on app refresh.
- Hide routes/modules/actions the account does not have permission for.

## 4. Backend Implementation Plan: Laravel

### Step 1: Routes

Create auth routes:

```php
Route::prefix('api/auth/v1')->group(function () {
    Route::post('/accounts/discover', [AccountDiscoveryController::class, 'discover']);
    Route::post('/accounts/login', [AccountLoginController::class, 'login']);
    Route::post('/accounts/login/2fa', [AccountTwoFactorController::class, 'verify']);
    Route::get('/me', [CurrentSessionController::class, 'show'])->middleware('auth:any');
    Route::post('/logout', [LogoutController::class, 'logout'])->middleware('auth:any');
    Route::post('/password/forgot', [PasswordResetController::class, 'send']);
    Route::post('/password/reset', [PasswordResetController::class, 'reset']);
});
```

`auth:any` can be a custom middleware that accepts either a platform token or tenant token.

### Step 2: Controllers

Recommended controllers:

```text
app/Http/Controllers/Auth/
  AccountDiscoveryController.php
  AccountLoginController.php
  AccountTwoFactorController.php
  CurrentSessionController.php
  LogoutController.php
  PasswordResetController.php
```

### Step 3: Requests

Recommended FormRequests:

```text
app/Http/Requests/Auth/
  DiscoverAccountsRequest.php
  LoginSelectedAccountRequest.php
  VerifyTwoFactorRequest.php
  ForgotPasswordRequest.php
  ResetPasswordRequest.php
```

### Step 4: Services

Recommended services:

```text
app/Services/Auth/
  AccountDiscoveryService.php
  AccountReferenceService.php
  UnifiedLoginService.php
  LoginRateLimiter.php
  TwoFactorChallengeService.php
  SessionResponseFactory.php
```

Service responsibilities:

| Service | Responsibility |
| --- | --- |
| `AccountDiscoveryService` | Query `platform_users` and `users` for login-capable accounts by email |
| `AccountReferenceService` | Create and verify opaque `account_ref` values |
| `UnifiedLoginService` | Verify selected account password and issue correct token |
| `LoginRateLimiter` | Apply rate limits by email/IP/account/device |
| `TwoFactorChallengeService` | Create/verify short-lived 2FA challenges |
| `SessionResponseFactory` | Build consistent login/current-session response |

### Step 5: Account Discovery Logic

Pseudo workflow:

```text
1. Normalize email to lowercase.
2. Rate limit discovery by email and IP.
3. Query active login-capable platform_users by email.
4. Query tenant users by email across tenants, joining tenants for tenant status and organization name.
5. Filter out deleted accounts.
6. Decide whether suspended/inactive accounts should appear as disabled choices or be hidden.
7. Build safe account choice DTOs.
8. Generate discovery_token valid for 5 minutes.
9. Generate opaque account_ref for each account choice.
10. Return account choices.
```

Important rules:

- Never return password hashes.
- Never return internal numeric IDs.
- Never return raw table names.
- Never reveal sensitive tenant data.
- Do not create session/token during discovery.

### Step 6: Account Reference Design

`account_ref` should be opaque.

Recommended payload before encryption/signing:

```json
{
  "guard": "tenant",
  "account_type": "tenant_owner",
  "account_uuid": "user_uuid",
  "tenant_uuid": "tenant_uuid",
  "email": "user@example.com",
  "expires_at": "2026-08-06T12:05:00Z",
  "nonce": "random_uuid"
}
```

Implementation options:

- Laravel encrypt/decrypt with signed encrypted payload.
- Cache-based opaque random token that maps to payload until expiry.

Recommendation:

- Use cache-based opaque references for easiest revocation and expiry.
- Store only for a short time, such as 5 minutes.

### Step 7: Discovery Token Design

`discovery_token` should prove the user completed email discovery.

Recommended properties:

- Short lived: 5 minutes.
- Bound to normalized email.
- Bound to account refs returned in that discovery response.
- Bound to IP/device where practical.
- Single purpose.
- Invalidated after login success or repeated failures.

### Step 8: Login Verification Logic

Pseudo workflow:

```text
1. Validate request.
2. Rate limit login by email, IP, account_ref.
3. Verify discovery_token.
4. Resolve account_ref safely.
5. Confirm account_ref email matches submitted email.
6. Load selected account from correct table.
7. Check account status.
8. If tenant account, load tenant and check tenant status.
9. Verify password against selected account password hash.
10. If invalid, log security event and return generic invalid password error.
11. If 2FA required, create challenge and return requires_2fa response.
12. Create correct token/session for platform or tenant guard.
13. Load roles, permissions, modules, preferences, tenant context.
14. Log successful login.
15. Return session response.
```

### Step 9: Token Strategy

Recommended first version:

- Laravel Sanctum personal access tokens for API auth.
- Separate token abilities/scopes for platform and tenant surfaces.
- Token metadata should include device name and last used time.

Token naming:

| Surface | Token Name Example |
| --- | --- |
| Platform | `platform:web-admin:Chrome on Windows` |
| Tenant | `tenant:acme:web:Chrome on Windows` |
| Flutter | `tenant:acme:flutter:iPhone 15` |

Do not allow platform tokens to authorize tenant API routes or tenant tokens to authorize platform routes.

### Step 10: Current Session `/me`

`/me` should inspect the token and return:

- Surface: platform, tenant, or client_portal.
- Account data.
- Roles.
- Permissions.
- Tenant context if applicable.
- Enabled modules.
- Preferences.
- Security flags such as 2FA enabled.

Frontend and Flutter should call `/me` on app startup.

## 5. Database Requirements

Existing tables used:

- `platform_users`
- `users`
- `tenants`
- Platform RBAC tables.
- Tenant RBAC tables.
- `platform_user_preferences`
- `user_preferences`
- `tenant_settings`
- `activity_logs`
- `security_events`

Recommended additional table for token/session tracking if Sanctum is not enough:

| Table | Key Columns |
| --- | --- |
| `login_sessions` | id, uuid, guard, account_type, account_id, tenant_id null, token_id null, device_name, ip_address, user_agent, last_used_at, revoked_at, expires_at, timestamps |

Recommended additional table for 2FA challenges if not cache-only:

| Table | Key Columns |
| --- | --- |
| `auth_challenges` | id, uuid, guard, account_type, account_id, tenant_id null, challenge_type, challenge_hash, expires_at, consumed_at, ip_address, user_agent, timestamps |

Cache is acceptable for discovery tokens, account refs, and 2FA challenges if persistence is not required.

## 6. React Frontend Setup

React auth flow screens:

```text
/auth/email
/auth/accounts
/auth/password
/auth/2fa
/platform/dashboard
/tenant/dashboard
/client/dashboard
```

React state requirements:

- `email`
- `discovery_token`
- `accounts[]`
- `selectedAccount`
- `surface`
- `access_token`
- `tenant`
- `roles`
- `permissions`
- `modules`

React implementation rules:

- Use React Hook Form and Zod for email/password/2FA validation.
- Use TanStack Query mutation for discover/login/2FA/logout.
- Store token securely according to app auth strategy.
- Keep platform and tenant API clients separate after login.
- Use `surface` and `redirect_to` from backend, not guessed frontend logic.
- Use PermissionGate and route guards after `/me` loads.

## 7. Flutter App Setup

Flutter auth flow screens:

```text
EmailEntryScreen
AccountChoiceScreen
PasswordLoginScreen
TwoFactorScreen
PlatformShell
TenantShell
ClientPortalShell
```

Flutter state requirements:

- Use Riverpod/Bloc auth state.
- Store access token in `flutter_secure_storage`.
- Store selected tenant context after login.
- Call `/api/auth/v1/me` on app launch.
- Use go_router redirects based on auth state and surface.

Flutter implementation rules:

- Use bottom sheets for account switcher if user logs out or changes account.
- Use secure storage only for tokens.
- Do not store passwords.
- Use device name in login requests.
- Support biometric app unlock later, but not as backend authentication replacement.

## 8. Account Switching

After login, user may want to switch accounts if the same email has multiple accounts.

Recommended UX:

- Show current account in profile menu.
- Add `Switch account` action.
- Switching account should either:
  - Return to email/account discovery flow, or
  - Reuse a valid remembered discovery flow only if secure and recent.
- Do not switch silently between tenants or platform context.
- Always create/verify a session for the selected account.

Optional endpoint later:

```http
POST /api/auth/v1/accounts/switch
```

Only add this if refresh/session design supports secure switching.

## 9. Password Rules

Recommended defaults:

- Minimum 10 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one symbol.
- Block common leaked passwords if possible.
- Force reset after temporary password.

Tenant-specific password policies can later be stored in `tenant_settings.security.password_policy`.

Platform password policy should be stricter than tenant policy.

## 10. Status and Blocking Rules

Platform account status:

| Status | Login Allowed |
| --- | --- |
| active | Yes |
| inactive | No |
| suspended | No |

Tenant user status:

| Status | Login Allowed |
| --- | --- |
| invited | Depends: allow invite setup, block normal login until password set |
| active | Yes |
| inactive | No |
| suspended | No |

Tenant status:

| Status | Login Allowed |
| --- | --- |
| pending | Owner setup only if onboarding allows |
| trial | Yes |
| active | Yes |
| suspended | No, except maybe tenant owner billing recovery route |
| expired | No or restricted billing route depending business rule |
| cancelled | No |
| archived | No |

## 11. Module Access Rules

After login, module access is based on:

- Account type.
- Roles.
- Permissions.
- Tenant enabled modules.
- Subscription plan features.
- Tenant settings.
- Client portal restrictions for `account_type=client`.

Backend must return permissions and modules in login/current-session responses.

Frontend/mobile must hide unavailable modules, but backend must still enforce permissions.

## 12. Error Handling UX

| Error Code | UI Behavior |
| --- | --- |
| `VALIDATION_FAILED` | Show field-level errors |
| `NO_ACCOUNTS_FOUND` | Show generic no account message |
| `DISCOVERY_TOKEN_EXPIRED` | Return to email screen |
| `INVALID_ACCOUNT_REF` | Return to email screen |
| `INVALID_CREDENTIALS` | Show invalid password on password screen |
| `ACCOUNT_SUSPENDED` | Show account suspended message |
| `TENANT_SUSPENDED` | Show tenant suspended message and support contact |
| `TENANT_EXPIRED` | Show subscription expired/restricted message |
| `TWO_FACTOR_REQUIRED` | Move to 2FA screen |
| `INVALID_2FA_CODE` | Show invalid code on 2FA screen |
| `TOO_MANY_ATTEMPTS` | Show cooldown timer |

## 13. Security Checklist

Backend:

- Rate limit discovery, login, 2FA, password reset.
- Use opaque account refs.
- Use short-lived discovery tokens.
- Invalidate discovery tokens after success or repeated failures.
- Log security events.
- Use constant/generic messages where account enumeration risk is high.
- Verify password only for selected account.
- Verify tenant status for tenant/client accounts.
- Verify roles and permissions on every protected API.
- Store tokens securely and revoke on logout.

Frontend/mobile:

- Do not store passwords.
- Do not expose account_ref in URL.
- Do not log tokens or passwords.
- Do not show raw internal IDs.
- Clear discovery_token after login or expiry.
- Clear selected account when going back to email screen.
- Use secure storage for mobile tokens.
- Use permission guards after login.

## 14. Testing Checklist

Backend tests:

- Email with no accounts returns empty list or generic response.
- Email with platform account returns platform account choice.
- Email with tenant owner/staff/client across multiple tenants returns multiple choices.
- Account refs are opaque and expire.
- Login validates selected platform account password.
- Login validates selected tenant account password.
- Wrong password fails only selected account.
- Suspended account cannot login.
- Suspended tenant blocks tenant/client login.
- 2FA challenge required and verified.
- Login writes security event.
- Logout revokes token.
- `/me` returns correct surface, permissions, tenant, modules.
- Platform token cannot access tenant API.
- Tenant token cannot access platform API.

React tests:

- Email flow renders account choices.
- Multiple account choice works.
- Password login redirects by surface.
- 2FA challenge screen appears when required.
- Permission-based route guard works.

Flutter tests:

- Auth state transitions: email, accounts, password, 2FA, logged in.
- Secure storage receives token only after success.
- go_router redirects by surface.
- Tenant context is included for tenant API calls.

## 15. Implementation Order

1. Create auth routes and FormRequests.
2. Build AccountDiscoveryService.
3. Build AccountReferenceService and discovery token cache.
4. Build UnifiedLoginService.
5. Add token/session generation for platform and tenant guards.
6. Add `/me` and logout.
7. Add 2FA challenge flow.
8. Add password reset flow.
9. Add security events and activity logs.
10. Add rate limiting.
11. Add backend tests.
12. Build React auth screens.
13. Build Flutter auth screens.
14. Verify platform/tenant/client redirects and permissions.

## 16. Final Acceptance Criteria

The auth system is complete only when:

- Email-first discovery works.
- Multiple account choices appear for the same email.
- Platform, tenant owner, tenant staff, and client accounts can be selected and logged in separately.
- Password verification applies only to the selected account.
- Login returns correct surface, token, roles, permissions, modules, and tenant context.
- Platform and tenant/client tokens are not interchangeable.
- Suspended/inactive accounts and tenants are blocked correctly.
- 2FA works when enabled.
- Password reset supports account-specific reset.
- Security events and activity logs are written.
- Rate limiting is enforced.
- React and Flutter follow the same flow.

## 17. Tenant Registration Setup

Tenant registration is the only public signup flow in the SaaS. Public users can create a new tenant workspace and become that tenant's owner. Platform users, platform staff, and super admins must not be created through public registration.

### 17.1 Registration UX Flow

Build a dedicated tenant registration page at `/register` or `/tenant/register`.

Recommended steps:

1. Owner email step
   - User enters email and continues.
   - Call `POST /register/check-email`.
   - If the email already has accounts, show a neutral message that the user can login or continue creating a new tenant workspace.
   - Do not show the existing account list inside registration. Existing accounts are shown only in the login discovery flow.

2. Organization step
   - Collect organization name, legal name, display name, industry, business type, company size, default currency, and default timezone.
   - Generate a workspace slug from the organization name.
   - Allow the user to edit the slug.
   - Call `POST /register/suggest-slug` when the slug is unavailable.

3. Owner profile step
   - Collect owner first name, last name, display name, mobile number, password, and password confirmation.
   - Show password strength and password rule validation before submit.

4. Head office step
   - Collect head office name, phone, email, address, country, state, city, postal code, default timezone, and default currency.
   - Default office code should be `HO` unless the user provides a valid code.

5. Plan or trial step
   - Show available public plans if plan selection is enabled.
   - Otherwise assign the default trial plan from backend configuration.
   - Do not require payment during registration unless billing is intentionally enabled for signup.

6. Review and acceptance step
   - Show organization, owner, workspace URL, plan, and head office summary.
   - Require terms and privacy policy acceptance.
   - Submit `POST /register/tenant`.

7. Verification or auto-login step
   - If backend returns `requires_email_verification: true`, show the verify email screen and allow resend through `POST /register/resend-verification`.
   - If backend returns `auto_login: true`, store the returned access token and redirect to tenant onboarding or tenant dashboard.

8. Future login behavior
   - After registration, the same email can use the normal email-first login flow.
   - If the email owns multiple tenants, `/accounts/discover` must show each tenant owner account separately.

### 17.2 Laravel Registration Routes

Add public registration routes under the auth API version group:

```php
Route::prefix('auth/v1')->group(function () {
    Route::post('/register/check-email', [TenantRegistrationController::class, 'checkEmail']);
    Route::post('/register/suggest-slug', [TenantRegistrationController::class, 'suggestSlug']);
    Route::post('/register/tenant', [TenantRegistrationController::class, 'register']);
    Route::post('/register/verify-email', [RegistrationEmailVerificationController::class, 'verify']);
    Route::post('/register/resend-verification', [RegistrationEmailVerificationController::class, 'resend']);
});
```

Use public middleware only, but apply strict throttling, request logging, and optional captcha validation on `POST /register/tenant`.

### 17.3 Laravel Classes

Controllers:

- `TenantRegistrationController`
- `RegistrationEmailVerificationController`

Form requests:

- `CheckRegistrationEmailRequest`
- `SuggestTenantSlugRequest`
- `RegisterTenantRequest`
- `VerifyRegistrationEmailRequest`
- `ResendRegistrationVerificationRequest`

Services:

- `TenantRegistrationService`
- `TenantSlugService`
- `TenantBootstrapService`
- `TenantOwnerService`
- `TenantTrialSubscriptionService`
- `RegistrationVerificationService`
- `AuthAuditService`

Notifications/jobs:

- `SendTenantOwnerVerificationEmail`
- `SendTenantRegistrationWelcomeEmail`
- `BootstrapTenantDefaultsJob` if tenant bootstrapping is moved out of the request cycle.

### 17.4 Registration Transaction

`TenantRegistrationService` should wrap tenant creation in a database transaction.

Transaction steps:

1. Validate that the workspace slug is available.
2. Create the `tenants` record with pending, trial, or active status based on configuration.
3. Create the tenant owner user with `account_type=owner`.
4. Hash the owner password.
5. Create the tenant head office record.
6. Attach owner to the tenant and head office.
7. Seed default tenant roles, permissions, modules, settings, pipelines, statuses, tags, and numbering rules.
8. Create the trial or pending subscription record.
9. Store terms and privacy policy acceptance details if legal acceptance tables exist.
10. Create an email verification token when verification is required.
11. Send verification and welcome notifications.
12. Log tenant registration audit events.
13. Return either verification-required response or auto-login session response.

Important rules:

- Public registration must create tenant accounts only.
- Never create `super_admin`, platform admin, platform staff, or internal support users from tenant registration.
- The same email may exist in multiple tenants and may also exist as a platform user.
- Owner email uniqueness should be scoped to the new tenant, not globally across the SaaS.
- Tenant slug must be globally unique.
- Organization code should be generated if the user does not provide it.
- Head office should default to office code `HO`.
- If email verification is required, do not issue a full access token before verification unless the token is restricted to onboarding-only routes.

### 17.5 React Frontend Registration Structure

Create registration screens inside the auth module:

```text
src/features/auth/register/
  pages/TenantRegisterPage.tsx
  pages/RegistrationEmailVerificationPage.tsx
  components/RegistrationStepper.tsx
  components/OwnerEmailStep.tsx
  components/OrganizationStep.tsx
  components/WorkspaceSlugField.tsx
  components/OwnerProfileStep.tsx
  components/HeadOfficeStep.tsx
  components/PlanStep.tsx
  components/RegistrationReviewStep.tsx
  components/ExistingAccountNotice.tsx
  components/VerificationSentPanel.tsx
  hooks/useTenantRegistration.ts
  services/registrationApi.ts
  schemas/registration.schema.ts
```

Frontend requirements:

- Use React Hook Form with Zod validation.
- Keep each step resumable in local component state until submit.
- Use backend validation messages as field-level errors.
- Disable submit while registration is in progress.
- Add a clear login link for users who already have accounts.
- Show workspace URL preview while editing slug.
- Show password strength and exact missing password rules.
- Do not reveal whether an email belongs to a platform user.
- After auto-login, redirect tenant owners to tenant onboarding or dashboard based on backend `redirect_to`.

### 17.6 Flutter Registration Structure

If mobile registration is enabled, mirror the web flow in the Flutter auth feature:

```text
lib/features/auth/register/
  presentation/pages/tenant_register_page.dart
  presentation/pages/registration_email_verification_page.dart
  presentation/widgets/registration_stepper.dart
  presentation/widgets/owner_email_step.dart
  presentation/widgets/organization_step.dart
  presentation/widgets/workspace_slug_field.dart
  presentation/widgets/owner_profile_step.dart
  presentation/widgets/head_office_step.dart
  presentation/widgets/plan_step.dart
  presentation/widgets/registration_review_step.dart
  data/registration_api.dart
  data/registration_models.dart
  domain/tenant_registration_controller.dart
```

Flutter requirements:

- Use the same API contract as React.
- Use form validators matching backend rules.
- Store tokens only in secure storage after verified login or approved auto-login.
- Support verification resend.
- Keep registration optional if tenant signup is web-only for the first release.

### 17.7 Registration Tests

Backend tests:

- A new tenant can register successfully.
- Registration creates tenant, owner user, owner role, head office, default settings, and subscription/trial records.
- Duplicate tenant slug is rejected.
- Same email can register another tenant.
- Same email as a platform user can still register a tenant owner account.
- Public registration cannot create super admin or platform users.
- Weak password is rejected.
- Terms and privacy acceptance are required.
- Email verification token is created and verified.
- Verification resend is rate limited.
- Auto-login returns the same session structure as password login when enabled.

Frontend tests:

- Registration stepper validates every step.
- Existing account notice does not expose account details.
- Slug suggestions render when slug is unavailable.
- Submit handles validation errors, duplicate slug, verification required, and auto-login success.
- Verification sent screen supports resend.

### 17.8 Updated Implementation Order

Add tenant registration after the core auth API contracts are defined and before final auth acceptance testing:

1. Create auth route groups and response envelopes.
2. Implement account discovery and password login.
3. Implement tenant registration routes, requests, services, and tests.
4. Implement email verification for newly registered tenant owners.
5. Implement `/me`, logout, password reset, and 2FA.
6. Build React login and registration screens.
7. Build Flutter login screens and optional registration screens.
8. Test full login, registration, account switching, module access, and tenant isolation flows.

### 17.9 Updated Final Acceptance Criteria

Tenant registration is complete when:

- Public signup creates only tenant workspaces and tenant owner accounts.
- Platform and super-admin accounts cannot be created from the registration page or registration APIs.
- The registration page supports organization, owner, workspace slug, head office, plan/trial, and legal acceptance steps.
- Registered owners can verify email, login, and access tenant modules based on their assigned permissions.
- Registered tenant accounts appear in the normal email-first account discovery flow after signup.
- Same email can safely belong to multiple tenant accounts without breaking account selection.
