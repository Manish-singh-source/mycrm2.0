# React JS SaaS Frontend Setup Prompts

This document contains step-by-step workflow prompts for building the React frontend for the SaaS CRM. Use these prompts sequentially in a frontend React project. They are based on:

- `docs/platform-pages.md`
- `docs/platform-apis.md`
- `docs/tenant-pages.md`
- `docs/tenant-apis.md`
- `docs/additional-ui-changes.md`

The target frontend is an enterprise SaaS application with two surfaces:

- Platform Admin: SaaS owner/staff console using `/api/platform/v1`.
- Tenant CRM: tenant workspace application using `/api/tenant/v1`.

## Global Frontend Standards

Use these standards in every prompt unless explicitly overridden:

- Build with React, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, a typed API client, and a component-first architecture.
- Use a professional enterprise SaaS UI: dense, readable, fast, restrained, consistent, and built for repeated daily work.
- Use role/permission-aware navigation, buttons, routes, and actions.
- Use API response envelopes, validation errors, pagination, filters, includes, sparse fields, and request IDs exactly as documented in the API docs.
- Use separate platform and tenant API clients because headers, base URLs, auth guards, and tenancy rules differ.
- Use UUIDs in route params where available.
- Mask secrets, account numbers, gateway responses, and credentials in UI.
- Every list page must support search, filters, pagination, sorting, column visibility, saved views, export, safe bulk actions, and activity access.
- Every create/edit page must support validation, duplicate/error display, save, save and continue, cancel, unsaved changes warning, and audit reason where needed.
- Every view page must support header summary, tabs, primary actions, notes, files, reminders, activity/timeline, and permission-aware action visibility.
- Every destructive, financial, payroll, security, remote login, integration, backup, and bulk action must show a confirmation modal and capture a reason when required.
- Use shared drawers and modals for assignment, status changes, bulk update, import/export, file preview, raw payload, audit compare, communication composer, approval, and quick-create flows.
- Do not build marketing pages. The first screen after login must be the actual SaaS application.

Recommended source structure:

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  config/
    env.ts
    routes.ts
    permissions.ts
  lib/
    api/
      http.ts
      platformClient.ts
      tenantClient.ts
      errors.ts
      queryKeys.ts
    auth/
      authStore.ts
      permissionGuard.ts
      tenantContext.ts
    format/
      date.ts
      money.ts
      status.ts
    validation/
  layouts/
    AuthLayout.tsx
    PlatformLayout.tsx
    TenantLayout.tsx
  components/
    ui/
    data-table/
    forms/
    charts/
    drawers/
    modals/
    files/
    activity/
    navigation/
    permissions/
  features/
    platform/
    tenant/
    shared/
  pages/
    platform/
    tenant/
    auth/
  hooks/
  styles/
  tests/
```

## Prompt 1: Project Bootstrap and Standards

```text
Create the initial React SaaS frontend project architecture for an enterprise CRM using React, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, and a reusable component system.

Read and follow these docs as source of truth:
- docs/platform-pages.md
- docs/platform-apis.md
- docs/tenant-pages.md
- docs/tenant-apis.md
- docs/additional-ui-changes.md

Do not implement all pages yet. First create the frontend foundation only:
- app providers
- router shell
- environment config
- platform and tenant API client placeholders
- auth store shape
- permission guard helpers
- layout shells
- shared UI directories
- data table, drawer, modal, form, chart, file, activity, and navigation folders
- route constants for platform and tenant modules
- lint/format/test setup recommendations

Use a clean enterprise folder structure and naming convention that can scale to hundreds of pages. Keep platform and tenant features separated, but share reusable primitives.

Output code and explain the structure briefly.
```

## Prompt 2: Environment, API Clients, and Request Standards

```text
Implement the API layer for the React SaaS frontend.

Use docs/platform-apis.md and docs/tenant-apis.md.

Requirements:
- Create a shared HTTP client wrapper around fetch or axios.
- Create separate platformClient and tenantClient.
- Platform base URL: /api/platform/v1.
- Tenant base URL: /api/tenant/v1.
- Platform headers: Authorization, Accept, Content-Type, X-Request-Id, X-Client-Version, optional Idempotency-Key, X-Timezone, X-Locale, X-Impersonation-Reason.
- Tenant headers: Authorization, Accept, Content-Type, X-Tenant, X-Request-Id, X-Client-Version, optional Idempotency-Key, X-Timezone, X-Locale, X-Office.
- Support multipart uploads without forcing JSON Content-Type.
- Normalize standard response envelopes: data, meta, links.
- Normalize validation errors and API errors.
- Add helpers for common list query params: page, per_page, search, sort, include, fields, filter[field], date_from, date_to, view.
- Add idempotency helper for mutating financial, payroll, security, and bulk actions.
- Add request cancellation and retry rules appropriate for reads only.
- Never retry non-idempotent mutations automatically.

Create query key conventions for platform and tenant resources.
```

## Prompt 3: Auth, Tenant Context, and Permission Guards

```text
Build the authentication, tenant context, route protection, and permission guard layer.

Use docs/platform-apis.md and docs/tenant-apis.md auth sections.

Requirements:
- Support platform admin login/session and tenant user login/session separately.
- Add auth state with current user, current tenant, roles, permissions, token, locale, timezone, and office where applicable.
- Build route guards for authenticated platform routes, authenticated tenant routes, public auth routes, and forbidden states.
- Build PermissionGate component and usePermission hook.
- Hide navigation items and action buttons when permission is missing.
- Add 401 handling, logout, refresh flow placeholder, and forbidden page.
- Tenant requests must include X-Tenant.
- Platform routes must never send X-Tenant unless explicitly needed for impersonation UI.
- Create profile/session preference hooks.

Do not build module pages yet. Focus on secure shell behavior.
```

## Prompt 4: Design System and Shared UI Primitives

```text
Create the shared enterprise SaaS design system primitives.

Use docs/additional-ui-changes.md as the source for required UI surfaces.

Build reusable components for:
- AppShell, page header, breadcrumbs, tabs, summary cards, status badges
- DataTable with search, filters, pagination, sorting, column visibility, saved views, row selection, bulk action bar
- AdvancedFiltersDrawer
- ColumnManagerModal
- SavedViewsModal
- ExportModal
- ImportWizard
- ConfirmDialog with typed confirmation support
- AssignUserTeamModal
- StatusChangeModal
- BulkUpdateModal
- QuickCreateDrawer
- ActivityDrawer
- AuditCompareDrawer
- NotesDrawer
- FilesDrawer
- FilePreviewDrawer
- RawPayloadDrawer
- CommunicationComposerDrawer
- ApprovalModal
- ReminderModal
- TagsModal
- EmptyState and PermissionDeniedState

Standards:
- Keep UI dense and operational, not marketing-like.
- Use 8px or smaller radius for cards unless the design system requires otherwise.
- Use accessible labels, keyboard focus, loading, empty, error, and disabled states.
- Every modal/drawer must be permission-aware and support API loading/errors.
```

## Prompt 5: Application Layouts and Navigation

```text
Build the platform and tenant application layouts.

Use docs/platform-pages.md and docs/tenant-pages.md navigation requirements.

Platform layout:
- Sidebar sections: Dashboard, Access Control, Platform Teams, Platform Staff, Tenants, Subscriptions, Plans/Features/Add-ons, Billing, Coupons, Modules, Support, Reports, Monitoring, Integrations, Settings, Audit Logs, Onboarding/Trial/Legal/Announcements/API Tokens/Webhooks where applicable.
- Top bar: search, notifications, profile, timezone/locale, quick actions.

Tenant layout:
- Sidebar sections: Dashboard, CRM, Projects, Support, HRMS, Finance, Documents, Reports, Settings, Profile, Help Center.
- CRM: Leads, Clients, Vendors, Client Renewals, Vendor Renewals.
- Projects: Projects, Tasks, Calendar, To-Do.
- HRMS: Staff, Attendance, Leave Management, Payroll, Holidays.
- Finance: Invoices, Payments, Expenses, Bank Accounts.
- Hide modules disabled by tenant settings or subscription features.
- Show badges for overdue tasks, open issues, pending approvals, unread notifications, and renewals due soon.

Add responsive behavior, collapsed sidebar, breadcrumbs, and permission-aware navigation.
```

## Prompt 6: Shared CRUD Page Factory Pattern

```text
Create a reusable page pattern for enterprise list/create/edit/view modules.

The pattern must support:
- List page: search, filters, saved views, pagination, sorting, column manager, exports, bulk actions, row action menu, activity drawer.
- Create/edit page: React Hook Form + Zod, API validation errors, save, save and continue, cancel, unsaved changes confirmation, duplicate checks where API returns conflicts.
- View page: header summary, status badge, primary actions, action menu, tabs, notes, files, reminders, activity timeline.
- Modal actions: assign, status change, clone, archive, restore, delete, import, export.

Create reusable hooks and component conventions so platform and tenant modules can implement consistent pages without copy-paste.

Do not generate every module yet. Build the reusable foundation and one small sample module adapter using mock fields.
```

## Prompt 7: Platform Dashboard and Operational Widgets

```text
Implement the Platform Admin dashboard.

Use docs/platform-pages.md section Dashboard and docs/platform-apis.md Dashboard endpoints.

Build:
- KPI cards for tenants, revenue, billing, operations, failed jobs, incidents, alerts.
- Charts for tenant growth, revenue, plan distribution, subscription status, usage, payment success/failure.
- Tables for recent tenants, recent payments, overdue invoices, active alerts, security events.
- Date range selector popup.
- Dashboard export popup.
- Alert detail drawer.
- Incident quick-create drawer.
- Failed job detail drawer with retry/delete actions.
- Security event review popup.

Use TanStack Query for all GET endpoints. Respect loading, error, empty states, permission checks, and export flow.
```

## Prompt 8: Platform Access Control and Teams

```text
Implement Platform Access Control and Platform Teams.

Use docs/platform-pages.md sections Access Control and Platform Teams, docs/platform-apis.md Access Control and Platform Teams, and docs/additional-ui-changes.md platform access/team UI additions.

Build pages:
- Platform Roles List/Create/Edit/View
- Platform Permissions List/Create/Edit/View where custom permission actions are supported
- Platform Teams List/Create/Edit/View
- Platform Team Roles List/Create/Edit

Required UI:
- Assign permissions drawer with grouped permission checklist and diff preview.
- Assign users popup.
- Clone role popup.
- Delete role confirmation with assigned user count.
- Add team member popup.
- Assign records popup for tenants, tickets, incidents, alerts.
- Release assignment confirmation.
- Team role editor popup.

All actions must be permission-aware and write audit reason where required.
```

## Prompt 9: Platform Staff Management

```text
Implement Platform Staff management.

Use docs/platform-pages.md Platform Staff, docs/platform-apis.md Platform Staff, and docs/additional-ui-changes.md Platform Staff additions.

Build:
- Staff list with filters, roles, teams, status, 2FA, last login.
- Staff create/edit form with identity, contact, employment, access, security, preferences.
- Staff view with Profile, Access, Security, Assignments, Activity tabs.

Required UI:
- Invite staff popup.
- Assign roles popup.
- Direct permissions drawer.
- Assign teams popup.
- Suspend/reactivate popup.
- Reset password popup.
- Force logout confirmation.
- Require 2FA popup.
- Profile photo upload/crop popup.

Ensure password/token fields are never displayed after creation.
```

## Prompt 10: Platform Tenant Lifecycle

```text
Implement Platform Tenant management.

Use docs/platform-pages.md Tenants, docs/platform-apis.md Tenants, and docs/additional-ui-changes.md Tenants UI additions.

Build:
- Tenant list with filters for status, plan, subscription status, trial ending, industry, business type, country, created date.
- Tenant creation wizard: organization, owner, head office, subscription, review.
- Tenant edit page.
- Tenant view with tabs: Overview, Owner/Users, Offices, Subscription, Billing, Usage, Modules/Features, Settings, Integrations, Security, Support, Files, Activity.

Required UI:
- Change plan popup.
- Extend trial popup.
- Suspend/reactivate popup.
- Remote login popup.
- Owner reset password popup.
- Module override drawer.
- Usage detail drawer.
- Tenant settings preview drawer with masked secrets.
- Confirm typed action for suspension/deletion/remote login.

Implement tenant lifecycle actions exactly as API docs specify.
```

## Prompt 11: Platform Subscriptions, Plans, Features, Add-ons

```text
Implement Platform subscription catalog and lifecycle management.

Use docs/platform-pages.md sections Subscriptions and Plans/Features/Add-ons, docs/platform-apis.md matching endpoints, and docs/additional-ui-changes.md subscription/catalog UI additions.

Build:
- Subscriptions list/view.
- Plans list/create/edit/view.
- Features list/create/edit/view.
- Add-ons list/create/edit/view.

Required UI:
- Upgrade/downgrade popup with plan comparison, proration, coupon, effective date.
- Pause/resume popup.
- Cancel subscription popup with data retention warning.
- Renew subscription popup.
- Add add-on popup.
- Apply coupon popup.
- Feature matrix drawer.
- Attach feature popup.
- Clone plan popup.
- Archive plan confirmation with active subscription count.

Show financial totals using money formatting and never mutate subscription state without confirmation.
```

## Prompt 12: Platform Billing, Payments, Refunds, Coupons

```text
Implement Platform Billing and Coupons.

Use docs/platform-pages.md Billing and Coupons, docs/platform-apis.md Billing/Coupons, and docs/additional-ui-changes.md Platform Billing/Coupon UI additions.

Build:
- Platform invoices list/view/create manual invoice.
- Invoice line item editor.
- Payments list/view.
- Refund list/view if API/table exists; otherwise create UI placeholder with missing-table note.
- Coupons list/create/edit/view.

Required UI:
- Manual invoice drawer.
- Send invoice popup.
- Record payment popup.
- Invoice PDF preview drawer.
- Cancel invoice confirmation.
- Gateway response drawer with masked raw response.
- Retry payment popup.
- Initiate refund popup.
- Coupon rule builder popup.
- Assign plans and assign tenants popups.
- Disable coupon confirmation.

Use typed confirmations for refunds, voids, and invoice cancellation after sending.
```

## Prompt 13: Platform Modules, Support, Monitoring, Integrations, Settings, Audit

```text
Implement remaining Platform Admin modules.

Use docs/platform-pages.md sections Modules, Support, Reports, Monitoring, Integrations, Settings, Audit Logs, Missing Platform Pages, docs/platform-apis.md matching sections, and docs/additional-ui-changes.md platform additions.

Build pages:
- Modules and feature controls.
- Support tickets, knowledge base, remote login sessions.
- Reports dashboard and report pages.
- Monitoring service health, jobs, scheduler logs, API logs, alerts, incidents.
- Integrations provider catalog, tenant integrations, credentials, webhooks, sync jobs, field mappings, rate limits.
- Settings groups, notification templates, backups.
- Audit logs: activity, security, billing/payment/subscription/system/remote login logs.
- Onboarding, trial, legal documents, announcements, API tokens, webhook delivery pages if backed by APIs.

Required UI:
- Provider connect wizard.
- Credential rotation popup.
- Webhook/sync retry popup.
- Field mapping editor drawer.
- Alert resolve popup.
- Incident drawer.
- Raw payload/exception drawer.
- Article editor and publish/unpublish popups.
- Audit compare drawer.
- Export report/audit popups.

For features with missing tables, render a clear implementation placeholder and keep route/module structure ready.
```

## Prompt 14: Tenant Auth, Dashboard, Navigation, Profile

```text
Implement Tenant CRM auth, dashboard, navigation, notifications, and profile.

Use docs/tenant-pages.md Dashboard/Profile/Navigation, docs/tenant-apis.md Auth/Profile/Dashboard, and docs/additional-ui-changes.md Tenant Dashboard/Profile additions.

Build:
- Tenant login flow with X-Tenant support.
- Tenant app shell and sidebar.
- Dashboard summary, charts, widgets, recent records, activity.
- My Dashboard widget customization.
- Notifications center drawer.
- Profile pages: My Profile, Change Password, Security, Sessions, API Tokens, Preferences.
- Help Center shell.

Required UI:
- Widget library popup.
- Widget settings popup.
- Quick actions menu.
- Notification detail drawer.
- Recent activity drawer with compare changes.
- Sidebar disabled module tooltip.
- 2FA wizard.
- Revoke session/token confirmation.
- API token create/rotate copy-once view.

Ensure tenant route guards hide disabled modules and permission-restricted pages.
```

## Prompt 15: Tenant Access Control, Teams, Staff

```text
Implement Tenant Access Control, Teams, Staff, and Tenant Users.

Use docs/tenant-pages.md Access Control and Staff Management, docs/tenant-apis.md Access Control/Teams/Staff, and docs/additional-ui-changes.md tenant access/team/staff additions.

Build:
- Roles list/create/edit/view.
- Permissions grouped view.
- Teams list/create/edit/view with members, permissions, settings, assignments.
- Staff dashboard/list/grid/create/edit/view.
- Tenant users list/invite/update/roles/suspend/activate/reset password.
- Staff view tabs: Profile, User Access, Teams, Documents, Bank Details, Salary Structure, Leave History, Attendance, Payroll, Projects/Tasks, Assets, Certifications, Appraisals, Training, Notes, Files, Activity.

Required UI:
- Clone role popup.
- Assign permissions drawer.
- Assign users popup.
- Add team member popup.
- Assign record popup.
- Staff import wizard.
- Staff export popup.
- Invite user popup.
- Assign role/team popups.
- Bank account popup with masked preview.
- Salary structure popup with effective-date warning.
- Document popup with expiry reminder option.
- Profile photo upload/crop popup.
- Staff timeline drawer.
```

## Prompt 16: Tenant CRM Clients, Vendors, Leads

```text
Implement Tenant CRM modules for Clients, Vendors, and Leads.

Use docs/tenant-pages.md Clients/Vendors/Lead Management, docs/tenant-apis.md CRM sections, and docs/additional-ui-changes.md Clients/Vendors/Leads additions.

Build:
- Clients list/grid/create/edit/view.
- Client tabs: Overview, Contacts, Addresses, Projects, Quotations placeholder, Invoices, Payments, Renewals, Support Issues, Files, Notes, Timeline.
- Vendors list/grid/create/edit/view.
- Vendor tabs: Overview, Contacts, Addresses, Bank Accounts, Services/Contracts placeholder, Expenses, Renewals, Documents, Notes, Activity.
- Leads dashboard/list/grid/Kanban/create/edit/view.
- Lead tabs: Overview, Contacts, Activities, Follow-ups, Calls, Meetings, Emails, Tasks, Quotations placeholder, Documents, Notes, Timeline, Conversion History.

Required UI:
- Client duplicate merge wizard.
- Add contact popup and address popup.
- Portal access popup for client contact.
- Send email composer.
- Vendor bank account popup.
- Upload contract/document popup.
- Vendor rating popup.
- Lead stage-change confirmation.
- Assign owner popup.
- Activity/follow-up popup.
- Schedule meeting drawer.
- Mark won/lost popup.
- Convert lead wizard.
- Duplicate/merge lead flows.

Use shared party/contact/address forms so client, vendor, and lead identity stays consistent.
```

## Prompt 17: Tenant Renewals, Projects, Tasks, Issues, Calendar

```text
Implement Tenant operational modules: Renewals, Projects, Tasks, To-Do, Client Issues, Calendar.

Use docs/tenant-pages.md sections Renewals, Projects, Tasks and To-Do, Client Issues, Calendar and Appointments; docs/tenant-apis.md matching sections; and docs/additional-ui-changes.md matching UI additions.

Build:
- Renewals dashboard/list/calendar/client-renewals/vendor-renewals/create/edit/view.
- Projects dashboard/list/grid/Kanban/Gantt/calendar/create/edit/view.
- Tasks dashboard/list/Kanban/calendar/my tasks/team tasks/create/edit/view.
- To-do lists dashboard/list/Kanban/calendar/create/edit/view.
- Client issues dashboard/list/Kanban/create/edit/view.
- Calendar daily/weekly/monthly/agenda/my schedule/team calendar.

Required UI:
- Renewal quick-create, renew/extend, reminder schedule, send reminder, cancel confirmation, history drawer.
- Project quick-create, member popup, phase/milestone popups, complete milestone confirmation, bulk assign, archive warning, log time, add expense, Gantt dependency editor.
- Task assign/status/bulk update/checklist/dependency/watcher/timer/recurrence/clone/share popups.
- Issue assign/reply/status/resolve/close/reopen/create-task/log-time/attachment preview flows.
- Calendar event quick-create/edit drawer, attendee selector, reminder popup, recurrence editor, room booking, video meeting, drag confirmation, conflict warning, sync result drawer.

All Kanban drag/drop changes must use confirmation when target stage/status has required fields.
```

## Prompt 18: Tenant HRMS Attendance, Leave, Payroll, Holidays

```text
Implement Tenant HRMS modules: Attendance, Leave Management, Payroll, Holidays.

Use docs/tenant-pages.md Attendance/Leave/Payroll/Holidays, docs/tenant-apis.md HRMS sections, and docs/additional-ui-changes.md HRMS additions.

Build:
- Attendance dashboard, daily attendance, monthly attendance grid, attendance requests/corrections, approval queue.
- Leave dashboard, requests, apply leave, approvals, balances, calendar, leave types.
- Payroll dashboard, cycles, generate payroll wizard, payroll history, payroll view, payslips, components, assignments, loans, reimbursements, bank transfers, tax/PF/ESI settings.
- Holidays calendar/list/create/edit/view, holiday calendars, holiday groups, group members.

Required UI:
- Check-in/check-out confirmation.
- Attendance correction request popup.
- Approve/reject correction popup.
- Monthly attendance bulk update popup.
- Attendance import wizard.
- Apply leave drawer with balance preview and overlap warning.
- Approve/reject/cancel leave popups.
- Leave balance adjustment popup.
- Payroll cycle popup.
- Generate payroll wizard with validation preview.
- Payroll preview drawer.
- Submit/approve/lock/reopen confirmations.
- Payslip preview and bulk email popup.
- Salary component formula editor.
- Loan schedule popup.
- Reimbursement approval popup.
- Bank transfer export popup.
- Holiday applicability selector drawer.
- Duplicate holiday to next year confirmation.
- Holiday import wizard.
```

## Prompt 19: Tenant Finance, Documents, Communication, Reports, Settings

```text
Implement Tenant Finance, Files/Documents, Notifications/Communication, Reports, Settings, Integrations, Audit, and Help Center.

Use docs/tenant-pages.md sections Tenant Finance, Files and Documents, Notifications and Communication, Reports, Settings, Audit Logs, Profile, Help Center; docs/tenant-apis.md matching sections; and docs/additional-ui-changes.md matching UI additions.

Build:
- Finance dashboard, invoices, invoice create/edit/view, payments, expenses, bank accounts.
- Documents center: all documents, upload, shared files, recent files, optional folders placeholder.
- Notifications and communication logs/queues/templates.
- Reports dashboard and all CRM/HR/payroll/renewal/finance/project/task/support/custom reports.
- Settings: general, company info, branding, localization, offices, HR settings, CRM lookups, communication, security, integrations, storage, backup placeholders.
- Audit logs: activity, login history, system/API logs, data changes.
- Help Center: docs, FAQs, contact support, release notes, system status.

Required UI:
- Invoice quick-create drawer, line item editor, tax/discount drawer, send invoice composer, PDF preview, record payment, cancel confirmation.
- Payment detail drawer, void confirmation, receipt upload.
- Expense quick-create, item editor, receipt attachment, approve/reject.
- Bank account add/edit masked preview, set primary confirmation.
- Upload document drag/drop, file preview, attach existing, replace confirmation, optional folder move/copy.
- Communication composer, retry confirmation, template preview/test-send.
- Report filter drawer, column/group selector, chart type selector, export, save custom report, schedule report placeholder, drill-down drawer.
- Logo/favicon crop/upload, lookup reorder, delete lookup used-count warning, integration connect wizard, credential rotation, backup/restore confirmations, security policy confirmation.
```

## Prompt 20: Cross-Module Workflow Polish

```text
Add cross-module workflow polish across the full React SaaS frontend.

Use docs/additional-ui-changes.md, especially Global UI Rules, Common Popup and Drawer Patterns, Cross-Module Assignment Matrix, Confirmation Rules, Missing Persistent UI Support, and Implementation Priority.

Implement or verify:
- Assignment flows for platform tenants/tickets/incidents/alerts and tenant leads/clients/vendors/projects/tasks/issues/events/approvals.
- Shared ConfirmDialog rules, including typed confirmations for tenant suspension/deletion, subscription cancellation, invoice cancellation, payment refund/void, integration disconnect, backup restore, payroll lock/reopen.
- Shared action reason capture for lifecycle, financial, payroll, access, security, and bulk actions.
- Global drawers for activity, audit compare, raw payloads, notes, files, reminders, communication composer, approvals.
- Permission-aware empty states.
- Missing-table placeholders for platform teams, refunds, support tickets, knowledge base, remote login, tenant attendance corrections, tenant API tokens, backups/restores, document folders, notification templates, quotations, and contracts.
- Consistent loading, error, empty, success, optimistic update, and invalidation behavior.

Do not add unrelated visual redesign. Keep the UI enterprise-focused and operational.
```

## Prompt 21: Testing, Accessibility, Performance, and Release Readiness

```text
Prepare the React SaaS frontend for enterprise release quality.

Add or verify:
- Unit tests for formatters, permission helpers, API query builders, and validation schemas.
- Component tests for DataTable, ConfirmDialog, AssignUserTeamModal, ImportWizard, ExportModal, ActivityDrawer, FilesDrawer, and PermissionGate.
- Route guard tests for platform, tenant, forbidden, unauthenticated, and disabled module states.
- API mocking strategy using MSW for platform and tenant endpoints.
- Accessibility: keyboard navigation, focus trap in modals/drawers, ARIA labels, error announcements, color contrast, table navigation.
- Performance: route-level code splitting, query caching, pagination, virtualized large tables where needed, memoized columns, debounced search.
- Security: masked secrets, no raw tokens after create, no cross-tenant data leakage, no permission-hidden action execution, safe raw payload rendering.
- UX: unsaved changes guard, skeletons, empty states, retry actions, toast messages, audit reason prompts.
- Build checks: typecheck, lint, test, production build.

Create a final checklist showing which platform and tenant modules are complete, partial, or blocked by missing backend tables/APIs.
```

## Prompt 22: Final Frontend Acceptance Checklist

```text
Review the completed React frontend against all source docs:
- docs/platform-pages.md
- docs/platform-apis.md
- docs/tenant-pages.md
- docs/tenant-apis.md
- docs/additional-ui-changes.md

Produce a final acceptance report with these sections:
- Platform pages completed.
- Tenant pages completed.
- API endpoints integrated.
- Shared UI surfaces completed.
- Assignment workflows completed.
- Confirmation workflows completed.
- Import/export workflows completed.
- Permission guards completed.
- Missing backend/table dependencies.
- Known UX gaps.
- Test coverage summary.
- Production readiness risks.

Do not mark a module complete unless its list, create/edit, view tabs, actions, drawers/modals, permissions, API integration, loading/error/empty states, and tests are implemented.
```

## Suggested Build Order

1. Project bootstrap, standards, routing, API clients, auth, permission guards.
2. Design system primitives, app layouts, shared CRUD/list patterns.
3. Platform dashboard, access control, staff, tenants.
4. Platform subscriptions, plans, billing, coupons.
5. Platform support, monitoring, integrations, settings, audit.
6. Tenant auth/dashboard/profile/navigation.
7. Tenant access control, teams, staff.
8. Tenant CRM: clients, vendors, leads.
9. Tenant operations: renewals, projects, tasks, issues, calendar.
10. Tenant HRMS: attendance, leave, payroll, holidays.
11. Tenant finance, documents, communication, reports, settings, audit, help.
12. Cross-module polish, tests, accessibility, performance, release readiness.

## Non-Negotiable Company Standards

- Keep platform and tenant modules separated in routes, API clients, permissions, and layouts.
- Keep shared components generic and domain modules specific.
- Do not hardcode permissions inside components when a central permission map can be used.
- Do not leak tenant data across tenant context changes.
- Do not show raw secrets, tokens, encrypted values, gateway secrets, account numbers, or private file paths.
- Do not perform destructive or financial actions without confirmation.
- Do not create pages without loading, empty, error, and permission-denied states.
- Do not create forms without schema validation and API validation error rendering.
- Do not create list pages without saved filters, search, pagination, sorting, column manager, export, and safe bulk action support.
- Do not implement a page as complete unless required popups/drawers from `docs/additional-ui-changes.md` are included.
