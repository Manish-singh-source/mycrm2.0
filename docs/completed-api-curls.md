# Completed API Curls

This file lists APIs currently implemented in the backend with curl examples, request bodies, and response examples.

Use these placeholders:

```text
{{BASE_URL}} = https://darkgreen-goat-738912.hostingersite.com/
{{REQUEST_ID}} = client generated UUID
{{DISCOVERY_TOKEN}} = token returned by /api/auth/v1/accounts/discover
{{ACCOUNT_REF}} = selected account_ref returned by /api/auth/v1/accounts/discover
{{CHALLENGE_TOKEN}} = token returned when login requires 2FA
{{ACCESS_TOKEN}} = platform or tenant access token from unified login
{{PLATFORM_TOKEN}} = platform access token
{{TENANT_TOKEN}} = tenant/client access token
{{TENANT}} = tenant slug or tenant UUID
```

Common public headers:

```http
Accept: application/json
Content-Type: application/json
X-Request-Id: {{REQUEST_ID}}
X-Client-Version: web/1.0.0
X-Timezone: Asia/Kolkata
X-Locale: en
```

---

# 1. Unified Auth APIs

Base URL: `/api/auth/v1`

## 1.1 Discover Accounts By Email

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/accounts/discover" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -H "X-Client-Version: web/1.0.0" \
  -d '{
    "email": "user@example.com",
    "device_name": "Chrome on Windows"
  }'
```

Request body:

```json
{
  "email": "user@example.com",
  "device_name": "Chrome on Windows"
}
```

Response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "email": "user@example.com",
    "discovery_token": "disc_short_lived_token",
    "expires_in_seconds": 300,
    "accounts": [
      {
        "account_ref": "acct_opaque_platform_ref",
        "account_type": "platform",
        "auth_guard": "platform",
        "label": "SaaS Super Admin",
        "display_name": "Super Admin",
        "email": "user@example.com",
        "avatar_url": null,
        "organization": null,
        "tenant": null,
        "roles": ["super_admin"],
        "status": "active",
        "last_login_at": null
      },
      {
        "account_ref": "acct_opaque_tenant_ref",
        "account_type": "tenant_owner",
        "auth_guard": "tenant",
        "label": "Acme - Owner",
        "display_name": "Acme Owner",
        "email": "user@example.com",
        "avatar_url": null,
        "organization": "Acme Pvt Ltd",
        "tenant": {"uuid": "tenant_uuid", "slug": "acme", "status": "active"},
        "roles": ["owner"],
        "status": "active",
        "last_login_at": null
      }
    ]
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

No accounts response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "email": "user@example.com",
    "discovery_token": null,
    "expires_in_seconds": 0,
    "accounts": []
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

## 1.2 Login Selected Account

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/accounts/login" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -H "X-Client-Version: web/1.0.0" \
  -d '{
    "email": "user@example.com",
    "discovery_token": "{{DISCOVERY_TOKEN}}",
    "account_ref": "{{ACCOUNT_REF}}",
    "password": "StrongPassword#123",
    "remember": true,
    "device_name": "Chrome on Windows"
  }'
```

Request body:

```json
{
  "email": "user@example.com",
  "discovery_token": "{{DISCOVERY_TOKEN}}",
  "account_ref": "{{ACCOUNT_REF}}",
  "password": "StrongPassword#123",
  "remember": true,
  "device_name": "Chrome on Windows"
}
```

Platform login response example:

```json
{
  "success": true,
  "message": "Logged in.",
  "data": {
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-07T12:00:00.000000Z",
    "surface": "platform",
    "redirect_to": "/platform/dashboard",
    "account": {
      "account_type": "platform",
      "auth_guard": "platform",
      "uuid": "platform_user_uuid",
      "display_name": "Super Admin",
      "email": "user@example.com",
      "status": "active",
      "two_factor_enabled": false,
      "roles": ["super_admin"],
      "permissions": ["dashboard.view", "tenant.view"]
    },
    "tenant": null,
    "modules": ["dashboard", "tenants", "subscriptions", "billing", "support", "monitoring", "settings"],
    "preferences": {"timezone": "Asia/Kolkata", "locale": "en"}
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

Tenant login response example:

```json
{
  "success": true,
  "message": "Logged in.",
  "data": {
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-07T12:00:00.000000Z",
    "surface": "tenant",
    "redirect_to": "/tenant/dashboard",
    "account": {
      "account_type": "tenant_owner",
      "auth_guard": "tenant",
      "uuid": "user_uuid",
      "display_name": "Acme Owner",
      "email": "user@example.com",
      "status": "active",
      "two_factor_enabled": false,
      "roles": ["owner"],
      "permissions": ["dashboard.view", "client.view"]
    },
    "tenant": {
      "uuid": "tenant_uuid",
      "slug": "acme",
      "organization_name": "Acme Pvt Ltd",
      "status": "active",
      "default_currency": "INR",
      "default_timezone": "Asia/Kolkata"
    },
    "modules": ["dashboard", "crm"],
    "preferences": {"timezone": "Asia/Kolkata", "locale": "en"}
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

Client login response uses the same shape with `surface: "client_portal"`, `redirect_to: "/client/dashboard"`, and client-limited modules.

2FA required response example:

```json
{
  "success": true,
  "message": "Two-factor authentication required.",
  "data": {
    "requires_2fa": true,
    "challenge_token": "2fa_short_lived_token",
    "methods": ["totp"],
    "account_type": "tenant_owner",
    "surface": "tenant"
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

## 1.3 Verify Login 2FA Challenge

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/accounts/login/2fa" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "challenge_token": "{{CHALLENGE_TOKEN}}",
    "code": "123456",
    "remember_device": true,
    "device_name": "Chrome on Windows"
  }'
```

Request body:

```json
{
  "challenge_token": "{{CHALLENGE_TOKEN}}",
  "code": "123456",
  "remember_device": true,
  "device_name": "Chrome on Windows"
}
```

Response body matches the successful `/accounts/login` response.

## 1.4 Current Session

```bash
curl -X GET "{{BASE_URL}}/api/auth/v1/me" \
  -H "Authorization: Bearer {{ACCESS_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "surface": "tenant",
    "redirect_to": "/tenant/dashboard",
    "account": {"account_type": "tenant_staff", "uuid": "user_uuid", "display_name": "Staff User", "email": "staff@example.com", "roles": ["sales_user"], "permissions": ["lead.view", "lead.create"]},
    "tenant": {"uuid": "tenant_uuid", "slug": "acme", "organization_name": "Acme Pvt Ltd"},
    "modules": ["dashboard", "crm"],
    "preferences": {"timezone": "Asia/Kolkata", "locale": "en"}
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

## 1.5 Logout

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/logout" \
  -H "Authorization: Bearer {{ACCESS_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"all_devices": false}'
```

Request body:

```json
{"all_devices": false}
```

Response example:

```json
{"success": true, "message": "OK", "data": {"logged_out": true}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

## 1.6 Password Forgot

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/password/forgot" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "email": "user@example.com",
    "account_ref": "{{ACCOUNT_REF}}",
    "discovery_token": "{{DISCOVERY_TOKEN}}"
  }'
```

Request body when account is not selected:

```json
{"email": "user@example.com"}
```

Request body when account is selected:

```json
{
  "email": "user@example.com",
  "account_ref": "{{ACCOUNT_REF}}",
  "discovery_token": "{{DISCOVERY_TOKEN}}"
}
```

Response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "sent": true,
    "message": "If this account can receive password reset instructions, an email has been sent.",
    "reset_token": "local_only_reset_token"
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

`reset_token` is returned only in local environment.

## 1.7 Password Reset

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/password/reset" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "email": "user@example.com",
    "token": "local_only_reset_token",
    "password": "NewStrongPassword#123",
    "password_confirmation": "NewStrongPassword#123"
  }'
```

Request body:

```json
{
  "email": "user@example.com",
  "token": "password_reset_token",
  "password": "NewStrongPassword#123",
  "password_confirmation": "NewStrongPassword#123"
}
```

Response example:

```json
{"success": true, "message": "OK", "data": {"reset": true}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

---

# 2. Implemented Platform Post-Login APIs

Base URL: `/api/platform/v1`

These endpoints require a platform token created by the unified login flow.

## 2.1 Platform Auth/Profile/Security Endpoints

| Method | Endpoint                           | Purpose                              |
| ------ | ---------------------------------- | ------------------------------------ |
| POST   | `/auth/logout`                   | Revoke current platform token        |
| POST   | `/auth/refresh`                  | Rotate current platform token        |
| GET    | `/auth/me`                       | Platform current user                |
| POST   | `/auth/verify-email/resend`      | Queue verification email placeholder |
| POST   | `/auth/2fa/enable`               | Start TOTP 2FA setup                 |
| POST   | `/auth/2fa/confirm`              | Confirm TOTP 2FA setup               |
| POST   | `/auth/2fa/disable`              | Disable 2FA                          |
| GET    | `/profile`                       | Get profile                          |
| PATCH  | `/profile`                       | Update profile                       |
| PUT    | `/profile/password`              | Change password                      |
| GET    | `/settings/preferences`          | List preferences                     |
| PUT    | `/settings/preferences`          | Update preferences                   |
| GET    | `/profile/sessions`              | List Sanctum sessions/tokens         |
| DELETE | `/profile/sessions/{session_id}` | Revoke session/token                 |

Example platform profile update:

```bash
curl -X PATCH "{{BASE_URL}}/api/platform/v1/profile" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "first_name": "Sahil",
    "last_name": "Admin",
    "display_name": "Sahil Admin",
    "mobile": "+919999999999",
    "timezone": "Asia/Kolkata",
    "locale": "en"
  }'
```

Request body:

```json
{
  "first_name": "Sahil",
  "last_name": "Admin",
  "display_name": "Sahil Admin",
  "mobile": "+919999999999",
  "profile_photo_file_id": 1,
  "timezone": "Asia/Kolkata",
  "locale": "en"
}
```

Response example:

```json
{"success": true, "message": "Profile updated.", "data": {"user": {"uuid": "platform_user_uuid", "display_name": "Sahil Admin"}}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

Example platform 2FA enable:

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/auth/2fa/enable" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success": true, "message": "Confirm 2FA setup.", "data": {"secret": "BASE32TOTPSECRET", "provisioning_uri": "otpauth://totp/SaaS%20CRM:user%40example.com?secret=BASE32TOTPSECRET&issuer=SaaS%20CRM&algorithm=SHA1&digits=6&period=30"}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

## 2.2 Platform API Tokens

| Method | Endpoint                            | Purpose                                |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/api-tokens`                     | List platform API tokens               |
| POST   | `/api-tokens`                     | Create platform API token              |
| GET    | `/api-tokens/{token_uuid}`        | Show platform API token metadata       |
| POST   | `/api-tokens/{token_uuid}/rotate` | Rotate token and return raw token once |
| POST   | `/api-tokens/{token_uuid}/revoke` | Revoke token                           |

Create platform API token:

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/api-tokens" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "name": "BI Warehouse Export",
    "abilities": ["report.view", "report.export"],
    "expires_at": "2027-08-06T00:00:00Z"
  }'
```

Request body:

```json
{"name": "BI Warehouse Export", "abilities": ["report.view", "report.export"], "expires_at": "2027-08-06T00:00:00Z"}
```

Response example:

```json
{"success": true, "message": "API token created.", "data": {"uuid": "platform_token_uuid", "name": "BI Warehouse Export", "token": "plat_plain_text_token_returned_once", "expires_at": "2027-08-06T00:00:00Z"}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

---

# 3. Implemented Tenant Post-Login APIs

Base URL: `/api/tenant/v1`

These endpoints require a tenant/client token created by the unified login flow and must include `X-Tenant`.

## 3.1 Tenant Auth/Profile/Security Endpoints

| Method | Endpoint                           | Purpose                              |
| ------ | ---------------------------------- | ------------------------------------ |
| POST   | `/auth/logout`                   | Revoke current tenant token          |
| POST   | `/auth/refresh`                  | Rotate current tenant token          |
| GET    | `/auth/me`                       | Tenant current user                  |
| POST   | `/auth/verify-email/resend`      | Queue verification email placeholder |
| POST   | `/auth/2fa/enable`               | Start TOTP 2FA setup                 |
| POST   | `/auth/2fa/confirm`              | Confirm TOTP 2FA setup               |
| POST   | `/auth/2fa/disable`              | Disable 2FA                          |
| GET    | `/profile`                       | Get profile                          |
| PATCH  | `/profile`                       | Update profile                       |
| PUT    | `/profile/password`              | Change password                      |
| GET    | `/profile/preferences`           | List preferences                     |
| PUT    | `/profile/preferences`           | Update preferences                   |
| GET    | `/profile/sessions`              | List Sanctum sessions/tokens         |
| DELETE | `/profile/sessions/{session_id}` | Revoke session/token                 |

Example tenant profile update:

```bash
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/profile" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "first_name": "Sahil",
    "last_name": "Owner",
    "display_name": "Sahil Owner",
    "mobile": "+919999999999",
    "timezone": "Asia/Kolkata",
    "locale": "en"
  }'
```

Request body:

```json
{
  "first_name": "Sahil",
  "last_name": "Owner",
  "display_name": "Sahil Owner",
  "mobile": "+919999999999",
  "profile_photo_file_id": 1,
  "timezone": "Asia/Kolkata",
  "locale": "en"
}
```

Response example:

```json
{"success": true, "message": "Profile updated.", "data": {"user": {"uuid": "user_uuid", "display_name": "Sahil Owner"}}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

## 3.2 Tenant API Tokens

| Method | Endpoint                                    | Purpose                                |
| ------ | ------------------------------------------- | -------------------------------------- |
| GET    | `/profile/api-tokens`                     | List tenant API tokens                 |
| POST   | `/profile/api-tokens`                     | Create tenant API token                |
| POST   | `/profile/api-tokens/{token_uuid}/rotate` | Rotate token and return raw token once |
| POST   | `/profile/api-tokens/{token_uuid}/revoke` | Revoke token                           |

Create tenant API token:

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/profile/api-tokens" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "name": "Reporting Integration",
    "abilities": ["report.view", "report.export"],
    "expires_at": "2027-08-06T00:00:00Z"
  }'
```

Request body:

```json
{"name": "Reporting Integration", "abilities": ["report.view", "report.export"], "expires_at": "2027-08-06T00:00:00Z"}
```

Response example:

```json
{"success": true, "message": "API token created.", "data": {"uuid": "tenant_token_uuid", "name": "Reporting Integration", "token": "tenant_1_plain_text_token_returned_once", "expires_at": "2027-08-06T00:00:00Z"}, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": null}
```

---

# 4. Common Error Examples

Validation error:

```json
{"success": false, "message": "Validation failed.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "VALIDATION_ERROR", "details": {"email": ["The email field is required."]}}}
```

Invalid password:

```json
{"success": false, "message": "Invalid password.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "INVALID_CREDENTIALS", "details": []}}
```

Expired discovery token or invalid account selection:

```json
{"success": false, "message": "Discovery token expired or account selection is invalid.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "DISCOVERY_TOKEN_EXPIRED", "details": []}}
```

Wrong token surface:

```json
{"success": false, "message": "Tenant token required.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "TENANT_TOKEN_REQUIRED", "details": []}}
```

Tenant token mismatch:

```json
{"success": false, "message": "Token does not belong to this tenant.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "TENANT_TOKEN_MISMATCH", "details": []}}
```
