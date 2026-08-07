# Laravel SaaS Backend Setup Prompts

This document contains step-by-step workflow prompts for building the Laravel backend APIs for the Multi-Tenant SaaS CRM. Use these prompts sequentially in the Laravel project.

Source documents:

- `docs/database.md`
- `docs/platform-pages.md`
- `docs/platform-apis.md`
- `docs/tenant-pages.md`
- `docs/tenant-apis.md`
- `docs/additional-ui-changes.md`
- `docs/technology-stacks.md`
- `docs/project-documentation.md`

The backend must support two API surfaces:

- Platform Admin APIs: `/api/platform/v1`
- Tenant CRM APIs: `/api/tenant/v1`

## Global Laravel Standards

Use these standards in every prompt unless explicitly overridden:

- Build with Laravel, PHP 8.2+, Composer, MySQL 8 or PostgreSQL, Redis, queues, scheduler, and S3-compatible storage.
- Use REST JSON APIs with the response envelopes documented in `platform-apis.md` and `tenant-apis.md`.
- Keep platform and tenant APIs separated by routes, controllers, requests, resources, policies, services, and permissions.
- Enforce tenant scoping server-side. Never rely only on frontend headers.
- Use UUIDs as public IDs on major records and internal BIGINT IDs for database relationships.
- Use FormRequest classes for validation.
- Use API Resource classes for responses.
- Use Policies, Gates, and permission middleware for authorization.
- Use service/action classes for business workflows.
- Use database transactions for multi-table mutations.
- Use queues for imports, exports, reports, PDFs, notifications, webhooks, sync jobs, and backups.
- Encrypt credentials, tokens, API keys, bank account numbers, payment credentials, and integration secrets.
- Never return raw secrets after creation/update.
- Write activity/audit logs for every important mutation.
- Use idempotency keys for financial, payroll, billing, subscription, webhook retry, import/export, and bulk mutation actions.
- Add tests for tenant scoping, permissions, validation, lifecycle actions, billing, payroll, imports, exports, and security-sensitive flows.

Recommended structure:

```text
app/
  Actions/
    Platform/
    Tenant/
    Shared/
  DTOs/
  Enums/
  Events/
  Exceptions/
  Http/
    Controllers/
      Platform/
      Tenant/
      Shared/
    Middleware/
    Requests/
      Platform/
      Tenant/
    Resources/
      Platform/
      Tenant/
  Jobs/
  Listeners/
  Models/
    Platform/
    Tenant/
    Shared/
  Notifications/
  Policies/
    Platform/
    Tenant/
  Services/
    Platform/
    Tenant/
    Shared/
  Support/
    Api/
    Tenancy/
    Permissions/
    Files/
    Money/
    Reports/
  Traits/
```

## Prompt 1: Backend Foundation and Project Standards

```text
Set up the Laravel backend foundation for a multi-tenant SaaS CRM.

Read and follow:
- docs/database.md
- docs/platform-apis.md
- docs/tenant-apis.md
- docs/project-documentation.md
- docs/technology-stacks.md

Create the backend architecture structure only. Do not implement all modules yet.

Set up:
- Platform, Tenant, and Shared namespaces for controllers, requests, resources, policies, services, actions, and jobs.
- Route files or route groups for `/api/platform/v1` and `/api/tenant/v1`.
- Standard API response helper for success, list, validation errors, and business errors.
- Global exception rendering for API errors.
- Request ID middleware using `X-Request-Id` or generated UUID.
- Locale/timezone middleware using `X-Locale` and `X-Timezone`.
- Idempotency middleware placeholder.
- Base FormRequest classes for platform and tenant requests.
- Base API Resource conventions.
- Base service/action conventions.
- Test folder structure for platform, tenant, shared, and security tests.

Company standard: code must be explicit, typed where practical, transaction-safe, permission-aware, and tenant-safe.
```

## Prompt 2: Database Migrations and Schema Order

```text
Implement Laravel migrations based on docs/database.md.

Follow the migration order exactly:
1. Master data: countries, states, cities, business types, industries.
2. Platform auth and platform RBAC.
3. Tenants and tenant offices.
4. Tenant users and tenant RBAC.
5. Shared primitives: files, lookups, attachments, notes, tags, custom fields, activity logs.
6. Settings and preferences.
7. Plans, subscriptions, platform invoices, payments, coupons.
8. Parties, contacts, addresses, client/vendor/lead profiles.
9. Staff, departments, teams, attendance, leave.
10. Projects, tasks, issues, renewals, calendar, reminders.
11. Tenant invoices, payments, expenses, bank accounts.
12. Payroll.
13. Holidays.
14. Monitoring, security, integrations, notifications, communication logs.

Rules:
- Use BIGINT internal IDs.
- Add UUID unique columns to major records.
- Add tenant_id to every tenant business table.
- Add tenant-scoped unique indexes.
- Use decimal(18,2) and currency char(3) for money.
- Use encrypted columns/casts for secrets and bank accounts.
- Use soft deletes where recovery is required.
- Restrict accounting, payroll, payment, and compliance deletes.
- Add useful composite indexes for list filters and relationship lookups.

Also create migrations for recommended missing tables when required by pages/APIs:
- platform_teams, platform_team_roles, platform_team_members, platform_team_assignments
- platform_refunds
- platform_tickets, platform_ticket_comments
- knowledge_base_categories, knowledge_base_articles
- remote_login_sessions
- platform_settings, notification_templates, backup_runs
- attendance_requests
- tenant_api_tokens
- tenant_backup_runs, tenant_restore_requests
- document_folders, document_folder_files
```

## Prompt 3: Seeders, Enums, Lookups, Permissions

```text
Create seeders and enums for the SaaS CRM backend.

Use docs/database.md, platform-pages.md permission map, tenant-pages.md permission map, platform-apis.md, and tenant-apis.md.

Build:
- PHP enums for common statuses: active/inactive/suspended, tenant status, subscription status, payment status, invoice status, approval status, priority, visibility, channel, source, payroll status.
- Master data seeders for countries/states/cities if local data is available or placeholders if not.
- Business type and industry seeders.
- Platform permission seeder using platform permission map.
- Tenant permission seeder using tenant permission map.
- Default platform roles: super_admin, admin, billing_manager, support_manager, operations_manager.
- Default tenant roles: owner, admin, manager, staff, accountant, hr_manager, project_manager, sales_user, support_user, client_user.
- Tenant lookup seeders for lead stages, priorities, statuses, project statuses, task statuses, issue statuses, renewal statuses, categories, employment types, team types.
- Plan/feature/add-on sample seeders for SaaS billing.

Rules:
- Seeders must be idempotent.
- Do not duplicate permissions or lookups on repeated seed runs.
- System records should be marked `is_system` or `is_default` where schema supports it.
```

## Prompt 4: Authentication, Guards, Tokens, 2FA

```text
Implement platform and tenant authentication APIs.

Use docs/platform-apis.md Common Headers/Auth Rules and docs/tenant-apis.md Auth/Profile sections.

Build:
- Platform auth guard using `platform_users`.
- Tenant auth guard using `users`.
- Login, logout, refresh placeholder, forgot password, reset password, email verification resend.
- Current user endpoint for platform and tenant.
- Profile update, password change, preferences.
- Session/token revoke support.
- Optional tenant API tokens and platform API tokens if tables are added.
- 2FA enable/confirm/disable workflow using TOTP where possible.

Rules:
- Platform tokens and tenant tokens must not be interchangeable.
- Tenant login must resolve tenant by slug/uuid/domain and validate user belongs to that tenant.
- Tenant API requests must resolve tenant context and enforce it.
- Return raw API tokens only once during create/rotate.
- Log login success/failure, password reset, 2FA changes, token revoke, suspicious access to security_events/activity_logs.
```

## Prompt 5: Tenancy Middleware and Tenant-Safe Models

```text
Implement backend tenancy infrastructure.

Use docs/database.md tenancy rules and docs/project-documentation.md security requirements.

Build:
- TenantContext service that stores current tenant ID, uuid, slug, settings, enabled modules, subscription info.
- Middleware for tenant API routes that resolves X-Tenant and authenticated user tenant.
- Middleware that rejects cross-tenant mismatch.
- Base tenant model trait/scope for tenant_id filtering.
- Helpers for creating tenant-scoped records with tenant_id automatically.
- Policies that always validate tenant ownership.
- Tests proving users cannot read/update/delete records from another tenant.

Rules:
- Never trust route UUID alone.
- Never trust X-Tenant alone.
- Every tenant business query must include tenant_id directly or through a verified relation.
- Shared tables with nullable tenant_id must explicitly handle platform versus tenant visibility.
```

## Prompt 6: RBAC and Authorization Layer

```text
Implement platform and tenant RBAC.

Use docs/database.md RBAC section, platform-pages.md Permission Map, tenant-pages.md Tenant Permission Map, platform-apis.md Access Control, tenant-apis.md Access Control.

Build:
- Platform roles, permissions, pivots, role assignment APIs.
- Tenant roles, permissions, pivots, role assignment APIs.
- Permission middleware for platform and tenant routes.
- Policy classes for major platform and tenant models.
- Assign permissions, assign users, clone role, activate/deactivate/delete role workflows.
- Grouped permission responses by module.

Rules:
- Tenant roles are tenant-scoped.
- Tenant model role pivots must include tenant_id.
- System roles cannot be deleted or renamed unless explicitly allowed.
- Prevent removing the final owner/admin role from a tenant.
- All role/permission changes must write audit logs.
```

## Prompt 7: Shared Primitives: Files, Notes, Tags, Custom Fields, Activity

```text
Implement shared primitives used across platform and tenant modules.

Use docs/database.md Shared Primitives, platform-apis.md Files APIs, tenant-apis.md Files APIs, and additional-ui-changes.md shared drawers.

Build APIs and services for:
- Files upload, metadata, signed download, delete.
- Attachments polymorphic mapping.
- Notes polymorphic mapping.
- Tags and taggables.
- Custom fields and custom field values.
- Activity logs and audit compare data.
- Reminders.

Rules:
- Validate file ownership and tenant scope.
- Hide raw storage paths.
- Use signed URLs for private downloads.
- Support platform files and tenant files.
- Activity logs must include actor, subject, event, old values, new values, IP, user agent, request ID.
- Custom fields must validate field type and options.
```

## Prompt 8: Platform Dashboard, Staff, Teams, Tenants

```text
Implement core Platform Admin APIs.

Use docs/platform-pages.md Dashboard, Platform Staff, Platform Teams, Tenants and docs/platform-apis.md matching sections.

Build:
- Platform dashboard summary, charts, recent tenants, recent payments, overdue invoices, alerts, security events, export.
- Platform staff CRUD, invite, roles, permissions, suspend, activate, reset password, force logout, require 2FA, activity.
- Platform teams CRUD, team roles, team members, assignments.
- Tenant CRUD with organization, owner user, head office, subscription creation.
- Tenant lifecycle actions: activate, suspend, reactivate, archive, restore, extend trial, remote login, module overrides.
- Tenant detail tabs: users, offices, subscription, billing, usage, modules, settings, integrations, security, support, files, activity.

Rules:
- Use transactions for tenant creation.
- Tenant creation must create organization, owner user, head office, subscription, settings defaults, and default tenant roles.
- Remote login must require reason and duration and write audit/security logs.
- Tenant suspension must block tenant login where required.
```

## Prompt 9: Platform Plans, Subscriptions, Billing, Coupons, Modules

```text
Implement Platform SaaS billing/catalog APIs.

Use docs/platform-pages.md Subscriptions, Plans/Features/Add-ons, Billing, Coupons, Modules and docs/platform-apis.md matching sections.

Build:
- Plans CRUD, clone, archive, feature assignment.
- Features CRUD and module grouping.
- Add-on plans CRUD.
- Subscriptions list/view/create/update/lifecycle: upgrade, downgrade, renew, pause, resume, cancel, add addon, apply coupon.
- Subscription usage and versions/renewals history.
- Platform invoices CRUD/manual invoice, line items, send, PDF generation, cancel.
- Platform payments list/view/record/retry/reconcile placeholder.
- Platform refunds if `platform_refunds` exists.
- Coupons CRUD, plan assignments, tenant assignments, redemptions.
- Modules and feature control APIs.

Rules:
- Financial mutations require idempotency key support.
- Use transactions for billing changes.
- Store immutable snapshots for subscription versions.
- Never delete financial records; cancel/void/refund instead.
- Payment gateway raw responses must be masked in resources.
```

## Prompt 10: Platform Support, Monitoring, Integrations, Settings, Audit

```text
Implement remaining Platform Admin APIs.

Use docs/platform-pages.md Support, Reports, Monitoring, Integrations, Settings, Audit Logs, Missing Platform Pages and docs/platform-apis.md matching sections.

Build:
- Platform tickets, comments, internal notes, assignment, status, close/reopen, attachments.
- Knowledge base categories/articles, publish/unpublish/archive.
- Remote login sessions list/detail/end.
- Reports endpoints and export jobs.
- Monitoring services/logs, API request logs, queue job logs, scheduler logs, alerts, incidents.
- Integration providers, tenant integrations, credentials, webhooks, webhook logs, sync jobs, field mappings, rate limits.
- Platform settings, notification templates, backup settings/runs.
- Audit logs and security event review.
- Onboarding, trial, legal documents, announcements, API tokens, outbound webhooks if tables are implemented.

Rules:
- Credentials are write-only and encrypted.
- Webhook retries must be queued and idempotent.
- Raw payload views must mask sensitive fields.
- Alert/incident resolution must capture notes and actor.
```

## Prompt 11: Tenant Dashboard, Users, Teams, Staff

```text
Implement Tenant dashboard, users, teams, access control, and staff APIs.

Use docs/tenant-pages.md Dashboard, Access Control, Staff Management and docs/tenant-apis.md matching sections.

Build:
- Tenant dashboard summary, charts, widgets, recent records, activity.
- My dashboard widget preferences.
- Tenant roles/permissions APIs.
- Tenant teams, team roles, team members, permissions, settings, assignments.
- Tenant users list/invite/update/roles/suspend/activate/reset password.
- Staff dashboard/list/grid/create/edit/view.
- Staff child resources: employment history, bank accounts, salary structures, documents, emergency contacts, assets, certifications, appraisals, training.

Rules:
- Staff login users must belong to the same tenant.
- Staff bank accounts must be encrypted and masked in responses.
- Salary and bank details require explicit permissions.
- Staff import/export must run through queued jobs for large files.
```

## Prompt 12: Tenant CRM: Clients, Vendors, Leads

```text
Implement Tenant CRM APIs for clients, vendors, and leads.

Use docs/database.md Parties/Clients/Vendors/Leads, docs/tenant-pages.md Clients/Vendors/Lead Management, docs/tenant-apis.md CRM sections.

Build:
- Shared party service for identity, contacts, addresses.
- Clients CRUD, import/export, merge duplicates, contacts, addresses, related projects/invoices/payments/renewals/issues/activity.
- Vendors CRUD, import/export, contacts, addresses, bank accounts, expenses, renewals, activity.
- Leads dashboard/list/Kanban/CRUD/import/export/duplicate/convert/mark-lost/merge.
- Lead activities and follow-ups.

Rules:
- Use transactions when creating party plus profile plus contacts/addresses.
- Enforce tenant uniqueness for client_code, vendor_code, lead_number.
- Lead conversion must create or link a client and preserve conversion history.
- Merge workflows must move related records safely and archive duplicates.
- Contact portal access must create/update tenant `users` only when requested and permitted.
```

## Prompt 13: Tenant Renewals, Projects, Tasks, Issues, Calendar

```text
Implement Tenant operational APIs.

Use docs/database.md Renewals, Calendar, Projects/Tasks/Issues and docs/tenant-apis.md matching sections.

Build:
- Renewals dashboard/list/calendar/client/vendor renewal APIs.
- Renewal CRUD, line items, history, reminders, send reminder, renew/extend, cancel.
- Projects dashboard/list/Kanban/Gantt/calendar/CRUD/archive.
- Project members, phases, milestones, time logs, project expenses.
- Tasks dashboard/list/Kanban/calendar/my/team/CRUD/assign/status/complete/clone/bulk update.
- Task checklists, checklist items, comments, dependencies, watchers, assignments, time logs.
- To-do lists CRUD/share/tasks.
- Client issues dashboard/list/Kanban/CRUD/assign/status/resolve/close/reopen/time logs/create linked task.
- Calendars, calendar events, attendees, reminders, meeting rooms, room bookings, video meetings, sync logs.
- Generic reminders.

Rules:
- Use `related_type` and `related_id` consistently for cross-module relationships.
- Time logs must validate start/end/minutes and user scope.
- Kanban status/stage changes must validate required business rules.
- Closing issues must capture resolution notes.
- Calendar events must validate attendee and related-record tenant ownership.
```

## Prompt 14: Tenant Attendance, Leave, Payroll, Holidays

```text
Implement Tenant HRMS APIs.

Use docs/database.md Staff/HR, Payroll, Holidays and docs/tenant-apis.md Attendance/Leave/Payroll/Holidays sections.

Build:
- Attendance dashboard, daily attendance, monthly attendance grid.
- Check-in/check-out APIs.
- Attendance records CRUD/import/export.
- Attendance correction requests and approval/rejection if `attendance_requests` exists.
- Leave dashboard, requests, apply/update/approve/reject/cancel, balances, calendar, leave types.
- Payroll dashboard, cycles, generate preview, generate payroll, submit, approve, lock, reopen.
- Payroll history/detail/items.
- Payslip generation/download/email.
- Payroll component types, components, component assignments.
- Loans, reimbursements, bank transfers, tax slabs, PF settings, ESI settings.
- Holidays CRUD/import/export, calendars, applicability, groups, group members.

Rules:
- Payroll generation must run in a transaction or queued workflow with recoverable state.
- Payroll lock must prevent edits unless reopened by permissioned user.
- Payslip PDFs should be generated through queued jobs.
- Leave approval must validate balance, overlaps, and status transitions.
- Attendance corrections require approval logs.
- Payroll, bank, and salary data require strict permissions and audit logs.
```

## Prompt 15: Tenant Finance, Documents, Notifications, Reports, Settings

```text
Implement Tenant finance, documents, communication, reports, settings, integrations, audit, profile, and help APIs.

Use docs/database.md Tenant Finance, Notifications, Settings, Integrations and docs/tenant-apis.md matching sections.

Build:
- Finance dashboard.
- Tenant invoices CRUD, line items, PDF generation, send, cancel.
- Tenant payments record/view/update pending/void.
- Tenant expenses CRUD/items/approve/reject/receipts.
- Bank accounts CRUD/set primary with encrypted account number.
- Files/documents APIs, optional document folders if tables exist.
- Notifications list/read/unread/bulk/delete.
- Communication logs, retry failed messages, send email/SMS/WhatsApp.
- Tenant notification templates if table exists.
- Reports dashboard and all report endpoints/export jobs/custom report.
- Tenant settings groups, offices, departments, designations, shifts, lookups, integrations, credentials, webhooks, sync jobs, field mappings, rate limits.
- Audit logs, security event review, API request logs.
- Help center endpoints/contact support.

Rules:
- Tenant invoice/payment/expense mutations require idempotency where applicable.
- Invoice cancellation after send must capture reason.
- Bank account responses must be masked.
- Reports and exports should be queued when large.
- Integration credentials are encrypted and write-only.
```

## Prompt 16: Imports, Exports, PDFs, Reports, Queues

```text
Implement backend async infrastructure for imports, exports, PDFs, reports, and queued operations.

Use platform-apis.md, tenant-apis.md, additional-ui-changes.md import/export requirements, and technology-stacks.md.

Build:
- Generic import job framework with upload, mapping, validation preview, duplicate strategy, progress, error download.
- Generic export job framework with selected IDs, filters, columns, format, timezone, email file option.
- PDF generation jobs for platform invoices, tenant invoices, payslips, reports.
- Report generation jobs for large reports.
- Notification jobs for email, SMS, WhatsApp, push.
- Webhook dispatch/retry jobs.
- Sync jobs for integrations.
- Backup jobs if backup tables are implemented.
- Queue job logging into `queue_job_logs`.

Rules:
- Use Redis queues.
- Use Laravel Horizon if available.
- Persist job status and failure reason where user needs progress UI.
- Never block HTTP requests for long-running imports/exports/PDFs.
- Add retry and backoff policies carefully.
```

## Prompt 17: Notifications and External Provider Interfaces

```text
Create provider interfaces for external services.

Use docs/technology-stacks.md External APIs and Services.

Build interfaces/services for:
- Email providers: SES/SendGrid/Mailgun/SMTP.
- SMS providers: Twilio/MSG91/Textlocal/Fast2SMS.
- WhatsApp providers: Meta Cloud API/Twilio/WATI/Interakt/Gupshup.
- Push notifications: Firebase Cloud Messaging/OneSignal.
- Payment gateways: Razorpay/Cashfree/Stripe/PayPal.
- Storage providers: S3-compatible storage.
- Calendar/meeting providers: Google Calendar, Microsoft Graph, Zoom, Teams.
- Maps/geocoding providers if address autocomplete or geo attendance is required.

Rules:
- Keep providers behind interfaces so implementations can change.
- Store tenant provider credentials encrypted.
- Log provider requests/responses safely with sensitive masking.
- Verify payment and webhook signatures.
- Queue outbound notifications and provider sync jobs.
```

## Prompt 18: Security, Audit, Compliance Hardening

```text
Harden the Laravel backend security model.

Use docs/project-documentation.md Security Requirements and docs/technology-stacks.md Security Stack.

Implement or verify:
- Server-side permission enforcement for every route/action.
- Tenant scoping tests for all tenant modules.
- Rate limiting for auth, uploads, exports, webhooks, and sensitive actions.
- Signed URLs for private files.
- Encrypted casts for secrets and bank data.
- Security events for login failures, password resets, 2FA changes, remote login, suspicious access, token changes.
- Activity logs for create/update/delete/status/action mutations.
- Remote login sessions with reason, duration, actor, IP, and end time.
- CORS and security headers.
- Typed confirmation/action reason support on all high-risk actions.
- Data retention and soft-delete/restrict-delete behavior.

Rules:
- UI permissions are convenience only; backend permissions are authoritative.
- Never expose raw secrets, raw tokens, private file paths, encrypted account numbers, or unmasked gateway credentials.
```

## Prompt 19: API Documentation and OpenAPI/Scribe

```text
Generate and maintain backend API documentation.

Use docs/platform-apis.md and docs/tenant-apis.md as source of truth.

Build:
- Scribe or OpenAPI setup.
- Grouped docs for Platform APIs and Tenant APIs.
- Common headers, auth rules, request bodies, response envelopes, errors, pagination, filters.
- Example requests and responses for each module.
- Postman/Insomnia/Bruno collection export if supported.

Rules:
- Do not let generated docs drift from markdown API contracts.
- Every endpoint must document permission, purpose, request body, validation errors, and response shape.
- Sensitive fields must be marked write-only/masked.
```

## Prompt 20: Backend Testing Strategy

```text
Create the Laravel backend test suite.

Use docs/project-documentation.md Quality Checklist and docs/technology-stacks.md Testing Stack.

Add tests for:
- Auth: platform login, tenant login, token use, logout, forbidden, 2FA.
- Tenancy: cross-tenant read/write/delete blocked across all tenant modules.
- RBAC: permissions required for routes and actions.
- Validation: create/update/action FormRequests.
- Platform lifecycle: tenant create/suspend/reactivate/archive, subscription changes, billing actions.
- Tenant CRM: clients, vendors, leads, conversion, merge.
- Projects/tasks/issues workflows.
- Attendance/leave/payroll workflows.
- Finance: invoices, payments, expenses, bank accounts.
- Files: upload/download/attach/delete tenant safety.
- Imports/exports/report jobs.
- Integrations/webhook signature and retry behavior.
- Activity logs/security events created for mutations.

Use factories, seeders, database transactions, queue fakes, notification fakes, storage fakes, and HTTP fakes.
```

## Prompt 21: Performance, Scaling, and Observability

```text
Prepare the Laravel backend for production performance and operations.

Use docs/technology-stacks.md Observability and Operations.

Implement or verify:
- Database indexes for tenant_id, status, assigned_to, due dates, created_at, related_type/id, numbers/codes.
- Pagination on every list endpoint.
- Avoid N+1 queries using eager loading and includes.
- Query filters are indexed where common.
- Caching for permissions, settings, navigation/module availability, master data.
- Redis queues and Horizon dashboard.
- Scheduler logging.
- API request logging with duration/status where required.
- Error tracking integration with Sentry/Bugsnag/Rollbar.
- Uptime and health endpoints.
- Backup monitoring and alerts.
- Slow query and failed job alerts.

Rules:
- Do not return huge unpaginated lists.
- Use queued jobs for expensive exports/reports/PDFs.
- Keep dashboard endpoints optimized and cache where acceptable.
```

## Prompt 22: Deployment and Environment Setup

```text
Create Laravel deployment and environment setup documentation/scripts.

Use docs/technology-stacks.md DevOps and Infrastructure.

Cover:
- Required PHP extensions.
- Composer install commands.
- Environment variables.
- Database migration/seed flow.
- Storage link and disk configuration.
- Redis configuration.
- Queue worker setup with Supervisor/systemd.
- Scheduler cron setup.
- Nginx/Apache production config notes.
- SSL requirements.
- Backup configuration.
- CI/CD checks: composer install, tests, Pint, PHPStan/Larastan, migrations dry run if possible.
- Deployment order and rollback plan.

Environment groups:
- local
- staging
- production

Rules:
- Never commit production secrets.
- Use APP_KEY securely.
- Production must run with APP_DEBUG=false.
- Production queues and scheduler must be monitored.
```

## Prompt 23: Final Backend Acceptance Checklist

```text
Review the completed Laravel backend against all source docs:
- docs/database.md
- docs/platform-pages.md
- docs/platform-apis.md
- docs/tenant-pages.md
- docs/tenant-apis.md
- docs/additional-ui-changes.md
- docs/project-documentation.md
- docs/technology-stacks.md

Produce a final backend acceptance report with:
- Database modules completed.
- Platform APIs completed.
- Tenant APIs completed.
- Shared primitives completed.
- Auth/RBAC/tenancy completed.
- Assignment workflows completed.
- Confirmation/action reason support completed.
- Import/export/PDF/report jobs completed.
- External providers integrated or stubbed.
- Missing table/API dependencies.
- Security review results.
- Test coverage summary.
- Performance risks.
- Production deployment readiness.

Do not mark a backend module complete unless migrations, models, policies, requests, resources, services/actions, controllers, routes, activity logs, permissions, tests, and API documentation are implemented.
```

## Suggested Build Order

1. Backend foundation, response format, exception handling, route groups, request ID, API conventions.
2. Database migrations, models, factories, seeders, enums, permissions.
3. Auth, tenancy middleware, RBAC, policies.
4. Shared primitives: files, attachments, notes, tags, custom fields, activity, reminders.
5. Platform core: dashboard, staff, teams, tenants.
6. Platform billing/catalog: plans, subscriptions, invoices, payments, coupons, modules.
7. Platform operations: support, monitoring, integrations, settings, audit.
8. Tenant core: dashboard, access control, teams, staff/users.
9. Tenant CRM: clients, vendors, leads.
10. Tenant operations: renewals, projects, tasks, issues, calendar.
11. Tenant HRMS: attendance, leave, payroll, holidays.
12. Tenant finance, documents, notifications, reports, settings, audit, help.
13. Queues, imports, exports, PDFs, notifications, external providers.
14. Security hardening, tests, performance, API docs, deployment.

## Non-Negotiable Company Standards

- Platform and tenant APIs must stay separated.
- Tenant scoping must be enforced in backend queries and policies.
- Permissions must be enforced server-side for every protected action.
- Every mutation with business impact must write activity/audit logs.
- Financial, payroll, subscription, credential, backup, and remote-login actions require extra validation, confirmation reason support, and idempotency where appropriate.
- Never expose raw secrets, account numbers, tokens, private file paths, gateway keys, or encrypted values.
- Every list endpoint must be paginated.
- Every create/update/action endpoint must use FormRequest validation.
- Every response must use consistent API resources/envelopes.
- Every long-running workflow must use queues.
- Every module must have tests before being marked complete.
