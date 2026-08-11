# Completed API Curls

This file lists APIs currently implemented in the backend with curl examples, request bodies, and response examples.

Use these placeholders:

```text
{{BASE_URL}} = https://darkgreen-goat-738912.hostingersite.com
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

# 0. Common Master Data APIs

Base URL: `https://darkgreen-goat-738912.hostingersite.com`

## 0.1 Countries List

List active countries for any form that needs a country dropdown. Supports optional `search` by country name, ISO2, or ISO3.

```bash
curl -X GET "{{BASE_URL}}/api/common/v1/locations/countries?search=ind" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none.

Response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "countries": [
      {
        "id": 1,
        "name": "India",
        "iso2": "IN",
        "iso3": "IND",
        "phone_code": "+91",
        "currency_code": "INR"
      }
    ]
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

## 0.2 States List

List active states for any form after a country is selected. Pass either `country_id` or `country_iso2`; supports optional `search` by state name or code.

```bash
curl -X GET "{{BASE_URL}}/api/common/v1/locations/states?country_id=1&search=guj" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none.

Response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "states": [
      {
        "id": 1,
        "country_id": 1,
        "name": "Gujarat",
        "code": "GJ"
      }
    ]
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

Error example:

```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": {
    "code": "VALIDATION_ERROR",
    "details": {
      "country_id": ["The country id field is required when country iso2 is not present."]
    }
  }
}
```

## 0.3 Cities List

List active cities for any form after a state is selected. `country_id` is optional and can be used to additionally constrain the result; supports optional `search` by city name.

```bash
curl -X GET "{{BASE_URL}}/api/common/v1/locations/cities?state_id=1&country_id=1&search=ahm" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none.

Response example:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "cities": [
      {
        "id": 1,
        "country_id": 1,
        "state_id": 1,
        "name": "Ahmedabad"
      }
    ]
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

Error example:

```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": {
    "code": "VALIDATION_ERROR",
    "details": {
      "state_id": ["The state id field is required."]
    }
  }
}
````n
# 1. Unified Auth APIs

Base URL: `/api/auth/v1`

## 1.1 Tenant Registration

Create a new SaaS tenant, first owner user, default head office, owner role, tenant role pivot, audit log, and return a tenant access token.

```bash
curl -X POST "{{BASE_URL}}/api/auth/v1/tenants/register" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "organization_name": "Acme Pvt Ltd",
    "legal_name": "Acme Private Limited",
    "display_name": "Acme",
    "organization_code": "ACME",
    "slug": "acme",
    "company_size": "small",
    "website": "https://acme.example.com",
    "default_currency": "INR",
    "default_timezone": "Asia/Kolkata",
    "owner": {
      "first_name": "Sahil",
      "last_name": "Owner",
      "display_name": "Sahil Owner",
      "email": "owner@example.com",
      "mobile": "+919999999999",
      "password": "Password@123",
      "password_confirmation": "Password@123"
    },
    "office": {
      "office_name": "Head Office",
      "address_line_1": "Main Street",
      "address_line_2": "Business Park",
      "postal_code": "400001",
      "contact_phone": "+919999999999"
    }
  }'
```

Request body:

```json
{
  "organization_name": "Acme Pvt Ltd",
  "legal_name": "Acme Private Limited",
  "display_name": "Acme",
  "organization_code": "ACME",
  "slug": "acme",
  "business_type_id": 1,
  "industry_id": 1,
  "company_size": "small",
  "gst_number": "27ABCDE1234F1Z5",
  "pan_number": "ABCDE1234F",
  "registration_number": "U12345MH2026PTC123456",
  "website": "https://acme.example.com",
  "default_currency": "INR",
  "default_timezone": "Asia/Kolkata",
  "owner": {
    "first_name": "Sahil",
    "last_name": "Owner",
    "display_name": "Sahil Owner",
    "email": "owner@example.com",
    "mobile": "+919999999999",
    "password": "Password@123",
    "password_confirmation": "Password@123"
  },
  "office": {
    "office_name": "Head Office",
    "address_line_1": "Main Street",
    "address_line_2": "Business Park",
    "landmark": "Near Metro",
    "country_id": 1,
    "state_id": 1,
    "city_id": 1,
    "postal_code": "400001",
    "contact_phone": "+919999999999"
  }
}
```

Response example:

```json
{
  "success": true,
  "message": "Tenant registered.",
  "data": {
    "access_token": "plain_text_token_returned_once",
    "token_type": "Bearer",
    "expires_at": "2026-08-08T12:00:00.000000Z",
    "tenant": {"uuid": "tenant_uuid", "organization_name": "Acme Pvt Ltd", "display_name": "Acme", "organization_code": "ACME", "slug": "acme", "default_currency": "INR", "default_timezone": "Asia/Kolkata", "status": "trial", "trial_ends_at": "2026-08-22T00:00:00.000000Z"},
    "owner": {"uuid": "user_uuid", "display_name": "Sahil Owner", "email": "owner@example.com", "mobile": "+919999999999", "account_type": "owner", "status": "active"},
    "roles": ["owner"],
    "permissions": ["dashboard.view", "role.view"]
  },
  "meta": {"request_id": "{{REQUEST_ID}}"},
  "errors": null
}
```

Error examples:

```json
{"success": false, "message": "Validation failed.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "VALIDATION_ERROR", "details": {"slug": ["The slug has already been taken."], "owner.password": ["The owner.password confirmation does not match."]}}}
```

```json
{"success": false, "message": "Server error.", "data": null, "meta": {"request_id": "{{REQUEST_ID}}"}, "errors": {"code": "SERVER_ERROR", "details": []}}
```

## 1.2 Discover Accounts By Email

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

## 1.3 Login Selected Account

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

## 1.4 Verify Login 2FA Challenge

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

## 1.5 Current Session

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

## 1.6 Logout

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

## 1.7 Password Forgot

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

## 1.8 Password Reset

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


| Method | Endpoint                         | Purpose                              |
| -------- | ---------------------------------- | -------------------------------------- |
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

Example platform token refresh:

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/auth/refresh" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "device_name": "Chrome on Windows"
  }'
```

Request body:

```json
{
  "device_name": "Chrome on Windows"
}
```

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

Example platform 2FA confirm:

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/auth/2fa/confirm" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "code": "123456"
  }'
```

Request body:

```json
{"code": "123456"}
```

Example platform 2FA disable:

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/auth/2fa/disable" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "password": "StrongPassword#123"
  }'
```

Request body:

```json
{"password": "StrongPassword#123"}
```

Example platform password change:

```bash
curl -X PUT "{{BASE_URL}}/api/platform/v1/profile/password" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "current_password": "StrongPassword#123",
    "password": "NewStrongPassword#123",
    "password_confirmation": "NewStrongPassword#123"
  }'
```

Request body:

```json
{
  "current_password": "StrongPassword#123",
  "password": "NewStrongPassword#123",
  "password_confirmation": "NewStrongPassword#123"
}
```

Example platform preferences update:

```bash
curl -X PUT "{{BASE_URL}}/api/platform/v1/settings/preferences" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "preferences": {
      "notifications": {
        "email": true,
        "browser": false
      },
      "ui": {
        "theme": "light"
      }
    }
  }'
```

Request body:

```json
{
  "preferences": {
    "notifications": {
      "email": true,
      "browser": false
    },
    "ui": {
      "theme": "light"
    }
  }
}
```

## 2.2 Platform API Tokens


| Method | Endpoint                          | Purpose                                |
| -------- | ----------------------------------- | ---------------------------------------- |
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


| Method | Endpoint                         | Purpose                              |
| -------- | ---------------------------------- | -------------------------------------- |
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

Example tenant token refresh:

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/auth/refresh" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "device_name": "Chrome on Windows"
  }'
```

Request body:

```json
{
  "device_name": "Chrome on Windows"
}
```

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

Example tenant 2FA enable:

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/auth/2fa/enable" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Example tenant 2FA confirm:

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/auth/2fa/confirm" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "code": "123456"
  }'
```

Request body:

```json
{"code": "123456"}
```

Example tenant 2FA disable:

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/auth/2fa/disable" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "password": "StrongPassword#123"
  }'
```

Request body:

```json
{"password": "StrongPassword#123"}
```

Example tenant password change:

```bash
curl -X PUT "{{BASE_URL}}/api/tenant/v1/profile/password" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "current_password": "StrongPassword#123",
    "password": "NewStrongPassword#123",
    "password_confirmation": "NewStrongPassword#123"
  }'
```

Request body:

```json
{
  "current_password": "StrongPassword#123",
  "password": "NewStrongPassword#123",
  "password_confirmation": "NewStrongPassword#123"
}
```

Example tenant preferences update:

```bash
curl -X PUT "{{BASE_URL}}/api/tenant/v1/profile/preferences" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{
    "preferences": {
      "notifications": {
        "email": true,
        "browser": false
      },
      "ui": {
        "theme": "light"
      }
    }
  }'
```

Request body:

```json
{
  "preferences": {
    "notifications": {
      "email": true,
      "browser": false
    },
    "ui": {
      "theme": "light"
    }
  }
}
```

## 3.2 Tenant API Tokens


| Method | Endpoint                                  | Purpose                                |
| -------- | ------------------------------------------- | ---------------------------------------- |
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

# 4. Platform Admin APIs

Base URL: `/api/platform/v1`

All requests require `Authorization: Bearer {{PLATFORM_TOKEN}}` and the permission listed in `docs/platform-apis.md`.

## 4.1 Dashboard

Implemented endpoints:

```http
GET /dashboard/summary
GET /dashboard/charts
GET /dashboard/recent
GET /dashboard/alerts
POST /dashboard/export
```

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/dashboard/summary" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Response example:

```json
{"success":true,"message":"OK","data":{"tenants":{"total":120,"active":91,"trial":12,"suspended":4,"expired":7},"revenue":{"mrr":"120000.00","arr":"1440000.00","currency":"INR"},"billing":{"overdue_invoice_count":8,"overdue_balance":"45000.00"},"operations":{"open_incidents":2}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 4.2 Platform Staff

Implemented endpoints:

```http
GET /platform-users
POST /platform-users
POST /platform-users/invite
GET /platform-users/{platform_user_uuid}
PUT|PATCH /platform-users/{platform_user_uuid}
DELETE /platform-users/{platform_user_uuid}
POST /platform-users/{platform_user_uuid}/restore
POST /platform-users/{platform_user_uuid}/suspend
POST /platform-users/{platform_user_uuid}/activate
POST /platform-users/{platform_user_uuid}/reset-password
POST /platform-users/{platform_user_uuid}/force-logout
POST /platform-users/{platform_user_uuid}/require-2fa
GET|PUT /platform-users/{platform_user_uuid}/roles
GET|PUT /platform-users/{platform_user_uuid}/permissions
GET /platform-users/{platform_user_uuid}/activity
POST /platform-users/export
```

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/platform-users" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"first_name":"Priya","last_name":"Admin","display_name":"Priya Admin","email":"priya.admin@example.com","password":"Password@123","department":"Support","designation":"Manager","status":"active"}'
```

Response example:

```json
{"success":true,"message":"Platform staff created.","data":{"user":{"uuid":"platform_user_uuid","display_name":"Priya Admin","email":"priya.admin@example.com","status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

Action body examples:

```json
{"role_uuids":["role_uuid"]}
```

```json
{"permission_uuids":["permission_uuid"]}
```

## 4.3 Platform Teams

Implemented endpoints:

```http
GET|POST /platform-teams
GET|PUT|PATCH|DELETE /platform-teams/{team_uuid}
GET|POST /platform-teams/{team_uuid}/members
PUT|PATCH|DELETE /platform-teams/{team_uuid}/members/{member_id}
GET|POST /platform-teams/{team_uuid}/assignments
DELETE /platform-teams/{team_uuid}/assignments/{assignment_id}
GET|POST /platform-team-roles
PUT|PATCH /platform-team-roles/{role_uuid}
```

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/platform-teams" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -d '{"name":"Customer Success","code":"customer-success","description":"Tenant success operations","status":"active"}'

curl -X POST "{{BASE_URL}}/api/platform/v1/platform-team-roles" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -d '{"name":"Implementation Lead","code":"implementation_lead","permissions":["platform_team.view","platform_team.assign"],"status":"active"}'

curl -X PATCH "{{BASE_URL}}/api/platform/v1/platform-team-roles/{role_uuid}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -d '{"name":"Senior Implementation Lead","permissions":["platform_team.view","platform_team.assign"],"status":"active"}'
```

Platform team role create body:

```json
{"name":"Implementation Lead","code":"implementation_lead","permissions":["platform_team.view","platform_team.assign"],"status":"active"}
```

Platform team role update body:

```json
{"name":"Senior Implementation Lead","permissions":["platform_team.view","platform_team.assign"],"status":"active"}
```

Response example:

```json
{"success":true,"message":"Platform team created.","data":{"team":{"uuid":"team_uuid","name":"Customer Success","code":"customer-success","status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 4.4 Platform Tenants

Implemented endpoints:

```http
GET|POST /tenants
GET|PUT|PATCH|DELETE /tenants/{tenant_uuid}
POST /tenants/{tenant_uuid}/restore
POST /tenants/{tenant_uuid}/activate
POST /tenants/{tenant_uuid}/suspend
POST /tenants/{tenant_uuid}/reactivate
POST /tenants/{tenant_uuid}/archive
POST /tenants/{tenant_uuid}/extend-trial
POST /tenants/{tenant_uuid}/impersonate
DELETE /tenants/{tenant_uuid}/impersonate/{session_uuid}
GET /tenants/{tenant_uuid}/{users|offices|subscription|billing|usage|modules|settings|integrations|security|support|files|activity}
PUT /tenants/{tenant_uuid}/modules
```

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/tenants" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"organization_name":"Acme Pvt Ltd","display_name":"Acme","organization_code":"ACME","slug":"acme","plan_uuid":"plan_uuid","owner":{"first_name":"Sahil","last_name":"Owner","email":"owner@example.com","password":"Password@123"},"office":{"office_name":"Head Office","address_line_1":"Main Street"},"trial_days":14}'
```

Response example:

```json
{"success":true,"message":"Tenant created.","data":{"tenant":{"uuid":"tenant_uuid","organization_name":"Acme Pvt Ltd","slug":"acme","status":"trial"},"owner":{"uuid":"user_uuid","email":"owner@example.com"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

Lifecycle body examples:

```json
{"reason":"Payment overdue","notify_owner":true,"suspended_until":null}
```

```json
{"trial_ends_at":"2026-09-30T00:00:00Z","reason":"Sales-approved extension"}
```

Remote login body:

```json
{"reason":"Debug billing setup with customer approval","duration_minutes":30,"target_user_uuid":"user_uuid"}
```

Module overrides body:

```json
{"modules":[{"module_code":"crm","enabled":true,"limits":{"users":25},"metadata":{"source":"platform_admin"}}]}
```

Common error examples:

```json
{"success":false,"message":"Missing permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"PERMISSION_DENIED","details":{}}}
```

```json
{"success":false,"message":"Validation failed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"VALIDATION_ERROR","details":{"reason":["The reason field is required."]}}}
```

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

---

---

# 5. Implemented Platform RBAC APIs

Base URL: `/api/platform/v1`

Headers for all platform RBAC APIs:

```http
Authorization: Bearer {{PLATFORM_TOKEN}}
Accept: application/json
Content-Type: application/json
X-Request-Id: {{REQUEST_ID}}
```

## 5.1 Platform Roles

### List roles

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/roles?page=1&per_page=25&search=billing&filter[status]=active&filter[type]=custom&filter[guard_name]=platform" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":[{"uuid":"role_uuid","name":"billing_manager","display_name":"Billing Manager","guard_name":"platform","description":"Billing access.","is_system":false,"status":"active","permissions_count":3,"users_count":2}],"meta":{"request_id":"{{REQUEST_ID}}","pagination":{"current_page":1,"per_page":25,"total":1}},"errors":null}
```

### Create role

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/access-control/roles" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"name":"billing_manager_custom","display_name":"Billing Manager Custom","guard_name":"platform","description":"Billing access.","status":"active","is_system":false,"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Initial role setup"}'
```

Request body:

```json
{"name":"billing_manager_custom","display_name":"Billing Manager Custom","guard_name":"platform","description":"Billing access.","status":"active","is_system":false,"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Initial role setup"}
```

Response example:

```json
{"success":true,"message":"Role created.","data":{"role":{"uuid":"role_uuid","name":"billing_manager_custom","display_name":"Billing Manager Custom","guard_name":"platform","status":"active","permissions":{"billing":[{"uuid":"permission_uuid_1","module":"billing","name":"billing.invoice.view","display_name":"Billing Invoice View"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### View role

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"role":{"uuid":"role_uuid","name":"billing_manager_custom","permissions_count":2,"users_count":1,"permissions":{"billing":[{"uuid":"permission_uuid_1","name":"billing.invoice.view"}]},"users":[{"uuid":"platform_user_uuid","display_name":"Sahil Admin","email":"admin@example.com","department":"Billing","status":"active"}]}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Update role

```bash
curl -X PATCH "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"display_name":"Billing Operations Manager","description":"Updated billing access.","status":"active","permission_ids":["permission_uuid_1"],"audit_reason":"Quarterly access review"}'
```

Request body:

```json
{"display_name":"Billing Operations Manager","description":"Updated billing access.","status":"active","permission_ids":["permission_uuid_1"],"audit_reason":"Quarterly access review"}
```

Response example:

```json
{"success":true,"message":"Role updated.","data":{"role":{"uuid":"role_uuid","display_name":"Billing Operations Manager","status":"active","permissions":{"billing":[{"uuid":"permission_uuid_1","name":"billing.invoice.view"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Delete role

```bash
curl -X DELETE "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"Role retired"}'
```

Request body:

```json
{"audit_reason":"Role retired"}
```

Response example:

```json
{"success":true,"message":"Role deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Clone role

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/clone" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"name":"billing_manager_copy","display_name":"Billing Manager Copy","copy_permissions":true,"copy_description":true,"status":"inactive","audit_reason":"Create restricted clone"}'
```

Request body:

```json
{"name":"billing_manager_copy","display_name":"Billing Manager Copy","copy_permissions":true,"copy_description":true,"status":"inactive","audit_reason":"Create restricted clone"}
```

Response example:

```json
{"success":true,"message":"Role cloned.","data":{"role":{"uuid":"new_role_uuid","name":"billing_manager_copy","display_name":"Billing Manager Copy","status":"inactive","permissions":{"billing":[{"uuid":"permission_uuid_1","name":"billing.invoice.view"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Activate role

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/activate" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"Access restored"}'
```

Request body:

```json
{"audit_reason":"Access restored"}
```

Response example:

```json
{"success":true,"message":"Role active.","data":{"role":{"uuid":"role_uuid","status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Deactivate role

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/deactivate" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"Temporary access freeze"}'
```

Request body:

```json
{"audit_reason":"Temporary access freeze"}
```

Response example:

```json
{"success":true,"message":"Role inactive.","data":{"role":{"uuid":"role_uuid","status":"inactive"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### List role permissions

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/permissions" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"permissions":{"billing":[{"uuid":"permission_uuid_1","module":"billing","name":"billing.invoice.view","display_name":"Billing Invoice View","guard_name":"platform","is_system":true,"status":"active"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Replace role permissions

```bash
curl -X PUT "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/permissions" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Quarterly access review"}'
```

Request body:

```json
{"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Quarterly access review"}
```

Response example:

```json
{"success":true,"message":"Role permissions updated.","data":{"role":{"uuid":"role_uuid","permissions":{"billing":[{"uuid":"permission_uuid_1","name":"billing.invoice.view"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### List role users

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/users" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"users":[{"uuid":"platform_user_uuid","display_name":"Sahil Admin","email":"admin@example.com","department":"Billing","status":"active"}]},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Assign role users

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/users" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"platform_user_ids":["platform_user_uuid_1","platform_user_uuid_2"],"audit_reason":"Billing team assignment"}'
```

Request body:

```json
{"platform_user_ids":["platform_user_uuid_1","platform_user_uuid_2"],"audit_reason":"Billing team assignment"}
```

Response example:

```json
{"success":true,"message":"Users assigned.","data":{"users":2},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Remove role user

```bash
curl -X DELETE "{{BASE_URL}}/api/platform/v1/access-control/roles/{role_uuid}/users/{platform_user_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"User moved teams"}'
```

Request body:

```json
{"audit_reason":"User moved teams"}
```

Response example:

```json
{"success":true,"message":"User removed from role.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 5.2 Platform Permissions

### List permissions

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/permissions?page=1&per_page=50&search=billing&filter[module]=billing&filter[status]=active&filter[guard_name]=platform" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":[{"uuid":"permission_uuid","module":"billing","name":"billing.invoice.view","display_name":"Billing Invoice View","guard_name":"platform","description":"Billing Invoice View","is_system":true,"status":"active","roles_count":2}],"meta":{"request_id":"{{REQUEST_ID}}","pagination":{"current_page":1,"per_page":50,"total":1}},"errors":null}
```

### Create permission

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/access-control/permissions" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"module":"billing","name":"billing.adjustment.create","display_name":"Create Billing Adjustment","description":"Allows creating billing adjustments.","guard_name":"platform","is_system":false,"status":"active"}'
```

Request body:

```json
{"module":"billing","name":"billing.adjustment.create","display_name":"Create Billing Adjustment","description":"Allows creating billing adjustments.","guard_name":"platform","is_system":false,"status":"active"}
```

Response example:

```json
{"success":true,"message":"Permission created.","data":{"permission":{"uuid":"permission_uuid","module":"billing","name":"billing.adjustment.create","display_name":"Create Billing Adjustment","guard_name":"platform","is_system":false,"status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Grouped permissions

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/permissions/grouped" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"permissions":{"billing":[{"uuid":"permission_uuid","module":"billing","name":"billing.payment.view","display_name":"Billing Payment View","guard_name":"platform","status":"active"}]}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### View permission

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/access-control/permissions/{permission_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"permission":{"uuid":"permission_uuid","module":"billing","name":"billing.payment.view","display_name":"Billing Payment View","guard_name":"platform","is_system":true,"status":"active","roles_count":2}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Update permission

```bash
curl -X PATCH "{{BASE_URL}}/api/platform/v1/access-control/permissions/{permission_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"display_name":"Create Billing Adjustment","description":"Updated description.","status":"active"}'
```

Request body:

```json
{"display_name":"Create Billing Adjustment","description":"Updated description.","status":"active"}
```

Response example:

```json
{"success":true,"message":"Permission updated.","data":{"permission":{"uuid":"permission_uuid","display_name":"Create Billing Adjustment","status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Delete permission

```bash
curl -X DELETE "{{BASE_URL}}/api/platform/v1/access-control/permissions/{permission_uuid}" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"Permission deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 5.3 Platform RBAC Errors

Missing platform permission:

```json
{"success":false,"message":"Missing platform permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"PLATFORM_PERMISSION_DENIED","details":{"permissions":["platform_role.edit"]}}}
```

System role delete blocked:

```json
{"success":false,"message":"System roles cannot be deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"SYSTEM_ROLE_DELETE_FORBIDDEN","details":[]}}
```

System role rename blocked:

```json
{"success":false,"message":"System roles cannot be renamed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"SYSTEM_ROLE_RENAME_FORBIDDEN","details":[]}}
```

Role in use:

```json
{"success":false,"message":"Assigned roles cannot be deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"ROLE_IN_USE","details":[]}}
```

System permission delete blocked:

```json
{"success":false,"message":"System permissions cannot be deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"SYSTEM_PERMISSION_DELETE_FORBIDDEN","details":[]}}
```

Permission in use:

```json
{"success":false,"message":"Assigned permissions cannot be deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"PERMISSION_IN_USE","details":[]}}
```

Validation error:

```json
{"success":false,"message":"Validation failed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"VALIDATION_ERROR","details":{"name":["The name has already been taken."]}}}
```

Not found:

```json
{"success":false,"message":"Resource not found.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"NOT_FOUND","details":[]}}
```

---

# 6. Implemented Tenant RBAC APIs

Base URL: `/api/tenant/v1`

Headers for all tenant RBAC APIs:

```http
Authorization: Bearer {{TENANT_TOKEN}}
Accept: application/json
Content-Type: application/json
X-Tenant: {{TENANT}}
X-Request-Id: {{REQUEST_ID}}
```

Tenant roles are tenant-scoped. Tenant user role pivots include `tenant_id`.

## 6.1 Tenant Roles

### List roles

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/roles?page=1&per_page=25&search=project&filter[status]=active&filter[guard_name]=tenant" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":[{"uuid":"role_uuid","tenant_id":1,"name":"project_manager","display_name":"Project Manager","guard_name":"tenant","is_system":true,"status":"active","permissions_count":8,"users_count":3}],"meta":{"request_id":"{{REQUEST_ID}}","pagination":{"current_page":1,"per_page":25,"total":1}},"errors":null}
```

### Create role

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/access-control/roles" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"name":"project_manager_custom","display_name":"Project Manager Custom","guard_name":"tenant","description":"Project access.","status":"active","is_system":false,"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Initial role setup"}'
```

Request body:

```json
{"name":"project_manager_custom","display_name":"Project Manager Custom","guard_name":"tenant","description":"Project access.","status":"active","is_system":false,"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Initial role setup"}
```

Response example:

```json
{"success":true,"message":"Role created.","data":{"role":{"uuid":"role_uuid","tenant_id":1,"name":"project_manager_custom","display_name":"Project Manager Custom","status":"active","permissions":{"project":[{"uuid":"permission_uuid_1","module":"project","name":"project.view","display_name":"Project View"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### View role

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"role":{"uuid":"role_uuid","tenant_id":1,"name":"project_manager_custom","permissions_count":2,"users_count":1,"permissions":{"project":[{"uuid":"permission_uuid_1","module":"project","name":"project.view","display_name":"Project View"}]},"users":[{"uuid":"user_uuid","display_name":"Sahil Owner","email":"owner@example.com","account_type":"owner","status":"active"}]}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Update role

```bash
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"display_name":"Project Operations Manager","description":"Updated project access.","status":"active","permission_ids":["permission_uuid_1"],"audit_reason":"Quarterly access review"}'
```

Request body:

```json
{"display_name":"Project Operations Manager","description":"Updated project access.","status":"active","permission_ids":["permission_uuid_1"],"audit_reason":"Quarterly access review"}
```

Response example:

```json
{"success":true,"message":"Role updated.","data":{"role":{"uuid":"role_uuid","tenant_id":1,"display_name":"Project Operations Manager","status":"active","permissions":{"project":[{"uuid":"permission_uuid_1","name":"project.view"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Delete role

```bash
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"Role retired"}'
```

Request body:

```json
{"audit_reason":"Role retired"}
```

Response example:

```json
{"success":true,"message":"Role deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Clone role

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/clone" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"name":"project_manager_copy","display_name":"Project Manager Copy","copy_permissions":true,"copy_description":true,"status":"inactive","audit_reason":"Create restricted clone"}'
```

Request body:

```json
{"name":"project_manager_copy","display_name":"Project Manager Copy","copy_permissions":true,"copy_description":true,"status":"inactive","audit_reason":"Create restricted clone"}
```

Response example:

```json
{"success":true,"message":"Role cloned.","data":{"role":{"uuid":"new_role_uuid","tenant_id":1,"name":"project_manager_copy","display_name":"Project Manager Copy","status":"inactive","permissions":{"project":[{"uuid":"permission_uuid_1","name":"project.view"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Activate role

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/activate" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"Access restored"}'
```

Request body:

```json
{"audit_reason":"Access restored"}
```

Response example:

```json
{"success":true,"message":"Role active.","data":{"role":{"uuid":"role_uuid","tenant_id":1,"status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Deactivate role

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/deactivate" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"Temporary access freeze"}'
```

Request body:

```json
{"audit_reason":"Temporary access freeze"}
```

Response example:

```json
{"success":true,"message":"Role inactive.","data":{"role":{"uuid":"role_uuid","tenant_id":1,"status":"inactive"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### List role permissions

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/permissions" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"permissions":{"project":[{"uuid":"permission_uuid_1","module":"project","name":"project.view","display_name":"Project View","guard_name":"tenant","is_system":true,"status":"active"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Replace role permissions

```bash
curl -X PUT "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/permissions" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Quarterly access review"}'
```

Request body:

```json
{"permission_ids":["permission_uuid_1","permission_uuid_2"],"audit_reason":"Quarterly access review"}
```

Response example:

```json
{"success":true,"message":"Role permissions updated.","data":{"role":{"uuid":"role_uuid","tenant_id":1,"permissions":{"project":[{"uuid":"permission_uuid_1","name":"project.view"}]}}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### List role users

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/users" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"users":[{"uuid":"user_uuid","display_name":"Sahil Owner","email":"owner@example.com","account_type":"owner","status":"active"}]},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Assign role users

```bash
curl -X POST "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/users" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"user_ids":["user_uuid_1","user_uuid_2"],"audit_reason":"Project team access"}'
```

Request body:

```json
{"user_ids":["user_uuid_1","user_uuid_2"],"audit_reason":"Project team access"}
```

Response example:

```json
{"success":true,"message":"Users assigned.","data":{"users":2},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Remove role user

```bash
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/access-control/roles/{role_uuid}/users/{user_uuid}" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"audit_reason":"User moved teams"}'
```

Request body:

```json
{"audit_reason":"User moved teams"}
```

Response example:

```json
{"success":true,"message":"User removed from role.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 6.2 Tenant Permissions

### List permissions

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/permissions?page=1&per_page=50&search=project&filter[module]=project&filter[status]=active&filter[guard_name]=tenant" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":[{"uuid":"permission_uuid","module":"project","name":"project.view","display_name":"Project View","guard_name":"tenant","description":"Project View","is_system":true,"status":"active","roles_count":3}],"meta":{"request_id":"{{REQUEST_ID}}","pagination":{"current_page":1,"per_page":50,"total":1}},"errors":null}
```

### Grouped permissions

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/permissions/grouped" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"permissions":{"project":[{"uuid":"permission_uuid","module":"project","name":"project.view","display_name":"Project View","guard_name":"tenant","status":"active"}]}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### View permission

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/access-control/permissions/{permission_uuid}" \
  -H "Authorization: Bearer {{TENANT_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Tenant: {{TENANT}}" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none

Response example:

```json
{"success":true,"message":"OK","data":{"permission":{"uuid":"permission_uuid","module":"project","name":"project.view","display_name":"Project View","guard_name":"tenant","is_system":true,"status":"active","roles_count":3}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 6.3 Tenant RBAC Errors

Missing tenant permission:

```json
{"success":false,"message":"Missing tenant permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"TENANT_PERMISSION_DENIED","details":{"permissions":["role.edit"]}}}
```

System role delete blocked:

```json
{"success":false,"message":"System roles cannot be deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"SYSTEM_ROLE_DELETE_FORBIDDEN","details":[]}}
```

System role rename blocked:

```json
{"success":false,"message":"System roles cannot be renamed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"SYSTEM_ROLE_RENAME_FORBIDDEN","details":[]}}
```

Final tenant owner/admin blocked:

```json
{"success":false,"message":"Cannot remove the final owner/admin role from this tenant.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"FINAL_OWNER_ADMIN_ROLE_REQUIRED","details":[]}}
```

Role in use:

```json
{"success":false,"message":"Assigned roles cannot be deleted.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"ROLE_IN_USE","details":[]}}
```

Tenant token mismatch:

```json
{"success":false,"message":"Token does not belong to this tenant.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"TENANT_TOKEN_MISMATCH","details":[]}}
```

Validation error:

```json
{"success":false,"message":"Validation failed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"VALIDATION_ERROR","details":{"name":["The name has already been taken."]}}}
```

Not found:

```json
{"success":false,"message":"Resource not found.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"NOT_FOUND","details":[]}}
```

---

# 7. Platform SaaS Billing and Catalog APIs

All endpoints require a platform token and platform permission middleware. Financial mutations also require `Idempotency-Key`.

Common platform headers:

```http
Authorization: Bearer {{PLATFORM_TOKEN}}
Accept: application/json
Content-Type: application/json
X-Request-Id: {{REQUEST_ID}}
Idempotency-Key: {{REQUEST_ID}}-billing-action
```

## 7.1 Plans

### List plans

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/plans?page=1&per_page=25&status=active&search=growth" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}"
```

Request body: none.

Response example:

```json
{"success":true,"message":"OK","data":[{"uuid":"plan_uuid","name":"Growth","code":"growth","billing_cycle":"monthly","base_price":"2999.00","currency":"INR","status":"active"}],"meta":{"request_id":"{{REQUEST_ID}}","pagination":{"current_page":1,"per_page":25,"total":1}},"errors":null}
```

### Create plan

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/plans" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -d '{"name":"Scale","code":"scale","description":"Scale plan","billing_cycle":"monthly","base_price":"4999.00","currency":"INR","trial_days":14,"is_custom":false,"is_public":true,"status":"active"}'
```

Request body:

```json
{"name":"Scale","code":"scale","description":"Scale plan","billing_cycle":"monthly","base_price":"4999.00","currency":"INR","trial_days":14,"is_custom":false,"is_public":true,"status":"active"}
```

Response example:

```json
{"success":true,"message":"Plan created.","data":{"plan":{"uuid":"plan_uuid","name":"Scale","code":"scale","status":"active"}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### View, update, archive, clone, features, subscriptions

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"base_price":"5999.00","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}/clone" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"name":"Scale Copy","code":"scale_copy","status":"inactive"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}/features" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PUT "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}/features" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"features":[{"feature_uuid":"feature_uuid","value":"25","metadata":{"source":"contract"}}]}'
curl -X GET "{{BASE_URL}}/api/platform/v1/plans/{plan_uuid}/subscriptions" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/plans/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
```

Response examples: view returns `data.plan`, `data.features`, and `data.subscription_count`; update/clone return `data.plan`; archive returns `data:null`; feature replacement returns `data.features`; export returns `data.export.status=queued`.

## 7.2 Features and Add-on Plans

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/features?module=projects&status=active" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/features" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"module":"projects","name":"Project Limit","code":"projects.limit","data_type":"integer","unit":"projects","description":"Maximum active projects","status":"active"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/features/{feature_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/features/{feature_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"name":"Project Limit","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/features/{feature_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/addons?status=active" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/addons" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"name":"Extra 10 Users","code":"extra_10_users","pricing_type":"recurring","price":"499.00","currency":"INR","status":"active"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/addons/{addon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/addons/{addon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"price":"699.00","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/addons/{addon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
```

Feature create response returns `data.feature`; add-on create/update/view returns `data.addon`; delete/archive responses return `data:null`.

## 7.3 Subscriptions

### Create subscription

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions" \
  -H "Authorization: Bearer {{PLATFORM_TOKEN}}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: {{REQUEST_ID}}" \
  -H "Idempotency-Key: {{REQUEST_ID}}-sub-create" \
  -d '{"tenant_id":"tenant_uuid","plan_id":"plan_uuid","type":"paid","billing_cycle":"yearly","status":"active","renewal_type":"automatic","starts_at":"2026-08-08T00:00:00Z","expires_at":"2027-08-07T23:59:59Z","currency":"INR","auto_renew":true,"notes":"Annual contract"}'
```

Request body: same as `-d` JSON above.

Response example:

```json
{"success":true,"message":"Subscription created.","data":{"subscription":{"uuid":"subscription_uuid","subscription_number":"SUB-ABC123","status":"active","current_version":1}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

### Subscription lifecycle and history

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/subscriptions?status=active&tenant_uuid=tenant_uuid" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-sub-update" -d '{"auto_renew":false,"notes":"Manual renewal"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/upgrade" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-upgrade" -d '{"new_plan_id":"plan_uuid","effective_at":"2026-08-08T00:00:00Z","proration":"immediate","billing_cycle":"yearly","reason":"Customer upgrade"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/downgrade" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-downgrade" -d '{"new_plan_id":"plan_uuid","reason":"Customer downgrade"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/renew" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-renew" -d '{"renewal_expires_at":"2028-08-07T23:59:59Z","amount":"120000.00","currency":"INR","create_invoice":true,"notes":"Manual renewal"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/pause" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-pause"
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/resume" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-resume"
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/cancel" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-cancel" -d '{"reason":"Customer requested cancellation"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/usage" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/history" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
```

Lifecycle responses return `data.subscription`; usage returns `data.usage`; history returns immutable `data.versions` and `data.renewals`.

### Subscription add-ons, coupons, invoice

```bash
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/addons" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-addon-add" -d '{"addon_plan_id":"addon_uuid","quantity":5,"unit_price":"499.00","starts_at":"2026-08-08T00:00:00Z","status":"active"}'
curl -X PATCH "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/addons/{addon_id}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-addon-update" -d '{"quantity":10,"status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/addons/{addon_id}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-addon-remove"
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/apply-coupon" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-coupon-apply" -d '{"coupon_code":"YEARLY20"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/coupons/{coupon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-coupon-remove"
curl -X POST "{{BASE_URL}}/api/platform/v1/subscriptions/{subscription_uuid}/invoice" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-sub-invoice"
```

## 7.4 Platform Billing: Invoices, Payments, Refunds

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/invoices?status=draft&overdue=0" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/invoices" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-invoice-create" -d '{"tenant_id":"tenant_uuid","subscription_id":"subscription_uuid","invoice_date":"2026-08-08","due_date":"2026-08-23","currency":"INR","status":"draft","discount_amount":"0.00","tax_amount":"899.82","items":[{"item_type":"plan","description":"Growth plan - August 2026","quantity":"1.00","unit_price":"4999.00","amount":"4999.00","metadata":{}}]}'
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/invoices/{invoice_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/billing/invoices/{invoice_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-invoice-update" -d '{"due_date":"2026-08-30","tax_amount":"900.00"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/billing/invoices/{invoice_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-invoice-cancel"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/invoices/{invoice_uuid}/send" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"to":["owner@tenant.example"],"cc":[],"message":"Please find your invoice attached."}'
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/invoices/{invoice_uuid}/pdf" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/invoices/{invoice_uuid}/payments" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-invoice-payment" -d '{"gateway":"razorpay","gateway_payment_id":"pay_123","payment_method":"card","amount":"5898.82","currency":"INR","payment_status":"success","paid_at":"2026-08-08T10:00:00Z","raw_response":{"token":"secret-token","status":"captured"}}'
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/invoices/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
```

Invoice create response returns `data.invoice` and `data.items`. PDF response returns file metadata only, never raw storage path.

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/payments?payment_status=success" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/payments" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-payment-record" -d '{"tenant_id":"tenant_uuid","platform_invoice_id":"invoice_uuid","subscription_id":"subscription_uuid","gateway":"razorpay","gateway_payment_id":"pay_123","payment_method":"card","amount":"5898.82","currency":"INR","payment_status":"success","paid_at":"2026-08-08T10:00:00Z","raw_response":{"secret":"masked in response"}}'
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/payments/{payment_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/payments/{payment_uuid}/retry" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-payment-retry"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/payments/{payment_uuid}/reconcile" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-payment-reconcile"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/payments/{payment_uuid}/refund" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-payment-refund" -d '{"amount":"1000.00","currency":"INR","reason":"Duplicate payment","gateway":"razorpay"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/payments/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/refunds" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/refunds" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-refund-create" -d '{"platform_payment_id":"payment_uuid","amount":"1000.00","currency":"INR","reason":"Duplicate payment","gateway":"razorpay"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/billing/refunds/{refund_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/refunds/{refund_uuid}/retry" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -H "Idempotency-Key: {{REQUEST_ID}}-refund-retry"
curl -X POST "{{BASE_URL}}/api/platform/v1/billing/refunds/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
```

Payment and refund responses mask gateway `raw_response` secrets as `[masked]`.

## 7.5 Coupons

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/coupons?status=active&discount_type=percent" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/coupons" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"code":"YEARLY20","name":"Yearly 20%","discount_type":"percent","discount_value":"20.00","starts_at":"2026-08-08T00:00:00Z","expires_at":"2026-12-31T23:59:59Z","max_redemptions":100,"status":"active","plan_uuids":["plan_uuid"],"tenant_uuids":["tenant_uuid"]}'
curl -X GET "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"name":"Yearly 20% Updated","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}/activate" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}/deactivate" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}/redemptions" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PUT "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}/plans" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"plan_uuids":["plan_uuid"]}'
curl -X PUT "{{BASE_URL}}/api/platform/v1/coupons/{coupon_uuid}/tenants" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"tenant_uuids":["tenant_uuid"]}'
curl -X POST "{{BASE_URL}}/api/platform/v1/coupons/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
```

## 7.6 Modules and Feature Controls

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/modules?status=active" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/modules" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"name":"Projects","code":"projects","description":"Project management","icon":"briefcase","category":"operations","is_core":true,"status":"active","sort_order":10}'
curl -X GET "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"description":"Updated module"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}/enable" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X POST "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}/disable" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}/features" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PUT "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}/features" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"feature_uuids":["feature_uuid"]}'
curl -X GET "{{BASE_URL}}/api/platform/v1/modules/{module_uuid}/tenants" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X GET "{{BASE_URL}}/api/platform/v1/tenants/{tenant_uuid}/module-entitlements" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}"
curl -X PUT "{{BASE_URL}}/api/platform/v1/tenants/{tenant_uuid}/modules/{module_code}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -H "X-Request-Id: {{REQUEST_ID}}" -d '{"enabled":true,"limits":{"users":25},"metadata":{"reason":"Enterprise override"},"reason":"Custom agreement"}'
```

## 7.7 Billing and Catalog Errors

Missing idempotency key on financial mutations:

```json
{"success":false,"message":"Idempotency-Key header is required for this financial mutation.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"IDEMPOTENCY_KEY_REQUIRED","details":[]}}
```

Reused idempotency key with different body:

```json
{"success":false,"message":"Idempotency-Key was already used with different request data.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"IDEMPOTENCY_KEY_CONFLICT","details":[]}}
```

Validation error:

```json
{"success":false,"message":"Validation failed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"VALIDATION_ERROR","details":{"name":["The name field is required."]}}}
```

Missing permission:

```json
{"success":false,"message":"Missing permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"PERMISSION_DENIED","details":{"permissions":["billing.invoice.create"]}}}
```

Not found:

```json
{"success":false,"message":"Resource not found.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"NOT_FOUND","details":[]}}
```

Invoice not draft:

```json
{"success":false,"message":"Only draft invoices can be updated.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"INVOICE_NOT_DRAFT","details":[]}}
```

---

# 8. Remaining Platform Admin APIs

All endpoints require:

```http
Authorization: Bearer {{PLATFORM_TOKEN}}
Accept: application/json
Content-Type: application/json
X-Request-Id: {{REQUEST_ID}}
```

For retry endpoints also send:

```http
Idempotency-Key: {{REQUEST_ID}}-retry
```

## 8.1 Support

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/support/tickets?status=open&priority=high" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"tenant_uuid":"tenant_uuid","subject":"Invoice not generated","description":"July invoice missing","priority":"high","category":"billing","source":"platform","assigned_to_uuid":"platform_user_uuid"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"priority":"urgent","status":"pending"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}/assign" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"assigned_to_uuid":"platform_user_uuid","audit_reason":"Escalated"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}/comments" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"comment":"Checked billing worker.","is_internal":true}'
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}/attachments" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"file_uuid":"file_uuid"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}/close" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"notes":"Resolved"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets/{ticket_uuid}/reopen" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/tickets/export" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
```

Response examples return `data.ticket`, `data.comment`, `data.attachments`, or `data.export` with the standard envelope.

Knowledge base:

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/support/knowledge-base/categories" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/knowledge-base/categories" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Billing","slug":"billing","audience":"all","status":"active"}'
curl -X PATCH "{{BASE_URL}}/api/platform/v1/support/knowledge-base/categories/{category_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Billing Help"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles?status=draft" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"category_uuid":"category_uuid","title":"How billing works","slug":"how-billing-works","body":"Article body","audience":"all","status":"draft"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles/{article_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles/{article_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"body":"Updated body"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles/{article_uuid}/publish" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles/{article_uuid}/unpublish" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/knowledge-base/articles/{article_uuid}/archive" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
```

Remote login sessions:

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/support/remote-login-sessions" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/support/remote-login-sessions/{session_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/support/remote-login-sessions/{session_uuid}/end" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
```

## 8.2 Reports and Monitoring

Reports:

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/reports/tenant-status" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/reports/revenue" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/reports/invoice-aging" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/reports/revenue/export?date_from=2026-08-01&date_to=2026-08-31" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/reports/export-jobs" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/reports/export-jobs/{job_uuid}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
```

Supported report codes: `tenant-status`, `plan-performance`, `revenue`, `invoice-aging`, `payment-failures`, `coupon-usage`, `tenant-usage`, `support-sla`, `security-events`.

Monitoring:

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/services" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/services/{service_code}/logs" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/api-request-logs" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/queue-jobs?status=failed" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/monitoring/queue-jobs/{job_id}/retry" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X DELETE "{{BASE_URL}}/api/platform/v1/monitoring/queue-jobs/{job_id}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/scheduler-logs" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/alerts?status=open" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/monitoring/alerts/{alert_id}/resolve" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"notes":"Queue recovered"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/incidents" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/monitoring/incidents" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"title":"Billing worker delayed","severity":"high","summary":"Invoice queue delayed"}'
curl -X PATCH "{{BASE_URL}}/api/platform/v1/monitoring/incidents/{incident_id}" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"status":"investigating"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/monitoring/incidents/{incident_id}/resolve" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"notes":"Worker scaled"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/monitoring/tenant-usage-snapshots" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
```

## 8.3 Integrations, Settings, Audit, Missing Pages

Integration credentials are write-only and encrypted. Payload responses mask sensitive keys.

```bash
curl -X GET "{{BASE_URL}}/api/platform/v1/integrations/providers" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/integrations/providers" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Stripe","code":"stripe","category":"payment_gateway","auth_type":"api_key","metadata":{"secret":"masked"}}'
curl -X GET "{{BASE_URL}}/api/platform/v1/integrations/tenant-integrations?tenant_uuid=tenant_uuid" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/integrations/tenant-integrations" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"tenant_uuid":"tenant_uuid","provider_code":"stripe","name":"Stripe Live","credentials":{"api_key":"sk_live_xxx"}}'
curl -X POST "{{BASE_URL}}/api/platform/v1/integrations/tenant-integrations/{integration_uuid}/credentials" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"credentials":{"api_key":"new_secret"}}'
curl -X POST "{{BASE_URL}}/api/platform/v1/integrations/webhook-logs/{log_id}/retry" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Idempotency-Key: {{REQUEST_ID}}-webhook-retry" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/settings/platform" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X PUT "{{BASE_URL}}/api/platform/v1/settings/platform" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"settings":{"billing":{"invoice_prefix":"INV"},"trials":{"trial_days":14}}}'
curl -X POST "{{BASE_URL}}/api/platform/v1/settings/backups/run" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"backup_type":"manual"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/audit/activity-logs" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/platform/v1/audit/security-events" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/audit/security-events/{event_id}/review" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"status":"reviewed","notes":"Expected admin action"}'
curl -X GET "{{BASE_URL}}/api/platform/v1/onboarding/tenants" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X PUT "{{BASE_URL}}/api/platform/v1/onboarding/tenants/{tenant_uuid}/steps/profile" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"status":"completed","metadata":{"source":"admin"}}'
curl -X GET "{{BASE_URL}}/api/platform/v1/trials" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/trials/{tenant_uuid}/convert" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/platform/v1/legal/documents" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"document_type":"terms","title":"Terms","version":"1.0","content":"Terms body"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/announcements" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"title":"Maintenance","body":"Billing services maintenance","audience":"all"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/webhook-endpoints" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"tenant_uuid":"tenant_uuid","name":"Tenant Webhook","url":"https://tenant.example/webhook","events":["invoice.paid"],"secret":"write-only"}'
curl -X POST "{{BASE_URL}}/api/platform/v1/webhook-deliveries/{delivery_uuid}/retry" -H "Authorization: Bearer {{PLATFORM_TOKEN}}" -H "Accept: application/json"
```

Common errors:

```json
{"success":false,"message":"Unauthenticated.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"AUTHENTICATION_REQUIRED","details":[]}}
```

```json
{"success":false,"message":"Missing permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"PERMISSION_DENIED","details":{"permissions":["monitoring.manage"]}}}
```

```json
{"success":false,"message":"Validation failed.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"VALIDATION_ERROR","details":{"notes":["The notes field is required."]}}}
```


# 9. Tenant Dashboard, Teams, Users, and Staff APIs

Use `Authorization: Bearer {{TENANT_TOKEN}}`, `Accept: application/json`, and `X-Tenant: {{TENANT_SLUG}}` or your configured tenant resolver headers/domain.

## 9.1 Dashboard and Widget Preferences

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/navigation/sidebar" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/summary" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/charts/leads-pipeline" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/charts/projects" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/charts/tasks" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/charts/revenue" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/charts/attendance" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/charts/support" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/my-tasks" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/upcoming-events" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/recent-leads" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/overdue-invoices" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/recent-activities" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/dashboard/widgets" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PUT "{{BASE_URL}}/api/tenant/v1/dashboard/widgets" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"widgets":[{"code":"my_tasks","position":1,"visible":true,"settings":{"limit":10}},{"code":"calendar","position":2,"visible":true}]}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/dashboard/export" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv","widgets":["summary","revenue"]}'
```

Success example:

```json
{"success":true,"message":"OK","data":{"summary":{"leads":0,"clients":0,"staff_count":1}},"meta":{"request_id":"{{REQUEST_ID}}"},"errors":null}
```

## 9.2 Tenant Teams and Team Roles

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/team-roles" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/team-roles" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Delivery Lead","code":"delivery_lead","permissions":["project.view"],"status":"active"}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/team-roles/{team_role_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"description":"Can lead delivery assignments"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/team-roles/{team_role_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/teams?filter[status]=active" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/teams" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Sales Team","code":"sales","department_id":"department_uuid","office_id":"office_uuid","lead_user_id":"user_uuid","visibility":"tenant","status":"active"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"color":"#2563eb","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/members" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/members" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"members":[{"user_id":"user_uuid","staff_id":"staff_uuid","team_role_id":"team_role_uuid","member_type":"primary","allocation_percent":100,"is_primary":true,"effective_from":"2026-08-06","status":"active"}]}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/members/{member_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"allocation_percent":50,"status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/members/{member_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/permissions" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PUT "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/permissions" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"permission_ids":["permission_uuid"]}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/settings" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PUT "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/settings" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"settings":[{"group":"notifications","key":"daily_digest","value":true}]}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/assignments" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/assignments" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"assignable_type":"project","assignable_id":"project_uuid","assignment_role":"delivery_owner","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/teams/{team_uuid}/assignments/{assignment_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/teams/export" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv","filters":{"status":"active"}}'
```

## 9.3 Tenant Login Users

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/users?filter[status]=active" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/users/invite" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"first_name":"Asha","last_name":"Patel","email":"asha@example.com","staff_id":"staff_uuid","account_type":"staff","role_ids":["role_uuid"]}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/users/{user_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/users/{user_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"mobile":"+919999999999","status":"active"}'
curl -X PUT "{{BASE_URL}}/api/tenant/v1/users/{user_uuid}/roles" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"role_ids":["role_uuid"]}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/users/{user_uuid}/suspend" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/users/{user_uuid}/activate" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/users/{user_uuid}/reset-password" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
```

## 9.4 Staff and Child Resources

Bank and salary routes require `staff.manage_bank` and `staff.manage_salary`; bank responses only expose `account_number_masked`.

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/dashboard" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/grid" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"employee_code":"EMP0001","first_name":"Sahil","last_name":"Khan","display_name":"Sahil Khan","work_email":"sahil@example.com","joining_date":"2026-08-06","department_id":"department_uuid","designation_id":"designation_uuid","office_id":"office_uuid","primary_team_id":"team_uuid","employment_type":"full_time","employment_status":"active","create_user":true}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"mobile":"+919999999999","employment_status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/restore" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/import" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"file_id":"file_uuid","mapping":{"employee_code":"Employee Code"}}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/export" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv","filters":{"employment_status":"active"}}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/activity" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"

curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/employment-history" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/employment-history" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"department_id":"department_uuid","designation_id":"designation_uuid","office_id":"office_uuid","effective_from":"2026-08-06"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/bank-accounts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/bank-accounts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"account_holder_name":"Sahil Khan","bank_name":"HDFC Bank","account_number":"1234567890","ifsc_code":"HDFC0000001","is_primary":true}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/bank-accounts/{account_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"is_primary":true}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/bank-accounts/{account_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/salary-structures" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/salary-structures" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"effective_from":"2026-08-06","annual_ctc":1200000,"monthly_gross":100000,"currency":"INR"}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/salary-structures/{salary_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"monthly_gross":110000}'
```

For `documents`, `emergency-contacts`, `assets`, `certifications`, `appraisals`, and `training`, use the same pattern:

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/{resource}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/{resource}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Example","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/staff/{staff_uuid}/{resource}/{id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
```

Common errors:

```json
{"success":false,"message":"Unauthenticated.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"AUTHENTICATION_REQUIRED","details":[]}}
```

```json
{"success":false,"message":"Missing tenant permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"TENANT_PERMISSION_DENIED","details":{"permissions":["staff.manage_bank"]}}}
```

```json
{"success":false,"message":"Cannot remove the final owner/admin role from this tenant.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"FINAL_OWNER_ADMIN_ROLE_REQUIRED","details":[]}}
```

# 10. Tenant CRM Clients, Vendors, and Leads APIs

Use `Authorization: Bearer {{TENANT_TOKEN}}`, `Accept: application/json`, and your tenant resolver (`X-Tenant: {{TENANT_SLUG}}` if configured).

## 10.1 Clients

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients?search=acme" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"party":{"party_type":"company","display_name":"Acme Pvt Ltd","legal_name":"Acme Private Limited","email":"hello@acme.example","phone":"+919999999999","owner_user_id":"user_uuid"},"profile":{"client_code":"CL0001","client_type":"enterprise","credit_limit":"500000.00","payment_terms_days":30,"onboarding_date":"2026-08-06","account_manager_id":"user_uuid"},"contacts":[{"first_name":"Amit","last_name":"Shah","email":"amit@acme.example","is_primary":true,"portal_enabled":false}],"addresses":[{"address_type":"billing","address_line_1":"Address 1","country_id":1,"state_id":1,"city_id":1,"postal_code":"400001","is_default":true}]}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"party":{"phone":"+918888888888"},"profile":{"payment_terms_days":45}}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/restore" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients/import" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"file_id":"file_uuid","mapping":{"client_code":"Client Code"}}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients/export" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv"}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients/merge" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"primary_client_id":"client_uuid","duplicate_client_ids":["client_uuid_2"],"reason":"Duplicate cleanup"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/contacts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/contacts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"first_name":"Amit","email":"amit@acme.example","portal_enabled":true,"create_portal_user":true}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/contacts/{contact_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"first_name":"Amit","status":"active"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/contacts/{contact_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/addresses" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/addresses" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"address_type":"shipping","address_line_1":"Warehouse Road","postal_code":"400001"}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/addresses/{address_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"address_type":"billing","address_line_1":"Updated Address"}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/addresses/{address_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/projects" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/invoices" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/payments" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/renewals" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/issues" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/clients/{client_uuid}/activity" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
```

## 10.2 Vendors

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/vendors" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"party":{"party_type":"company","display_name":"Supply Co","email":"accounts@supply.example"},"profile":{"vendor_code":"VN0001","payment_terms_days":15,"rating":4},"contacts":[],"addresses":[]}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"profile":{"rating":4.5}}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/vendors/import" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"file_id":"file_uuid"}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/vendors/export" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/contacts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/contacts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"first_name":"Neha","email":"neha@supply.example"}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/contacts/{contact_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"first_name":"Neha","status":"active"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/addresses" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/addresses" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"address_type":"office","address_line_1":"Vendor Street"}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/addresses/{address_id}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"address_type":"office","address_line_1":"Updated Vendor Street"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/bank-accounts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/bank-accounts" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"bank_name":"HDFC Bank","account_number":"1234567890","ifsc_code":"HDFC0000001","is_primary":true}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/expenses" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/renewals" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/vendors/{vendor_uuid}/activity" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
```

## 10.3 Leads

```bash
curl -X GET "{{BASE_URL}}/api/tenant/v1/leads/dashboard" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/leads" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X GET "{{BASE_URL}}/api/tenant/v1/leads/kanban" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"party":{"party_type":"company","display_name":"Prospect Ltd","email":"info@prospect.example"},"profile":{"lead_number":"LD0001","expected_value":"250000.00","probability":40,"expected_close_date":"2026-09-15"},"contacts":[],"addresses":[]}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"profile":{"probability":60}}'
curl -X DELETE "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/import" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"file_id":"file_uuid"}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/export" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"format":"csv"}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/duplicate" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"lead_number":"LD0002"}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/convert" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"client_code":"CL0002","client_type":"enterprise","account_manager_id":"user_uuid","move_open_tasks":true,"create_project":false,"conversion_note":"Lead won after proposal approval."}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/mark-lost" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"lost_reason":"Budget not approved"}'
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/merge" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"primary_lead_id":"lead_uuid","duplicate_lead_ids":["lead_uuid_2"],"reason":"Duplicate inquiry"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/activities" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
curl -X POST "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/activities" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"activity_type":"call","subject":"Discovery call","scheduled_at":"2026-08-07T10:00:00Z","assigned_to":"user_uuid"}'
curl -X PATCH "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/activities/{activity_uuid}" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"completed_at":"2026-08-07T10:30:00Z","outcome":"Qualified"}'
curl -X GET "{{BASE_URL}}/api/tenant/v1/leads/{lead_uuid}/activity" -H "Authorization: Bearer {{TENANT_TOKEN}}" -H "Accept: application/json"
```

Common errors:

```json
{"success":false,"message":"client_code already exists for this tenant.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"BUSINESS_ERROR","details":[]}}
```

```json
{"success":false,"message":"Missing tenant permission.","data":null,"meta":{"request_id":"{{REQUEST_ID}}"},"errors":{"code":"TENANT_PERMISSION_DENIED","details":{"permissions":["lead.convert"]}}}
```
