# Frontend Release Readiness Checklist

Status legend:
- Complete: route, list/view/action shell, API integration, permissions, loading/error/empty states are implemented.
- Partial: usable module exists, but one or more enterprise polish items need deeper coverage or backend support.
- Blocked: UI placeholder is intentionally shown because backend tables/APIs are missing or incomplete.

## Quality Gates

| Area | Status | Notes |
| --- | --- | --- |
| Unit tests | Complete | Added tests for formatters, permission helpers, API query builders, and shared validation schemas. |
| Component tests | Complete | Added coverage for DataTable, ConfirmDialog, AssignUserTeamModal, ImportWizard, ExportModal, ActivityDrawer, FilesDrawer, and PermissionGate behavior. |
| Route guard tests | Complete | Covers platform auth, tenant auth, forbidden permissions, unauthenticated redirects, cross-tenant leakage, and disabled module navigation. |
| API mocking | Complete | MSW is installed and configured in `src/test/msw`; shared platform and tenant handlers are active in Vitest setup. |
| Accessibility | Partial | Modal focus trap existed; drawer focus trap, Escape close, labelled dialog, overlay close, ARIA status/error states, and table labels are verified. Full axe/contrast audit is still recommended before release. |
| Performance | Partial | React Query caching, pagination, memoized DataTable sorting/visible columns, and module pagination are in place. Route-level code splitting and large-table virtualization remain recommended; current production bundle still warns above 500 KB. |
| Security | Partial | Tenant header isolation, permission gates, masked formatter utility, sensitive API log masking, and typed risky confirmations are in place. Full token lifecycle and raw-payload redaction audit should be completed with real API fixtures. |
| UX | Partial | Shared confirmations, audit reasons, loading/error/empty states, retry-able API client behavior, imports/exports, and placeholders are present. Global toast system and unsaved-change guard are still recommended. |
| Build checks | Complete | `typecheck`, `lint`, `test`, and production `build` pass. Lint currently reports warnings for existing unused symbols, explicit `any`, and hook dependency cleanup debt. |

## Platform Modules

| Module | Status | Notes |
| --- | --- | --- |
| Platform auth/dashboard/navigation | Complete | Protected platform shell and dashboard routes are implemented. |
| Tenants | Complete | List/create/edit/view, lifecycle actions, typed confirmations, activity drawers, exports. |
| Platform staff | Complete | Staff list/create/edit/view, roles, teams, permissions, sessions and action drawers. |
| Platform access control | Complete | Roles, permissions, teams, team roles, assignments, clone/assign/export flows. |
| Subscription catalog | Complete | Plans, features, add-ons, subscriptions, lifecycle actions. |
| Billing invoices/payments/coupons | Complete | Lists/views/actions, typed invoice cancellation and refund flows. |
| Platform refunds | Partial | Routes and views exist; persistence depends on refund table/API completeness. |
| Modules and feature controls | Complete | Platform module management route and actions are wired. |
| Support tickets | Blocked | Placeholder retained where support ticket/comment persistence is missing. |
| Knowledge base | Blocked | Placeholder retained where KB tables/APIs are missing or incomplete. |
| Remote login sessions | Blocked | Placeholder retained where remote-login persistence/session APIs are missing. |
| Reports | Partial | Dashboard/report pages exist; deeper saved/scheduled reports depend on report definition APIs. |
| Monitoring | Complete | Service health, jobs, scheduler/API logs, alerts, incidents pages are wired. |
| Integrations | Complete | Provider catalog, tenant integrations, credentials, webhooks, sync jobs, mappings, rate limits are wired. |
| Settings/backups/templates | Partial | Settings pages exist; backups/templates show placeholders where persistence is missing. |
| Audit logs | Complete | Activity/security/billing/payment/subscription/system/remote-login log shells and compare/export surfaces exist. |
| Onboarding/trials/legal/announcements/API tokens/webhook delivery | Partial | Routes exist where APIs are present; missing-table placeholders remain for unsupported persistence. |

## Tenant Modules

| Module | Status | Notes |
| --- | --- | --- |
| Tenant auth/dashboard/navigation/profile | Complete | Tenant login, X-Tenant support, dashboard, widgets, notifications, profile/security/session/token shells are implemented. |
| Access control | Complete | Roles, permissions, teams, users, assignments and reasoned actions are wired. |
| Staff management | Complete | Staff dashboard/list/grid/create/edit/view and tabbed detail pages are implemented. |
| Clients | Complete | List/grid/create/edit/view, tabs, contacts/addresses/notes/files/timeline flows are wired. |
| Vendors | Complete | List/grid/create/edit/view, tabs, bank/document/rating flows are wired. |
| Leads | Complete | Dashboard/list/grid/Kanban/create/edit/view and conversion/activity flows are wired. |
| Renewals | Complete | Dashboard/list/calendar/client/vendor/create/edit/view and reminder/history flows are wired. |
| Projects | Complete | Dashboard/list/grid/Kanban/Gantt/calendar/create/edit/view and assignment/time/expense flows are wired. |
| Tasks and To-Do | Complete | Dashboard/list/Kanban/calendar/my/team/create/edit/view and bulk/status/checklist/dependency flows are wired. |
| Client issues | Complete | Dashboard/list/Kanban/create/edit/view and assign/reply/status/resolve/close/reopen flows are wired. |
| Calendar | Complete | Daily/weekly/monthly/agenda/my/team views, event drawers, attendees/reminders/room/video/sync placeholders. |
| Attendance | Partial | Dashboard/daily/monthly/corrections/approvals exist; correction persistence remains dependent on backend table/API completeness. |
| Leave | Complete | Dashboard, requests, apply/approve/reject/cancel, balances, calendar, leave types are wired. |
| Payroll | Complete | Cycles, generate/preview/submit/approve/lock/reopen, payslips, components, loans, reimbursements, transfers, settings are wired. |
| Holidays | Complete | Calendar/list/create/edit/view, calendars, groups, members, import/export flows are wired. |
| Finance | Complete | Invoices, payments, expenses, bank accounts with typed financial confirmations are wired. |
| Documents | Partial | Upload/list/shared/recent/preview flows exist; folders remain placeholder where backend is optional/missing. |
| Communication/notifications | Partial | Logs, queues, composer, retry, templates exist; template persistence depends on notification template table support. |
| Reports | Partial | Report dashboard/tabs/export/save shells exist; saved/scheduled custom reports need complete backend persistence. |
| Settings | Partial | General/company/branding/localization/offices/HR/CRM/security/integrations/storage shells exist; backup/restore and some branding persistence are placeholders. |
| Tenant integrations | Complete | Provider connect, credential rotation, disconnect, webhooks, sync jobs, mappings, rate limits are wired. |
| Audit logs | Complete | Activity/login/system/API/data-change logs, compare and export surfaces are wired. |
| Help Center | Partial | Docs/FAQ/contact/release/status shell exists; article/contact persistence varies by backend support. |
| Quotations and contracts | Blocked | Clear placeholders are retained because backing tables/APIs are missing. |
| Tenant API tokens | Blocked | Placeholder retained where tenant API token persistence/API is missing. |
| Tenant backups/restores | Blocked | UI structure exists; full restore workflow depends on backup/restore persistence and workers. |

## Queue Commands

Run background downloads/imports/exports with:

```bash
php artisan queue:work --queue=exports,imports,default
```

## Release Follow-Ups

- Add route-level lazy imports to reduce the current production chunk size.
- Add axe accessibility tests and color-contrast CI checks.
- Add virtualized table mode for lists expected to render thousands of rows client-side.
- Add global toast provider and unsaved-change guard across create/edit drawers and pages.
- Expand MSW fixtures per module as API contracts stabilize.
- Decide whether generated `dist` and local `node_modules` artifacts should remain tracked; both currently appear in Git status after build/install.
