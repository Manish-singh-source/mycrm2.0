# Platform APIs

This document defines the SaaS Super Admin API surface for the platform pages in `docs/platform-pages.md`, aligned with the database design in `docs/database.md`.

Base URL:

```http
/api/platform/v1
```

These are platform-admin APIs for SaaS owner/staff users. Tenant CRM APIs should be documented separately.

## Common Headers

JSON requests:

```http
Authorization: Bearer {platform_access_token}
Accept: application/json
Content-Type: application/json
X-Request-Id: {uuid}
X-Client-Version: web-admin/1.0.0
```

Optional:

```http
Idempotency-Key: {uuid}
X-Timezone: Asia/Kolkata
X-Locale: en
X-Impersonation-Reason: Support ticket review
```

Multipart upload:

```http
Authorization: Bearer {platform_access_token}
Accept: application/json
Content-Type: multipart/form-data
```

## Auth Rules

- Guard: `platform`.
- Auth table: `platform_users`.
- RBAC tables: `platform_roles`, `platform_permissions`, `platform_role_has_permissions`, `platform_model_has_roles`, `platform_model_has_permissions`.
- All mutating APIs must write audit/activity data.
- Secrets must never be returned raw after creation.

## Common List Query Parameters

```http
?page=1&per_page=25&search=admin&sort=-created_at,name&include=roles,teams&filter[status]=active&date_from=2026-08-01&date_to=2026-08-31
```

| Parameter | Notes |
| --- | --- |
| `search` | Global search keyword |
| `page`, `per_page` | Default `25`, max `100` |
| `sort` | Comma list; prefix `-` for descending |
| `include` | Related resources |
| `fields` | Sparse fields |
| `filter[field]` | Exact or comma-separated values |
| `date_from`, `date_to` | Date range for reports/logs |

## Standard Response Envelope

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-08-05T12:00:00Z"
  }
}
```

List:

```json
{
  "data": [],
  "links": {"first": "...", "last": "...", "prev": null, "next": "..."},
  "meta": {"current_page": 1, "per_page": 25, "total": 125, "last_page": 5}
}
```

Error:

```json
{
  "message": "Validation failed.",
  "error_code": "VALIDATION_FAILED",
  "errors": {"email": ["The email has already been taken."]},
  "request_id": "uuid"
}
```

## Common Status Codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 202 | Accepted for async processing |
| 204 | No content |
| 400 | Business rule violation |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Duplicate/conflict |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

## Common Bodies

Bulk action:

```json
{"ids": ["uuid-1", "uuid-2"], "reason": "Audit reason"}
```

Export:

```json
{"format": "csv", "columns": ["name", "status"], "filters": {}, "selected_ids": [], "timezone": "Asia/Kolkata"}
```

Supported export formats: `csv`, `xlsx`, `pdf` where useful.

---

# 1. Dashboard

Data sources: `tenants`, `subscriptions`, `plans`, `platform_invoices`, `platform_payments`, `subscription_usage`, `tenant_usage_snapshots`, `security_events`, `monitoring_alerts`, `system_incidents`, `queue_job_logs`, `scheduler_logs`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/dashboard/summary` | `dashboard.view` | KPI cards |
| GET | `/dashboard/charts/tenant-growth` | `dashboard.view` | Tenant growth chart |
| GET | `/dashboard/charts/revenue` | `dashboard.view` | Revenue chart |
| GET | `/dashboard/charts/plan-distribution` | `dashboard.view` | Plan distribution |
| GET | `/dashboard/charts/subscription-status` | `dashboard.view` | Subscription status chart |
| GET | `/dashboard/charts/usage` | `dashboard.view` | API/storage usage chart |
| GET | `/dashboard/recent-tenants` | `dashboard.view` | Recent tenants table |
| GET | `/dashboard/recent-payments` | `dashboard.view` | Recent payments table |
| GET | `/dashboard/overdue-invoices` | `dashboard.view` | Overdue invoices |
| GET | `/dashboard/active-alerts` | `dashboard.view` | Active alerts |
| GET | `/dashboard/security-events` | `dashboard.view` | Recent security events |
| POST | `/dashboard/export` | `dashboard.view` | Export snapshot |

Summary response fields:

```json
{
  "data": {
    "tenants": {"total": 120, "active": 91, "trial": 12, "suspended": 4, "expired": 7, "new_today": 2, "new_this_week": 11, "new_this_month": 35},
    "revenue": {"mrr": "120000.00", "arr": "1440000.00", "collected_today": "15000.00", "collected_this_month": "430000.00", "currency": "INR"},
    "billing": {"overdue_invoice_count": 8, "overdue_balance": "45000.00", "failed_payment_count": 3},
    "operations": {"open_incidents": 2, "critical_security_events": 5, "failed_queue_jobs": 4, "failed_scheduler_runs": 1}
  }
}
```

---

# 2. Access Control

## 2.1 Platform Roles

Data sources: `platform_roles`, `platform_permissions`, `platform_role_has_permissions`, `platform_model_has_roles`, `activity_logs`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/access-control/roles` | `platform_role.view` | List roles |
| POST | `/access-control/roles` | `platform_role.create` | Create role |
| GET | `/access-control/roles/{role_uuid}` | `platform_role.view` | View role |
| PUT/PATCH | `/access-control/roles/{role_uuid}` | `platform_role.edit` | Update role |
| DELETE | `/access-control/roles/{role_uuid}` | `platform_role.delete` | Delete custom role |
| POST | `/access-control/roles/{role_uuid}/clone` | `platform_role.create` | Clone role |
| POST | `/access-control/roles/{role_uuid}/activate` | `platform_role.edit` | Activate role |
| POST | `/access-control/roles/{role_uuid}/deactivate` | `platform_role.edit` | Deactivate role |
| GET | `/access-control/roles/{role_uuid}/permissions` | `platform_role.view` | Permission list |
| PUT | `/access-control/roles/{role_uuid}/permissions` | `platform_role.edit` | Replace permissions |
| GET | `/access-control/roles/{role_uuid}/users` | `platform_role.view` | Assigned users |
| POST | `/access-control/roles/{role_uuid}/users` | `platform_role.edit` | Assign users |
| DELETE | `/access-control/roles/{role_uuid}/users/{platform_user_uuid}` | `platform_role.edit` | Remove user role |
| GET | `/access-control/roles/{role_uuid}/activity` | `audit_log.view` | Role audit/activity |
| POST | `/access-control/roles/bulk/activate` | `platform_role.edit` | Bulk activate |
| POST | `/access-control/roles/bulk/deactivate` | `platform_role.edit` | Bulk deactivate |
| POST | `/access-control/roles/export` | `platform_role.view` | Export roles |

List filters: `status`, `type=system|custom`, `guard_name`, `permission_module`, `created_from`, `created_to`, `updated_from`, `updated_to`.

Create body:

```json
{
  "display_name": "Billing Manager",
  "name": "billing_manager",
  "guard_name": "platform",
  "description": "Can manage platform invoices, payments, refunds, and subscription billing.",
  "status": "active",
  "is_system": false,
  "permission_ids": ["permission_uuid_1", "permission_uuid_2"]
}
```

Update body:

```json
{"display_name": "Billing Operations Manager", "description": "Updated description.", "status": "active", "permission_ids": ["permission_uuid_1"], "audit_reason": "Quarterly access review"}
```

Clone body:

```json
{"display_name": "Billing Manager Copy", "name": "billing_manager_copy", "copy_permissions": true, "copy_description": true, "status": "inactive"}
```

Assign users body:

```json
{"platform_user_ids": ["platform_user_uuid_1", "platform_user_uuid_2"], "audit_reason": "Billing team access assignment"}
```

Validation: display name required/unique, role name required/unique by guard, guard required, at least one permission, system roles cannot be renamed/deleted.

## 2.2 Platform Permissions

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/access-control/permissions` | `platform_permission.view` | List permissions |
| POST | `/access-control/permissions` | `platform_permission.create` | Create permission |
| GET | `/access-control/permissions/{permission_uuid}` | `platform_permission.view` | View permission |
| PUT/PATCH | `/access-control/permissions/{permission_uuid}` | `platform_permission.edit` | Update permission |
| DELETE | `/access-control/permissions/{permission_uuid}` | `platform_permission.delete` | Delete custom unused permission |
| GET | `/access-control/permissions/grouped` | `platform_permission.view` | Grouped by module |
| POST | `/access-control/permissions/export` | `platform_permission.view` | Export permissions |

Create/update body:

```json
{"module": "billing", "name": "billing.refund", "display_name": "Refund Payments", "description": "Allows refunding platform payments.", "guard_name": "platform", "is_system": false, "status": "active"}
```

---

# 3. Platform Teams

Recommended data sources: `platform_teams`, `platform_team_roles`, `platform_team_members`, `platform_team_assignments`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/platform-teams` | `platform_team.view` | List teams |
| POST | `/platform-teams` | `platform_team.create` | Create team |
| GET | `/platform-teams/{team_uuid}` | `platform_team.view` | View team |
| PUT/PATCH | `/platform-teams/{team_uuid}` | `platform_team.edit` | Update team |
| DELETE | `/platform-teams/{team_uuid}` | `platform_team.delete` | Archive/delete team |
| GET | `/platform-teams/{team_uuid}/members` | `platform_team.view` | Team members |
| POST | `/platform-teams/{team_uuid}/members` | `platform_team.assign` | Add members |
| PUT/PATCH | `/platform-teams/{team_uuid}/members/{member_uuid}` | `platform_team.assign` | Update member |
| DELETE | `/platform-teams/{team_uuid}/members/{member_uuid}` | `platform_team.assign` | Remove member |
| GET | `/platform-teams/{team_uuid}/assignments` | `platform_team.view` | Assignments |
| POST | `/platform-teams/{team_uuid}/assignments` | `platform_team.assign` | Create assignment |
| DELETE | `/platform-teams/{team_uuid}/assignments/{assignment_uuid}` | `platform_team.assign` | Release assignment |
| GET | `/platform-team-roles` | `platform_team.view` | List team roles |
| POST | `/platform-team-roles` | `platform_team.create` | Create team role |
| PUT/PATCH | `/platform-team-roles/{role_uuid}` | `platform_team.edit` | Update team role |
| DELETE | `/platform-team-roles/{role_uuid}` | `platform_team.delete` | Delete team role |

Create team body:

```json
{"name": "Support Operations", "code": "support_ops", "parent_team_id": null, "description": "Handles tenant support escalations.", "lead_platform_user_id": "platform_user_uuid", "assistant_lead_platform_user_id": null, "email": "support-ops@example.com", "phone": "+919999999999", "color": "#2563eb", "icon": "life-preserver", "visibility": "internal", "status": "active"}
```

Add members body:

```json
{"members": [{"platform_user_id": "platform_user_uuid", "platform_team_role_id": "team_role_uuid", "allocation_percent": 100, "is_primary": true, "effective_from": "2026-08-05", "effective_to": null, "status": "active"}]}
```

Assignment body:

```json
{"assignable_type": "tenant", "assignable_id": "tenant_uuid", "assignment_role": "support_owner", "assigned_at": "2026-08-05T10:00:00Z", "status": "active"}
```

Allowed `assignable_type`: `tenant`, `platform_ticket`, `system_incident`, `monitoring_alert`.

---

# 4. Platform Staff

Data source: `platform_users`, platform RBAC pivots, optional platform team tables.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/platform-users` | `platform_user.view` | List staff |
| POST | `/platform-users` | `platform_user.create` | Create staff |
| POST | `/platform-users/invite` | `platform_user.create` | Invite staff |
| GET | `/platform-users/{platform_user_uuid}` | `platform_user.view` | View staff |
| PUT/PATCH | `/platform-users/{platform_user_uuid}` | `platform_user.edit` | Update staff |
| DELETE | `/platform-users/{platform_user_uuid}` | `platform_user.delete` | Soft delete staff |
| POST | `/platform-users/{platform_user_uuid}/restore` | `platform_user.edit` | Restore staff |
| POST | `/platform-users/{platform_user_uuid}/suspend` | `platform_user.suspend` | Suspend staff |
| POST | `/platform-users/{platform_user_uuid}/activate` | `platform_user.edit` | Activate staff |
| POST | `/platform-users/{platform_user_uuid}/reset-password` | `platform_user.edit` | Reset password/send link |
| POST | `/platform-users/{platform_user_uuid}/force-logout` | `platform_user.edit` | Revoke sessions/tokens |
| POST | `/platform-users/{platform_user_uuid}/require-2fa` | `platform_user.edit` | Require 2FA |
| GET | `/platform-users/{platform_user_uuid}/roles` | `platform_user.view` | User roles |
| PUT | `/platform-users/{platform_user_uuid}/roles` | `platform_user.edit` | Replace roles |
| GET | `/platform-users/{platform_user_uuid}/permissions` | `platform_user.view` | Direct permissions |
| PUT | `/platform-users/{platform_user_uuid}/permissions` | `platform_user.edit` | Replace direct permissions |
| GET | `/platform-users/{platform_user_uuid}/activity` | `audit_log.view` | Activity |
| POST | `/platform-users/export` | `platform_user.view` | Export staff |

Create body:

```json
{"employee_code": "EMP0001", "first_name": "Sahil", "last_name": "Admin", "display_name": "Sahil Admin", "email": "sahil@example.com", "mobile": "+919999999999", "password": "StrongPassword#123", "profile_photo_file_id": null, "designation": "Super Admin", "department": "Operations", "timezone": "Asia/Kolkata", "locale": "en", "two_factor_enabled": true, "status": "active", "role_ids": ["role_uuid"], "team_ids": ["team_uuid"]}
```

Invite body:

```json
{"email": "new.admin@example.com", "first_name": "New", "last_name": "Admin", "designation": "Support Manager", "department": "Support", "role_ids": ["role_uuid"], "send_invite": true}
```

Replace roles/permissions body:

```json
{"role_ids": ["role_uuid_1", "role_uuid_2"], "audit_reason": "Access review update"}
```

---

# 5. Tenants

Data sources: `tenants`, `users`, `tenant_offices`, `subscriptions`, `plans`, `tenant_usage_snapshots`, `subscription_usage`, `platform_invoices`, `platform_payments`, `tenant_settings`, `tenant_integrations`, `security_events`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/tenants` | `tenant.view` | List tenants |
| POST | `/tenants` | `tenant.create` | Create tenant with owner/office/subscription |
| GET | `/tenants/{tenant_uuid}` | `tenant.view` | Tenant overview |
| PUT/PATCH | `/tenants/{tenant_uuid}` | `tenant.edit` | Update tenant organization |
| DELETE | `/tenants/{tenant_uuid}` | `tenant.delete` | Soft delete/archive tenant |
| POST | `/tenants/{tenant_uuid}/restore` | `tenant.edit` | Restore tenant |
| POST | `/tenants/{tenant_uuid}/activate` | `tenant.activate` | Activate tenant |
| POST | `/tenants/{tenant_uuid}/suspend` | `tenant.suspend` | Suspend tenant |
| POST | `/tenants/{tenant_uuid}/archive` | `tenant.delete` | Archive tenant |
| POST | `/tenants/{tenant_uuid}/extend-trial` | `subscription.edit` | Extend trial |
| POST | `/tenants/{tenant_uuid}/impersonate` | `tenant.impersonate` | Start remote login |
| DELETE | `/tenants/{tenant_uuid}/impersonate/{session_uuid}` | `tenant.impersonate` | End remote login |
| GET | `/tenants/{tenant_uuid}/users` | `tenant.view` | Tenant users tab |
| GET | `/tenants/{tenant_uuid}/offices` | `tenant.view` | Offices tab |
| POST | `/tenants/{tenant_uuid}/offices` | `tenant.edit` | Create office |
| PUT/PATCH | `/tenants/{tenant_uuid}/offices/{office_uuid}` | `tenant.edit` | Update office |
| DELETE | `/tenants/{tenant_uuid}/offices/{office_uuid}` | `tenant.edit` | Delete office |
| GET | `/tenants/{tenant_uuid}/subscription` | `subscription.view` | Current subscription |
| GET | `/tenants/{tenant_uuid}/billing` | `billing.invoice.view` | Invoices/payments summary |
| GET | `/tenants/{tenant_uuid}/usage` | `tenant.view` | Usage tab |
| GET | `/tenants/{tenant_uuid}/modules` | `module.view` | Enabled modules/features |
| PUT | `/tenants/{tenant_uuid}/modules` | `module.edit` | Update module overrides |
| GET | `/tenants/{tenant_uuid}/settings` | `setting.view` | Settings summary |
| GET | `/tenants/{tenant_uuid}/integrations` | `integration.view` | Tenant integrations |
| GET | `/tenants/{tenant_uuid}/security-events` | `audit_log.view` | Security events |
| GET | `/tenants/{tenant_uuid}/activity` | `audit_log.view` | Tenant audit/activity |
| POST | `/tenants/export` | `tenant.view` | Export tenants |

List filters: `status`, `plan_id`, `subscription_status`, `industry_id`, `business_type_id`, `country_id`, `trial_ending_before`.

Create body:

```json
{
  "organization": {"organization_name": "Acme Pvt Ltd", "legal_name": "Acme Private Limited", "display_name": "Acme", "organization_code": "ACME001", "slug": "acme", "business_type_id": "business_type_uuid", "industry_id": "industry_uuid", "company_size": "small", "gst_number": "27AAAAA0000A1Z5", "pan_number": "AAAAA0000A", "registration_number": "REG123", "website": "https://acme.example", "description": "Tenant description", "logo_file_id": null, "favicon_file_id": null, "default_currency": "INR", "default_timezone": "Asia/Kolkata", "status": "trial"},
  "owner": {"first_name": "Owner", "last_name": "User", "display_name": "Owner User", "email": "owner@acme.example", "mobile": "+919999999999", "password": "StrongPassword#123", "send_invite": false, "status": "active"},
  "head_office": {"office_name": "Head Office", "office_code": "HO", "office_type": "head_office", "is_head_office": true, "is_default": true, "address_line_1": "Address line 1", "address_line_2": null, "landmark": null, "country_id": "country_uuid", "state_id": "state_uuid", "city_id": "city_uuid", "postal_code": "400001", "contact_person": "Owner User", "contact_email": "owner@acme.example", "contact_phone": "+919999999999", "timezone": "Asia/Kolkata", "working_hours": {"mon_fri": "09:00-18:00"}, "gst_number": "27AAAAA0000A1Z5", "status": "active"},
  "subscription": {"plan_id": "plan_uuid", "type": "trial", "billing_cycle": "monthly", "starts_at": "2026-08-05T00:00:00Z", "expires_at": "2026-09-04T23:59:59Z", "trial_starts_at": "2026-08-05T00:00:00Z", "trial_ends_at": "2026-08-19T23:59:59Z", "renewal_type": "manual", "auto_renew": false}
}
```

Common action bodies:

```json
{"reason": "Payment overdue", "notify_owner": true, "suspended_until": null}
```

```json
{"trial_ends_at": "2026-09-05T23:59:59Z", "reason": "Sales-approved extension"}
```

```json
{"reason": "Support debugging ticket TCK-1001", "duration_minutes": 30, "approved_by": "platform_user_uuid"}
```

```json
{"modules": [{"code": "projects", "enabled": true}, {"code": "payroll", "enabled": false}], "feature_overrides": [{"feature_code": "users.limit", "value": 25}], "reason": "Custom enterprise agreement"}
```

---

# 6. Subscriptions

Data sources: `subscriptions`, `subscription_versions`, `subscription_renewals`, `subscription_addons`, `subscription_usage`, `plans`, `platform_invoices`, `platform_payments`, `coupon_redemptions`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/subscriptions` | `subscription.view` | List subscriptions |
| POST | `/subscriptions` | `subscription.create` | Create subscription |
| GET | `/subscriptions/{subscription_uuid}` | `subscription.view` | View subscription |
| PUT/PATCH | `/subscriptions/{subscription_uuid}` | `subscription.edit` | Update subscription |
| POST | `/subscriptions/{subscription_uuid}/upgrade` | `subscription.upgrade` | Upgrade plan |
| POST | `/subscriptions/{subscription_uuid}/downgrade` | `subscription.downgrade` | Downgrade plan |
| POST | `/subscriptions/{subscription_uuid}/renew` | `subscription.renew` | Renew subscription |
| POST | `/subscriptions/{subscription_uuid}/pause` | `subscription.edit` | Pause subscription |
| POST | `/subscriptions/{subscription_uuid}/resume` | `subscription.edit` | Resume subscription |
| POST | `/subscriptions/{subscription_uuid}/cancel` | `subscription.cancel` | Cancel subscription |
| POST | `/subscriptions/{subscription_uuid}/addons` | `subscription.edit` | Add addon |
| PUT/PATCH | `/subscriptions/{subscription_uuid}/addons/{addon_uuid}` | `subscription.edit` | Update addon |
| DELETE | `/subscriptions/{subscription_uuid}/addons/{addon_uuid}` | `subscription.edit` | Remove addon |
| POST | `/subscriptions/{subscription_uuid}/apply-coupon` | `subscription.edit` | Apply coupon |
| DELETE | `/subscriptions/{subscription_uuid}/coupons/{coupon_uuid}` | `subscription.edit` | Remove coupon |
| GET | `/subscriptions/{subscription_uuid}/usage` | `subscription.view` | Feature usage |
| POST | `/subscriptions/{subscription_uuid}/invoice` | `billing.invoice.create` | Create invoice |
| GET | `/subscriptions/{subscription_uuid}/history` | `subscription.view` | Versions/renewals |
| POST | `/subscriptions/export` | `subscription.view` | Export subscriptions |

Bodies:

```json
{"tenant_id": "tenant_uuid", "plan_id": "plan_uuid", "type": "paid", "billing_cycle": "yearly", "status": "active", "renewal_type": "automatic", "starts_at": "2026-08-05T00:00:00Z", "expires_at": "2027-08-04T23:59:59Z", "next_billing_at": "2027-08-01T00:00:00Z", "currency": "INR", "auto_renew": true, "notes": "Annual contract"}
```

```json
{"new_plan_id": "plan_uuid", "effective_at": "2026-08-05T00:00:00Z", "proration": "immediate", "billing_cycle": "yearly", "reason": "Customer upgrade request"}
```

```json
{"renewal_starts_at": "2027-08-05T00:00:00Z", "renewal_expires_at": "2028-08-04T23:59:59Z", "amount": "120000.00", "currency": "INR", "create_invoice": true, "notes": "Manual renewal"}
```

```json
{"reason": "Customer requested cancellation", "cancel_at_period_end": true, "effective_at": "2026-09-04T23:59:59Z"}
```

```json
{"addon_plan_id": "addon_plan_uuid", "quantity": 5, "unit_price": "499.00", "starts_at": "2026-08-05T00:00:00Z", "ends_at": null, "status": "active"}
```

---

# 7. Plans, Features, Add-ons

## Plans

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/plans` | `plan.view` | List plans |
| POST | `/plans` | `plan.create` | Create plan |
| GET | `/plans/{plan_uuid}` | `plan.view` | View plan |
| PUT/PATCH | `/plans/{plan_uuid}` | `plan.edit` | Update plan |
| DELETE | `/plans/{plan_uuid}` | `plan.delete` | Archive/delete plan |
| POST | `/plans/{plan_uuid}/clone` | `plan.create` | Clone plan |
| GET | `/plans/{plan_uuid}/features` | `plan.view` | Plan features |
| PUT | `/plans/{plan_uuid}/features` | `plan.edit` | Replace features |
| GET | `/plans/{plan_uuid}/subscriptions` | `plan.view` | Subscriptions using plan |
| POST | `/plans/export` | `plan.view` | Export plans |

Plan body:

```json
{"name": "Growth", "code": "growth", "description": "Plan for growing teams.", "billing_cycle": "monthly", "base_price": "4999.00", "currency": "INR", "trial_days": 14, "is_custom": false, "is_public": true, "status": "active", "features": [{"feature_id": "feature_uuid", "value": 25, "metadata": {}}]}
```

## Features

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/features` | `feature.view` | List features |
| POST | `/features` | `feature.create` | Create feature |
| GET | `/features/{feature_uuid}` | `feature.view` | View feature |
| PUT/PATCH | `/features/{feature_uuid}` | `feature.edit` | Update feature |
| DELETE | `/features/{feature_uuid}` | `feature.delete` | Disable/delete feature |
| POST | `/features/export` | `feature.view` | Export features |

Feature body:

```json
{"module": "projects", "name": "Project Limit", "code": "projects.limit", "data_type": "integer", "unit": "projects", "description": "Maximum active projects.", "status": "active"}
```

## Add-ons

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/addons` | `plan.view` | List addon plans |
| POST | `/addons` | `plan.create` | Create addon |
| GET | `/addons/{addon_uuid}` | `plan.view` | View addon |
| PUT/PATCH | `/addons/{addon_uuid}` | `plan.edit` | Update addon |
| DELETE | `/addons/{addon_uuid}` | `plan.delete` | Archive addon |

Addon body:

```json
{"name": "Extra Users", "code": "extra_users", "pricing_type": "per_unit", "price": "199.00", "currency": "INR", "status": "active"}
```

---

# 8. Billing

Data sources: `platform_invoices`, `platform_invoice_items`, `platform_payments`, recommended `platform_refunds`.

## Invoices

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/billing/invoices` | `billing.invoice.view` | List invoices |
| POST | `/billing/invoices` | `billing.invoice.create` | Create manual invoice |
| GET | `/billing/invoices/{invoice_uuid}` | `billing.invoice.view` | View invoice |
| PUT/PATCH | `/billing/invoices/{invoice_uuid}` | `billing.invoice.edit` | Update draft invoice |
| DELETE | `/billing/invoices/{invoice_uuid}` | `billing.invoice.cancel` | Cancel invoice |
| POST | `/billing/invoices/{invoice_uuid}/send` | `billing.invoice.send` | Send invoice |
| GET | `/billing/invoices/{invoice_uuid}/pdf` | `billing.invoice.view` | Download PDF |
| POST | `/billing/invoices/{invoice_uuid}/payments` | `billing.payment.create` | Record payment |
| POST | `/billing/invoices/export` | `billing.invoice.view` | Export invoices |

Invoice body:

```json
{"tenant_id": "tenant_uuid", "subscription_id": "subscription_uuid", "invoice_date": "2026-08-05", "due_date": "2026-08-20", "currency": "INR", "status": "draft", "items": [{"item_type": "plan", "description": "Growth plan - August 2026", "quantity": "1.00", "unit_price": "4999.00", "amount": "4999.00", "metadata": {}}], "discount_amount": "0.00", "tax_amount": "899.82", "notes": "Manual platform invoice"}
```

Send body:

```json
{"to": ["owner@tenant.example"], "cc": [], "message": "Please find your invoice attached."}
```

## Payments

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/billing/payments` | `billing.payment.view` | List payments |
| POST | `/billing/payments` | `billing.payment.create` | Record payment |
| GET | `/billing/payments/{payment_uuid}` | `billing.payment.view` | View payment |
| POST | `/billing/payments/{payment_uuid}/retry` | `billing.payment.create` | Retry failed payment |
| POST | `/billing/payments/{payment_uuid}/refund` | `billing.payment.refund` | Refund payment |
| POST | `/billing/payments/export` | `billing.payment.view` | Export payments |

Payment body:

```json
{"tenant_id": "tenant_uuid", "platform_invoice_id": "invoice_uuid", "subscription_id": "subscription_uuid", "gateway": "razorpay", "gateway_payment_id": "pay_123", "payment_method": "card", "amount": "5898.82", "currency": "INR", "payment_status": "success", "paid_at": "2026-08-05T10:00:00Z", "raw_response": {}}
```

## Refunds

Recommended table: `platform_refunds`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/billing/refunds` | `billing.payment.view` | List refunds |
| POST | `/billing/refunds` | `billing.payment.refund` | Create refund |
| GET | `/billing/refunds/{refund_uuid}` | `billing.payment.view` | View refund |
| POST | `/billing/refunds/{refund_uuid}/retry` | `billing.payment.refund` | Retry failed refund |
| POST | `/billing/refunds/export` | `billing.payment.view` | Export refunds |

Refund body:

```json
{"tenant_id": "tenant_uuid", "platform_payment_id": "payment_uuid", "platform_invoice_id": "invoice_uuid", "amount": "1000.00", "currency": "INR", "reason": "Duplicate payment", "gateway": "razorpay"}
```

# 9. Coupons

Source tables: `coupons`, `coupon_redemptions`, `coupon_plans`, `coupon_tenants`, `platform_activity_logs`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/coupons` | List coupons with filters: `status`, `discount_type`, `valid_from`, `valid_until`, `plan_uuid`, `tenant_uuid` |
| `POST` | `/coupons` | Create coupon |
| `GET` | `/coupons/{coupon_uuid}` | Coupon detail with plans, tenants, redemptions, audit summary |
| `PUT/PATCH` | `/coupons/{coupon_uuid}` | Update coupon |
| `DELETE` | `/coupons/{coupon_uuid}` | Delete coupon if unused, otherwise archive |
| `POST` | `/coupons/{coupon_uuid}/activate` | Activate coupon |
| `POST` | `/coupons/{coupon_uuid}/deactivate` | Deactivate coupon |
| `GET` | `/coupons/{coupon_uuid}/redemptions` | List coupon usage by tenant/subscription/invoice |
| `PUT` | `/coupons/{coupon_uuid}/plans` | Restrict coupon to selected plans |
| `PUT` | `/coupons/{coupon_uuid}/tenants` | Restrict coupon to selected tenants |
| `POST` | `/coupons/export` | Export coupons/redemptions |

Create/update body:

```json
{
  "code": "YEARLY20",
  "name": "20% yearly discount",
  "description": "Applies to annual subscriptions",
  "discount_type": "percentage",
  "discount_value": 20,
  "max_discount_amount": 5000,
  "currency": "INR",
  "valid_from": "2026-08-01T00:00:00Z",
  "valid_until": "2026-12-31T23:59:59Z",
  "max_redemptions": 500,
  "max_redemptions_per_tenant": 1,
  "applies_to": "subscription",
  "billing_cycles": ["yearly"],
  "status": "active",
  "plan_uuids": ["plan_uuid"],
  "tenant_uuids": []
}
```

# 10. Modules and Feature Controls

Source tables: `modules`, `features`, `plans`, `plan_features`, `subscriptions`, `subscription_usage`, `tenant_settings`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/modules` | List platform modules |
| `POST` | `/modules` | Create module |
| `GET` | `/modules/{module_uuid}` | Module detail with features and enabled tenants |
| `PUT/PATCH` | `/modules/{module_uuid}` | Update module metadata |
| `POST` | `/modules/{module_uuid}/enable` | Enable platform module |
| `POST` | `/modules/{module_uuid}/disable` | Disable platform module |
| `GET` | `/modules/{module_uuid}/features` | List module features |
| `PUT` | `/modules/{module_uuid}/features` | Replace module feature assignments |
| `GET` | `/modules/{module_uuid}/tenants` | Tenants using module |
| `GET` | `/tenants/{tenant_uuid}/modules` | Tenant module entitlements and overrides |
| `PUT` | `/tenants/{tenant_uuid}/modules/{module_code}` | Override tenant module access |

Module body:

```json
{
  "name": "Project Management",
  "code": "projects",
  "description": "Projects, tasks, milestones, time and delivery tracking",
  "icon": "folder-kanban",
  "sort_order": 30,
  "status": "active"
}
```

Tenant module override body:

```json
{
  "enabled": true,
  "source": "manual_override",
  "limits": {
    "projects": 100,
    "storage_gb": 50
  },
  "reason": "Enterprise contract exception"
}
```

# 11. Support

Recommended tables: `platform_tickets`, `platform_ticket_comments`, `platform_ticket_attachments`, `knowledge_base_categories`, `knowledge_base_articles`, `remote_login_sessions`.

## Ticket Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/support/tickets` | List tickets with filters: `tenant_uuid`, `status`, `priority`, `category`, `assigned_to_uuid`, `sla_status` |
| `POST` | `/support/tickets` | Create ticket |
| `GET` | `/support/tickets/{ticket_uuid}` | Ticket detail with comments, attachments, SLA, audit |
| `PUT/PATCH` | `/support/tickets/{ticket_uuid}` | Update ticket fields |
| `POST` | `/support/tickets/{ticket_uuid}/assign` | Assign or reassign ticket |
| `POST` | `/support/tickets/{ticket_uuid}/comments` | Add internal/public reply |
| `POST` | `/support/tickets/{ticket_uuid}/attachments` | Upload attachment |
| `POST` | `/support/tickets/{ticket_uuid}/close` | Close ticket |
| `POST` | `/support/tickets/{ticket_uuid}/reopen` | Reopen ticket |
| `POST` | `/support/tickets/export` | Export tickets |

Create ticket body:

```json
{
  "tenant_uuid": "tenant_uuid",
  "subject": "Invoice not generated",
  "description": "Tenant reports missing July invoice.",
  "priority": "high",
  "category": "billing",
  "assigned_to_uuid": "platform_user_uuid",
  "tags": ["invoice", "urgent"]
}
```

Comment body:

```json
{
  "visibility": "internal",
  "body": "Checked subscription state; invoice job failed.",
  "attachment_file_uuids": ["file_uuid"]
}
```

## Knowledge Base Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/support/kb/categories` | List KB categories |
| `POST` | `/support/kb/categories` | Create KB category |
| `PUT/PATCH` | `/support/kb/categories/{category_uuid}` | Update KB category |
| `DELETE` | `/support/kb/categories/{category_uuid}` | Delete KB category |
| `GET` | `/support/kb/articles` | List articles |
| `POST` | `/support/kb/articles` | Create article |
| `GET` | `/support/kb/articles/{article_uuid}` | Article detail |
| `PUT/PATCH` | `/support/kb/articles/{article_uuid}` | Update article |
| `POST` | `/support/kb/articles/{article_uuid}/publish` | Publish article |
| `POST` | `/support/kb/articles/{article_uuid}/unpublish` | Unpublish article |
| `DELETE` | `/support/kb/articles/{article_uuid}` | Delete article |

Article body:

```json
{
  "category_uuid": "category_uuid",
  "title": "How to reset tenant billing",
  "slug": "reset-tenant-billing",
  "summary": "Operational guide for platform billing support.",
  "content": "Markdown article body",
  "visibility": "platform_staff",
  "tags": ["billing"],
  "status": "draft"
}
```

## Remote Login Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/support/remote-login-sessions` | List remote login sessions |
| `POST` | `/support/remote-login-sessions` | Start approved remote login session |
| `GET` | `/support/remote-login-sessions/{session_uuid}` | Session detail |
| `POST` | `/support/remote-login-sessions/{session_uuid}/end` | End session |

Start remote login body:

```json
{
  "tenant_uuid": "tenant_uuid",
  "target_user_uuid": "tenant_user_uuid",
  "ticket_uuid": "ticket_uuid",
  "reason": "Debug invoice permission issue",
  "expires_at": "2026-08-05T12:30:00Z"
}
```

# 12. Reports

All report endpoints support `date_from`, `date_to`, `group_by`, `tenant_uuid`, `plan_uuid`, `currency`, `status`, `format=json` as applicable.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/reports/tenant-growth` | New tenants, activated tenants, churned tenants |
| `GET` | `/reports/tenant-status` | Active/trial/suspended/archived tenant counts |
| `GET` | `/reports/mrr-arr` | MRR, ARR, expansion, contraction |
| `GET` | `/reports/churn` | Tenant and revenue churn |
| `GET` | `/reports/plan-performance` | Plan adoption, upgrades, downgrades |
| `GET` | `/reports/revenue-collection` | Invoiced, collected, outstanding revenue |
| `GET` | `/reports/invoice-aging` | Aging buckets for unpaid invoices |
| `GET` | `/reports/payment-failures` | Failed payments by gateway/reason |
| `GET` | `/reports/coupon-usage` | Coupon redemption and discount analytics |
| `GET` | `/reports/tenant-usage` | Usage by module/feature/tenant |
| `GET` | `/reports/api-usage` | API requests, latency, failures |
| `GET` | `/reports/storage-usage` | Tenant storage usage and limit pressure |
| `GET` | `/reports/support-sla` | Ticket volume, first response, resolution SLA |
| `GET` | `/reports/security-events` | Security event trend and severity |
| `GET` | `/reports/platform-staff-activity` | Staff actions and audit summary |
| `POST` | `/reports/{report_code}/export` | Generate report file |

Export body:

```json
{
  "format": "xlsx",
  "date_from": "2026-08-01",
  "date_to": "2026-08-31",
  "filters": {
    "plan_uuid": "plan_uuid",
    "status": "active"
  },
  "columns": ["tenant_name", "mrr", "status", "created_at"],
  "send_to_email": false
}
```

# 13. Monitoring

Recommended tables: `platform_services`, `platform_service_logs`, `api_request_logs`, `queue_jobs`, `scheduler_logs`, `platform_alerts`, `platform_incidents`, `tenant_usage_snapshots`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/monitoring/services` | List service health cards |
| `POST` | `/monitoring/services` | Register monitored service |
| `GET` | `/monitoring/services/{service_uuid}` | Service detail with metrics |
| `PUT/PATCH` | `/monitoring/services/{service_uuid}` | Update monitored service |
| `GET` | `/monitoring/services/{service_uuid}/logs` | Service logs |
| `GET` | `/monitoring/api-requests` | API request logs with filters: tenant, status_code, path, method |
| `GET` | `/monitoring/tenant-usage-snapshots` | Usage snapshots by tenant/module/feature |
| `GET` | `/monitoring/queue-jobs` | Queue jobs and failures |
| `POST` | `/monitoring/queue-jobs/{job_id}/retry` | Retry failed job |
| `DELETE` | `/monitoring/queue-jobs/{job_id}` | Delete failed job record |
| `GET` | `/monitoring/scheduler-logs` | Scheduler execution history |
| `GET` | `/monitoring/alerts` | List alerts |
| `POST` | `/monitoring/alerts/{alert_uuid}/resolve` | Resolve alert |
| `GET` | `/monitoring/incidents` | List incidents |
| `POST` | `/monitoring/incidents` | Create incident |
| `GET` | `/monitoring/incidents/{incident_uuid}` | Incident detail |
| `PUT/PATCH` | `/monitoring/incidents/{incident_uuid}` | Update incident |
| `POST` | `/monitoring/incidents/{incident_uuid}/resolve` | Resolve incident |

Service body:

```json
{
  "name": "Billing Worker",
  "code": "billing-worker",
  "type": "queue",
  "check_url": "https://api.example.com/health/billing-worker",
  "expected_status_code": 200,
  "check_interval_seconds": 60,
  "status": "active"
}
```

Resolve alert body:

```json
{
  "resolution_note": "Queue backlog cleared after worker restart."
}
```

Incident body:

```json
{
  "title": "Invoice generation delayed",
  "severity": "major",
  "status": "investigating",
  "affected_services": ["billing-worker"],
  "tenant_uuids": ["tenant_uuid"],
  "started_at": "2026-08-05T09:30:00Z",
  "summary": "Invoice generation queue is delayed."
}
```

# 14. Integrations

Source tables: `integration_providers`, `tenant_integrations`, `integration_credentials`, `integration_webhooks`, `integration_webhook_logs`, `integration_sync_jobs`, `integration_field_mappings`, `integration_rate_limits`.

Secrets in `integration_credentials.encrypted_value` are write-only. Detail APIs may return `has_credentials`, `last_rotated_at`, and masked key names only.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/integrations/providers` | List available integration providers |
| `POST` | `/integrations/providers` | Create provider |
| `GET` | `/integrations/providers/{provider_uuid}` | Provider detail |
| `PUT/PATCH` | `/integrations/providers/{provider_uuid}` | Update provider |
| `POST` | `/integrations/providers/{provider_uuid}/activate` | Activate provider |
| `POST` | `/integrations/providers/{provider_uuid}/deactivate` | Deactivate provider |
| `GET` | `/integrations/tenant-integrations` | List tenant integrations |
| `POST` | `/integrations/tenant-integrations` | Connect provider for a tenant |
| `GET` | `/integrations/tenant-integrations/{integration_uuid}` | Tenant integration detail |
| `PUT/PATCH` | `/integrations/tenant-integrations/{integration_uuid}` | Update tenant integration settings |
| `POST` | `/integrations/tenant-integrations/{integration_uuid}/test` | Test connection |
| `PUT` | `/integrations/tenant-integrations/{integration_uuid}/credentials` | Replace credentials |
| `DELETE` | `/integrations/tenant-integrations/{integration_uuid}` | Disconnect integration |
| `GET` | `/integrations/webhooks` | List webhooks |
| `POST` | `/integrations/webhooks` | Create webhook |
| `GET` | `/integrations/webhooks/{webhook_uuid}` | Webhook detail |
| `PUT/PATCH` | `/integrations/webhooks/{webhook_uuid}` | Update webhook |
| `DELETE` | `/integrations/webhooks/{webhook_uuid}` | Delete webhook |
| `GET` | `/integrations/webhooks/{webhook_uuid}/logs` | Delivery logs |
| `POST` | `/integrations/webhook-logs/{log_id}/retry` | Retry delivery |
| `GET` | `/integrations/sync-jobs` | List sync jobs |
| `POST` | `/integrations/sync-jobs` | Start sync job |
| `POST` | `/integrations/sync-jobs/{job_uuid}/retry` | Retry sync job |
| `GET` | `/integrations/field-mappings` | List field mappings |
| `POST` | `/integrations/field-mappings` | Create field mapping |
| `PUT/PATCH` | `/integrations/field-mappings/{mapping_uuid}` | Update field mapping |
| `DELETE` | `/integrations/field-mappings/{mapping_uuid}` | Delete field mapping |
| `GET` | `/integrations/rate-limits` | Rate limit status by provider/tenant |

Provider body:

```json
{
  "name": "Stripe",
  "code": "stripe",
  "type": "payment_gateway",
  "description": "Payment processing provider",
  "auth_type": "api_key",
  "base_url": "https://api.stripe.com",
  "status": "active",
  "config_schema": {
    "required": ["secret_key"],
    "properties": {
      "secret_key": { "type": "string", "secret": true }
    }
  }
}
```

Connect tenant integration body:

```json
{
  "tenant_uuid": "tenant_uuid",
  "provider_uuid": "provider_uuid",
  "status": "active",
  "settings": {
    "mode": "live",
    "webhook_events": ["invoice.paid", "payment.failed"]
  },
  "credentials": {
    "secret_key": "sk_live_xxx"
  }
}
```

Webhook body:

```json
{
  "tenant_uuid": "tenant_uuid",
  "provider_uuid": "provider_uuid",
  "url": "https://tenant.example.com/webhooks/stripe",
  "events": ["invoice.paid"],
  "secret": "generated_or_user_secret",
  "status": "active"
}
```

Sync job body:

```json
{
  "tenant_integration_uuid": "integration_uuid",
  "sync_type": "full",
  "entity": "customers",
  "date_from": "2026-08-01",
  "date_to": "2026-08-31"
}
```

# 15. Settings

Source tables: `platform_settings`, `platform_preferences`, `notification_templates`, recommended `backup_settings`, `backup_runs`.

## Platform Settings Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/settings` | Get all grouped platform settings |
| `GET` | `/settings/{group}` | Get one settings group: `general`, `billing`, `email`, `sms`, `storage`, `security`, `branding`, `tax`, `support` |
| `PUT` | `/settings/{group}` | Replace/update settings group |
| `POST` | `/settings/email/test` | Send test email |
| `POST` | `/settings/sms/test` | Send test SMS |
| `POST` | `/settings/storage/test` | Test storage disk |
| `GET` | `/settings/preferences` | Current platform user preferences |
| `PUT` | `/settings/preferences` | Update current platform user preferences |

Settings update body:

```json
{
  "settings": {
    "platform_name": "SaaS CRM",
    "support_email": "support@example.com",
    "default_currency": "INR",
    "default_timezone": "Asia/Kolkata",
    "invoice_prefix": "INV",
    "trial_days": 14,
    "password_min_length": 10,
    "mfa_required_for_admins": true
  }
}
```

Preferences body:

```json
{
  "theme": "light",
  "timezone": "Asia/Kolkata",
  "locale": "en",
  "date_format": "DD MMM YYYY",
  "table_density": "comfortable",
  "notifications": {
    "email": true,
    "browser": true
  }
}
```

## Notification Templates

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/settings/notification-templates` | List templates |
| `POST` | `/settings/notification-templates` | Create template |
| `GET` | `/settings/notification-templates/{template_uuid}` | Template detail |
| `PUT/PATCH` | `/settings/notification-templates/{template_uuid}` | Update template |
| `DELETE` | `/settings/notification-templates/{template_uuid}` | Delete template |
| `POST` | `/settings/notification-templates/{template_uuid}/preview` | Render preview with sample data |

Template body:

```json
{
  "code": "invoice_overdue",
  "channel": "email",
  "subject": "Invoice {{ invoice_number }} is overdue",
  "body": "Hello {{ tenant_name }}, your invoice is overdue.",
  "variables": ["invoice_number", "tenant_name", "due_date"],
  "status": "active"
}
```

## Backups

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/settings/backups` | Backup configuration summary |
| `PUT` | `/settings/backups` | Update backup configuration |
| `POST` | `/settings/backups/run` | Start manual backup |
| `GET` | `/settings/backups/runs` | Backup run history |
| `GET` | `/settings/backups/runs/{run_uuid}` | Backup run detail |
| `GET` | `/settings/backups/runs/{run_uuid}/download` | Download backup if allowed |

Backup settings body:

```json
{
  "enabled": true,
  "schedule": "0 2 * * *",
  "retention_days": 30,
  "include_files": true,
  "storage_disk": "s3",
  "notify_emails": ["ops@example.com"]
}
```

# 16. Audit Logs

Source tables: `platform_activity_logs`, `platform_security_events`, `subscription_logs`, `payment_logs`, `system_logs`, `remote_login_sessions`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/audit/activity-logs` | Staff/admin activity logs |
| `GET` | `/audit/security-events` | Security events and risk signals |
| `POST` | `/audit/security-events/{event_id}/review` | Mark reviewed, ignored, or escalated |
| `GET` | `/audit/subscription-logs` | Subscription lifecycle audit |
| `GET` | `/audit/payment-logs` | Billing/payment audit |
| `GET` | `/audit/system-logs` | System and job logs |
| `GET` | `/audit/remote-login-sessions` | Remote login/impersonation history |
| `POST` | `/audit/export` | Export audit records |

Common filters:

```http
GET /audit/activity-logs?actor_uuid=platform_user_uuid&subject_type=tenant&event=updated&date_from=2026-08-01&date_to=2026-08-31&ip_address=127.0.0.1
```

Review security event body:

```json
{
  "status": "reviewed",
  "severity": "medium",
  "notes": "Confirmed password reset was requested by account owner."
}
```

# 17. Files and Shared Utility APIs

Source tables: `files`, `attachments`, `notes`, `tags`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/files` | Upload file |
| `GET` | `/files/{file_uuid}` | File metadata |
| `GET` | `/files/{file_uuid}/download` | Signed download |
| `DELETE` | `/files/{file_uuid}` | Delete file if allowed |
| `GET` | `/attachments` | List attachments by attachable type/id |
| `POST` | `/attachments` | Attach existing uploaded file to a record |
| `DELETE` | `/attachments/{attachment_id}` | Remove attachment link |
| `GET` | `/notes` | List notes by noteable type/id |
| `POST` | `/notes` | Create note |
| `PUT/PATCH` | `/notes/{note_uuid}` | Update note |
| `DELETE` | `/notes/{note_uuid}` | Delete note |

Upload request:

```http
POST /api/platform/v1/files
Content-Type: multipart/form-data
```

Multipart fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | file | Yes | Uploaded file |
| `disk` | string | No | Default platform disk |
| `visibility` | string | No | `private`, `public` |
| `purpose` | string | No | `invoice`, `ticket`, `avatar`, `import`, `export` |

Attachment body:

```json
{
  "file_uuid": "file_uuid",
  "attachable_type": "tenant",
  "attachable_uuid": "tenant_uuid",
  "label": "Contract PDF"
}
```

Note body:

```json
{
  "noteable_type": "tenant",
  "noteable_uuid": "tenant_uuid",
  "visibility": "platform_internal",
  "body": "Tenant requested enterprise pricing follow-up.",
  "pinned": false
}
```

# 18. Master Data APIs

Source tables: `countries`, `states`, `cities`, `business_types`, `industries`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/master/countries` | Country list |
| `GET` | `/master/states?country_id=101` | States by country |
| `GET` | `/master/cities?state_id=12` | Cities by state |
| `GET` | `/master/business-types` | Business type list |
| `POST` | `/master/business-types` | Create business type |
| `PUT/PATCH` | `/master/business-types/{id}` | Update business type |
| `GET` | `/master/industries` | Industry list |
| `POST` | `/master/industries` | Create industry |
| `PUT/PATCH` | `/master/industries/{id}` | Update industry |

Business type/industry body:

```json
{
  "name": "Manufacturing",
  "code": "manufacturing",
  "status": "active",
  "sort_order": 10
}
```

# 19. Onboarding, Trial, Legal, Announcements

Recommended tables: `onboarding_checklists`, `tenant_onboarding_steps`, `legal_documents`, `tenant_legal_acceptances`, `platform_announcements`.

## Onboarding and Trial

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/onboarding/tenants` | Tenant onboarding progress |
| `GET` | `/onboarding/tenants/{tenant_uuid}` | Tenant onboarding detail |
| `PUT` | `/onboarding/tenants/{tenant_uuid}/steps/{step_code}` | Mark/update onboarding step |
| `GET` | `/trials` | Trial tenants with expiry/conversion status |
| `POST` | `/trials/{tenant_uuid}/extend` | Extend trial |
| `POST` | `/trials/{tenant_uuid}/convert` | Convert trial to paid subscription |

Convert trial body:

```json
{
  "plan_uuid": "plan_uuid",
  "billing_cycle": "monthly",
  "starts_at": "2026-08-05",
  "payment_method_uuid": "payment_method_uuid",
  "coupon_code": "YEARLY20"
}
```

## Legal Documents

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/legal/documents` | List legal documents |
| `POST` | `/legal/documents` | Create document version |
| `GET` | `/legal/documents/{document_uuid}` | Document detail |
| `PUT/PATCH` | `/legal/documents/{document_uuid}` | Update draft document |
| `POST` | `/legal/documents/{document_uuid}/publish` | Publish document version |
| `GET` | `/legal/documents/{document_uuid}/acceptances` | Tenant/user acceptances |

Legal document body:

```json
{
  "type": "terms_of_service",
  "version": "2026.08",
  "title": "Terms of Service",
  "content": "Markdown or HTML content",
  "effective_at": "2026-09-01T00:00:00Z",
  "requires_acceptance": true,
  "status": "draft"
}
```

## Announcements

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/announcements` | List announcements |
| `POST` | `/announcements` | Create announcement |
| `GET` | `/announcements/{announcement_uuid}` | Announcement detail |
| `PUT/PATCH` | `/announcements/{announcement_uuid}` | Update announcement |
| `POST` | `/announcements/{announcement_uuid}/publish` | Publish announcement |
| `POST` | `/announcements/{announcement_uuid}/archive` | Archive announcement |
| `DELETE` | `/announcements/{announcement_uuid}` | Delete draft announcement |

Announcement body:

```json
{
  "title": "Scheduled maintenance",
  "body": "Billing services will be unavailable for 15 minutes.",
  "audience": "all_tenants",
  "tenant_uuids": [],
  "severity": "info",
  "starts_at": "2026-08-10T18:00:00Z",
  "ends_at": "2026-08-10T19:00:00Z",
  "status": "draft"
}
```

# 20. Platform API Tokens

Recommended table: `platform_api_tokens` for machine-to-machine platform integrations.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api-tokens` | List platform API tokens |
| `POST` | `/api-tokens` | Create token |
| `GET` | `/api-tokens/{token_uuid}` | Token metadata |
| `POST` | `/api-tokens/{token_uuid}/rotate` | Rotate token secret |
| `POST` | `/api-tokens/{token_uuid}/revoke` | Revoke token |

Create token body:

```json
{
  "name": "BI Warehouse Export",
  "abilities": ["reports.read", "billing.read"],
  "expires_at": "2027-08-05T00:00:00Z",
  "allowed_ips": ["203.0.113.10"]
}
```

Create/rotate response includes raw token once:

```json
{
  "data": {
    "uuid": "token_uuid",
    "name": "BI Warehouse Export",
    "token": "plain_text_token_returned_once",
    "expires_at": "2027-08-05T00:00:00Z"
  }
}
```

# 21. Webhook/Event Delivery APIs

Recommended tables: `platform_webhook_endpoints`, `platform_webhook_deliveries`, `platform_events`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/webhook-endpoints` | List outbound platform webhook endpoints |
| `POST` | `/webhook-endpoints` | Create endpoint |
| `GET` | `/webhook-endpoints/{endpoint_uuid}` | Endpoint detail |
| `PUT/PATCH` | `/webhook-endpoints/{endpoint_uuid}` | Update endpoint |
| `DELETE` | `/webhook-endpoints/{endpoint_uuid}` | Delete endpoint |
| `GET` | `/webhook-endpoints/{endpoint_uuid}/deliveries` | Delivery history |
| `GET` | `/webhook-deliveries/{delivery_uuid}` | Delivery detail |
| `POST` | `/webhook-deliveries/{delivery_uuid}/retry` | Retry delivery |
| `GET` | `/events` | Internal platform event stream |

Webhook endpoint body:

```json
{
  "tenant_uuid": "tenant_uuid",
  "url": "https://example.com/platform-events",
  "events": ["tenant.created", "invoice.paid", "subscription.cancelled"],
  "secret": "generated_secret",
  "status": "active"
}
```

# 22. Endpoint Coverage Checklist

This API surface covers every platform page described in `docs/platform-pages.md` and the platform-side data model in `docs/database.md`:

| Area | Covered APIs |
| --- | --- |
| Overview dashboard | Dashboard summary, charts, recent records, alerts, export |
| Access control | Roles, permissions, role users, direct permissions, audit, bulk actions |
| Teams | Platform teams, team members, team roles, tenant/plan/module assignments |
| Platform staff | Staff CRUD, invite, roles, permissions, suspend, MFA/2FA, sessions |
| Tenants | Tenant CRUD, lifecycle, offices, users, modules, settings, usage, billing, impersonation |
| Subscriptions | Create/change/renew/pause/resume/cancel, add-ons, coupons, usage, invoice |
| Plans/features/add-ons | Catalog CRUD, clone, feature matrix, assignment to plans/subscriptions |
| Billing | Invoices, payments, refunds, PDFs, exports, retries |
| Coupons | Coupon setup, restrictions, redemption reporting |
| Modules | Module catalog, feature mapping, tenant overrides |
| Support | Tickets, comments, attachments, KB, remote login sessions |
| Reports | Revenue, tenant, billing, usage, support, security and staff reports |
| Monitoring | Services, logs, jobs, scheduler, alerts, incidents, usage snapshots |
| Integrations | Providers, tenant connections, credentials, webhooks, sync jobs, mappings |
| Settings | General platform settings, preferences, templates, backup configuration |
| Audit logs | Activity, security, billing, subscription, system and remote-login audits |
| Shared utilities | Files, attachments, notes, master data |
| Missing SaaS essentials added | Legal docs, announcements, API tokens, outbound platform webhooks |

Implementation priority should be: auth/session APIs, access control, tenants, plans/subscriptions/billing, then monitoring/support/settings. Each mutating endpoint should enforce platform permission checks and write audit records with actor, subject, before/after changes, IP address, user agent, and request id.