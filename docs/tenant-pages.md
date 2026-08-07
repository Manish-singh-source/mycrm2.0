# Tenant CRM Pages

This document defines tenant-facing CRM pages for company users inside a tenant workspace. Platform owner/staff pages are defined separately in `docs/platform-pages.md`.

Each page is aligned with `docs/database.md` and includes data sources, list columns, filters, detail tabs, forms, actions, and enterprise workflow pages where useful.

## Global Rules

Every tenant page must be scoped by `tenant_id` unless the source table is explicitly global master data. Tenant users must never access another tenant's data through list filters, exports, bulk actions, API calls, file previews, or related-record drawers.

Every list page should include search, saved filters, pagination, sorting, column visibility, export where useful, import where useful, bulk actions where safe, and quick access to notes, tags, files, reminders, and activity logs.

Every create/update form should include required validation, duplicate checks for tenant-unique fields, permission checks, save, save and continue, cancel, audit metadata, and shared sections for files, notes, tags, custom fields, and reminders when relevant.

Every view page should include a header summary, record status, owner/assignee, primary actions, tabs, related records, internal notes, files, reminders, and activity timeline.

Shared source tables used across modules: `files`, `attachments`, `notes`, `tags`, `taggables`, `custom_fields`, `custom_field_values`, `activity_logs`, `tenant_lookups`, `reminders`, `communication_logs`, `notifications`.

## 1. Tenant Navigation

Recommended sidebar:

```text
Dashboard

CRM
- Leads
- Clients
- Vendors
- Client Renewals
- Vendor Renewals

Projects
- Projects
- Tasks
- Calendar
- To-Do

Support
- Client Issues

HRMS
- Staff
- Attendance
- Leave Management
- Payroll
- Holidays

Finance
- Invoices
- Payments
- Expenses
- Bank Accounts

Documents
Reports
Settings
Profile
Help Center
```

Navigation rules:

- Hide modules disabled in `tenant_settings` or unavailable in the active subscription.
- Show badges for overdue tasks, open issues, pending approvals, unread notifications, and renewals due soon.
- Keep owner/admin-only pages protected by tenant RBAC permissions.

## 2. Dashboard

Source tables: `parties`, `lead_profiles`, `client_profiles`, `vendor_profiles`, `projects`, `tasks`, `client_issues`, `renewals`, `tenant_invoices`, `tenant_payments`, `tenant_expenses`, `staff`, `attendance_records`, `leave_requests`, `payrolls`, `calendar_events`, `notifications`, `activity_logs`.

### 2.1 Main Dashboard

Cards:

- Leads, clients, vendors, active projects, open tasks, overdue tasks.
- Open support issues, high-priority issues, issues due today.
- Client renewals due soon and vendor renewals due soon.
- Invoice total, paid amount, outstanding amount, overdue amount.
- Month expenses and net collection.
- Staff count, present today, absent today, leave pending approval.

Charts:

- Lead pipeline by stage.
- Project status distribution.
- Task completion trend.
- Revenue by month.
- Expense by category.
- Attendance trend.
- Support issue volume by priority/status.

Tables:

- My tasks: task number, title, project/client, priority, due date, progress.
- Upcoming events: title, date/time, attendees, related record.
- Recent leads: lead number, company/contact, stage, owner, expected value.
- Overdue invoices: invoice number, client, due date, balance amount.
- Recent activities: actor, event, subject, time.

Actions: create lead, create client, create task, create project, create invoice, create event, apply leave, upload document.

### 2.2 My Dashboard

Purpose: customizable user widgets and personal workload.

Widgets: my tasks, my leads, my projects, my issues, my calendar, my reminders, my attendance, leave balance, unread notifications, recent files.

Actions: add/remove widget, reorder widgets, save layout, reset layout.

### 2.3 Notifications Center

Source tables: `notifications`, `communication_logs`.

Columns: channel/type, title/message summary, related record, read status, created at.

Filters: unread, channel, module, date, priority.

Actions: mark read/unread, open related record, bulk mark read, clear old notifications.

### 2.4 Recent Activities

Source table: `activity_logs`.

Columns: actor, module, subject, event, description, IP, created at.

Filters: actor, module, event, date range.

Actions: open subject, compare old/new values, export.

## 3. Access Control

Source tables: `roles`, `permissions`, `role_has_permissions`, `model_has_roles`, `model_has_permissions`, `teams`, `team_roles`, `team_members`, `team_permissions`, `team_settings`, `team_assignments`, `users`, `staff`.

### 3.1 Roles List

Columns: display/name, guard, permission count, assigned user count, status, created at, updated at.

Filters: status, guard, permission module, assigned users.

Actions: create, view, edit, clone, assign permissions, view users, delete unused custom role.

### 3.2 Role Create/Update

Fields: name, display name if implemented, description if implemented, guard name, status.

Permission section: permissions grouped by module such as dashboard, leads, clients, vendors, projects, tasks, support, HRMS, finance, reports, settings.

Validation: unique `tenant_id + name + guard_name`; prevent removal of final owner/admin role permission.

### 3.3 Role View

Tabs:

- Details: role metadata.
- Permissions: module, permission name, display name.
- Users: user, staff profile, email, status.
- Activity: audit trail.

### 3.4 Permissions List/View

Columns: module, name, display name, guard, status if implemented.

Actions: view, sync defaults from application permissions if supported.

### 3.5 Teams List

Columns: name, code, department, office, lead, member count, assigned project count, assigned task count, visibility, status.

Filters: status, department, office, lead, team type.

Actions: create, view, edit, add members, assign records, archive.

### 3.6 Team Create/Update

Fields: name, code, parent team, department, office, team type, description, lead, assistant lead, email, phone, color, icon, visibility, default flag, status.

Member section: user, staff, team role, member type, allocation percent, primary flag, effective dates, joined date, status.

### 3.7 Team View

Tabs:

- Overview: team details and summary metrics.
- Members: user, staff, role, allocation, effective dates, status.
- Permissions: team-level permissions and settings.
- Assignments: projects, tasks, issues, clients, leads, calendar events.
- Activity.

## 4. Staff Management

Source tables: `staff`, `users`, `departments`, `designations`, `tenant_offices`, `teams`, `team_members`, `staff_employment_history`, `staff_bank_accounts`, `staff_salary_structures`, `staff_documents`, `staff_emergency_contacts`, `staff_assets`, `staff_certifications`, `staff_appraisals`, `staff_training`, `attendance_records`, `leave_requests`, `leave_balances`, `payrolls`, `projects`, `tasks`.

### 4.1 Staff Dashboard

Cards: active staff, new joiners, exits this month, pending documents, pending leave approvals, present today, absent today.

Charts: department headcount, employment status, attendance trend, leave usage.

Tables: birthdays/work anniversaries if stored, pending approvals, expiring documents/certifications.

### 4.2 Staff List

Columns: photo, employee code, display name, work email, mobile, department, designation, office, primary team, reporting manager, employment type, employment status.

Filters: employment status, department, designation, office, team, manager, joining date, exit date.

Views: table, grid, org-style grouping by department/team.

Actions: create, view, edit, import staff, export staff, invite user, suspend user login, archive, restore.

### 4.3 Staff Create/Update

Sections:

- Personal: first name, last name, display name, gender, date of birth, personal email, mobile.
- Employment: employee code, work email, joining date, exit date, department, designation, office, primary team, reporting manager, employment type, employment status.
- User account: linked user, role, login status, invite/password handling.
- Bank details: account holder, bank, encrypted account number, IFSC, primary flag.
- Salary: effective dates, annual CTC, monthly gross, currency.
- Emergency contacts, documents, assets, certifications, custom fields.

### 4.4 Staff View

Tabs:

- Profile: personal and employment information.
- User access: linked login, roles, permissions, 2FA, last login.
- Teams: memberships, roles, allocation, dates.
- Documents: document type, file, number, expiry.
- Bank details: masked account details.
- Salary structure: current and historical salary rows.
- Leave history: requests, balances, approvals.
- Attendance: daily/monthly attendance.
- Payroll: payroll history, payslips, loans, reimbursements.
- Projects/tasks: assignments, time logs, workload.
- Assets, certifications, appraisals, training.
- Notes, files, activity log.

## 5. Clients

Source tables: `parties`, `party_contacts`, `party_addresses`, `client_profiles`, `projects`, `tasks`, `tenant_invoices`, `tenant_payments`, `renewals`, `client_issues`, `communication_logs`.

### 5.1 Clients List

Columns: display name, client code, email, phone, industry, source, status, owner, account manager, credit limit, payment terms, created at.

Filters: status, owner, account manager, industry, source, city/state/country, client type, created date.

Views: table, grid, map if address/location is available.

Actions: create, view, edit, import, export, merge duplicates, convert from lead, archive, restore.

### 5.2 Client Create/Update

Sections:

- Identity: party type, display name, legal name, email, phone, website, GST, PAN, industry, source, status, owner.
- Client profile: client code, client type, credit limit, payment terms, onboarding date, account manager.
- Contacts: name, email, mobile, designation, department, primary flag, portal enabled, status.
- Addresses: type, address lines, country/state/city, postal code, default flag.
- Tags, custom fields, notes, files.

### 5.3 Client View

Tabs:

- Overview: identity, client profile, owner, status, tags.
- Contacts: contact people and portal access.
- Addresses: billing, shipping, office, default address.
- Projects: project number, name, manager, status, progress.
- Quotations: placeholder if quotation tables are added later.
- Invoices: invoice number, date, due date, total, balance, status.
- Payments: payment number, amount, method, status, paid at.
- Renewals: title, type, renewal date, amount, status.
- Support issues: issue number, priority, status, assignee.
- Files, notes, timeline.

Actions: create contact, create project, create invoice, create renewal, create issue, send email, archive, merge.

## 6. Vendors

Source tables: `parties`, `party_contacts`, `party_addresses`, `vendor_profiles`, `tenant_expenses`, `renewals`, `bank_accounts`.

### 6.1 Vendors List

Columns: display name, vendor code, email, phone, category, rating, payment terms, account manager, status, created at.

Filters: status, category, rating, owner/account manager, city/state/country.

Actions: create, view, edit, import, export, archive, restore.

### 6.2 Vendor Create/Update

Sections: identity, vendor profile, contacts, addresses, bank accounts, services/categories, tags, custom fields, notes, files.

### 6.3 Vendor View

Tabs:

- Overview: identity, category, rating, payment terms.
- Contacts and addresses.
- Bank accounts: masked encrypted account numbers.
- Services/contracts: use files/notes until dedicated contract tables are added.
- Expenses: expense number, project, date, amount, status.
- Renewals: renewal history and upcoming dates.
- Documents, notes, activity.

Actions: create expense, create renewal, upload contract, archive.

## 7. Lead Management

Source tables: `parties`, `party_contacts`, `party_addresses`, `lead_profiles`, `lead_activities`, `tasks`, `calendar_events`, `communication_logs`, `tenant_lookups`.

### 7.1 Leads Dashboard

Cards: new leads, open leads, won leads, lost leads, expected value, weighted pipeline value, overdue follow-ups.

Charts: leads by stage, leads by source, conversion trend, owner performance.

Tables: stale leads, upcoming follow-ups, high-value opportunities.

### 7.2 Leads List

Columns: lead number, display name, primary contact, stage, priority, expected value, probability, expected close date, owner, status, created at.

Filters: stage, priority, source, owner, expected close date, created date, value range, stale/no activity.

Views: table, grid, Kanban pipeline by stage.

Actions: create, view, edit, import, export, duplicate, assign owner, convert to client, mark won/lost, merge duplicates.

### 7.3 Lead Create/Update

Sections: party identity, contacts, addresses, lead number, stage, priority, expected value, probability, expected close date, owner, source, notes, files, custom fields.

### 7.4 Lead View

Tabs:

- Overview: lead profile, stage, priority, value, probability.
- Contacts and addresses.
- Activities/follow-ups: activity type, subject, schedule, outcome.
- Calls, meetings, emails: from `lead_activities`, `calendar_events`, and `communication_logs`.
- Tasks: related tasks.
- Quotations: placeholder if quotation tables are added later.
- Documents, notes, timeline.
- Conversion history: converted client, converted at, lost reason.

Actions: add activity, schedule meeting, create task, send email, convert to client, mark lost.

## 8. Renewals

Source tables: `renewals`, `renewal_items`, `renewal_history`, `renewal_reminders`, `parties`.

Use one `renewals` table for client, vendor, license, contract, and service renewals. Separate pages can pre-filter by `renewal_type`.

### 8.1 Renewals Dashboard

Cards: renewals due this week/month, overdue renewals, auto-renew enabled, total renewal amount.

Charts: renewals by type, renewals by status, upcoming amount by month.

Tables: overdue renewals, upcoming renewals, failed reminders.

### 8.2 Client Renewals List

Columns: renewal number, client, title, start date, end date, renewal date, amount, owner, auto renew, status.

Filters: client, status, renewal date range, owner, auto renew, amount range.

Actions: create, view, edit, renew, mark cancelled, schedule reminder, export.

### 8.3 Vendor Renewals List

Columns: renewal number, vendor, type, title, end date, renewal date, amount, owner, status.

Filters/actions: same as client renewals, pre-filtered to vendor records.

### 8.4 Renewal Calendar

Views: month, week, agenda.

Actions: open renewal, drag date if allowed, create reminder.

### 8.5 Renewal Create/Update

Fields: party, renewal type, title, description, start date, end date, renewal date, amount, currency, reminder days before, auto renew, owner, status.

Line items: name, quantity, unit price, amount.

Reminder schedule: remind at, channel, status.

### 8.6 Renewal View

Tabs: overview, line items, reminder schedule, renewal history, linked party, files, notes, activity.

Actions: renew, extend end date, send reminder, cancel, export.

## 9. Projects

Source tables: `projects`, `project_members`, `project_phases`, `project_milestones`, `project_time_logs`, `project_expenses`, `tasks`, `parties`, `teams`, `users`.

### 9.1 Projects Dashboard

Cards: active projects, overdue projects, completed projects, total budget, billable time, project expenses.

Charts: projects by status, progress trend, budget versus expense, workload by team.

Tables: projects at risk, overdue milestones, recent time logs.

### 9.2 Projects List

Columns: project number, name, client, manager, status, priority, start date, due date, budget, progress, created at.

Filters: client, manager, team, status, priority, category, due date, created date, progress range.

Views: table, grid, Kanban, Gantt, calendar.

Actions: create, view, edit, archive, bulk assign manager/team, export.

### 9.3 Project Create/Update

Fields: project number, name, description, client, manager, category, type, status, priority, start date, due date, budget amount, billing type, progress.

Members: user, team, role, billing rate, allocation percent, joined/left dates.

Phases/milestones: name, dates, status, sort order.

### 9.4 Project View

Tabs:

- Overview: summary, dates, budget, progress, status.
- Team members: users, teams, roles, allocation.
- Phases: phase list with progress/status.
- Milestones: due dates and completion.
- Tasks: task board/list scoped to project.
- Files: attachments and documents.
- Expenses: project expense list.
- Time logs: user, task, minutes, billable flag.
- Notes, activity.

Actions: create task, add member, add milestone, log time, add expense, archive.

## 10. Tasks and To-Do

Source tables: `tasks`, `task_checklists`, `task_checklist_items`, `task_comments`, `task_dependencies`, `task_watchers`, `task_assignments`, `task_time_logs`, `todo_lists`, `projects`, `teams`, `users`.

### 10.1 Tasks Dashboard

Cards: my open tasks, overdue tasks, due today, completed this week, team open tasks.

Charts: tasks by status, tasks by priority, completion trend, workload by user/team.

Tables: overdue tasks, blocked/dependent tasks, recently completed tasks.

### 10.2 Tasks List

Columns: task number, title, project, related record, assignee, team, status, priority, start, due, progress.

Filters: status, priority, category, assignee, team, project, due date, watcher, recurring, completed.

Views: table, Kanban, calendar, my tasks, team tasks.

Actions: create, view, edit, assign, change status, change priority, bulk update, export.

### 10.3 Task Create/Update

Fields: task number, parent task, project, related type/id, title, description, status, priority, category, assigned user, assigned team, start/due, estimated minutes, actual minutes, progress, recurring flag, recurrence rule.

Sections: checklist, dependencies, watchers, comments, files, reminders.

### 10.4 Task View

Tabs: details, checklist, comments, attachments, dependencies, watchers, assignment history, time logs, activity.

Actions: start timer, log time, complete checklist item, comment, reassign, mark complete, clone task.

### 10.5 To-Do Lists

Source table: `todo_lists` plus `tasks`.

Pages: dashboard, my tasks, shared lists, list view, Kanban view, calendar view, create, edit, view.

List columns: name, owner, team, visibility, status, task count, color/icon.

Actions: create list, share with team, add task, archive list.

## 11. Client Issues and Support

Source tables: `client_issues`, `parties`, `party_contacts`, `projects`, `tasks`, `task_time_logs`, `attachments`, `notes`, `activity_logs`.

### 11.1 Issues Dashboard

Cards: open issues, urgent issues, overdue issues, resolved this week, average resolution time.

Charts: issues by priority, issues by status, issues by type/category, assignee workload.

### 11.2 Issues List

Columns: issue number, client, contact, project, title, type, category, status, priority, assignee, team, due at, created at.

Filters: client, project, type, category, status, priority, assignee, team, due date, created date.

Views: table, Kanban by status.

Actions: create, view, edit, assign, change priority, change status, close, reopen, export.

### 11.3 Issue Create/Update

Fields: issue number, client, contact, project, title, description, type, category, status, priority, assigned user, assigned team, due date.

Sections: attachments, related tasks, notes, reminders.

### 11.4 Issue View

Tabs: details, conversation/internal notes, attachments, linked tasks, time logs, activity.

Actions: reply/add note, create task, log time, assign, resolve, close, reopen.

## 12. Calendar and Appointments

Source tables: `calendars`, `calendar_events`, `calendar_event_attendees`, `calendar_event_reminders`, `meeting_rooms`, `meeting_room_bookings`, `video_meetings`, `calendar_sync_logs`, `reminders`.

### 12.1 Calendar

Views: daily, weekly, monthly, agenda, my schedule, team calendar.

Filters: calendar, owner, team, event status, related module, attendee, location.

Actions: create event, edit event, drag/reschedule, delete/cancel, invite attendees, create video meeting, book room, sync provider.

### 12.2 Event Create/Update

Fields: calendar, related record, title, description, location, starts at, ends at, timezone, all day, recurrence rule, status.

Attendees: users, teams, contacts, external email, response status.

Reminders: channel, remind at, status.

Meeting sections: room booking and video meeting provider/link/passcode.

### 12.3 Event View

Tabs: details, attendees, reminders, room/video meeting, related record, sync logs, activity.

## 13. Attendance

Source tables: `attendance_records`, `staff`, `shifts`, `staff_shift_assignments`, `tenant_lookups`, `activity_logs`.

### 13.1 Attendance Dashboard

Cards: present today, absent today, late check-ins, early check-outs, pending corrections.

Charts: attendance trend, department attendance, shift coverage.

### 13.2 Daily Attendance

Columns: staff, department, shift, date, check in, check out, total minutes, status.

Filters: date, department, team, office, shift, status.

Actions: check in/out, mark attendance, import attendance, approve correction, export.

### 13.3 Monthly Attendance

Grid: staff rows by day columns with status markers, totals, leave/holiday indicators.

Actions: export monthly sheet, open staff attendance, bulk update.

### 13.4 Attendance Requests and Corrections

Recommended missing table: `attendance_requests` with `id`, `uuid`, `tenant_id`, `staff_id`, `attendance_record_id`, `request_type`, `requested_check_in_at`, `requested_check_out_at`, `reason`, `status_id`, `approved_by`, `approved_at`, timestamps.

Pages: request list, create request, review request, approval queue.

## 14. Leave Management

Source tables: `leave_types`, `leave_requests`, `leave_balances`, `staff`, `holiday_calendars`, `holidays`.

### 14.1 Leave Dashboard

Cards: pending requests, approved this month, rejected this month, staff on leave today.

Charts: leave usage by type, department leave trend.

### 14.2 Leave Requests

Columns: staff, leave type, start date, end date, total days, reason, status, approved by, approved at.

Filters: status, leave type, department, staff, date range.

Actions: apply leave, approve, reject, cancel, export.

### 14.3 Apply Leave

Fields: staff if manager/admin, leave type, start date, end date, total days, reason, attachments.

Validation: leave balance, overlapping requests, holiday/weekend policy if configured.

### 14.4 Leave Balance

Columns: staff, leave type, year, opening balance, accrued, used, remaining.

Actions: adjust balance, export.

### 14.5 Leave Calendar

Views: month, week, agenda, department/team filter.

## 15. Payroll

Source tables: `payroll_cycles`, `payrolls`, `payroll_component_types`, `payroll_components`, `payroll_component_assignments`, `payroll_items`, `payroll_overtime`, `payroll_loans`, `payroll_loan_installments`, `payroll_reimbursements`, `payroll_tax_slabs`, `payroll_tax_deductions`, `payroll_pf_settings`, `payroll_esi_settings`, `payroll_bank_transfers`, `payroll_payslips`, `payroll_approvals`, `staff`, `attendance_records`, `leave_requests`.

### 15.1 Payroll Dashboard

Cards: current cycle status, gross payroll, deductions, net payroll, pending approvals, pending bank transfers.

Charts: payroll cost by month, department payroll, component breakdown.

### 15.2 Payroll Cycles

Columns: cycle name, month/year, period start/end, payment date, status, processed by, approved by.

Actions: create cycle, generate payroll, process, approve, lock, reopen if permitted.

### 15.3 Generate Payroll

Inputs: cycle, staff scope, attendance source, leave source, salary effective date, include overtime, include reimbursements, include loan deductions.

Output preview: staff, working days, present days, leave days, gross salary, earnings, deductions, tax, net salary.

Actions: validate, regenerate selected staff, save draft, submit for approval.

### 15.4 Payroll History and Payroll View

List columns: cycle, staff, employee code, gross salary, earnings, deductions, tax, net salary, payment status.

View tabs: summary, payroll items, overtime, loans, reimbursements, taxes, approvals, bank transfer, payslip, activity.

### 15.5 Payslips

Columns: payslip number, staff, cycle, generated at, emailed at, file.

Actions: generate PDF, download, email, bulk email.

### 15.6 Salary Components and Assignments

Pages: component type list, component list, staff component assignments.

Actions: create component, edit formula, assign to staff, end assignment.

### 15.7 Loans, Reimbursements, Bank Transfers, Tax Settings

Pages:

- Loans list/view/create/update with installment schedule.
- Reimbursements list/approval.
- Bank transfers list/view/export bank file.
- Tax slabs, PF settings, ESI settings.

## 16. Holidays

Source tables: `holiday_calendars`, `holidays`, `holiday_applicabilities`, `holiday_groups`, `holiday_group_members`.

### 16.1 Holiday Calendar

Views: calendar, list.

Filters: calendar, country/state/city, office, department, team, staff group, holiday type/category, optional/mandatory.

Actions: create holiday, edit, duplicate to next year, import holidays, export.

### 16.2 Holiday Create/Update

Fields: calendar, name, type, category, date or start/end dates, total days, half-day flag/session, recurring yearly, optional holiday, applicable to all, description, color, status.

Applicability section: country, state, city, office, department, team, staff, group.

### 16.3 Holiday Groups and Calendars

Pages: holiday calendars list/create/edit/view, holiday groups list/create/edit/view, group members.

## 17. Tenant Finance

Source tables: `tenant_invoices`, `tenant_invoice_items`, `tenant_payments`, `tenant_expenses`, `tenant_expense_items`, `bank_accounts`, `parties`, `projects`.

### 17.1 Finance Dashboard

Cards: invoice total, paid amount, outstanding balance, overdue balance, expenses this month, net revenue.

Charts: revenue by month, payment collection, expenses by category, invoice aging.

Tables: overdue invoices, recent payments, pending expenses.

### 17.2 Invoices List

Columns: invoice number, client, project, invoice date, due date, subtotal, tax, total, paid, balance, currency, status.

Filters: client, project, status, invoice date, due date, overdue, balance, currency.

Actions: create, view, edit draft, send, download PDF, record payment, cancel, export.

### 17.3 Invoice Create/Update

Fields: client, project, invoice number, invoice date, due date, currency, status.

Line items: item name, description, quantity, unit price, tax rate, amount.

Totals: subtotal, discount, taxable amount, tax amount, total amount.

### 17.4 Invoice View

Tabs: summary, line items, payments, PDF/file, communication logs, notes, activity.

### 17.5 Payments List/View

Columns: payment number, invoice, client, amount, currency, method, reference, status, paid at.

Actions: record payment, edit pending payment, void if allowed, open invoice, export.

### 17.6 Expenses List/View

Columns: expense number, vendor, project, category, expense date, amount, currency, status.

Actions: create, view, edit, approve, reject, attach receipt, export.

### 17.7 Bank Accounts

Columns: owner type, owner, bank name, masked account number, IFSC, primary flag.

Actions: create, edit, set primary, archive.

## 18. Files and Documents

Source tables: `files`, `attachments`, `staff_documents`, shared module attachments.

Pages:

- All documents: file, module, linked record, owner/uploader, visibility, size, uploaded at.
- Upload document: file, label, visibility, linked record.
- Shared files: visibility/shared scope.
- Folder management: recommended missing table if folder hierarchy is required.
- Recent files: recently uploaded or opened files.

Actions: upload, preview, download, replace, attach to record, detach, archive, restore, export file index.

Security: validate tenant ownership for every attached file; hide raw storage paths from tenant users.

## 19. Notifications and Communication

Source tables: `notifications`, `communication_logs`.

### 19.1 Notifications

Pages: all notifications, unread notifications, push notifications.

Columns: type, related record, message summary, read status, created at.

Actions: mark read, open record, delete/clear, bulk actions.

### 19.2 Communication Queues and Logs

Pages: email queue, SMS queue, WhatsApp queue, call logs.

Columns: channel, direction, party/user, subject, provider, provider message ID, status, sent at, delivered at, failure reason.

Actions: retry failed message, open related party, export.

### 19.3 Notification Templates

Recommended missing table: `notification_templates` as also listed in `platform-pages.md`, tenant-scoped if tenants can customize templates.

Pages: template list, create/update, preview, test send.

## 20. Reports

Each report should include filters, grouped totals, charts, export, scheduled export if implemented, and drill-down links to source records.

Pages:

- Reports dashboard.
- Sales/CRM reports: lead pipeline, lead conversion, lead source, client acquisition, client activity.
- Client reports: client aging, inactive clients, client revenue, client support history.
- Vendor reports: vendor expenses, vendor renewal due, vendor rating.
- Staff reports: headcount, department distribution, staff activity, assigned workload.
- Attendance reports: daily attendance, monthly attendance, late/early report, absentee report.
- Leave reports: leave balance, leave usage, pending approvals.
- Payroll reports: payroll summary, component report, tax deduction report, payslip report, bank transfer report.
- Renewal reports: upcoming renewals, overdue renewals, renewal revenue/expense.
- Revenue reports: invoice summary, payment collection, outstanding balance, invoice aging.
- Expense reports: expense summary, project expenses, vendor expenses.
- Project reports: status, profitability, progress, milestone delay, time logs.
- Task reports: overdue tasks, completion trend, workload by assignee/team.
- Support reports: issue status, priority, resolution time, assignee performance.
- Custom reports: user-selected entity, columns, filters, grouping, chart type.

## 21. Settings

Source tables: `tenant_settings`, `tenant_lookups`, `departments`, `designations`, `shifts`, `leave_types`, `payroll_components`, `tags`, `custom_fields`, `integration_providers`, `tenant_integrations`, `integration_credentials`, `integration_webhooks`, `integration_field_mappings`, `integration_rate_limits`, `user_preferences`.

### 21.1 General Settings

Pages:

- Company information: tenant organization fields.
- Branding: logo, favicon, colors.
- Localization: currency, timezone, locale, date/time format.
- Offices: tenant offices list/create/update/view.

### 21.2 HR Settings

Pages: departments, designations, employment types using lookups, shifts, leave types, salary components, PF settings, ESI settings, tax slabs.

### 21.3 CRM Settings

Pages: lead sources, lead statuses, lead stages, project statuses, task statuses, priorities, categories, tags, custom fields.

Most status/category pages should use `tenant_lookups` with a fixed `group`.

### 21.4 Communication Settings

Pages: email settings, SMTP, SMS, WhatsApp, notification settings, templates.

Use `tenant_settings` for configuration and `tenant_integrations` for provider connections.

### 21.5 Security Settings

Pages: password policy, session policy, login settings, two-factor authentication, allowed IPs if implemented, user access defaults.

### 21.6 Integrations

Pages: Google, Microsoft, Zoom, Google Meet, payment gateways, webhooks, storage providers.

Actions: connect, test connection, rotate credentials, disconnect, retry sync, view logs.

### 21.7 Storage and Backup

Pages: local storage, S3, Google Drive, manual backup, scheduled backup, restore.

Recommended missing tenant backup tables if tenant-managed backups are required: `tenant_backup_runs`, `tenant_restore_requests`.

## 22. Audit Logs

Source tables: `activity_logs`, `security_events`, `communication_logs`, `api_request_logs`.

Pages:

- User activity: actor, subject, event, old/new values, IP, time.
- Login history: user, event, IP, user agent, time.
- System logs: API requests, communication failures, integration sync logs.
- Data changes: subject, old values, new values, changed by.

Actions: filter, export, open subject record, compare changes.

## 23. Profile

Source tables: `users`, `user_preferences`, `notifications`, `activity_logs`, `api_request_logs`.

Pages:

- My profile: name, email, mobile, photo, timezone, locale.
- Change password.
- Security: 2FA, sessions, last login, login IPs.
- API tokens: recommended missing table if tenant user API tokens are offered.
- Preferences: notification preferences, dashboard layout, language/timezone.

Actions: update profile, upload photo, change password, enable/disable 2FA, revoke session/token.

## 24. Help Center

Recommended tenant-facing pages:

- Documentation.
- FAQs.
- Contact support.
- Release notes.
- System status link if exposed to tenants.

If help content is tenant-customizable, add knowledge base tables or reuse platform knowledge base pages with tenant visibility rules.

## 25. Missing Tenant Pages and Tables To Add

Pages missing from simple CRUD outlines:

- My Dashboard and widget preferences.
- Notifications center and communication queues.
- Recent activity and audit log pages.
- Staff import/export, activity timeline, and profile sub-tabs.
- Client/vendor duplicate merge pages.
- Lead dashboard and Kanban pipeline.
- Project Gantt and calendar views.
- Task dashboards, my tasks, team tasks, dependencies, watchers, timers.
- Attendance as a standalone module.
- Leave management as a standalone module.
- Finance dashboard, invoice aging, payment collection, expense reports.
- Files/documents center.
- Profile/security/preferences pages.
- Help center and release notes.

Recommended missing tables when these capabilities are required:


| Table                   | Key Columns                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| attendance_requests     | id, uuid, tenant_id, staff_id, attendance_record_id, request_type, requested_check_in_at, requested_check_out_at, reason, status_id, approved_by, approved_at, timestamps |
| tenant_api_tokens       | id, uuid, tenant_id, user_id, name, token_hash, abilities JSON, last_used_at, expires_at, timestamps                                                                      |
| tenant_backup_runs      | id, uuid, tenant_id, disk, file_id, backup_type, status, size_bytes, started_at, finished_at, failure_reason                                                              |
| tenant_restore_requests | id, uuid, tenant_id, backup_run_id, requested_by, approved_by, status, reason, started_at, finished_at, failure_reason                                                    |
| document_folders        | id, uuid, tenant_id, parent_id, name, visibility, owner_user_id, team_id, status, timestamps                                                                              |
| document_folder_files   | id, tenant_id, folder_id, file_id, added_by, created_at                                                                                                                   |
| notification_templates  | id, uuid, tenant_id NULL, channel, event, name, subject, body, variables JSON, status, timestamps                                                                         |

## 26. Tenant Permission Map

Recommended tenant permissions:

- `dashboard.view`, `dashboard.customize`
- `notification.view`, `notification.manage`
- `activity_log.view`, `activity_log.export`
- `role.view`, `role.create`, `role.edit`, `role.delete`, `role.assign_permissions`
- `permission.view`
- `team.view`, `team.create`, `team.edit`, `team.delete`, `team.assign`
- `staff.view`, `staff.create`, `staff.edit`, `staff.delete`, `staff.import`, `staff.export`, `staff.manage_salary`, `staff.manage_bank`
- `client.view`, `client.create`, `client.edit`, `client.delete`, `client.import`, `client.export`, `client.merge`
- `vendor.view`, `vendor.create`, `vendor.edit`, `vendor.delete`, `vendor.import`, `vendor.export`
- `lead.view`, `lead.create`, `lead.edit`, `lead.delete`, `lead.import`, `lead.export`, `lead.convert`
- `renewal.view`, `renewal.create`, `renewal.edit`, `renewal.delete`, `renewal.renew`
- `project.view`, `project.create`, `project.edit`, `project.delete`, `project.archive`
- `task.view`, `task.create`, `task.edit`, `task.delete`, `task.assign`, `task.log_time`
- `todo.view`, `todo.create`, `todo.edit`, `todo.delete`, `todo.share`
- `issue.view`, `issue.create`, `issue.edit`, `issue.delete`, `issue.assign`, `issue.close`
- `calendar.view`, `calendar.create`, `calendar.edit`, `calendar.delete`, `calendar.manage_team`
- `attendance.view`, `attendance.create`, `attendance.edit`, `attendance.approve`, `attendance.export`
- `leave.view`, `leave.apply`, `leave.approve`, `leave.manage_balance`
- `payroll.view`, `payroll.generate`, `payroll.approve`, `payroll.manage_settings`, `payroll.export`
- `holiday.view`, `holiday.create`, `holiday.edit`, `holiday.delete`
- `finance.invoice.view`, `finance.invoice.create`, `finance.invoice.edit`, `finance.invoice.send`, `finance.invoice.cancel`
- `finance.payment.view`, `finance.payment.create`, `finance.payment.edit`, `finance.payment.export`
- `finance.expense.view`, `finance.expense.create`, `finance.expense.edit`, `finance.expense.approve`
- `finance.bank_account.view`, `finance.bank_account.create`, `finance.bank_account.edit`, `finance.bank_account.delete`
- `document.view`, `document.upload`, `document.edit`, `document.delete`, `document.share`
- `report.view`, `report.export`, `report.customize`
- `setting.view`, `setting.edit`
- `profile.view`, `profile.edit`, `profile.security`
