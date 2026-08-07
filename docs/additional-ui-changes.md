# Additional UI Changes

This document lists page-level UI additions required beyond the base page inventories in `docs/platform-pages.md` and `docs/tenant-pages.md`. It focuses on assignment dialogs, popups, drawers, quick actions, bulk flows, confirmations, and reusable UI surfaces that should exist across platform and tenant modules.

## Global UI Rules

Every list page should include these shared controls unless the page is read-only:

- Saved views popup: save current filters, columns, sort, density, and grouping as personal or shared view.
- Advanced filters drawer: field filters, date ranges, owner/assignee filters, status filters, and reset/apply actions.
- Column manager popup: show/hide columns, reorder columns, freeze important columns, reset defaults.
- Bulk action bar: appears after row selection with allowed actions only.
- Export popup: format, columns, selected rows versus filtered result, timezone, and email file option.
- Import wizard: upload, field mapping, validation preview, duplicate handling, import progress, error download.
- Activity drawer: actor, event, old/new values, IP/user agent, related record link.
- Notes drawer: add/edit/delete note, pin note if supported, visibility selector.
- Files drawer: upload, attach existing file, preview, download, replace, detach, delete where allowed.
- Tags popup: add/remove tags, create tag when permission allows.
- Reminder popup: date/time, channel, assignee, related record, repeat rule where supported.
- Confirm dialog: destructive actions, irreversible state changes, and financial/security actions must require reason.

Every view page should include these shared surfaces:

- Header action menu for secondary actions.
- Related-record quick create popup for tasks, notes, files, reminders, and events.
- Timeline drawer that merges activity, notes, communication, and status changes.
- Permission-aware empty states with create/import/connect actions where useful.
- Unsaved changes confirmation when leaving forms or closing modals.

## Common Popup and Drawer Patterns

| UI Surface | Used For | Required Fields/Controls |
| --- | --- | --- |
| Assign user/team popup | Owners, assignees, reviewers, account managers, project managers | user, team, role, effective date, remarks, notify assignee |
| Status change popup | Activate, suspend, close, approve, reject, cancel, archive | new status, reason/remarks, effective date, notify flag |
| Bulk update popup | Lists with multi-select | selected count, target field, new value, reason, preview impacted rows |
| Confirm destructive popup | Delete, revoke, cancel, refund, disconnect | typed confirmation for high-risk actions, reason, cancel/confirm |
| Quick create drawer | Create related record without leaving page | minimum required fields, save, save and open, cancel |
| Preview drawer | Files, invoices, payslips, templates, logs | metadata header, preview, download/open action |
| Raw payload drawer | Webhooks, gateway responses, API logs | formatted JSON, copy, download, sensitive masking |
| Audit compare drawer | Activity logs | old values, new values, changed fields highlight |
| Communication composer | Email/SMS/WhatsApp replies | recipient, template, subject where applicable, body, attachments, send/test |
| Approval popup | Leave, expense, payroll, refund, restore | approve/reject, remarks, next approver, notify requester |

## Platform UI Additions

### Platform Dashboard

Add these popups/drawers:

- Date range selector popup for dashboard cards and charts.
- Dashboard export popup with selected widgets and file format.
- Alert detail drawer from active alerts table.
- Incident quick-create drawer from monitoring cards.
- Failed job detail drawer with exception, retry, and delete actions.
- Security event review popup with severity, status, notes, and assignee.

### Platform Access Control

Roles:

- Clone role popup: new name, display name, copy permissions, copy users flag, status.
- Assign permissions drawer: grouped permission checklist, search, select module, diff preview before save.
- Assign users popup: platform users, effective date, audit reason, notify users.
- Delete role confirmation: show assigned user count and require reassignment when users exist.

Permissions:

- Permission detail drawer from grouped permission list.
- Create/edit permission modal for custom permissions.
- Sync default permissions confirmation if application permission sync is implemented.

### Platform Teams

Add these UI pieces:

- Add members popup: platform user, team role, allocation percent, primary flag, effective dates.
- Assign records popup: assign tenants, support tickets, incidents, alerts; include assignment role and remarks.
- Release assignment confirmation: release date, reason, notify team lead.
- Team role editor popup: name, code, permissions JSON editor, sort order, status.
- Member allocation warning popup when total allocation exceeds expected limits.

### Platform Staff

Add these UI pieces:

- Invite staff popup: email, name, department/designation, roles, teams, send invite flag.
- Assign roles popup and direct permissions drawer.
- Assign teams popup with role, allocation, primary team, effective dates.
- Suspend/reactivate popup: reason, effective until, revoke sessions, notify user.
- Reset password popup: send link versus set temporary password, force change on login.
- Force logout confirmation: affected sessions count and reason.
- Require 2FA popup: enforcement date, notify user.
- Profile photo upload/crop popup.

### Tenants

Add these UI pieces:

- Tenant creation wizard: organization, owner, head office, subscription, review.
- Change plan popup: current plan, new plan, billing cycle, proration preview, effective date.
- Extend trial popup: current trial end, new trial end, reason, notify owner.
- Suspend/reactivate popup: reason, effective date, block login flag, notify owner.
- Remote login popup: reason, duration, approval, security warning, start session.
- Owner reset password popup.
- Module override drawer: enabled modules, feature limits, reason, effective date.
- Usage detail drawer: users/storage/API/projects/invoices by period.
- Tenant settings preview drawer with grouped settings and masked secrets.

### Subscriptions, Plans, Features, Add-ons

Subscriptions:

- Upgrade/downgrade popup with plan comparison, proration, coupon, effective date.
- Pause/resume subscription popup with reason and dates.
- Cancel subscription popup with cancellation reason, end date, data retention warning.
- Renew subscription popup with expiry preview, amount, invoice creation flag.
- Add addon popup: addon plan, quantity, unit price, dates, preview total.
- Apply coupon popup: code, validation result, discount preview.

Plans/features/add-ons:

- Feature matrix drawer for plan features and limits.
- Attach feature popup: feature, value, metadata, limit type.
- Clone plan popup: new name/code, copy features, public/custom flag.
- Archive plan confirmation showing active subscription count.
- Add-on pricing popup for flat/unit/tiered pricing if supported.

### Platform Billing

Invoices:

- Manual invoice drawer: tenant, subscription, line items, tax, discount, due date.
- Line item editor popup with quantity, unit price, tax, metadata.
- Send invoice popup: recipients, template, message, attach PDF flag.
- Record payment popup: method, gateway/reference, amount, paid at, notes.
- Cancel invoice confirmation with reason and accounting warning.
- Invoice PDF preview drawer.

Payments/refunds:

- Gateway response drawer with masked raw response.
- Retry payment popup with gateway, amount, reason.
- Initiate refund popup: amount, reason, gateway preview, confirmation.
- Refund failure retry popup.
- Reconciliation popup if reconciliation is added.

### Coupons and Modules

Coupons:

- Coupon rule builder popup: discount type/value, limits, dates, plan/tenant restrictions.
- Assign plans popup and assign tenants popup.
- Disable coupon confirmation showing active/future redemptions.
- Redemption detail drawer.

Modules:

- Module enable/disable confirmation with affected tenant count.
- Attach features drawer.
- Tenant override popup from module view.
- Usage metrics drawer for module adoption and limit pressure.

### Platform Support and Remote Login

Tickets:

- Assign ticket popup: platform user/team, priority, SLA, remarks.
- Reply composer drawer with public reply/internal note toggle.
- Link incident popup.
- Close/reopen confirmation with resolution notes.
- Attachment preview drawer.

Knowledge base:

- Category reorder drawer.
- Article editor drawer/page with preview, publish/unpublish popup, visibility selector.
- Archive article confirmation.

Remote login:

- Start session popup: tenant, reason, duration, approval, security warning.
- End session confirmation.
- Session activity drawer.

### Monitoring, Integrations, Settings, Audit

Monitoring:

- Service health detail drawer.
- Retry failed job confirmation.
- Delete failed job confirmation.
- Alert resolve popup with resolution note.
- Incident create/update drawer.
- Log payload/exception drawer with copy/download.

Integrations:

- Connect provider wizard: provider, auth method, credentials, scopes, test connection, enable.
- Rotate credentials popup with write-only secret fields.
- Disconnect confirmation with impact warning.
- Retry webhook/sync popup.
- Field mapping editor drawer with transform preview.

Settings:

- Test email/SMS/storage popup with result drawer.
- Backup run confirmation and backup result drawer.
- Restore request confirmation with high-risk warning.
- Maintenance mode confirmation with allowed IP preview.
- Template preview/test-send popup.

Audit:

- Audit compare drawer.
- Security event review popup.
- Export audit popup.

## Tenant UI Additions

### Tenant Dashboard and Navigation

Add these UI pieces:

- Widget library popup for My Dashboard.
- Widget settings popup for widget-specific filters and limits.
- Dashboard date range selector.
- Quick actions menu: lead, client, task, project, invoice, event, leave, document.
- Notification center drawer with mark read/unread, open record, and clear actions.
- Recent activity drawer with compare changes.
- Sidebar module unavailable tooltip explaining subscription or settings restriction.

### Tenant Access Control and Teams

Roles:

- Clone role popup.
- Assign permissions drawer grouped by module.
- Assign users popup with audit reason.
- Delete role confirmation with user count and fallback role requirement.

Teams:

- Add team member popup with user/staff, team role, allocation, primary flag, dates.
- Assign record popup for leads, clients, vendors, projects, tasks, issues, events.
- Team permission drawer.
- Team settings drawer.
- Release assignment confirmation.

### Staff Management

Add these UI pieces:

- Staff import wizard with duplicate employee code/email handling.
- Staff export popup.
- Invite user popup from staff profile.
- Suspend/reactivate login popup.
- Assign role popup for linked user.
- Assign team popup with allocation warning.
- Add bank account popup with masked preview.
- Add salary structure popup with effective date conflict warning.
- Add document popup with expiry reminder option.
- Add emergency contact, asset, certification, appraisal, and training popups.
- Profile photo crop/upload popup.
- Staff timeline drawer.

### Clients, Vendors, Leads

Clients:

- Merge duplicate clients wizard: select primary, compare fields, choose field winners, move related records, confirm.
- Add contact popup and edit contact drawer.
- Add address popup with default billing/shipping selector.
- Create project/invoice/renewal/issue quick drawers from client view.
- Send email composer drawer.
- Portal access popup for client contact.

Vendors:

- Add bank account popup with masked account preview.
- Upload contract/document popup.
- Create expense quick drawer.
- Create renewal quick drawer.
- Vendor rating popup.

Leads:

- Kanban stage-change confirmation when stage has required fields.
- Assign owner popup.
- Add activity/follow-up popup.
- Schedule meeting drawer.
- Mark won/lost popup with outcome, reason, conversion option.
- Convert lead wizard: client profile, contacts, addresses, move tasks, optional project.
- Duplicate lead popup.
- Merge duplicate leads wizard.

### Renewals

Add these UI pieces:

- Renewal quick-create popup from client/vendor pages.
- Renew/extend popup: new end date, renewal date, amount, reminder updates.
- Reminder schedule popup.
- Send reminder composer.
- Cancel renewal confirmation.
- Calendar drag confirmation when changing renewal date.
- Renewal history drawer.

### Projects

Add these UI pieces:

- Project quick-create drawer from client view.
- Add member popup with user/team, role, billing rate, allocation.
- Add phase popup and milestone popup.
- Complete milestone confirmation with completed date.
- Bulk assign manager/team popup.
- Archive project confirmation with open task/milestone warning.
- Log time popup.
- Add expense popup.
- Gantt dependency editor drawer if Gantt supports dependencies.
- Project health/risk popup for manually marking at-risk status if implemented.

### Tasks and To-Do

Add these UI pieces:

- Assign task popup with user/team, remarks, notify assignee.
- Change status popup when status requires progress/comment.
- Bulk update popup for status, priority, assignee, due date, tags.
- Checklist editor inline popup.
- Dependency editor popup.
- Watcher add/remove popup.
- Start timer mini panel and stop timer log popup.
- Recurrence rule popup.
- Clone task popup.
- Convert task to issue or linked task popup if supported.
- To-do list share popup with user/team visibility.

### Client Issues and Support

Add these UI pieces:

- Assign issue popup with user/team, priority, due date, remarks.
- Reply/internal note composer drawer.
- Change priority/status popup.
- Resolve/close popup with resolution notes and notify client flag.
- Reopen issue confirmation.
- Create linked task drawer.
- Log time popup.
- Attachment preview drawer.

### Calendar and Appointments

Add these UI pieces:

- Event quick-create popup from calendar click.
- Event edit drawer from calendar event click.
- Attendee selector popup for users, teams, contacts, external emails.
- Reminder popup with channel and remind time.
- Recurrence editor popup.
- Room booking popup with availability check.
- Video meeting provider popup.
- Drag/reschedule confirmation.
- Event conflict warning popup.
- Calendar sync result drawer.

### Attendance and Leave

Attendance:

- Check-in/check-out confirmation with location/device metadata if captured.
- Attendance correction request popup.
- Approve/reject correction popup.
- Monthly attendance bulk update popup.
- Import attendance wizard.
- Attendance record detail drawer.

Leave:

- Apply leave popup/drawer with balance preview and overlap warning.
- Approve/reject leave popup with remarks.
- Cancel leave confirmation.
- Leave balance adjustment popup.
- Leave calendar event detail drawer.

### Payroll

Add these UI pieces:

- Create payroll cycle popup.
- Generate payroll wizard: cycle, staff scope, attendance/leave source, preview, validation, submit.
- Payroll preview drawer with staff-by-staff calculation details.
- Regenerate selected staff confirmation.
- Submit/approve/lock/reopen confirmation popups.
- Payslip preview drawer.
- Bulk email payslips popup.
- Salary component formula editor drawer.
- Staff component assignment popup.
- Loan schedule popup.
- Reimbursement approval popup.
- Bank transfer export popup.
- Tax/PF/ESI settings effective-date warning popup.

### Holidays

Add these UI pieces:

- Holiday create popup from calendar date click.
- Applicability selector drawer for country/state/city/office/department/team/staff/group.
- Duplicate to next year confirmation.
- Import holidays wizard.
- Holiday group member selector popup.
- Optional holiday selection popup for employees if optional holidays are enabled.

### Tenant Finance

Invoices:

- Invoice quick-create drawer from client/project pages.
- Line item editor popup.
- Tax/discount breakdown drawer.
- Send invoice composer.
- Invoice PDF preview drawer.
- Record payment popup.
- Cancel invoice confirmation.

Payments:

- Payment detail drawer.
- Void payment confirmation.
- Receipt upload popup if receipts are stored as files.

Expenses:

- Expense quick-create drawer from vendor/project pages.
- Expense item editor popup.
- Receipt attachment popup.
- Approve/reject expense popup.

Bank accounts:

- Add/edit bank account popup with masked preview.
- Set primary confirmation.
- Delete/archive confirmation.

### Files, Notifications, Reports, Settings

Files/documents:

- Upload document popup with drag-and-drop.
- File preview drawer.
- Attach existing file popup.
- Folder move/copy popup if document folders are added.
- Replace file confirmation.

Notifications/communication:

- Notification detail drawer.
- Bulk mark read confirmation.
- Communication retry confirmation.
- Email/SMS/WhatsApp composer drawer.
- Template preview/test-send popup.

Reports:

- Report filter drawer.
- Column/grouping selector popup.
- Chart type selector.
- Export report popup.
- Save custom report popup.
- Schedule report popup if scheduled exports are added.
- Drill-down drawer from chart/table rows.

Settings:

- Company logo/favicon crop/upload popup.
- Lookup reorder drawer.
- Delete lookup confirmation with used-count warning.
- Test SMTP/SMS/storage popup.
- Integration connect wizard.
- Credential rotation popup.
- Backup run and restore confirmation popups.
- Security policy change confirmation.

Profile/help:

- Change password popup.
- Enable/disable 2FA wizard.
- Revoke session/token confirmation.
- API token create/rotate popup with copy-once token view.
- Contact support popup.

## Cross-Module Assignment Matrix

| Assignable Record | Assign User | Assign Team | Assign Role/Type | Notes |
| --- | --- | --- | --- | --- |
| Platform tenant | Yes | Platform team | support owner, account owner | Platform only |
| Platform ticket | Yes | Platform team | assignee, escalation owner | Platform support |
| Incident/alert | Yes | Platform team | owner, responder | Platform monitoring |
| Tenant lead | Yes | Tenant team | owner, sales owner | Tenant CRM |
| Tenant client | Yes | Tenant team | account manager, owner | Tenant CRM |
| Tenant vendor | Yes | Tenant team | account manager, owner | Tenant CRM |
| Project | Yes | Tenant team | manager, member, reviewer | Tenant projects |
| Task | Yes | Tenant team | assignee, reviewer, watcher | Tenant tasks |
| Client issue | Yes | Tenant team | assignee, support owner | Tenant support |
| Calendar event | Yes | Tenant team | attendee, organizer | Tenant calendar |
| Renewal | Yes | No by default | owner | Client/vendor renewals |
| Expense/leave/payroll approval | Yes | No by default | approver | Approval flows |

## Confirmation Rules

Require a confirmation popup and reason for:

- Delete, archive, restore, suspend, reactivate, cancel, close, reopen, revoke, disconnect, refund, void payment, lock payroll, reopen payroll, restore backup, remote login.
- Bulk changes affecting more than one row.
- Any action that changes billing, payroll, access control, security, credentials, or tenant availability.

Use typed confirmation for:

- Tenant suspension/deletion.
- Subscription cancellation.
- Invoice cancellation after sending.
- Payment refund or void.
- Integration disconnect with active sync/webhooks.
- Backup restore.
- Payroll lock/reopen after approval.

## Missing Persistent UI Support

These UI additions need database support before they can be fully persistent:

| UI Need | Missing/Recommended Table |
| --- | --- |
| Platform teams and assignments | `platform_teams`, `platform_team_roles`, `platform_team_members`, `platform_team_assignments` |
| Platform refunds | `platform_refunds` |
| Platform support tickets and comments | `platform_tickets`, `platform_ticket_comments` |
| Knowledge base | `knowledge_base_categories`, `knowledge_base_articles` |
| Remote login sessions | `remote_login_sessions` |
| Platform settings/backups/templates | `platform_settings`, `backup_runs`, `notification_templates` |
| Tenant attendance corrections | `attendance_requests` |
| Tenant API tokens | `tenant_api_tokens` |
| Tenant backups/restores | `tenant_backup_runs`, `tenant_restore_requests` |
| Document folders | `document_folders`, `document_folder_files` |
| Tenant-custom notification templates | tenant-scoped `notification_templates` |
| Quotations | quotation and quotation item tables |
| Structured contracts | `contracts` and contract renewal/history tables if required |

## Implementation Priority

1. Global list controls, activity drawer, notes/files/reminders drawers.
2. Assignment popups for users, teams, roles, and owners.
3. Confirmation popups for lifecycle, financial, security, payroll, and destructive actions.
4. Import/export wizards across staff, clients, vendors, leads, attendance, holidays, reports.
5. Communication composer, template preview, and notification center.
6. Module-specific wizards: tenant creation, subscription changes, lead conversion, payroll generation, integration connection.
