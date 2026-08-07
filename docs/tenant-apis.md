# Tenant APIs

This document defines the tenant CRM API surface for the tenant pages in `docs/tenant-pages.md`, aligned with the database design in `docs/database.md`.

Base URL:

```http
/api/tenant/v1
```

These APIs are for authenticated tenant users inside one tenant workspace. Platform owner/staff APIs are documented in `docs/platform-apis.md`.

## Common Headers

JSON requests:

```http
Authorization: Bearer {tenant_access_token}
Accept: application/json
Content-Type: application/json
X-Tenant: {tenant_uuid_or_slug}
X-Request-Id: {uuid}
X-Client-Version: web-tenant/1.0.0
```

Optional:

```http
Idempotency-Key: {uuid}
X-Timezone: Asia/Kolkata
X-Locale: en
X-Office: {office_uuid}
```

Multipart upload:

```http
Authorization: Bearer {tenant_access_token}
Accept: application/json
Content-Type: multipart/form-data
X-Tenant: {tenant_uuid_or_slug}
```

## Auth and Tenancy Rules

- Guard: `web` or dedicated tenant API guard.
- Auth table: `users`.
- Tenant RBAC tables: `roles`, `permissions`, `role_has_permissions`, `model_has_roles`, `model_has_permissions`.
- All tenant business queries must be scoped by the authenticated user's `tenant_id`.
- Use `{uuid}` for public IDs when available; for child rows without UUIDs, validate `{id}` against `tenant_id`.
- Mutating APIs must write `activity_logs` with actor, subject, old/new values, IP, user agent, and request ID.
- Secrets, bank accounts, tokens, and integration credentials are write-only after create/update and returned masked.

## Common Query Parameters

```http
?page=1&per_page=25&search=acme&sort=-created_at,name&include=owner,tags&fields=id,uuid,name,status&filter[status]=active&date_from=2026-08-01&date_to=2026-08-31&view=table
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
| `view` | `table`, `grid`, `kanban`, `calendar`, `gantt`, `agenda` |

## Standard Response Envelope

```json
{"data": {}, "meta": {"request_id": "uuid", "timestamp": "2026-08-06T12:00:00Z"}}
```

List:

```json
{"data": [], "links": {"first": "...", "last": "...", "prev": null, "next": "..."}, "meta": {"current_page": 1, "per_page": 25, "total": 125, "last_page": 5}}
```

Error:

```json
{"message": "Validation failed.", "error_code": "VALIDATION_FAILED", "errors": {"email": ["The email has already been taken."]}, "request_id": "uuid"}
```

## Common Status Codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 202 | Accepted for async import/export/report/payroll processing |
| 204 | No content |
| 400 | Business rule violation |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found in current tenant |
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
{"format": "xlsx", "columns": ["name", "status"], "filters": {}, "selected_ids": [], "timezone": "Asia/Kolkata"}
```

Import:

```json
{"file_uuid": "file_uuid", "mode": "create_or_update", "duplicate_strategy": "skip", "mapping": {"Name": "display_name", "Email": "email"}}
```

---

# 1. Auth, Profile, Dashboard

Data sources: `users`, `user_preferences`, `tenant_settings`, `notifications`, `activity_logs`, dashboard module tables.

## 1.1 Auth and Profile

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Login tenant user |
| POST | `/auth/logout` | authenticated | Revoke current token/session |
| POST | `/auth/refresh` | authenticated | Refresh access token |
| GET | `/auth/me` | authenticated | Current user, tenant, roles, permissions |
| POST | `/auth/forgot-password` | public | Send reset link |
| POST | `/auth/reset-password` | public | Reset password |
| POST | `/auth/verify-email/resend` | authenticated | Resend verification |
| POST | `/auth/2fa/enable` | `profile.security` | Enable 2FA |
| POST | `/auth/2fa/confirm` | `profile.security` | Confirm 2FA |
| POST | `/auth/2fa/disable` | `profile.security` | Disable 2FA |
| GET | `/profile` | `profile.view` | My profile |
| PUT/PATCH | `/profile` | `profile.edit` | Update profile |
| PUT | `/profile/password` | `profile.edit` | Change password |
| GET | `/profile/preferences` | `profile.view` | Preferences |
| PUT | `/profile/preferences` | `profile.edit` | Update preferences |
| GET | `/profile/sessions` | `profile.security` | Active sessions/tokens |
| DELETE | `/profile/sessions/{session_id}` | `profile.security` | Revoke session |
| GET | `/profile/api-tokens` | `profile.security` | List API tokens |
| POST | `/profile/api-tokens` | `profile.security` | Create API token |
| POST | `/profile/api-tokens/{token_uuid}/rotate` | `profile.security` | Rotate token |
| POST | `/profile/api-tokens/{token_uuid}/revoke` | `profile.security` | Revoke token |

Login body:

```json
{"tenant": "acme", "email": "owner@acme.example", "password": "StrongPassword#123", "remember": true, "device_name": "Chrome on Windows"}
```

Profile body:

```json
{"first_name": "Sahil", "last_name": "Admin", "display_name": "Sahil Admin", "mobile": "+919999999999", "profile_photo_file_id": "file_uuid", "timezone": "Asia/Kolkata", "locale": "en"}
```

Preferences body:

```json
{"theme": "light", "date_format": "DD MMM YYYY", "table_density": "comfortable", "dashboard_widgets": ["my_tasks", "calendar", "notifications"], "notifications": {"email": true, "browser": true, "sms": false}}
```

API token body:

```json
{"name": "Reporting Integration", "abilities": ["report.view", "report.export"], "expires_at": "2027-08-06T00:00:00Z"}
```

## 1.2 Dashboard and Navigation

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/navigation/sidebar` | authenticated | Tenant-aware sidebar and enabled modules |
| GET | `/dashboard/summary` | `dashboard.view` | KPI cards |
| GET | `/dashboard/charts/leads-pipeline` | `dashboard.view` | Leads by stage/source |
| GET | `/dashboard/charts/projects` | `dashboard.view` | Project status/progress |
| GET | `/dashboard/charts/tasks` | `dashboard.view` | Task completion |
| GET | `/dashboard/charts/revenue` | `dashboard.view` | Revenue and collection |
| GET | `/dashboard/charts/attendance` | `dashboard.view` | Attendance trend |
| GET | `/dashboard/charts/support` | `dashboard.view` | Issue volume |
| GET | `/dashboard/my-tasks` | `dashboard.view` | My task widget |
| GET | `/dashboard/upcoming-events` | `dashboard.view` | Calendar widget |
| GET | `/dashboard/recent-leads` | `dashboard.view` | Recent leads |
| GET | `/dashboard/overdue-invoices` | `dashboard.view` | Overdue invoices |
| GET | `/dashboard/recent-activities` | `activity_log.view` | Recent activities |
| GET | `/dashboard/widgets` | `dashboard.view` | Current user widgets |
| PUT | `/dashboard/widgets` | `dashboard.customize` | Save widget layout |
| POST | `/dashboard/export` | `dashboard.view` | Export dashboard snapshot |

Widget body:

```json
{"widgets": [{"code": "my_tasks", "position": 1, "visible": true, "settings": {"limit": 10}}, {"code": "calendar", "position": 2, "visible": true}]}
```

---

# 2. Access Control and Teams

Data sources: `roles`, `permissions`, RBAC pivots, `teams`, `team_roles`, `team_members`, `team_permissions`, `team_settings`, `team_assignments`, `users`, `staff`.

## 2.1 Roles and Permissions

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/access-control/roles` | `role.view` | List roles |
| POST | `/access-control/roles` | `role.create` | Create role |
| GET | `/access-control/roles/{role_uuid}` | `role.view` | View role |
| PUT/PATCH | `/access-control/roles/{role_uuid}` | `role.edit` | Update role |
| DELETE | `/access-control/roles/{role_uuid}` | `role.delete` | Delete custom unused role |
| POST | `/access-control/roles/{role_uuid}/clone` | `role.create` | Clone role |
| GET | `/access-control/roles/{role_uuid}/permissions` | `role.view` | Role permissions |
| PUT | `/access-control/roles/{role_uuid}/permissions` | `role.assign_permissions` | Replace permissions |
| GET | `/access-control/roles/{role_uuid}/users` | `role.view` | Role users |
| POST | `/access-control/roles/{role_uuid}/users` | `role.edit` | Assign users |
| DELETE | `/access-control/roles/{role_uuid}/users/{user_uuid}` | `role.edit` | Remove user |
| GET | `/access-control/roles/{role_uuid}/activity` | `activity_log.view` | Role audit |
| GET | `/access-control/permissions` | `permission.view` | List permissions |
| GET | `/access-control/permissions/grouped` | `permission.view` | Grouped permissions by module |
| GET | `/access-control/permissions/{permission_uuid}` | `permission.view` | View permission |
| POST | `/access-control/roles/export` | `role.view` | Export roles |

Role body:

```json
{"name": "project_manager", "display_name": "Project Manager", "guard_name": "web", "description": "Can manage projects and project tasks.", "status": "active", "permission_ids": ["permission_uuid_1", "permission_uuid_2"]}
```

Clone body:

```json
{"name": "project_manager_copy", "display_name": "Project Manager Copy", "copy_permissions": true, "status": "inactive"}
```

Assign users body:

```json
{"user_ids": ["user_uuid_1", "user_uuid_2"], "audit_reason": "Project team access update"}
```

## 2.2 Teams

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/teams` | `team.view` | List teams |
| POST | `/teams` | `team.create` | Create team |
| GET | `/teams/{team_uuid}` | `team.view` | View team |
| PUT/PATCH | `/teams/{team_uuid}` | `team.edit` | Update team |
| DELETE | `/teams/{team_uuid}` | `team.delete` | Archive/delete team |
| GET | `/teams/{team_uuid}/members` | `team.view` | Team members |
| POST | `/teams/{team_uuid}/members` | `team.assign` | Add members |
| PUT/PATCH | `/teams/{team_uuid}/members/{member_uuid}` | `team.assign` | Update member |
| DELETE | `/teams/{team_uuid}/members/{member_uuid}` | `team.assign` | Remove member |
| GET | `/teams/{team_uuid}/permissions` | `team.view` | Team permissions |
| PUT | `/teams/{team_uuid}/permissions` | `team.edit` | Replace team permissions |
| GET | `/teams/{team_uuid}/settings` | `team.view` | Team settings |
| PUT | `/teams/{team_uuid}/settings` | `team.edit` | Update team settings |
| GET | `/teams/{team_uuid}/assignments` | `team.view` | Team assignments |
| POST | `/teams/{team_uuid}/assignments` | `team.assign` | Create assignment |
| DELETE | `/teams/{team_uuid}/assignments/{assignment_id}` | `team.assign` | Release assignment |
| GET | `/team-roles` | `team.view` | List team roles |
| POST | `/team-roles` | `team.create` | Create team role |
| PUT/PATCH | `/team-roles/{team_role_uuid}` | `team.edit` | Update team role |
| DELETE | `/team-roles/{team_role_uuid}` | `team.delete` | Delete team role |
| POST | `/teams/export` | `team.view` | Export teams |

Team body:

```json
{"parent_team_id": null, "department_id": "department_uuid", "office_id": "office_uuid", "team_type_id": "lookup_uuid", "name": "Sales Team", "code": "sales", "description": "Handles leads and clients.", "lead_user_id": "user_uuid", "assistant_lead_user_id": null, "email": "sales@example.com", "phone": "+919999999999", "color": "#2563eb", "icon": "users", "visibility": "tenant", "is_default": false, "status": "active"}
```

Members body:

```json
{"members": [{"user_id": "user_uuid", "staff_id": "staff_uuid", "team_role_id": "team_role_uuid", "member_type": "primary", "allocation_percent": 100, "is_primary": true, "effective_from": "2026-08-06", "effective_to": null, "status": "active"}]}
```

Assignment body:

```json
{"assignable_type": "project", "assignable_id": "project_uuid", "assignment_role": "delivery_owner", "assigned_at": "2026-08-06T10:00:00Z", "status": "active"}
```

Allowed `assignable_type`: `lead`, `client`, `vendor`, `project`, `task`, `client_issue`, `calendar_event`.

---

# 3. Staff and Tenant Users

Data sources: `staff`, `users`, `departments`, `designations`, `tenant_offices`, `teams`, staff profile child tables, attendance, leave, payroll, projects, tasks.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/staff/dashboard` | `staff.view` | Staff dashboard |
| GET | `/staff` | `staff.view` | List staff |
| POST | `/staff` | `staff.create` | Create staff profile |
| GET | `/staff/{staff_uuid}` | `staff.view` | View staff profile |
| PUT/PATCH | `/staff/{staff_uuid}` | `staff.edit` | Update staff profile |
| DELETE | `/staff/{staff_uuid}` | `staff.delete` | Archive/delete staff |
| POST | `/staff/{staff_uuid}/restore` | `staff.edit` | Restore staff |
| POST | `/staff/import` | `staff.import` | Import staff |
| POST | `/staff/export` | `staff.export` | Export staff |
| GET/POST | `/staff/{staff_uuid}/employment-history` | `staff.view`/`staff.edit` | Employment history |
| GET/POST | `/staff/{staff_uuid}/bank-accounts` | `staff.manage_bank` | Staff bank accounts |
| PUT/PATCH | `/staff/{staff_uuid}/bank-accounts/{account_id}` | `staff.manage_bank` | Update bank account |
| DELETE | `/staff/{staff_uuid}/bank-accounts/{account_id}` | `staff.manage_bank` | Delete bank account |
| GET/POST | `/staff/{staff_uuid}/salary-structures` | `staff.manage_salary` | Salary structures |
| PUT/PATCH | `/staff/{staff_uuid}/salary-structures/{salary_id}` | `staff.manage_salary` | Update salary structure |
| GET/POST | `/staff/{staff_uuid}/documents` | `staff.view`/`staff.edit` | Staff documents |
| DELETE | `/staff/{staff_uuid}/documents/{document_id}` | `staff.edit` | Remove document |
| GET/POST | `/staff/{staff_uuid}/emergency-contacts` | `staff.view`/`staff.edit` | Emergency contacts |
| GET/POST | `/staff/{staff_uuid}/assets` | `staff.view`/`staff.edit` | Assigned assets |
| GET/POST | `/staff/{staff_uuid}/certifications` | `staff.view`/`staff.edit` | Certifications |
| GET/POST | `/staff/{staff_uuid}/appraisals` | `staff.view`/`staff.edit` | Appraisals |
| GET/POST | `/staff/{staff_uuid}/training` | `staff.view`/`staff.edit` | Training |
| GET | `/staff/{staff_uuid}/activity` | `activity_log.view` | Staff activity |
| GET | `/users` | `staff.view` | Tenant login users |
| POST | `/users/invite` | `staff.create` | Invite login user |
| GET | `/users/{user_uuid}` | `staff.view` | View login user |
| PUT/PATCH | `/users/{user_uuid}` | `staff.edit` | Update login user |
| PUT | `/users/{user_uuid}/roles` | `role.edit` | Replace roles |
| POST | `/users/{user_uuid}/suspend` | `staff.edit` | Suspend login |
| POST | `/users/{user_uuid}/activate` | `staff.edit` | Activate login |
| POST | `/users/{user_uuid}/reset-password` | `staff.edit` | Send reset link |

Staff body:

```json
{"employee_code": "EMP0001", "first_name": "Sahil", "last_name": "Khan", "display_name": "Sahil Khan", "personal_email": "sahil.personal@example.com", "work_email": "sahil@example.com", "mobile": "+919999999999", "gender": "male", "date_of_birth": "1995-01-01", "joining_date": "2026-08-06", "exit_date": null, "department_id": "department_uuid", "designation_id": "designation_uuid", "office_id": "office_uuid", "primary_team_id": "team_uuid", "reporting_manager_id": "user_uuid", "employment_type": "full_time", "employment_status": "active", "create_user": true, "role_ids": ["role_uuid"]}
```

Bank/salary/document bodies:

```json
{"account_holder_name": "Sahil Khan", "bank_name": "HDFC Bank", "account_number": "1234567890", "ifsc_code": "HDFC0000001", "is_primary": true}
```

```json
{"effective_from": "2026-08-01", "effective_to": null, "annual_ctc": "1200000.00", "monthly_gross": "100000.00", "currency": "INR"}
```

```json
{"document_type_id": "lookup_uuid", "file_id": "file_uuid", "document_number": "PAN123", "expiry_date": null}
```

---

# 4. CRM Parties, Clients, Vendors, Leads

Shared data sources: `parties`, `party_contacts`, `party_addresses`, `client_profiles`, `vendor_profiles`, `lead_profiles`, `lead_activities`, `communication_logs`.

## 4.1 Clients

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/clients` | `client.view` | List clients |
| POST | `/clients` | `client.create` | Create client |
| GET | `/clients/{client_uuid}` | `client.view` | View client |
| PUT/PATCH | `/clients/{client_uuid}` | `client.edit` | Update client |
| DELETE | `/clients/{client_uuid}` | `client.delete` | Archive/delete client |
| POST | `/clients/{client_uuid}/restore` | `client.edit` | Restore client |
| POST | `/clients/import` | `client.import` | Import clients |
| POST | `/clients/export` | `client.export` | Export clients |
| POST | `/clients/merge` | `client.merge` | Merge duplicates |
| GET/POST | `/clients/{client_uuid}/contacts` | `client.view`/`client.edit` | Contacts |
| PUT/PATCH | `/clients/{client_uuid}/contacts/{contact_uuid}` | `client.edit` | Update contact |
| DELETE | `/clients/{client_uuid}/contacts/{contact_uuid}` | `client.edit` | Delete contact |
| GET/POST | `/clients/{client_uuid}/addresses` | `client.view`/`client.edit` | Addresses |
| PUT/PATCH | `/clients/{client_uuid}/addresses/{address_id}` | `client.edit` | Update address |
| DELETE | `/clients/{client_uuid}/addresses/{address_id}` | `client.edit` | Delete address |
| GET | `/clients/{client_uuid}/projects` | `project.view` | Client projects |
| GET | `/clients/{client_uuid}/invoices` | `finance.invoice.view` | Client invoices |
| GET | `/clients/{client_uuid}/payments` | `finance.payment.view` | Client payments |
| GET | `/clients/{client_uuid}/renewals` | `renewal.view` | Client renewals |
| GET | `/clients/{client_uuid}/issues` | `issue.view` | Client support issues |
| GET | `/clients/{client_uuid}/activity` | `activity_log.view` | Client timeline |

Client body:

```json
{"party": {"party_type": "company", "display_name": "Acme Pvt Ltd", "legal_name": "Acme Private Limited", "email": "hello@acme.example", "phone": "+919999999999", "website": "https://acme.example", "gst_number": "27AAAAA0000A1Z5", "pan_number": "AAAAA0000A", "industry_id": "industry_uuid", "source_id": "lookup_uuid", "status_id": "lookup_uuid", "owner_user_id": "user_uuid", "metadata": {}}, "profile": {"client_code": "CL0001", "client_type": "enterprise", "credit_limit": "500000.00", "payment_terms_days": 30, "onboarding_date": "2026-08-06", "account_manager_id": "user_uuid"}, "contacts": [{"first_name": "Amit", "last_name": "Shah", "display_name": "Amit Shah", "email": "amit@acme.example", "mobile": "+919999999998", "designation": "CEO", "department": "Management", "is_primary": true, "portal_enabled": false, "status": "active"}], "addresses": [{"address_type": "billing", "address_line_1": "Address 1", "country_id": "country_uuid", "state_id": "state_uuid", "city_id": "city_uuid", "postal_code": "400001", "is_default": true}], "tag_ids": ["tag_uuid"], "custom_fields": {}}
```

Merge body:

```json
{"primary_client_id": "client_uuid", "duplicate_client_ids": ["client_uuid_2"], "field_strategy": "keep_primary", "move_related_records": true, "archive_duplicates": true, "reason": "Duplicate cleanup"}
```

## 4.2 Vendors

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/vendors` | `vendor.view` | List vendors |
| POST | `/vendors` | `vendor.create` | Create vendor |
| GET | `/vendors/{vendor_uuid}` | `vendor.view` | View vendor |
| PUT/PATCH | `/vendors/{vendor_uuid}` | `vendor.edit` | Update vendor |
| DELETE | `/vendors/{vendor_uuid}` | `vendor.delete` | Archive/delete vendor |
| POST | `/vendors/import` | `vendor.import` | Import vendors |
| POST | `/vendors/export` | `vendor.export` | Export vendors |
| GET/POST | `/vendors/{vendor_uuid}/contacts` | `vendor.view`/`vendor.edit` | Contacts |
| PUT/PATCH | `/vendors/{vendor_uuid}/contacts/{contact_uuid}` | `vendor.edit` | Update contact |
| GET/POST | `/vendors/{vendor_uuid}/addresses` | `vendor.view`/`vendor.edit` | Addresses |
| PUT/PATCH | `/vendors/{vendor_uuid}/addresses/{address_id}` | `vendor.edit` | Update address |
| GET/POST | `/vendors/{vendor_uuid}/bank-accounts` | `finance.bank_account.view`/`finance.bank_account.create` | Bank accounts |
| GET | `/vendors/{vendor_uuid}/expenses` | `finance.expense.view` | Vendor expenses |
| GET | `/vendors/{vendor_uuid}/renewals` | `renewal.view` | Vendor renewals |
| GET | `/vendors/{vendor_uuid}/activity` | `activity_log.view` | Vendor activity |

Vendor body:

```json
{"party": {"party_type": "company", "display_name": "Supply Co", "legal_name": "Supply Company", "email": "accounts@supply.example", "phone": "+919999999999", "industry_id": "industry_uuid", "source_id": "lookup_uuid", "status_id": "lookup_uuid", "owner_user_id": "user_uuid"}, "profile": {"vendor_code": "VN0001", "vendor_category_id": "lookup_uuid", "payment_terms_days": 15, "rating": 4, "account_manager_id": "user_uuid"}, "contacts": [], "addresses": [], "tag_ids": []}
```

## 4.3 Leads

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/leads/dashboard` | `lead.view` | Lead dashboard |
| GET | `/leads` | `lead.view` | List leads |
| GET | `/leads/kanban` | `lead.view` | Kanban pipeline |
| POST | `/leads` | `lead.create` | Create lead |
| GET | `/leads/{lead_uuid}` | `lead.view` | View lead |
| PUT/PATCH | `/leads/{lead_uuid}` | `lead.edit` | Update lead |
| DELETE | `/leads/{lead_uuid}` | `lead.delete` | Archive/delete lead |
| POST | `/leads/import` | `lead.import` | Import leads |
| POST | `/leads/export` | `lead.export` | Export leads |
| POST | `/leads/{lead_uuid}/duplicate` | `lead.create` | Duplicate lead |
| POST | `/leads/{lead_uuid}/convert` | `lead.convert` | Convert lead to client |
| POST | `/leads/{lead_uuid}/mark-lost` | `lead.edit` | Mark lost |
| GET/POST | `/leads/{lead_uuid}/activities` | `lead.view`/`lead.edit` | Activities |
| PUT/PATCH | `/leads/{lead_uuid}/activities/{activity_uuid}` | `lead.edit` | Update activity |
| POST | `/leads/merge` | `lead.edit` | Merge duplicate leads |
| GET | `/leads/{lead_uuid}/activity` | `activity_log.view` | Lead timeline |

Lead body:

```json
{"party": {"party_type": "company", "display_name": "Prospect Ltd", "email": "info@prospect.example", "phone": "+919999999999", "industry_id": "industry_uuid", "source_id": "lookup_uuid", "status_id": "lookup_uuid", "owner_user_id": "user_uuid"}, "profile": {"lead_number": "LD0001", "stage_id": "lookup_uuid", "priority_id": "lookup_uuid", "expected_value": "250000.00", "probability": 40, "expected_close_date": "2026-09-15"}, "contacts": [], "addresses": [], "tag_ids": []}
```

Lead activity body:

```json
{"activity_type": "call", "subject": "Discovery call", "description": "Discuss requirements.", "scheduled_at": "2026-08-07T10:00:00Z", "completed_at": null, "outcome": null, "assigned_to": "user_uuid"}
```

Convert body:

```json
{"client_code": "CL0002", "client_type": "enterprise", "account_manager_id": "user_uuid", "move_open_tasks": true, "create_project": false, "conversion_note": "Lead won after proposal approval."}
```

---

# 5. Projects, Tasks, To-Do, Issues

Data sources: `projects`, project child tables, `tasks`, task child tables, `todo_lists`, `client_issues`.

## 5.1 Projects

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/projects/dashboard` | `project.view` | Project dashboard |
| GET | `/projects` | `project.view` | List projects |
| GET | `/projects/kanban` | `project.view` | Kanban view |
| GET | `/projects/gantt` | `project.view` | Gantt data |
| GET | `/projects/calendar` | `project.view` | Calendar data |
| POST | `/projects` | `project.create` | Create project |
| GET | `/projects/{project_uuid}` | `project.view` | View project |
| PUT/PATCH | `/projects/{project_uuid}` | `project.edit` | Update project |
| DELETE | `/projects/{project_uuid}` | `project.delete` | Delete/archive project |
| POST | `/projects/{project_uuid}/archive` | `project.archive` | Archive project |
| POST | `/projects/export` | `project.view` | Export projects |
| GET/POST | `/projects/{project_uuid}/members` | `project.view`/`project.edit` | Members |
| PUT/PATCH | `/projects/{project_uuid}/members/{member_id}` | `project.edit` | Update member |
| DELETE | `/projects/{project_uuid}/members/{member_id}` | `project.edit` | Remove member |
| GET/POST | `/projects/{project_uuid}/phases` | `project.view`/`project.edit` | Phases |
| PUT/PATCH | `/projects/{project_uuid}/phases/{phase_id}` | `project.edit` | Update phase |
| DELETE | `/projects/{project_uuid}/phases/{phase_id}` | `project.edit` | Delete phase |
| GET/POST | `/projects/{project_uuid}/milestones` | `project.view`/`project.edit` | Milestones |
| PUT/PATCH | `/projects/{project_uuid}/milestones/{milestone_id}` | `project.edit` | Update milestone |
| POST | `/projects/{project_uuid}/milestones/{milestone_id}/complete` | `project.edit` | Complete milestone |
| GET | `/projects/{project_uuid}/tasks` | `task.view` | Project tasks |
| POST | `/projects/{project_uuid}/tasks` | `task.create` | Create project task |
| GET/POST | `/projects/{project_uuid}/time-logs` | `project.view`/`task.log_time` | Time logs |
| GET/POST | `/projects/{project_uuid}/expenses` | `finance.expense.view`/`finance.expense.create` | Project expenses |
| GET | `/projects/{project_uuid}/activity` | `activity_log.view` | Activity |

Project body:

```json
{"project_number": "PRJ0001", "name": "CRM Implementation", "description": "Implementation project.", "client_party_id": "client_uuid", "project_manager_id": "user_uuid", "category_id": "lookup_uuid", "type_id": "lookup_uuid", "status_id": "lookup_uuid", "priority_id": "lookup_uuid", "start_date": "2026-08-06", "due_date": "2026-10-31", "budget_amount": "500000.00", "billing_type": "fixed", "progress": 0}
```

## 5.2 Tasks and To-Do

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/tasks/dashboard` | `task.view` | Task dashboard |
| GET | `/tasks` | `task.view` | List tasks |
| GET | `/tasks/kanban` | `task.view` | Kanban view |
| GET | `/tasks/calendar` | `task.view` | Calendar view |
| GET | `/tasks/my` | `task.view` | My tasks |
| GET | `/tasks/team` | `task.view` | Team tasks |
| POST | `/tasks` | `task.create` | Create task |
| GET | `/tasks/{task_uuid}` | `task.view` | View task |
| PUT/PATCH | `/tasks/{task_uuid}` | `task.edit` | Update task |
| DELETE | `/tasks/{task_uuid}` | `task.delete` | Delete/archive task |
| POST | `/tasks/{task_uuid}/assign` | `task.assign` | Reassign task |
| POST | `/tasks/{task_uuid}/status` | `task.edit` | Change status |
| POST | `/tasks/{task_uuid}/complete` | `task.edit` | Mark complete |
| POST | `/tasks/{task_uuid}/clone` | `task.create` | Clone task |
| POST | `/tasks/bulk/update` | `task.edit` | Bulk update |
| POST | `/tasks/export` | `task.view` | Export tasks |
| GET/POST | `/tasks/{task_uuid}/checklists` | `task.view`/`task.edit` | Checklists |
| POST | `/tasks/{task_uuid}/checklists/{checklist_id}/items` | `task.edit` | Add checklist item |
| PUT/PATCH | `/tasks/{task_uuid}/checklist-items/{item_id}` | `task.edit` | Update checklist item |
| POST | `/tasks/{task_uuid}/checklist-items/{item_id}/complete` | `task.edit` | Complete checklist item |
| GET/POST | `/tasks/{task_uuid}/comments` | `task.view`/`task.edit` | Comments |
| PUT/PATCH | `/tasks/{task_uuid}/comments/{comment_id}` | `task.edit` | Update comment |
| DELETE | `/tasks/{task_uuid}/comments/{comment_id}` | `task.edit` | Delete comment |
| GET/POST | `/tasks/{task_uuid}/dependencies` | `task.view`/`task.edit` | Dependencies |
| DELETE | `/tasks/{task_uuid}/dependencies/{dependency_id}` | `task.edit` | Remove dependency |
| GET/POST | `/tasks/{task_uuid}/watchers` | `task.view`/`task.edit` | Watchers |
| DELETE | `/tasks/{task_uuid}/watchers/{user_uuid}` | `task.edit` | Remove watcher |
| GET/POST | `/tasks/{task_uuid}/time-logs` | `task.view`/`task.log_time` | Time logs |
| PUT/PATCH | `/tasks/{task_uuid}/time-logs/{time_log_id}` | `task.log_time` | Update time log |
| GET | `/tasks/{task_uuid}/activity` | `activity_log.view` | Activity |
| GET | `/todo-lists` | `todo.view` | To-do lists |
| POST | `/todo-lists` | `todo.create` | Create list |
| GET | `/todo-lists/{todo_list_uuid}` | `todo.view` | View list |
| PUT/PATCH | `/todo-lists/{todo_list_uuid}` | `todo.edit` | Update list |
| DELETE | `/todo-lists/{todo_list_uuid}` | `todo.delete` | Delete/archive list |
| POST | `/todo-lists/{todo_list_uuid}/share` | `todo.share` | Share list |
| GET | `/todo-lists/{todo_list_uuid}/tasks` | `todo.view` | List tasks in to-do list |

Task body:

```json
{"task_number": "TSK0001", "parent_task_id": null, "project_id": "project_uuid", "related_type": "client", "related_id": "client_uuid", "title": "Prepare proposal", "description": "Draft scope and commercial proposal.", "status_id": "lookup_uuid", "priority_id": "lookup_uuid", "category_id": "lookup_uuid", "assigned_to": "user_uuid", "assigned_team_id": null, "start_at": "2026-08-06T09:00:00Z", "due_at": "2026-08-10T18:00:00Z", "estimated_minutes": 240, "actual_minutes": 0, "progress": 0, "is_recurring": false, "recurrence_rule": null}
```

## 5.3 Client Issues

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/issues/dashboard` | `issue.view` | Issue dashboard |
| GET | `/issues` | `issue.view` | List issues |
| GET | `/issues/kanban` | `issue.view` | Kanban view |
| POST | `/issues` | `issue.create` | Create issue |
| GET | `/issues/{issue_uuid}` | `issue.view` | View issue |
| PUT/PATCH | `/issues/{issue_uuid}` | `issue.edit` | Update issue |
| DELETE | `/issues/{issue_uuid}` | `issue.delete` | Delete/archive issue |
| POST | `/issues/{issue_uuid}/assign` | `issue.assign` | Assign issue |
| POST | `/issues/{issue_uuid}/status` | `issue.edit` | Change status |
| POST | `/issues/{issue_uuid}/resolve` | `issue.close` | Resolve issue |
| POST | `/issues/{issue_uuid}/close` | `issue.close` | Close issue |
| POST | `/issues/{issue_uuid}/reopen` | `issue.close` | Reopen issue |
| GET/POST | `/issues/{issue_uuid}/time-logs` | `issue.view`/`task.log_time` | Time logs |
| POST | `/issues/{issue_uuid}/create-task` | `task.create` | Create linked task |
| GET | `/issues/{issue_uuid}/activity` | `activity_log.view` | Activity |
| POST | `/issues/export` | `issue.view` | Export issues |

Issue body:

```json
{"issue_number": "ISS0001", "client_party_id": "client_uuid", "contact_id": "contact_uuid", "project_id": "project_uuid", "title": "Login page issue", "description": "Client cannot access portal.", "type_id": "lookup_uuid", "category_id": "lookup_uuid", "status_id": "lookup_uuid", "priority_id": "lookup_uuid", "assigned_to": "user_uuid", "assigned_team_id": null, "due_at": "2026-08-08T18:00:00Z"}
```

---

# 6. Renewals, Calendar, HRMS

## 6.1 Renewals

Data sources: `renewals`, `renewal_items`, `renewal_history`, `renewal_reminders`, `parties`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/renewals/dashboard` | `renewal.view` | Renewals dashboard |
| GET | `/renewals` | `renewal.view` | List all renewals |
| GET | `/renewals/calendar` | `renewal.view` | Calendar view |
| GET | `/client-renewals` | `renewal.view` | Client renewal list |
| GET | `/vendor-renewals` | `renewal.view` | Vendor renewal list |
| POST | `/renewals` | `renewal.create` | Create renewal |
| GET | `/renewals/{renewal_uuid}` | `renewal.view` | View renewal |
| PUT/PATCH | `/renewals/{renewal_uuid}` | `renewal.edit` | Update renewal |
| DELETE | `/renewals/{renewal_uuid}` | `renewal.delete` | Delete/archive renewal |
| POST | `/renewals/{renewal_uuid}/renew` | `renewal.renew` | Renew/extend |
| POST | `/renewals/{renewal_uuid}/cancel` | `renewal.edit` | Cancel renewal |
| GET/POST | `/renewals/{renewal_uuid}/items` | `renewal.view`/`renewal.edit` | Line items |
| PUT/PATCH | `/renewals/{renewal_uuid}/items/{item_id}` | `renewal.edit` | Update item |
| DELETE | `/renewals/{renewal_uuid}/items/{item_id}` | `renewal.edit` | Delete item |
| GET | `/renewals/{renewal_uuid}/history` | `renewal.view` | History |
| GET/POST | `/renewals/{renewal_uuid}/reminders` | `renewal.view`/`renewal.edit` | Reminders |
| PUT/PATCH | `/renewals/{renewal_uuid}/reminders/{reminder_id}` | `renewal.edit` | Update reminder |
| POST | `/renewals/{renewal_uuid}/send-reminder` | `renewal.edit` | Send reminder |
| POST | `/renewals/export` | `renewal.view` | Export renewals |

Renewal body:

```json
{"renewal_number": "REN0001", "party_id": "client_or_vendor_uuid", "renewal_type": "client_contract", "title": "Annual AMC", "description": "Annual support contract.", "start_date": "2026-08-01", "end_date": "2027-07-31", "renewal_date": "2027-07-15", "amount": "120000.00", "currency": "INR", "reminder_days_before": 30, "auto_renew": false, "status_id": "lookup_uuid", "owner_user_id": "user_uuid", "items": [{"name": "AMC", "quantity": 1, "unit_price": "120000.00", "amount": "120000.00"}]}
```

## 6.2 Calendar, Meetings, Reminders

Data sources: `calendars`, `calendar_events`, `calendar_event_attendees`, `calendar_event_reminders`, `meeting_rooms`, `meeting_room_bookings`, `video_meetings`, `calendar_sync_logs`, `reminders`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/calendars` | `calendar.view` | List calendars |
| POST | `/calendars` | `calendar.create` | Create calendar |
| GET | `/calendars/{calendar_uuid}` | `calendar.view` | View calendar |
| PUT/PATCH | `/calendars/{calendar_uuid}` | `calendar.edit` | Update calendar |
| DELETE | `/calendars/{calendar_uuid}` | `calendar.delete` | Delete calendar |
| GET | `/calendar-events` | `calendar.view` | List events |
| POST | `/calendar-events` | `calendar.create` | Create event |
| GET | `/calendar-events/{event_uuid}` | `calendar.view` | View event |
| PUT/PATCH | `/calendar-events/{event_uuid}` | `calendar.edit` | Update event |
| DELETE | `/calendar-events/{event_uuid}` | `calendar.delete` | Cancel/delete event |
| POST | `/calendar-events/{event_uuid}/reschedule` | `calendar.edit` | Reschedule |
| GET/POST | `/calendar-events/{event_uuid}/attendees` | `calendar.view`/`calendar.edit` | Attendees |
| PUT/PATCH | `/calendar-events/{event_uuid}/attendees/{attendee_id}` | `calendar.edit` | Update response |
| GET/POST | `/calendar-events/{event_uuid}/reminders` | `calendar.view`/`calendar.edit` | Event reminders |
| POST | `/calendar-events/{event_uuid}/video-meeting` | `calendar.edit` | Create/update video meeting |
| POST | `/calendar-events/{event_uuid}/room-booking` | `calendar.edit` | Book meeting room |
| GET | `/meeting-rooms` | `calendar.view` | List rooms |
| POST | `/meeting-rooms` | `calendar.manage_team` | Create room |
| PUT/PATCH | `/meeting-rooms/{room_id}` | `calendar.manage_team` | Update room |
| GET/POST | `/reminders` | authenticated | My reminders/create reminder |
| PUT/PATCH | `/reminders/{reminder_uuid}` | authenticated | Update reminder |
| DELETE | `/reminders/{reminder_uuid}` | authenticated | Delete reminder |

Event body:

```json
{"calendar_id": "calendar_uuid", "related_type": "lead", "related_id": "lead_uuid", "title": "Proposal Review", "description": "Review proposal with client.", "location": "Online", "starts_at": "2026-08-08T10:00:00Z", "ends_at": "2026-08-08T11:00:00Z", "timezone": "Asia/Kolkata", "all_day": false, "recurrence_rule": null, "status": "confirmed", "attendees": [{"attendee_type": "user", "user_id": "user_uuid"}, {"attendee_type": "contact", "contact_id": "contact_uuid"}], "reminders": [{"channel": "email", "remind_at": "2026-08-08T09:30:00Z"}]}
```

## 6.3 Attendance and Leave

Data sources: `attendance_records`, `shifts`, `staff_shift_assignments`, `leave_types`, `leave_requests`, `leave_balances`, recommended `attendance_requests`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/attendance/dashboard` | `attendance.view` | Attendance dashboard |
| GET | `/attendance/daily` | `attendance.view` | Daily attendance |
| GET | `/attendance/monthly` | `attendance.view` | Monthly grid |
| POST | `/attendance/check-in` | authenticated | Current user check-in |
| POST | `/attendance/check-out` | authenticated | Current user check-out |
| POST | `/attendance/records` | `attendance.create` | Create/mark attendance |
| GET | `/attendance/records/{record_id}` | `attendance.view` | View record |
| PUT/PATCH | `/attendance/records/{record_id}` | `attendance.edit` | Update record |
| POST | `/attendance/import` | `attendance.edit` | Import attendance |
| POST | `/attendance/export` | `attendance.export` | Export attendance |
| GET | `/attendance/requests` | `attendance.view` | Correction requests |
| POST | `/attendance/requests` | authenticated | Request correction |
| GET | `/attendance/requests/{request_uuid}` | `attendance.view` | View request |
| POST | `/attendance/requests/{request_uuid}/approve` | `attendance.approve` | Approve request |
| POST | `/attendance/requests/{request_uuid}/reject` | `attendance.approve` | Reject request |
| GET | `/leave/dashboard` | `leave.view` | Leave dashboard |
| GET | `/leave/requests` | `leave.view` | List leave requests |
| POST | `/leave/requests` | `leave.apply` | Apply leave |
| GET | `/leave/requests/{request_id}` | `leave.view` | View leave request |
| PUT/PATCH | `/leave/requests/{request_id}` | `leave.apply` | Update pending request |
| POST | `/leave/requests/{request_id}/approve` | `leave.approve` | Approve leave |
| POST | `/leave/requests/{request_id}/reject` | `leave.approve` | Reject leave |
| POST | `/leave/requests/{request_id}/cancel` | `leave.apply` | Cancel leave |
| GET | `/leave/balances` | `leave.view` | Leave balances |
| PUT/PATCH | `/leave/balances/{balance_id}` | `leave.manage_balance` | Adjust balance |
| GET | `/leave/calendar` | `leave.view` | Leave calendar |
| GET/POST | `/leave/types` | `setting.view`/`setting.edit` | Leave types |
| PUT/PATCH | `/leave/types/{leave_type_id}` | `setting.edit` | Update leave type |

Attendance and leave bodies:

```json
{"staff_id": "staff_uuid", "attendance_date": "2026-08-06", "check_in_at": "2026-08-06T09:05:00Z", "check_out_at": "2026-08-06T18:00:00Z", "total_minutes": 535, "status_id": "lookup_uuid"}
```

```json
{"attendance_record_id": 123, "request_type": "check_in_correction", "requested_check_in_at": "2026-08-06T09:00:00Z", "requested_check_out_at": null, "reason": "Forgot to check in after office entry."}
```

```json
{"staff_id": "staff_uuid", "leave_type_id": "leave_type_id", "start_date": "2026-08-20", "end_date": "2026-08-21", "total_days": 2, "reason": "Personal work", "attachments": ["file_uuid"]}
```

## 6.4 Payroll

Data sources: payroll tables listed in `docs/database.md`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/payroll/dashboard` | `payroll.view` | Payroll dashboard |
| GET | `/payroll/cycles` | `payroll.view` | Payroll cycles |
| POST | `/payroll/cycles` | `payroll.generate` | Create cycle |
| GET | `/payroll/cycles/{cycle_uuid}` | `payroll.view` | View cycle |
| PUT/PATCH | `/payroll/cycles/{cycle_uuid}` | `payroll.generate` | Update cycle |
| POST | `/payroll/cycles/{cycle_uuid}/generate-preview` | `payroll.generate` | Generate preview |
| POST | `/payroll/cycles/{cycle_uuid}/generate` | `payroll.generate` | Generate payroll |
| POST | `/payroll/cycles/{cycle_uuid}/submit` | `payroll.generate` | Submit approval |
| POST | `/payroll/cycles/{cycle_uuid}/approve` | `payroll.approve` | Approve cycle |
| POST | `/payroll/cycles/{cycle_uuid}/lock` | `payroll.approve` | Lock cycle |
| POST | `/payroll/cycles/{cycle_uuid}/reopen` | `payroll.approve` | Reopen cycle |
| GET | `/payroll/payrolls` | `payroll.view` | Payroll history |
| GET | `/payroll/payrolls/{payroll_uuid}` | `payroll.view` | Payroll detail |
| PUT/PATCH | `/payroll/payrolls/{payroll_uuid}` | `payroll.generate` | Update payroll draft |
| GET | `/payroll/payrolls/{payroll_uuid}/items` | `payroll.view` | Payroll lines |
| GET | `/payroll/payslips` | `payroll.view` | Payslips |
| POST | `/payroll/payslips/generate` | `payroll.generate` | Generate payslips |
| POST | `/payroll/payslips/email` | `payroll.generate` | Email payslips |
| GET | `/payroll/payslips/{payslip_id}/download` | `payroll.view` | Download payslip |
| GET/POST | `/payroll/component-types` | `payroll.manage_settings` | Component types |
| GET/POST | `/payroll/components` | `payroll.manage_settings` | Components |
| PUT/PATCH | `/payroll/components/{component_id}` | `payroll.manage_settings` | Update component |
| GET/POST | `/payroll/component-assignments` | `payroll.manage_settings` | Staff assignments |
| GET/POST | `/payroll/loans` | `payroll.manage_settings` | Staff loans |
| PUT/PATCH | `/payroll/loans/{loan_id}` | `payroll.manage_settings` | Update loan |
| GET/POST | `/payroll/reimbursements` | `payroll.view`/`payroll.generate` | Reimbursements |
| POST | `/payroll/reimbursements/{reimbursement_id}/approve` | `payroll.approve` | Approve reimbursement |
| GET/POST | `/payroll/bank-transfers` | `payroll.view`/`payroll.generate` | Bank transfers |
| POST | `/payroll/bank-transfers/{transfer_id}/mark-paid` | `payroll.generate` | Mark paid |
| GET/POST | `/payroll/tax-slabs` | `payroll.manage_settings` | Tax slabs |
| GET/PUT | `/payroll/pf-settings` | `payroll.manage_settings` | PF settings |
| GET/PUT | `/payroll/esi-settings` | `payroll.manage_settings` | ESI settings |
| POST | `/payroll/export` | `payroll.export` | Export payroll data |

Cycle/generate bodies:

```json
{"cycle_name": "August 2026 Payroll", "payroll_month": 8, "payroll_year": 2026, "period_start": "2026-08-01", "period_end": "2026-08-31", "payment_date": "2026-09-05", "status": "draft", "remarks": null}
```

```json
{"staff_ids": ["staff_uuid"], "department_ids": [], "salary_effective_date": "2026-08-31", "include_overtime": true, "include_reimbursements": true, "include_loan_deductions": true, "attendance_source": "attendance_records", "leave_source": "leave_requests"}
```

## 6.5 Holidays

Data sources: `holiday_calendars`, `holidays`, `holiday_applicabilities`, `holiday_groups`, `holiday_group_members`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/holidays` | `holiday.view` | List holidays |
| POST | `/holidays` | `holiday.create` | Create holiday |
| GET | `/holidays/{holiday_uuid}` | `holiday.view` | View holiday |
| PUT/PATCH | `/holidays/{holiday_uuid}` | `holiday.edit` | Update holiday |
| DELETE | `/holidays/{holiday_uuid}` | `holiday.delete` | Delete holiday |
| POST | `/holidays/{holiday_uuid}/duplicate-next-year` | `holiday.create` | Duplicate to next year |
| POST | `/holidays/import` | `holiday.create` | Import holidays |
| POST | `/holidays/export` | `holiday.view` | Export holidays |
| GET/POST | `/holiday-calendars` | `holiday.view`/`holiday.create` | Holiday calendars |
| GET | `/holiday-calendars/{calendar_uuid}` | `holiday.view` | View calendar |
| PUT/PATCH | `/holiday-calendars/{calendar_uuid}` | `holiday.edit` | Update calendar |
| DELETE | `/holiday-calendars/{calendar_uuid}` | `holiday.delete` | Delete calendar |
| GET/POST | `/holiday-groups` | `holiday.view`/`holiday.create` | Holiday groups |
| PUT/PATCH | `/holiday-groups/{group_uuid}` | `holiday.edit` | Update group |
| GET/POST | `/holiday-groups/{group_uuid}/members` | `holiday.view`/`holiday.edit` | Group members |
| DELETE | `/holiday-groups/{group_uuid}/members/{staff_uuid}` | `holiday.edit` | Remove member |

Holiday body:

```json
{"holiday_calendar_id": "calendar_uuid", "name": "Independence Day", "type_id": "lookup_uuid", "category_id": "lookup_uuid", "holiday_date": "2026-08-15", "start_date": "2026-08-15", "end_date": "2026-08-15", "total_days": 1, "is_half_day": false, "half_day_session": null, "recurring_yearly": true, "optional_holiday": false, "applicable_to_all": true, "description": "National holiday", "color": "#16a34a", "applicabilities": [{"applicable_type": "country", "applicable_id": "country_uuid"}]}
```

---

# 7. Tenant Finance

Data sources: `tenant_invoices`, `tenant_invoice_items`, `tenant_payments`, `tenant_expenses`, `tenant_expense_items`, `bank_accounts`, `parties`, `projects`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/finance/dashboard` | `finance.invoice.view` | Finance dashboard |
| GET | `/finance/invoices` | `finance.invoice.view` | List invoices |
| POST | `/finance/invoices` | `finance.invoice.create` | Create invoice |
| GET | `/finance/invoices/{invoice_uuid}` | `finance.invoice.view` | View invoice |
| PUT/PATCH | `/finance/invoices/{invoice_uuid}` | `finance.invoice.edit` | Update draft invoice |
| DELETE | `/finance/invoices/{invoice_uuid}` | `finance.invoice.cancel` | Delete/cancel invoice |
| POST | `/finance/invoices/{invoice_uuid}/send` | `finance.invoice.send` | Send invoice |
| GET | `/finance/invoices/{invoice_uuid}/download` | `finance.invoice.view` | Download PDF |
| POST | `/finance/invoices/{invoice_uuid}/generate-pdf` | `finance.invoice.edit` | Generate PDF |
| POST | `/finance/invoices/{invoice_uuid}/cancel` | `finance.invoice.cancel` | Cancel invoice |
| GET/POST | `/finance/invoices/{invoice_uuid}/items` | `finance.invoice.view`/`finance.invoice.edit` | Invoice items |
| PUT/PATCH | `/finance/invoices/{invoice_uuid}/items/{item_id}` | `finance.invoice.edit` | Update item |
| DELETE | `/finance/invoices/{invoice_uuid}/items/{item_id}` | `finance.invoice.edit` | Delete item |
| GET | `/finance/payments` | `finance.payment.view` | List payments |
| POST | `/finance/payments` | `finance.payment.create` | Record payment |
| GET | `/finance/payments/{payment_uuid}` | `finance.payment.view` | View payment |
| PUT/PATCH | `/finance/payments/{payment_uuid}` | `finance.payment.edit` | Update pending payment |
| POST | `/finance/payments/{payment_uuid}/void` | `finance.payment.edit` | Void payment |
| GET | `/finance/expenses` | `finance.expense.view` | List expenses |
| POST | `/finance/expenses` | `finance.expense.create` | Create expense |
| GET | `/finance/expenses/{expense_uuid}` | `finance.expense.view` | View expense |
| PUT/PATCH | `/finance/expenses/{expense_uuid}` | `finance.expense.edit` | Update expense |
| DELETE | `/finance/expenses/{expense_uuid}` | `finance.expense.edit` | Delete expense |
| POST | `/finance/expenses/{expense_uuid}/approve` | `finance.expense.approve` | Approve expense |
| POST | `/finance/expenses/{expense_uuid}/reject` | `finance.expense.approve` | Reject expense |
| GET/POST | `/finance/expenses/{expense_uuid}/items` | `finance.expense.view`/`finance.expense.edit` | Expense items |
| GET | `/finance/bank-accounts` | `finance.bank_account.view` | List bank accounts |
| POST | `/finance/bank-accounts` | `finance.bank_account.create` | Create bank account |
| GET | `/finance/bank-accounts/{account_id}` | `finance.bank_account.view` | View bank account |
| PUT/PATCH | `/finance/bank-accounts/{account_id}` | `finance.bank_account.edit` | Update bank account |
| DELETE | `/finance/bank-accounts/{account_id}` | `finance.bank_account.delete` | Delete bank account |
| POST | `/finance/bank-accounts/{account_id}/set-primary` | `finance.bank_account.edit` | Set primary |
| POST | `/finance/export` | `finance.invoice.view` | Export finance data |

Invoice/payment/expense bodies:

```json
{"invoice_number": "INV0001", "client_party_id": "client_uuid", "project_id": "project_uuid", "invoice_date": "2026-08-06", "due_date": "2026-09-05", "currency": "INR", "status": "draft", "items": [{"item_name": "Implementation", "description": "CRM setup", "quantity": 1, "unit_price": "100000.00", "tax_rate": "18.00", "amount": "100000.00"}], "discount_amount": "0.00"}
```

```json
{"invoice_id": "invoice_uuid", "client_party_id": "client_uuid", "payment_number": "PAY0001", "amount": "50000.00", "currency": "INR", "method": "bank_transfer", "reference": "UTR123", "status": "success", "paid_at": "2026-08-06T12:00:00Z"}
```

```json
{"vendor_party_id": "vendor_uuid", "project_id": "project_uuid", "expense_number": "EXP0001", "category_id": "lookup_uuid", "amount": "10000.00", "currency": "INR", "expense_date": "2026-08-06", "status_id": "lookup_uuid", "items": [{"description": "Software license", "quantity": 1, "unit_price": "10000.00", "tax_amount": "1800.00", "amount": "10000.00"}]}
```

---

# 8. Files, Notifications, Reports

## 8.1 Files, Attachments, Notes, Tags, Custom Fields

Data sources: `files`, `attachments`, `notes`, `tags`, `taggables`, `custom_fields`, `custom_field_values`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/files` | `document.view` | List files/documents |
| POST | `/files` | `document.upload` | Upload file |
| GET | `/files/{file_uuid}` | `document.view` | File metadata |
| GET | `/files/{file_uuid}/download` | `document.view` | Signed download |
| DELETE | `/files/{file_uuid}` | `document.delete` | Delete file if allowed |
| GET | `/attachments` | authenticated | List attachments by attachable |
| POST | `/attachments` | authenticated | Attach existing file |
| DELETE | `/attachments/{attachment_id}` | authenticated | Detach file |
| GET | `/notes` | authenticated | List notes by notable |
| POST | `/notes` | authenticated | Create note |
| PUT/PATCH | `/notes/{note_uuid}` | authenticated | Update note |
| DELETE | `/notes/{note_uuid}` | authenticated | Delete note |
| GET | `/tags` | authenticated | List tags |
| POST | `/tags` | `setting.edit` | Create tag |
| PUT/PATCH | `/tags/{tag_uuid}` | `setting.edit` | Update tag |
| DELETE | `/tags/{tag_uuid}` | `setting.edit` | Delete unused tag |
| POST | `/taggables` | authenticated | Tag a record |
| DELETE | `/taggables` | authenticated | Remove tag |
| GET | `/custom-fields` | `setting.view` | List custom fields |
| POST | `/custom-fields` | `setting.edit` | Create custom field |
| PUT/PATCH | `/custom-fields/{field_uuid}` | `setting.edit` | Update field |
| DELETE | `/custom-fields/{field_uuid}` | `setting.edit` | Delete field |
| GET | `/custom-field-values` | authenticated | Values for record |
| PUT | `/custom-field-values` | authenticated | Replace values for record |

Multipart upload fields: `file` required, optional `disk`, `visibility=private|tenant|public`, `purpose=avatar|document|invoice|import|export`.

Attachment/note/custom field bodies:

```json
{"file_uuid": "file_uuid", "attachable_type": "client", "attachable_uuid": "client_uuid", "label": "Contract PDF"}
```

```json
{"notable_type": "client", "notable_uuid": "client_uuid", "note": "Client requested revised proposal.", "visibility": "tenant_internal"}
```

```json
{"entity_type": "client", "name": "Customer Segment", "code": "customer_segment", "field_type": "select", "options": ["SMB", "Enterprise"], "validation_rules": {"required": false}, "is_required": false, "sort_order": 10, "status": "active"}
```

## 8.2 Notifications and Communication

Data sources: `notifications`, `communication_logs`, recommended tenant-scoped `notification_templates`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | `notification.view` | List notifications |
| GET | `/notifications/unread-count` | `notification.view` | Unread count |
| POST | `/notifications/{notification_id}/read` | `notification.manage` | Mark read |
| POST | `/notifications/{notification_id}/unread` | `notification.manage` | Mark unread |
| POST | `/notifications/bulk/read` | `notification.manage` | Bulk mark read |
| DELETE | `/notifications/{notification_id}` | `notification.manage` | Delete notification |
| GET | `/communication/logs` | `setting.view` | Communication logs |
| POST | `/communication/logs/{log_uuid}/retry` | `setting.edit` | Retry failed message |
| POST | `/communication/send-email` | authenticated | Send email to party/contact |
| POST | `/communication/send-sms` | authenticated | Send SMS |
| POST | `/communication/send-whatsapp` | authenticated | Send WhatsApp |
| GET | `/settings/notification-templates` | `setting.view` | Templates |
| POST | `/settings/notification-templates` | `setting.edit` | Create template |
| PUT/PATCH | `/settings/notification-templates/{template_uuid}` | `setting.edit` | Update template |
| POST | `/settings/notification-templates/{template_uuid}/preview` | `setting.view` | Preview template |
| POST | `/settings/notification-templates/{template_uuid}/test` | `setting.edit` | Test send |

Message/template bodies:

```json
{"party_id": "client_uuid", "contact_id": "contact_uuid", "channel": "email", "subject": "Proposal", "body": "Please find attached proposal.", "attachments": ["file_uuid"], "related_type": "lead", "related_id": "lead_uuid"}
```

```json
{"channel": "email", "event": "invoice_overdue", "name": "Invoice Overdue", "subject": "Invoice {{ invoice_number }} is overdue", "body": "Hello {{ client_name }}, your invoice is overdue.", "variables": ["invoice_number", "client_name", "due_date"], "status": "active"}
```

## 8.3 Reports

Each report accepts `date_from`, `date_to`, `group_by`, `filters`, `timezone`, `currency`, and `include_chart=true`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/reports/dashboard` | `report.view` | Reports dashboard |
| GET | `/reports/leads-pipeline` | `report.view` | Lead pipeline |
| GET | `/reports/lead-conversion` | `report.view` | Lead conversion |
| GET | `/reports/lead-source` | `report.view` | Lead source report |
| GET | `/reports/client-acquisition` | `report.view` | Client acquisition |
| GET | `/reports/client-revenue` | `report.view` | Client revenue |
| GET | `/reports/inactive-clients` | `report.view` | Inactive clients |
| GET | `/reports/vendor-expenses` | `report.view` | Vendor expenses |
| GET | `/reports/vendor-renewals` | `report.view` | Vendor renewals |
| GET | `/reports/headcount` | `report.view` | Staff headcount |
| GET | `/reports/staff-activity` | `report.view` | Staff activity |
| GET | `/reports/attendance-daily` | `report.view` | Daily attendance |
| GET | `/reports/attendance-monthly` | `report.view` | Monthly attendance |
| GET | `/reports/late-early` | `report.view` | Late/early report |
| GET | `/reports/leave-balance` | `report.view` | Leave balance |
| GET | `/reports/leave-usage` | `report.view` | Leave usage |
| GET | `/reports/payroll-summary` | `report.view` | Payroll summary |
| GET | `/reports/payroll-components` | `report.view` | Payroll components |
| GET | `/reports/tax-deductions` | `report.view` | Tax deductions |
| GET | `/reports/renewals-upcoming` | `report.view` | Upcoming renewals |
| GET | `/reports/renewals-overdue` | `report.view` | Overdue renewals |
| GET | `/reports/invoice-summary` | `report.view` | Invoice summary |
| GET | `/reports/payment-collection` | `report.view` | Payment collection |
| GET | `/reports/invoice-aging` | `report.view` | Invoice aging |
| GET | `/reports/expense-summary` | `report.view` | Expense summary |
| GET | `/reports/project-status` | `report.view` | Project status |
| GET | `/reports/project-profitability` | `report.view` | Project profitability |
| GET | `/reports/task-overdue` | `report.view` | Overdue tasks |
| GET | `/reports/task-workload` | `report.view` | Task workload |
| GET | `/reports/support-status` | `report.view` | Issue status |
| GET | `/reports/support-resolution-time` | `report.view` | Resolution time |
| POST | `/reports/custom` | `report.customize` | Build custom report |
| POST | `/reports/{report_code}/export` | `report.export` | Export report |

Report bodies:

```json
{"format": "xlsx", "date_from": "2026-08-01", "date_to": "2026-08-31", "filters": {"status_id": "lookup_uuid"}, "columns": ["name", "status", "amount"], "send_to_email": false}
```

```json
{"entity": "tasks", "columns": ["task_number", "title", "status", "assigned_to", "due_at"], "filters": {"status_id": "lookup_uuid"}, "group_by": "assigned_to", "chart_type": "bar"}
```

---

# 9. Settings, Master Data, Integrations

Data sources: `tenant_settings`, `tenant_lookups`, `departments`, `designations`, `tenant_offices`, `shifts`, `leave_types`, `payroll_components`, `tags`, `custom_fields`, `integration_providers`, `tenant_integrations`, `integration_credentials`, `integration_webhooks`, `integration_webhook_logs`, `integration_sync_jobs`, `integration_field_mappings`, `integration_rate_limits`, `user_preferences`.

## 9.1 General, Offices, HR, CRM Settings

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings` | `setting.view` | All grouped settings |
| GET | `/settings/{group}` | `setting.view` | One settings group |
| PUT | `/settings/{group}` | `setting.edit` | Update group |
| GET | `/settings/offices` | `setting.view` | Offices |
| POST | `/settings/offices` | `setting.edit` | Create office |
| GET | `/settings/offices/{office_uuid}` | `setting.view` | View office |
| PUT/PATCH | `/settings/offices/{office_uuid}` | `setting.edit` | Update office |
| DELETE | `/settings/offices/{office_uuid}` | `setting.edit` | Delete office |
| GET/POST | `/settings/departments` | `setting.view`/`setting.edit` | Departments |
| PUT/PATCH | `/settings/departments/{department_uuid}` | `setting.edit` | Update department |
| GET/POST | `/settings/designations` | `setting.view`/`setting.edit` | Designations |
| PUT/PATCH | `/settings/designations/{designation_uuid}` | `setting.edit` | Update designation |
| GET/POST | `/settings/shifts` | `setting.view`/`setting.edit` | Shifts |
| PUT/PATCH | `/settings/shifts/{shift_id}` | `setting.edit` | Update shift |
| GET | `/settings/lookups` | `setting.view` | Tenant lookup list |
| POST | `/settings/lookups` | `setting.edit` | Create lookup |
| PUT/PATCH | `/settings/lookups/{lookup_uuid}` | `setting.edit` | Update lookup |
| DELETE | `/settings/lookups/{lookup_uuid}` | `setting.edit` | Delete unused lookup |
| POST | `/settings/email/test` | `setting.edit` | Test email |
| POST | `/settings/sms/test` | `setting.edit` | Test SMS |
| POST | `/settings/storage/test` | `setting.edit` | Test storage |
| GET | `/master/countries` | authenticated | Countries |
| GET | `/master/states` | authenticated | States by country |
| GET | `/master/cities` | authenticated | Cities by state |
| GET | `/master/business-types` | authenticated | Business types |
| GET | `/master/industries` | authenticated | Industries |

Settings/lookup/office bodies:

```json
{"settings": {"company.display_name": "Acme", "branding.logo_file_id": "file_uuid", "localization.currency": "INR", "localization.timezone": "Asia/Kolkata", "security.password_policy": {"min_length": 10, "require_2fa": false}}}
```

```json
{"group": "lead_stage", "code": "proposal", "name": "Proposal", "description": "Proposal sent", "color": "#2563eb", "icon": "file-text", "sort_order": 30, "is_default": false, "is_system": false, "status": "active", "metadata": {}}
```

```json
{"office_name": "Head Office", "office_code": "HO", "office_type": "head_office", "is_head_office": true, "is_default": true, "address_line_1": "Address 1", "address_line_2": null, "landmark": null, "country_id": "country_uuid", "state_id": "state_uuid", "city_id": "city_uuid", "postal_code": "400001", "contact_person": "Admin", "contact_email": "admin@example.com", "contact_phone": "+919999999999", "timezone": "Asia/Kolkata", "working_hours": {"mon_fri": "09:00-18:00"}, "gst_number": "27AAAAA0000A1Z5", "status": "active"}
```

## 9.2 Integrations and Webhooks

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/integrations/providers` | `setting.view` | Provider catalog |
| GET | `/integrations` | `setting.view` | Tenant integrations |
| POST | `/integrations` | `setting.edit` | Connect integration |
| GET | `/integrations/{integration_uuid}` | `setting.view` | View integration |
| PUT/PATCH | `/integrations/{integration_uuid}` | `setting.edit` | Update integration |
| DELETE | `/integrations/{integration_uuid}` | `setting.edit` | Disconnect integration |
| POST | `/integrations/{integration_uuid}/test` | `setting.edit` | Test connection |
| PUT | `/integrations/{integration_uuid}/credentials` | `setting.edit` | Replace credentials |
| GET/POST | `/integrations/{integration_uuid}/webhooks` | `setting.view`/`setting.edit` | Webhooks |
| PUT/PATCH | `/integrations/{integration_uuid}/webhooks/{webhook_id}` | `setting.edit` | Update webhook |
| DELETE | `/integrations/{integration_uuid}/webhooks/{webhook_id}` | `setting.edit` | Delete webhook |
| GET | `/integrations/webhook-logs` | `setting.view` | Webhook logs |
| POST | `/integrations/webhook-logs/{log_id}/retry` | `setting.edit` | Retry webhook |
| GET | `/integrations/sync-jobs` | `setting.view` | Sync jobs |
| POST | `/integrations/sync-jobs` | `setting.edit` | Start sync |
| POST | `/integrations/sync-jobs/{job_id}/retry` | `setting.edit` | Retry sync |
| GET/POST | `/integrations/field-mappings` | `setting.view`/`setting.edit` | Field mappings |
| PUT/PATCH | `/integrations/field-mappings/{mapping_id}` | `setting.edit` | Update mapping |
| DELETE | `/integrations/field-mappings/{mapping_id}` | `setting.edit` | Delete mapping |
| GET | `/integrations/rate-limits` | `setting.view` | Provider rate limits |

Integration bodies:

```json
{"provider_id": "provider_uuid", "name": "Google Workspace", "status": "active", "settings": {"sync_contacts": true, "sync_calendar": true}, "credentials": {"client_id": "xxx", "client_secret": "yyy", "refresh_token": "zzz"}}
```

```json
{"event": "invoice.paid", "secret": "generated_secret", "status": "active"}
```

```json
{"tenant_integration_id": "integration_uuid", "sync_type": "incremental", "direction": "pull", "entity_type": "contacts", "date_from": "2026-08-01", "date_to": "2026-08-31"}
```

---

# 10. Audit Logs and Help Center

## 10.1 Audit Logs and Security

Data sources: `activity_logs`, `security_events`, `api_request_logs`, `communication_logs`, integration logs.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/audit/activity-logs` | `activity_log.view` | User activity |
| GET | `/audit/data-changes` | `activity_log.view` | Data change log |
| GET | `/audit/login-history` | `activity_log.view` | Login history |
| GET | `/audit/security-events` | `activity_log.view` | Security events |
| POST | `/audit/security-events/{event_id}/review` | `activity_log.view` | Review event |
| GET | `/audit/api-requests` | `activity_log.view` | API request logs |
| GET | `/audit/communication-logs` | `activity_log.view` | Communication logs |
| POST | `/audit/export` | `activity_log.export` | Export audit logs |

Review body:

```json
{"status": "reviewed", "severity": "medium", "notes": "Confirmed with user."}
```

## 10.2 Help Center

Recommended data sources: platform knowledge base tables if exposed to tenants, or static application documentation.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/help/articles` | authenticated | List help articles |
| GET | `/help/articles/{slug}` | authenticated | View article |
| GET | `/help/faqs` | authenticated | FAQs |
| GET | `/help/release-notes` | authenticated | Release notes |
| POST | `/help/contact-support` | authenticated | Contact platform support |
| GET | `/help/system-status` | authenticated | Public status summary |

Contact support body:

```json
{"subject": "Need help with payroll", "description": "Payroll generation is showing an unexpected deduction.", "priority": "medium", "attachments": ["file_uuid"]}
```

# 11. Missing APIs and Table Gaps

The tenant pages require a few APIs that are not fully backed by `docs/database.md` yet. Add the recommended tables from `docs/tenant-pages.md` before implementing these as persistent features:

| Area | APIs | Required recommended table |
| --- | --- | --- |
| Attendance corrections | `/attendance/requests/*` | `attendance_requests` |
| Profile API tokens | `/profile/api-tokens/*` | `tenant_api_tokens` |
| Tenant backups | `/settings/backups/*` | `tenant_backup_runs`, `tenant_restore_requests` |
| Document folders | `/document-folders/*` | `document_folders`, `document_folder_files` |
| Tenant notification templates | `/settings/notification-templates/*` | `notification_templates` with `tenant_id` |
| Help center content | `/help/articles/*`, `/help/faqs` | Reuse platform KB or add tenant-visible KB tables |
| Client/vendor contracts | Vendor/client contract tabs | Add `contracts` table if contracts need structured lifecycle beyond files/notes |
| Quotations | Client/lead quotation tabs | Add quotation tables before exposing quote CRUD APIs |

Optional endpoints after adding those tables:

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/document-folders` | `document.view` | Folder tree |
| POST | `/document-folders` | `document.upload` | Create folder |
| PUT/PATCH | `/document-folders/{folder_uuid}` | `document.edit` | Update folder |
| DELETE | `/document-folders/{folder_uuid}` | `document.delete` | Delete folder |
| POST | `/document-folders/{folder_uuid}/files` | `document.edit` | Add file to folder |
| DELETE | `/document-folders/{folder_uuid}/files/{file_uuid}` | `document.edit` | Remove file from folder |
| GET | `/settings/backups` | `setting.view` | Backup settings |
| PUT | `/settings/backups` | `setting.edit` | Update backup settings |
| POST | `/settings/backups/run` | `setting.edit` | Start manual backup |
| GET | `/settings/backups/runs` | `setting.view` | Backup run history |
| POST | `/settings/restore-requests` | `setting.edit` | Request restore |

# 12. Endpoint Coverage Checklist

| Area | Covered APIs |
| --- | --- |
| Auth/profile | Login, logout, me, password, 2FA, preferences, sessions, API tokens |
| Dashboard | Sidebar, summaries, charts, widgets, recent records, export |
| Access control | Roles, permissions, role users, permission assignment |
| Teams | Teams, members, roles, permissions, settings, assignments |
| Staff | Staff CRUD, import/export, profile tabs, users, roles, bank, salary, documents |
| CRM | Clients, vendors, leads, contacts, addresses, merge, conversion, activities |
| Projects | Dashboard, list/grid/Kanban/Gantt/calendar, members, phases, milestones, time logs |
| Tasks/to-do | Dashboards, task CRUD, assignment, status, checklist, comments, dependencies, watchers, timers, lists |
| Support issues | Issue CRUD, assignment, status, resolve/close/reopen, linked tasks, time logs |
| Renewals | Client/vendor renewal views, calendar, items, reminders, history |
| Calendar | Calendars, events, attendees, reminders, rooms, video meetings |
| Attendance/leave | Attendance records, check-in/out, corrections, leave requests, approvals, balances |
| Payroll | Cycles, generation, approvals, payrolls, payslips, components, loans, reimbursements, bank transfers, tax settings |
| Holidays | Calendars, holidays, applicability, groups, members |
| Finance | Invoices, items, PDFs, payments, expenses, expense items, bank accounts |
| Documents | Files, attachments, notes, tags, custom fields, optional folders |
| Notifications | Notifications, communication logs, send/retry, templates |
| Reports | CRM, HR, payroll, renewal, finance, project, task, support, custom reports |
| Settings | General, offices, HR/CRM lookups, integrations, storage, communication, security |
| Audit | Activity, data changes, login history, security events, API logs, exports |
| Help center | Articles, FAQs, release notes, contact support, system status |

Implementation priority should be: auth/session APIs, tenant scoping middleware, access control, shared files/notes/tags/lookups, CRM parties, projects/tasks, finance, HRMS, payroll, then reports/settings/integrations.
