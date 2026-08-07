# SaaS CRM Project Documentation

This document is the main project handbook for the Multi-Tenant SaaS CRM. It connects the database blueprint, platform pages, tenant pages, APIs, UI requirements, technology stack, and frontend/mobile setup prompts into one project-level reference.

Related documents:

- `docs/database.md` - target database design and migration order.
- `docs/platform-pages.md` - SaaS platform admin pages.
- `docs/platform-apis.md` - SaaS platform admin API surface.
- `docs/tenant-pages.md` - tenant-facing CRM pages.
- `docs/tenant-apis.md` - tenant-facing CRM API surface.
- `docs/additional-ui-changes.md` - required modals, drawers, assignments, confirmations, and workflow UI additions.
- `docs/react-js-setup.md` - React frontend workflow prompts and standards.
- `docs/flutter-setup.md` - Flutter mobile/tablet app workflow prompts and standards.
- `docs/technology-stacks.md` - technology stack, tools, and external service requirements.

## 1. Project Overview

The project is a multi-tenant SaaS CRM platform with two primary product surfaces:

- Platform Admin: used by SaaS owner/staff users to manage tenants, plans, subscriptions, platform billing, monitoring, support, settings, integrations, and platform audit logs.
- Tenant CRM: used by tenant company users to manage CRM, staff, teams, projects, tasks, support issues, renewals, calendar, attendance, leave, payroll, holidays, finance, documents, reports, settings, and profile workflows.

Core implementation targets:

| Area | Technology |
| --- | --- |
| Backend APIs | Laravel |
| Web frontend | React |
| Mobile/tablet app | Flutter |
| Primary database | MySQL 8 or PostgreSQL |
| Cache/queue | Redis |
| File storage | Local for dev, S3-compatible storage for production |

## 2. Product Goals

The SaaS CRM should provide:

- Multi-tenant organization management.
- Platform-level subscription and billing management.
- Tenant-level CRM for leads, clients, vendors, and renewals.
- Project, task, to-do, calendar, and support workflows.
- Staff, attendance, leave, payroll, and holiday management.
- Tenant finance: invoices, payments, expenses, and bank accounts.
- Files, notes, tags, custom fields, reminders, notifications, and activity logs across modules.
- Role-based access control for platform and tenant users.
- Strong auditability, security, and operational monitoring.
- Web and mobile experiences with consistent APIs and permissions.

## 3. User Surfaces

### 3.1 Platform Admin

Platform Admin is for SaaS owner/staff users. It manages the SaaS business itself, not tenant business operations.

Main areas:

- Dashboard.
- Platform access control.
- Platform teams.
- Platform staff.
- Tenants.
- Subscriptions.
- Plans, features, add-ons.
- Platform billing, payments, refunds.
- Coupons.
- Modules and feature controls.
- Platform support and knowledge base.
- Reports.
- Monitoring.
- Integrations.
- Settings.
- Audit logs.
- Onboarding, trials, legal documents, announcements, API tokens, webhooks where supported.

Primary docs:

- `docs/platform-pages.md`
- `docs/platform-apis.md`

### 3.2 Tenant CRM

Tenant CRM is for users inside a tenant company workspace.

Main areas:

- Dashboard and My Dashboard.
- CRM: leads, clients, vendors, client renewals, vendor renewals.
- Projects: projects, tasks, calendar, to-do.
- Support: client issues.
- HRMS: staff, attendance, leave management, payroll, holidays.
- Finance: invoices, payments, expenses, bank accounts.
- Documents.
- Reports.
- Settings.
- Profile.
- Help Center.

Primary docs:

- `docs/tenant-pages.md`
- `docs/tenant-apis.md`

## 4. Architecture Summary

### 4.1 Backend

The Laravel backend owns:

- Auth and session/token management.
- Platform and tenant RBAC.
- Tenant scoping and data isolation.
- API endpoints for platform and tenant apps.
- Business rules and validations.
- Database persistence.
- File upload metadata and signed downloads.
- Queues, scheduled jobs, imports, exports, reports, PDFs, notifications, sync jobs, and webhooks.
- Audit logs and security events.

Recommended backend separation:

```text
app/
  Http/
    Controllers/
      Platform/
      Tenant/
    Requests/
    Resources/
  Services/
    Platform/
    Tenant/
  Actions/
  DTOs/
  Enums/
  Jobs/
  Policies/
  Models/
```

### 4.2 React Web Frontend

The React app owns:

- Platform Admin web interface.
- Tenant CRM web interface.
- Routing, layouts, navigation, permissions, and UI state.
- Data fetching through platform and tenant API clients.
- Enterprise data tables, forms, modals, drawers, imports, exports, and dashboards.

Primary frontend doc:

- `docs/react-js-setup.md`

### 4.3 Flutter App

The Flutter app owns:

- Mobile/tablet experience for tenant users.
- Optional Platform Admin mobile/tablet experience if needed.
- Secure token storage.
- Mobile-friendly dashboards, lists, detail screens, forms, bottom sheets, file uploads, push notifications, and deep links.

Primary mobile doc:

- `docs/flutter-setup.md`

## 5. Database Principles

The database design is defined in `docs/database.md`.

Core rules:

- Use `id BIGINT` as internal primary key.
- Use `uuid` as public ID for major records.
- Every tenant business table must include `tenant_id`.
- Platform-only tables must not be mixed with tenant tables.
- Auth data lives only in `platform_users` and `users`.
- Money uses `DECIMAL(18,2)` plus `currency CHAR(3)`.
- Important tables use creator/updater fields, timestamps, and soft deletes where useful.
- Secrets, tokens, credentials, and bank account numbers must be encrypted.
- Shared primitives should be reused: files, attachments, notes, tags, custom fields, activity logs, reminders.
- Tenant records need tenant-scoped unique indexes.

Important correction decisions:

- Tenant owner login belongs in `users`, not in tenant organization records.
- Platform billing is separate from tenant client invoices.
- Client, vendor, and lead identity uses shared `parties`, `party_contacts`, and `party_addresses`.
- Tenant lookups replace many duplicate status/category/type tables.
- Polymorphic attachments, notes, tags, custom fields, and activity logs are shared across modules.

## 6. API Principles

### 6.1 Platform APIs

Base URL:

```http
/api/platform/v1
```

Headers:

```http
Authorization: Bearer {platform_access_token}
Accept: application/json
Content-Type: application/json
X-Request-Id: {uuid}
X-Client-Version: web-admin/1.0.0
```

Platform APIs use platform auth and platform RBAC. They must never expose tenant business data without platform permission checks and audit logging.

### 6.2 Tenant APIs

Base URL:

```http
/api/tenant/v1
```

Headers:

```http
Authorization: Bearer {tenant_access_token}
Accept: application/json
Content-Type: application/json
X-Tenant: {tenant_uuid_or_slug}
X-Request-Id: {uuid}
X-Client-Version: web-tenant/1.0.0
```

Tenant APIs must scope every business query by authenticated tenant context. UI tenant headers are not trusted as the only source of tenancy; backend policies and query scopes must enforce isolation.

### 6.3 Standard API Response

Success:

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

## 7. Shared UI Requirements

The UI additions are defined in `docs/additional-ui-changes.md`.

Every major list page should include:

- Search.
- Advanced filters.
- Pagination.
- Sorting.
- Saved views.
- Column manager.
- Export.
- Import where relevant.
- Safe bulk actions.
- Activity drawer.

Every major detail page should include:

- Header summary.
- Status badge.
- Primary actions.
- More actions menu.
- Tabs or sections.
- Related records.
- Notes.
- Files.
- Reminders.
- Activity timeline.

Shared UI surfaces:

- Assign user/team popup.
- Status change popup.
- Bulk update popup.
- Confirm destructive popup.
- Quick create drawer.
- Preview drawer.
- Raw payload drawer.
- Audit compare drawer.
- Communication composer.
- Approval popup.
- Reminder popup.
- Tags popup.

High-risk actions must require confirmation and reason:

- Delete.
- Archive/restore.
- Suspend/reactivate.
- Cancel/close/reopen.
- Refund/void payment.
- Lock/reopen payroll.
- Disconnect integration.
- Restore backup.
- Remote login.
- Bulk updates.

## 8. Security Requirements

Security is a backend and frontend responsibility.

Backend must enforce:

- Authentication.
- Tenant scoping.
- Permissions.
- Policies.
- Rate limits.
- Audit logging.
- Encryption of secrets.
- Signed file URLs.
- Strict validation.

Frontend/mobile must enforce:

- Permission-aware routes and actions.
- Hidden or disabled unauthorized controls.
- Secure token storage.
- Tenant context separation.
- Masked secrets and account numbers.
- Confirmation for high-risk actions.
- No raw token display after token creation except copy-once flows.

Security-sensitive modules:

- Auth and 2FA.
- Remote login/impersonation.
- Billing and refunds.
- Payroll.
- Bank accounts.
- Integrations and credentials.
- Backups and restores.
- Audit logs.

## 9. External Services

The full stack and external service list is defined in `docs/technology-stacks.md`.

Likely required services:

- Email: Amazon SES, SendGrid, Mailgun, or SMTP.
- SMS: Twilio, MSG91, Textlocal, or Fast2SMS.
- WhatsApp: Meta Cloud API, Twilio, WATI, Interakt, or Gupshup.
- Push: Firebase Cloud Messaging or OneSignal.
- Payments: Razorpay, Cashfree, Stripe, or PayPal.
- Storage: AWS S3, DigitalOcean Spaces, Wasabi, MinIO.
- Maps: Google Maps, Mapbox, or OpenStreetMap.
- Calendar/meetings: Google Calendar, Microsoft Graph, Zoom, Google Meet, Teams.
- Monitoring: Sentry, Better Stack, UptimeRobot, Laravel Horizon.
- CI/CD: GitHub Actions or equivalent.

Recommended approach:

- Start with minimum providers for MVP.
- Add integrations behind provider interfaces.
- Make tenant-level provider credentials configurable where needed.

## 10. Module Summary

### 10.1 Platform Modules

| Module | Purpose |
| --- | --- |
| Dashboard | SaaS KPIs, revenue, alerts, recent records |
| Access Control | Platform roles and permissions |
| Platform Teams | SaaS staff team ownership and assignments |
| Platform Staff | SaaS staff users, roles, security |
| Tenants | Tenant lifecycle, owner, offices, subscription, usage |
| Subscriptions | Tenant subscription lifecycle |
| Plans/Features/Add-ons | SaaS product catalog |
| Billing | Platform invoices, payments, refunds |
| Coupons | Subscription discount rules |
| Modules | Global and tenant-specific feature controls |
| Support | Platform tickets, KB, remote login |
| Reports | SaaS revenue, tenant, usage, support, security reports |
| Monitoring | Services, jobs, logs, alerts, incidents |
| Integrations | Provider catalog and tenant integrations |
| Settings | Platform configuration, templates, backups |
| Audit Logs | Platform activity, security, billing, system logs |

### 10.2 Tenant Modules

| Module | Purpose |
| --- | --- |
| Dashboard | Tenant KPIs, widgets, activities, quick actions |
| Access Control | Tenant roles, permissions, users |
| Teams | Tenant team structure and assignments |
| Staff | Staff profiles and HR details |
| Clients | Client profiles, contacts, addresses, related records |
| Vendors | Vendor profiles, contacts, bank accounts, expenses |
| Leads | Lead pipeline, activities, conversion |
| Renewals | Client/vendor/license/contract renewals |
| Projects | Projects, members, phases, milestones, time, expenses |
| Tasks/To-Do | Work management, checklists, dependencies, timers |
| Client Issues | Support issue tracking |
| Calendar | Events, attendees, rooms, reminders, sync |
| Attendance | Daily/monthly attendance and corrections |
| Leave | Leave requests, approvals, balances, calendar |
| Payroll | Payroll cycles, payslips, components, loans, tax |
| Holidays | Holiday calendars, applicability, groups |
| Finance | Invoices, payments, expenses, bank accounts |
| Documents | Files, folders, shared docs, previews |
| Notifications | Notifications and communication logs |
| Reports | CRM, HR, payroll, finance, project, support reports |
| Settings | Company, HR, CRM, security, communication, integrations |
| Audit Logs | Activity, login, system/API, data changes |
| Profile | User profile, password, sessions, API tokens |
| Help Center | Docs, FAQs, support contact, release notes |

## 11. Implementation Phases

### Phase 1: Foundation

- Finalize database migrations for platform, tenants, auth, RBAC, shared primitives.
- Build Laravel API standards, response envelopes, auth, tenant scoping, permissions.
- Build React and Flutter project foundations.
- Build shared UI patterns, API clients, routing, auth, and permission guards.
- Implement files, notes, tags, custom fields, activity logs.

### Phase 2: Platform Core

- Platform dashboard.
- Platform roles and permissions.
- Platform staff.
- Tenants and offices.
- Plans, features, add-ons.
- Subscriptions.
- Platform invoices and payments.

### Phase 3: Tenant CRM Core

- Tenant dashboard.
- Tenant access control and teams.
- Staff basics.
- Clients, vendors, leads.
- Projects and tasks.
- Calendar and reminders.
- Client issues.

### Phase 4: Finance and HRMS

- Tenant invoices, payments, expenses, bank accounts.
- Attendance.
- Leave.
- Payroll.
- Holidays.
- Renewals.

### Phase 5: Operations and Integrations

- Reports.
- Notifications and communication templates.
- Platform support.
- Monitoring.
- Integrations.
- Backups.
- Audit and security review flows.

### Phase 6: Enterprise Enhancements

- SSO/SAML/OIDC.
- Advanced search.
- Scheduled reports.
- Tenant backups/restores.
- Knowledge base.
- Legal document acceptance.
- Announcements.
- AI-assisted summaries/drafts if required.

## 12. Missing or Recommended Tables

Some pages and UI workflows require additional tables beyond the current main schema document. Track these before implementation:

| Area | Recommended Tables |
| --- | --- |
| Platform teams | `platform_teams`, `platform_team_roles`, `platform_team_members`, `platform_team_assignments` |
| Platform refunds | `platform_refunds` |
| Platform support | `platform_tickets`, `platform_ticket_comments` |
| Knowledge base | `knowledge_base_categories`, `knowledge_base_articles` |
| Remote login | `remote_login_sessions` |
| Platform settings/templates/backups | `platform_settings`, `notification_templates`, `backup_runs` |
| Attendance corrections | `attendance_requests` |
| Tenant API tokens | `tenant_api_tokens` |
| Tenant backups/restores | `tenant_backup_runs`, `tenant_restore_requests` |
| Document folders | `document_folders`, `document_folder_files` |
| Quotations | quotation and quotation item tables |
| Contracts | structured contract tables if contract lifecycle is needed |

## 13. Development Standards

### 13.1 Backend Standards

- Use FormRequest validation.
- Use Resources for API responses.
- Use Services/Actions for business workflows.
- Use Policies/permissions for authorization.
- Use queues for slow work.
- Use transactions for multi-table mutations.
- Use idempotency for financial and retryable mutation workflows.
- Use tests for permissions, tenant scoping, billing, payroll, imports, exports, and critical workflows.

### 13.2 React Standards

- Use TypeScript strictly.
- Use route-level code splitting.
- Use TanStack Query for server state.
- Use React Hook Form and Zod for forms.
- Keep platform and tenant features separated.
- Reuse data table, drawers, modals, activity, files, notes, and confirmation components.
- Add tests for permission guards, API clients, forms, and important workflows.

### 13.3 Flutter Standards

- Use typed models and repositories.
- Use secure storage for tokens.
- Support mobile and tablet layouts.
- Use bottom sheets for quick actions and full-screen dialogs for complex forms.
- Keep platform and tenant features separated.
- Add tests for repositories, routing, permission guards, and important widgets.

## 14. Quality and Release Checklist

Before marking a module complete, confirm:

- List page exists with search, filters, pagination, sorting, export, saved views, and safe bulk actions where relevant.
- Create/edit form exists with validation and API error rendering.
- Detail page exists with header summary, tabs/sections, actions, notes, files, reminders, and activity.
- Required popups/drawers from `docs/additional-ui-changes.md` are implemented.
- API integration uses documented endpoints and headers.
- Permissions are enforced in UI and backend.
- Tenant scoping is enforced in backend queries.
- Loading, empty, error, forbidden, and success states exist.
- Destructive/high-risk actions require confirmation and reason.
- Audit/activity logs are written for mutations.
- Tests exist for critical behavior.

## 15. Recommended Build Order

1. Database migrations and seeders.
2. Backend auth, RBAC, tenant scoping, API conventions.
3. Shared backend primitives: files, notes, tags, custom fields, activity logs.
4. React foundation and shared UI system.
5. Flutter foundation and shared mobile widgets.
6. Platform core modules.
7. Tenant CRM core modules.
8. Tenant operations modules.
9. HRMS and finance modules.
10. Reports, integrations, notifications, monitoring, audit.
11. Security hardening and performance optimization.
12. Full QA, staging deployment, production rollout.

## 16. Final Notes

This project should be built as a modular SaaS platform, not as a collection of disconnected CRUD pages. The database, APIs, web frontend, mobile app, and UI workflows must stay aligned.

When implementation starts, always use the relevant module docs as source of truth:

- For schema: `docs/database.md`.
- For platform UI/API: `docs/platform-pages.md` and `docs/platform-apis.md`.
- For tenant UI/API: `docs/tenant-pages.md` and `docs/tenant-apis.md`.
- For dialogs/drawers/workflows: `docs/additional-ui-changes.md`.
- For React build prompts: `docs/react-js-setup.md`.
- For Flutter build prompts: `docs/flutter-setup.md`.
- For tools and services: `docs/technology-stacks.md`.
