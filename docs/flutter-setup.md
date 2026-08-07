# Flutter SaaS Mobile App Setup Prompts

This document contains step-by-step workflow prompts for building the Flutter app for the SaaS CRM. Use these prompts sequentially in a Flutter project. They are based on:

- `docs/platform-pages.md`
- `docs/platform-apis.md`
- `docs/tenant-pages.md`
- `docs/tenant-apis.md`
- `docs/additional-ui-changes.md`

The target app is an enterprise SaaS mobile/tablet application with two possible surfaces:

- Platform Admin: SaaS owner/staff console using `/api/platform/v1`.
- Tenant CRM: tenant workspace app using `/api/tenant/v1`.

## Global Flutter Standards

Use these standards in every prompt unless explicitly overridden:

- Build with Flutter stable, Dart, Material 3, go_router, Riverpod or Bloc, Dio, freezed/json_serializable, form validation, secure storage, and a clean feature-first architecture.
- Prefer Riverpod for scalable async state unless the project already standardizes on Bloc.
- Use strict typing for API models, request bodies, response envelopes, pagination, validation errors, and permissions.
- Keep platform and tenant modules separated in routing, API clients, headers, auth state, permissions, and navigation.
- Support mobile and tablet layouts. Mobile should use bottom sheets/drawers for complex actions; tablet can use split panes and side navigation.
- Use an enterprise SaaS visual style: compact, readable, fast, consistent, not marketing-like.
- Every list screen must support search, filters, pagination/infinite scroll, sorting where practical, saved views where supported, export, safe bulk actions, and activity access.
- Every form must support validation, API validation errors, save, save and continue where useful, cancel, and unsaved changes guard.
- Every detail screen must support header summary, status, tabs/sections, primary actions, related records, notes, files, reminders, and activity timeline.
- Every destructive, financial, payroll, security, remote login, integration, backup, and bulk action must show a confirmation sheet/dialog and capture a reason when required.
- Mask secrets, account numbers, tokens, encrypted values, gateway responses, and private file paths.
- Do not mark a screen complete unless required dialogs/sheets/drawers from `docs/additional-ui-changes.md` are included.

Recommended source structure:

```text
lib/
  main.dart
  app/
    app.dart
    router.dart
    providers.dart
    theme.dart
  core/
    config/
      env.dart
      routes.dart
      permissions.dart
    network/
      dio_client.dart
      platform_api_client.dart
      tenant_api_client.dart
      api_error.dart
      request_headers.dart
      query_params.dart
    auth/
      auth_state.dart
      auth_repository.dart
      permission_guard.dart
      tenant_context.dart
    storage/
      secure_storage.dart
      local_cache.dart
    utils/
      date_formatters.dart
      money_formatters.dart
      status_helpers.dart
    widgets/
      app_shell/
      data_list/
      forms/
      charts/
      dialogs/
      sheets/
      files/
      activity/
      navigation/
  features/
    platform/
    tenant/
    shared/
  l10n/
  test/
```

## Prompt 1: Flutter Project Bootstrap and Architecture

```text
Create the initial Flutter SaaS mobile/tablet app architecture for an enterprise CRM.

Read and follow these docs as source of truth:
- docs/platform-pages.md
- docs/platform-apis.md
- docs/tenant-pages.md
- docs/tenant-apis.md
- docs/additional-ui-changes.md

Do not implement all screens yet. First create the foundation only:
- clean feature-first folder structure
- app entry, router shell, providers, theme
- core network layer placeholders
- platform and tenant API client placeholders
- auth state shape
- tenant context shape
- permission guard helpers
- secure storage wrapper
- shared widgets directories
- route constants for platform and tenant modules
- test structure

Use Flutter stable, Dart, Material 3, go_router, Dio, Riverpod, freezed/json_serializable, and secure storage. Keep the structure scalable for hundreds of screens.
```

## Prompt 2: Environment, Dio Clients, and API Standards

```text
Implement the Flutter API layer.

Use docs/platform-apis.md and docs/tenant-apis.md.

Requirements:
- Create a shared Dio client wrapper.
- Create separate PlatformApiClient and TenantApiClient.
- Platform base URL: /api/platform/v1.
- Tenant base URL: /api/tenant/v1.
- Platform headers: Authorization, Accept, Content-Type, X-Request-Id, X-Client-Version, optional Idempotency-Key, X-Timezone, X-Locale, X-Impersonation-Reason.
- Tenant headers: Authorization, Accept, Content-Type, X-Tenant, X-Request-Id, X-Client-Version, optional Idempotency-Key, X-Timezone, X-Locale, X-Office.
- Support multipart upload without forcing JSON Content-Type.
- Parse standard response envelope: data, meta, links.
- Parse validation errors and API errors into typed failures.
- Create common list query parameter builder: page, per_page, search, sort, include, fields, filter[field], date_from, date_to, view.
- Add idempotency key helper for mutating financial, payroll, security, and bulk actions.
- Never auto-retry non-idempotent mutation requests.
- Add logging interceptor for debug only and mask Authorization/secrets.
```

## Prompt 3: Auth, Secure Storage, Tenant Context, Permissions

```text
Build authentication, secure token storage, tenant context, route protection, and permission guards.

Use docs/platform-apis.md and docs/tenant-apis.md auth sections.

Requirements:
- Support platform admin auth and tenant user auth separately.
- Store tokens in secure storage.
- Auth state must include current user, current tenant, roles, permissions, token, locale, timezone, and office where applicable.
- Use go_router redirects for unauthenticated, forbidden, platform, tenant, and disabled-module routes.
- Build PermissionGate widget and permission helper providers.
- Hide navigation and action buttons when permission is missing.
- Add 401 handling, logout, refresh placeholder, forbidden screen, and session expiry dialog.
- Tenant requests must include X-Tenant.
- Platform requests must not send X-Tenant except explicit impersonation/remote login flows.
```

## Prompt 4: Theme, Design System, Shared Widgets

```text
Create the Flutter enterprise SaaS design system.

Use docs/additional-ui-changes.md as source for reusable UI surfaces.

Build shared widgets for:
- AppScaffold, responsive shell, page header, breadcrumbs, tabs, status badges, summary cards
- DataList/DataTable for mobile and tablet
- Search bar, filter chips, advanced filter bottom sheet
- Column manager sheet for tablet/list-heavy screens
- Saved views sheet
- Export sheet
- Import wizard flow
- Confirm dialog/sheet with typed confirmation support
- Assign user/team sheet
- Status change sheet
- Bulk update sheet
- Quick create bottom sheet/full-screen dialog
- Activity timeline sheet
- Audit compare sheet
- Notes sheet
- Files sheet
- File preview screen/sheet
- Raw payload viewer with copy/download and masking
- Communication composer sheet
- Approval sheet
- Reminder sheet
- Tags sheet
- Empty state, error state, loading skeleton, permission denied state

Mobile rules:
- Use bottom sheets for quick actions and simple forms.
- Use full-screen dialogs for complex create/edit forms.
- Use tablet split panes for list-detail where helpful.
- Keep controls large enough for touch, but maintain compact enterprise density.
```

## Prompt 5: App Shells and Navigation

```text
Build Platform and Tenant app shells with responsive navigation.

Use docs/platform-pages.md and docs/tenant-pages.md.

Platform shell:
- Dashboard, Access Control, Platform Teams, Platform Staff, Tenants, Subscriptions, Plans/Features/Add-ons, Billing, Coupons, Modules, Support, Reports, Monitoring, Integrations, Settings, Audit Logs, Onboarding/Trial/Legal/Announcements/API Tokens/Webhooks where applicable.

Tenant shell:
- Dashboard, CRM, Projects, Support, HRMS, Finance, Documents, Reports, Settings, Profile, Help Center.
- CRM: Leads, Clients, Vendors, Client Renewals, Vendor Renewals.
- Projects: Projects, Tasks, Calendar, To-Do.
- HRMS: Staff, Attendance, Leave Management, Payroll, Holidays.
- Finance: Invoices, Payments, Expenses, Bank Accounts.

Requirements:
- Phone: bottom navigation for primary sections plus drawer for all modules.
- Tablet: navigation rail or side drawer.
- Hide routes/modules by permission, tenant settings, and subscription availability.
- Show badges for overdue tasks, open issues, pending approvals, unread notifications, and renewals due soon.
```

## Prompt 6: Shared Screen Patterns

```text
Create reusable Flutter screen patterns for list, create/edit, and detail screens.

The pattern must support:
- List screen: search, filters, pagination/infinite scroll, sort, saved views, export, bulk actions, row action menu, activity sheet.
- Create/edit screen: form validation, API validation errors, save, save and continue where useful, cancel, unsaved changes guard.
- Detail screen: header summary, status badge, primary actions, action overflow menu, tabs/sections, notes, files, reminders, activity timeline.
- Common action sheets: assign, status change, clone, archive, restore, delete, import, export.

Build reusable base classes/widgets/hooks/providers so platform and tenant features remain consistent.
```

## Prompt 7: Platform Dashboard and Operations

```text
Implement the Platform Admin dashboard in Flutter.

Use docs/platform-pages.md Dashboard, docs/platform-apis.md Dashboard, and docs/additional-ui-changes.md Platform Dashboard additions.

Build:
- KPI cards for tenants, revenue, billing, operations, incidents, alerts, failed jobs.
- Charts for tenant growth, revenue, plan distribution, subscription status, usage, payment status.
- Tables/lists for recent tenants, recent payments, overdue invoices, alerts, security events.
- Date range sheet.
- Dashboard export sheet.
- Alert detail sheet.
- Incident quick-create full-screen dialog.
- Failed job detail sheet with exception, retry, delete.
- Security event review sheet.

Use responsive layouts for phone/tablet and typed API states.
```

## Prompt 8: Platform Access Control, Teams, Staff

```text
Implement Platform Access Control, Platform Teams, and Platform Staff screens.

Use docs/platform-pages.md sections Access Control, Platform Teams, Platform Staff; docs/platform-apis.md matching endpoints; docs/additional-ui-changes.md platform access/team/staff additions.

Build:
- Platform roles list/create/edit/detail.
- Platform permissions list/detail.
- Platform teams list/create/edit/detail.
- Platform team roles list/create/edit.
- Platform staff list/create/edit/detail.

Required Flutter sheets/dialogs:
- Clone role sheet.
- Assign permissions full-screen sheet with grouped checklist and diff preview.
- Assign users sheet.
- Delete role confirmation with assigned user count.
- Add team member sheet.
- Assign records sheet for tenants, tickets, incidents, alerts.
- Release assignment confirmation.
- Invite staff sheet.
- Assign roles/direct permissions sheets.
- Assign teams sheet.
- Suspend/reactivate/reset password/force logout/require 2FA confirmations.
- Profile photo picker/crop flow.
```

## Prompt 9: Platform Tenants, Subscriptions, Plans, Billing

```text
Implement core Platform Admin business modules.

Use docs/platform-pages.md Tenants, Subscriptions, Plans/Features/Add-ons, Billing, Coupons; docs/platform-apis.md matching endpoints; docs/additional-ui-changes.md platform tenant/subscription/billing additions.

Build:
- Tenant list, creation wizard, edit, detail tabs.
- Subscription list/detail and lifecycle actions.
- Plans, features, add-ons catalog screens.
- Platform invoices, payments, refunds where backend exists.
- Coupons list/create/edit/detail.

Required workflows:
- Tenant creation wizard: organization, owner, head office, subscription, review.
- Change plan sheet with proration preview.
- Extend trial sheet.
- Suspend/reactivate tenant sheet.
- Remote login sheet with reason, duration, approval, warning.
- Module override sheet.
- Upgrade/downgrade, pause/resume, cancel, renew subscription sheets.
- Add add-on and apply coupon sheets.
- Feature matrix and attach feature sheets.
- Manual invoice dialog, line item editor, send invoice, record payment, PDF preview.
- Refund and retry payment flows with typed confirmations.
- Coupon rule builder, assign plans, assign tenants.
```

## Prompt 10: Platform Support, Monitoring, Integrations, Settings, Audit

```text
Implement remaining Platform Admin modules.

Use docs/platform-pages.md Support, Reports, Monitoring, Integrations, Settings, Audit Logs, Missing Platform Pages; docs/platform-apis.md matching sections; docs/additional-ui-changes.md platform additions.

Build:
- Modules and feature controls.
- Support tickets, knowledge base, remote login sessions.
- Reports dashboard and report screens.
- Monitoring services, jobs, scheduler logs, API logs, alerts, incidents.
- Integrations provider catalog, tenant integrations, credentials, webhooks, sync jobs, field mappings, rate limits.
- Settings groups, notification templates, backups.
- Audit logs and compare views.
- Optional onboarding, trial, legal, announcements, API tokens, webhooks if backend exists.

Required UI:
- Provider connect wizard.
- Credential rotation sheet.
- Webhook/sync retry sheet.
- Field mapping editor.
- Alert resolve sheet.
- Incident create/update dialog.
- Raw payload and exception viewer.
- Article editor and publish/unpublish sheets.
- Audit compare sheet.
- Export report/audit sheets.

For missing backend tables, create clean placeholder screens that explain the dependency without breaking navigation.
```

## Prompt 11: Tenant Auth, Dashboard, Navigation, Profile

```text
Implement Tenant auth, dashboard, navigation, notification center, profile, and help shell.

Use docs/tenant-pages.md Dashboard/Profile/Navigation, docs/tenant-apis.md Auth/Profile/Dashboard, and docs/additional-ui-changes.md Tenant Dashboard/Profile additions.

Build:
- Tenant login with X-Tenant support.
- Tenant responsive shell.
- Dashboard summary, charts, widgets, recent records, activities.
- My Dashboard customization.
- Notifications center.
- Profile, password, security, sessions, API tokens, preferences.
- Help Center shell.

Required UI:
- Widget library sheet.
- Widget settings sheet.
- Quick actions menu.
- Notification detail sheet.
- Recent activity compare sheet.
- Disabled module tooltip/message.
- 2FA wizard.
- Session/token revoke confirmation.
- API token create/rotate copy-once view.
```

## Prompt 12: Tenant Access Control, Teams, Staff

```text
Implement Tenant Access Control, Teams, Staff, and Users.

Use docs/tenant-pages.md Access Control and Staff Management, docs/tenant-apis.md Access Control/Teams/Staff, and docs/additional-ui-changes.md tenant access/team/staff additions.

Build:
- Roles list/create/edit/detail.
- Permissions grouped view.
- Teams list/create/edit/detail with members, permissions, settings, assignments.
- Staff dashboard, list/grid, create/edit/detail.
- Tenant users list/invite/update/roles/suspend/activate/reset password.
- Staff detail sections: profile, user access, teams, documents, bank, salary, leave, attendance, payroll, projects/tasks, assets, certifications, appraisals, training, notes, files, activity.

Required UI:
- Clone role sheet.
- Assign permissions sheet.
- Assign users sheet.
- Team member sheet.
- Assign record sheet.
- Staff import wizard.
- Staff export sheet.
- Invite user sheet.
- Assign role/team sheets.
- Bank account sheet with masked preview.
- Salary structure sheet with effective-date warning.
- Document sheet with expiry reminder.
- Profile photo picker/crop.
```

## Prompt 13: Tenant CRM Clients, Vendors, Leads

```text
Implement Tenant CRM screens for clients, vendors, and leads.

Use docs/tenant-pages.md Clients/Vendors/Lead Management, docs/tenant-apis.md CRM sections, and docs/additional-ui-changes.md CRM additions.

Build:
- Clients list/grid/create/edit/detail with all tabs.
- Vendors list/grid/create/edit/detail with all tabs.
- Leads dashboard/list/grid/Kanban/create/edit/detail with all tabs.

Required workflows:
- Client duplicate merge wizard.
- Add/edit contact and address sheets.
- Portal access sheet.
- Send email composer.
- Vendor bank account sheet.
- Upload contract/document sheet.
- Vendor rating sheet.
- Lead stage-change confirmation.
- Assign owner sheet.
- Activity/follow-up sheet.
- Schedule meeting dialog.
- Mark won/lost sheet.
- Convert lead wizard.
- Duplicate/merge lead flows.

Reuse shared party/contact/address form models across clients, vendors, and leads.
```

## Prompt 14: Tenant Operations: Renewals, Projects, Tasks, Issues, Calendar

```text
Implement Tenant operations modules.

Use docs/tenant-pages.md Renewals, Projects, Tasks and To-Do, Client Issues, Calendar; docs/tenant-apis.md matching sections; docs/additional-ui-changes.md operations additions.

Build:
- Renewals dashboard/list/calendar/client/vendor renewal screens.
- Projects dashboard/list/grid/Kanban/Gantt/calendar/create/edit/detail.
- Tasks dashboard/list/Kanban/calendar/my/team/create/edit/detail.
- To-do lists.
- Client issues dashboard/list/Kanban/create/edit/detail.
- Calendar daily/weekly/monthly/agenda/my schedule/team calendar.

Required UI:
- Renewal quick-create, renew/extend, reminder schedule, send reminder, cancel, history.
- Project member, phase, milestone, complete milestone, bulk assign, archive warning, log time, add expense, Gantt dependency flows.
- Task assign, status, bulk update, checklist, dependency, watcher, timer, recurrence, clone, share flows.
- Issue assign, reply/internal note, status, resolve/close/reopen, linked task, log time, attachment preview.
- Event quick-create/edit, attendee selector, reminder, recurrence, room booking, video meeting, drag confirmation, conflict warning, sync result.
```

## Prompt 15: Tenant HRMS: Attendance, Leave, Payroll, Holidays

```text
Implement Tenant HRMS modules.

Use docs/tenant-pages.md Attendance/Leave/Payroll/Holidays, docs/tenant-apis.md HRMS sections, and docs/additional-ui-changes.md HRMS additions.

Build:
- Attendance dashboard, daily list, monthly grid, corrections, approval queue.
- Leave dashboard, requests, apply leave, approvals, balances, calendar, leave types.
- Payroll dashboard, cycles, generate wizard, history, payroll detail, payslips, components, assignments, loans, reimbursements, bank transfers, tax/PF/ESI settings.
- Holidays calendar/list/create/edit/detail, calendars, groups, members.

Required UI:
- Check-in/out confirmation.
- Attendance correction sheet.
- Approve/reject correction sheet.
- Monthly attendance bulk update.
- Attendance import wizard.
- Apply leave sheet with balance/overlap warning.
- Leave approval/rejection/cancel sheets.
- Leave balance adjustment sheet.
- Payroll cycle sheet.
- Generate payroll wizard with validation preview.
- Payroll preview detail.
- Submit/approve/lock/reopen confirmations.
- Payslip preview and bulk email.
- Salary component formula editor.
- Loan schedule.
- Reimbursement approval.
- Bank transfer export.
- Holiday applicability selector.
- Duplicate holiday and import wizard.
```

## Prompt 16: Tenant Finance, Documents, Communication, Reports, Settings

```text
Implement Tenant Finance, Documents, Communication, Reports, Settings, Integrations, Audit, and Help.

Use docs/tenant-pages.md Finance/Documents/Notifications/Reports/Settings/Audit/Profile/Help, docs/tenant-apis.md matching sections, and docs/additional-ui-changes.md matching UI additions.

Build:
- Finance dashboard, invoices, payments, expenses, bank accounts.
- Documents center with upload, shared files, recent files, optional folders placeholder.
- Notifications and communication logs/templates.
- Reports dashboard and CRM/HR/payroll/renewal/finance/project/task/support/custom reports.
- Settings: general, offices, HR, CRM lookups, communication, security, integrations, storage, backup placeholders.
- Audit logs.
- Help center.

Required UI:
- Invoice quick-create, line item editor, tax/discount breakdown, send invoice, PDF preview, record payment, cancel.
- Payment detail, void confirmation, receipt upload.
- Expense quick-create, item editor, receipt attachment, approve/reject.
- Bank account add/edit masked preview, set primary.
- File upload, preview, attach existing, replace confirmation.
- Communication composer, retry confirmation, template preview/test-send.
- Report filter, column/group selector, chart selector, export, save custom, schedule placeholder, drill-down.
- Logo/favicon upload/crop, lookup reorder, delete lookup warning, integration connect, credential rotation, backup/restore confirmations, security policy confirmation.
```

## Prompt 17: Offline, Sync, Push Notifications, Device Capabilities

```text
Add mobile-specific capabilities for the Flutter SaaS app.

Requirements:
- Secure token storage and app lock placeholder.
- Network status banner and retry behavior.
- Optional read-only cache for dashboard, lists, profile, and settings.
- Clear stale-data indicators when offline.
- Push notification integration placeholder for notification center.
- Deep links to platform/tenant records where route and permission allow.
- File picker and camera/photo upload for documents, profile photos, receipts, contracts.
- Share/download support for invoices, payslips, reports, and files.
- Biometric unlock placeholder if company policy allows.

Never allow offline mutation unless a deliberate queued-sync design is implemented.
```

## Prompt 18: Cross-Module Workflow Polish

```text
Add cross-module workflow polish across the Flutter app.

Use docs/additional-ui-changes.md Global UI Rules, Common Popup and Drawer Patterns, Cross-Module Assignment Matrix, Confirmation Rules, Missing Persistent UI Support, and Implementation Priority.

Verify:
- Assignment flows for platform and tenant records.
- Shared confirmation rules and typed confirmations.
- Action reason capture for lifecycle, financial, payroll, access, security, remote login, and bulk actions.
- Shared sheets for activity, audit compare, raw payload, notes, files, reminders, communication, approvals.
- Permission-aware empty states.
- Missing-table placeholders for unbacked features.
- Consistent loading, error, empty, success, invalidation, and refresh behavior.
- Phone and tablet layouts for every major screen.
```

## Prompt 19: Testing, Accessibility, Performance, Release Readiness

```text
Prepare the Flutter app for enterprise release quality.

Add or verify:
- Unit tests for formatters, permission helpers, query builders, validation, repositories.
- Widget tests for DataList, ConfirmDialog, AssignUserTeamSheet, ImportWizard, ExportSheet, ActivitySheet, FilesSheet, PermissionGate.
- Router tests for platform, tenant, forbidden, unauthenticated, and disabled module states.
- Dio mock adapter or repository mocks for platform and tenant APIs.
- Accessibility: semantic labels, screen reader support, focus order, touch targets, contrast, form error announcements.
- Performance: lazy routes, pagination, image caching, debounced search, minimized rebuilds, tablet layout efficiency.
- Security: secure storage, masked secrets, no raw token display after create, no cross-tenant leakage, no hidden action execution.
- UX: unsaved changes guard, skeleton loaders, retry actions, empty states, snackbars/toasts, reason prompts.
- Build checks: flutter analyze, dart format, tests, Android release build, iOS release build checklist.
```

## Prompt 20: Final Flutter Acceptance Checklist

```text
Review the completed Flutter app against all source docs:
- docs/platform-pages.md
- docs/platform-apis.md
- docs/tenant-pages.md
- docs/tenant-apis.md
- docs/additional-ui-changes.md

Produce a final acceptance report with:
- Platform screens completed.
- Tenant screens completed.
- API endpoints integrated.
- Shared widgets completed.
- Assignment workflows completed.
- Confirmation workflows completed.
- Import/export workflows completed.
- Permission guards completed.
- Mobile/tablet responsiveness completed.
- Offline/cache/push/deep-link readiness.
- Missing backend/table dependencies.
- Known UX gaps.
- Test coverage summary.
- Production readiness risks.

Do not mark a module complete unless its list, create/edit, detail tabs, actions, sheets/dialogs, permissions, API integration, loading/error/empty states, and tests are implemented.
```

## Suggested Build Order

1. Project bootstrap, standards, routing, API clients, auth, secure storage, permission guards.
2. Design system widgets, responsive shells, shared screen patterns.
3. Platform dashboard, access control, staff, tenants.
4. Platform subscriptions, plans, billing, coupons.
5. Platform support, monitoring, integrations, settings, audit.
6. Tenant auth/dashboard/profile/navigation.
7. Tenant access control, teams, staff.
8. Tenant CRM: clients, vendors, leads.
9. Tenant operations: renewals, projects, tasks, issues, calendar.
10. Tenant HRMS: attendance, leave, payroll, holidays.
11. Tenant finance, documents, communication, reports, settings, audit, help.
12. Mobile capabilities, cross-module polish, tests, accessibility, performance, release readiness.

## Non-Negotiable Company Standards

- Keep platform and tenant modules separated in routes, API clients, permissions, auth state, and navigation.
- Keep shared widgets generic and feature modules domain-specific.
- Use typed models for all API responses and request bodies.
- Do not leak tenant data across tenant context changes.
- Do not show raw secrets, tokens, encrypted values, gateway secrets, account numbers, or private file paths.
- Do not perform destructive or financial actions without confirmation.
- Do not create screens without loading, empty, error, and permission-denied states.
- Do not create forms without validation and API validation error rendering.
- Do not create list screens without search, filters, pagination, export, and safe bulk action support where relevant.
- Do not mark a screen complete unless required sheets/dialogs from `docs/additional-ui-changes.md` are included.
- Every important mutation must refresh or invalidate affected providers/queries.
- Every mobile screen must be usable on small phones and efficient on tablets.
