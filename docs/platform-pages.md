# Platform Pages

This document defines the SaaS platform admin pages. Platform pages are for SaaS owner/staff users, not tenant CRM users. Tenant-facing CRM pages should be specified separately.

Each page is aligned with `docs/database.md` and includes data sources, list columns, filters, detail tabs, forms, and actions.

## Global Rules

Every list page should include search, filters, pagination, sorting, column visibility, export where useful, bulk actions where safe, and a link to the audit/activity drawer.

Every create/update form should include required validation, duplicate checks for unique fields, permission checks, save, save and continue, cancel, and audit metadata.

Every view page should include a header summary, record status, primary actions, tabs, internal notes where useful, files where useful, and activity logs.

## 1. Dashboard

Source tables: `tenants`, `subscriptions`, `plans`, `platform_invoices`, `platform_payments`, `subscription_usage`, `tenant_usage_snapshots`, `security_events`, `monitoring_alerts`, `system_incidents`, `queue_job_logs`, `scheduler_logs`.

Cards:

- Total tenants, active tenants, trial tenants, suspended tenants, expired tenants.
- New tenants today, this week, this month.
- MRR, ARR, month revenue, yearly revenue.
- Overdue invoice count and overdue balance.
- Failed payment count.
- Trials ending soon using `tenants.trial_ends_at` and `subscriptions.trial_ends_at`.
- Subscriptions expiring soon using `subscriptions.expires_at`.
- Active incidents and unresolved monitoring alerts.
- Failed queue jobs and failed scheduler runs.

Charts:

- Tenant growth by month.
- Revenue by month.
- Plan distribution.
- Subscription status distribution.
- API usage trend.
- Storage usage trend.
- Payment success/failure trend.

Tables:

- Recent tenants: logo, `organization_name`, `slug`, owner, current plan, tenant status, subscription status, `created_at`.
- Recent payments: `payment_number`, tenant, amount, currency, gateway, `payment_status`, `paid_at`.
- Overdue invoices: `invoice_number`, tenant, `due_date`, `balance_amount`, status.
- Active alerts: severity, message, status, `triggered_at`.
- Security events: severity, event, tenant, user/IP, `created_at`.

Actions: create tenant, create invoice, view failed jobs, view incidents, export dashboard snapshot.

## 2. Access Control

### 2.1 Platform Roles List

Source tables: `platform_roles`, `platform_permissions`, `platform_role_has_permissions`, `platform_model_has_roles`.

Columns: `display_name`, `name`, `guard_name`, permission count, assigned users count, `is_system`, `status`, `created_at`, `updated_at`.

Filters: status, system/custom, guard, permission module.

Actions: create, view, edit, clone, activate, inactivate, delete custom unused roles.

### 2.2 Platform Role Create/Update

Fields: `name`, `display_name`, `description`, `guard_name`, `is_system`, `status`, permissions grouped by `platform_permissions.module`.

Validation: unique `name + guard_name`; system roles require elevated permission to edit.

### 2.3 Platform Role View

Tabs:

- Details: all role columns.
- Permissions: module, permission name, display name.
- Assigned users: platform user, email, department, status.
- Activity: changes from `activity_logs` if implemented for platform records.

Actions: edit, assign/remove permissions, assign users, clone.

### 2.4 Platform Permissions List/Create/Update

Source table: `platform_permissions`.

Columns/fields: `module`, `name`, `display_name`, `description`, `guard_name`, `is_system`, timestamps.

Actions: create permission, edit custom permission, delete custom permission if unused.

## 3. Platform Teams

`database.md` defines tenant `teams`. Platform staff teams should not be mixed with tenant teams. Add these platform tables if SaaS internal teams are required:

| Table | Key Columns |
| --- | --- |
| platform_teams | id, uuid, parent_team_id, name, code, description, lead_platform_user_id, assistant_lead_platform_user_id, email, phone, color, icon, visibility, status, created_by, updated_by, timestamps, deleted_at |
| platform_team_roles | id, uuid, name, code, description, permissions JSON, sort_order, is_system, status, timestamps |
| platform_team_members | id, uuid, platform_team_id, platform_user_id, platform_team_role_id, allocation_percent, is_primary, effective_from, effective_to, joined_at, left_at, status |
| platform_team_assignments | id, platform_team_id, assignable_type, assignable_id, assignment_role, assigned_by, assigned_at, released_at, status |

### 3.1 Teams List

Columns: name, code, parent team, lead, member count, assigned tenant count, assigned ticket count, assigned incident count, visibility, status, `created_at`.

Filters: status, lead, parent team, visibility.

Actions: create, view, edit, add members, assign tenants/tickets/incidents, archive.

### 3.2 Team Create/Update

Fields: name, code, parent team, description, lead, assistant lead, email, phone, color, icon, visibility, status.

Member section: platform user, team role, allocation percent, primary flag, effective dates, joined date, status.

### 3.3 Team View

Tabs:

- Overview: team details, lead, member count, active assignment count.
- Members: user, role, allocation, primary flag, joined/left/status.
- Assignments: tenants, support tickets, incidents, alerts.
- Permissions/settings: role permissions and team preferences.
- Activity.

## 4. Platform Staff

Source tables: `platform_users`, platform RBAC pivots, platform team tables if added.

### 4.1 Staff List

Columns: profile photo, `employee_code`, `display_name`, `email`, `mobile`, `designation`, `department`, teams, roles, `status`, `two_factor_enabled`, `last_login_at`, `created_at`.

Filters: status, role, department, team, 2FA enabled, last login date, created date.

Actions: create, invite, view, edit, suspend, reactivate, reset password, force logout, require 2FA, assign roles, assign teams, delete/restore.

### 4.2 Staff Create/Update

Sections:

- Identity: `first_name`, `last_name`, `display_name`, `employee_code`, profile photo.
- Contact: `email`, `mobile`.
- Employment: `designation`, `department`, teams.
- Access: roles, direct permissions if allowed, `status`.
- Security: password or invite email, `two_factor_enabled`, verified flags.
- Preferences: timezone, locale.

### 4.3 Staff View

Tabs:

- Profile: all visible `platform_users` columns except password/token.
- Access: roles, permissions, teams.
- Security: 2FA, email verified, last login IP/time, devices/tokens if implemented.
- Assignments: tenants, tickets, incidents, alerts.
- Activity.

## 5. Tenants

Source tables: `tenants`, `users`, `tenant_offices`, `subscriptions`, `plans`, `subscription_usage`, `tenant_usage_snapshots`, `platform_invoices`, `platform_payments`, `tenant_integrations`, `tenant_settings`, `security_events`.

### 5.1 Tenants List

Columns: logo, `organization_name`, `slug`, `organization_code`, owner name/email, business type, industry, current plan, subscription status, tenant status, `trial_ends_at`, `default_currency`, `default_timezone`, storage used, users count, `created_at`.

Filters: tenant status, plan, subscription status, trial ending, expired, suspended, industry, business type, country, created date.

Actions: create, view, edit, activate, suspend, reactivate, archive, soft delete, restore, impersonate/remote login, change plan, create invoice, export.

### 5.2 Tenant Create/Update

Sections:

- Organization: `organization_name`, `legal_name`, `display_name`, `organization_code`, `slug`, business type, industry, company size, website, description.
- Legal/tax: GST, PAN, registration number.
- Branding: logo, favicon.
- Defaults: currency, timezone.
- Primary owner user: first name, last name, display name, email, mobile, password/invite, status.
- Head office: office name, code, office type, address, country/state/city, postal code, contact person/email/phone, working hours, GST number.
- Subscription: plan, type, billing cycle, trial dates, start date, expiry date, renewal type, auto renew.

### 5.3 Tenant View

Header: logo, organization name, slug, tenant status, current plan, subscription status, owner, created date.

Tabs:

- Overview: organization, legal/tax, defaults, website, description.
- Owner/users: tenant `users` with name, email, mobile, account type, status, last login, 2FA.
- Offices: `tenant_offices` fields and default/head office markers.
- Subscription: current subscription, financial totals, addons, usage, versions, renewals.
- Billing: platform invoices and payments for this tenant.
- Usage: users, storage, API requests, projects, invoices from `tenant_usage_snapshots` and `subscription_usage`.
- Modules/features: plan features, tenant module settings, feature limit usage.
- Settings: important `tenant_settings` groups.
- Integrations: tenant provider connections, credential expiry, sync status.
- Security: `security_events`, login/IP activity, 2FA coverage.
- Support: tickets, remote login history.
- Files: logo/favicon and platform attachments.
- Activity: audit logs.

Actions: activate, suspend, reactivate, extend trial, upgrade/downgrade plan, pause/resume subscription, cancel subscription, force owner password reset, remote login, create invoice, record payment, archive.

## 6. Subscriptions

Source tables: `subscriptions`, `subscription_versions`, `subscription_renewals`, `subscription_addons`, `subscription_usage`, `plans`, `features`, `platform_invoices`, `platform_payments`, `coupon_redemptions`.

### 6.1 Subscription List

Columns: `subscription_number`, tenant, plan, type, billing cycle, status, starts at, expires at, next billing date, payable amount, currency, auto renew, last renewed at.

Filters: plan, type, status, billing cycle, renewal type, expiry range, trial ending, payment pending.

Actions: view, upgrade, downgrade, renew, pause, resume, cancel, create invoice, apply coupon, add addon, export.

### 6.2 Subscription View

Tabs:

- Summary: subscription dates, status, renewal, pricing totals.
- Plan/features: plan features and limits.
- Usage: used value, limit value, period start/end.
- Add-ons: addon plan, quantity, price, active dates, status.
- Invoices: invoice number, date, total, balance, status.
- Payments: payment number, amount, gateway, status, paid at.
- Discounts: coupon redemptions.
- History: versions, renewals, pause/resume/cancel dates.
- Notes/activity.

## 7. Plans, Features, Add-ons

### 7.1 Plans List

Source tables: `plans`, `features`, `plan_features`, `subscriptions`.

Columns: name, code, billing cycle, base price, currency, trial days, custom flag, public flag, active subscription count, status.

Actions: create, view, edit, clone, archive, attach features.

### 7.2 Plan Create/Update

Fields: name, code, description, billing cycle, base price, currency, trial days, is custom, is public, status.

Feature section: feature, value, metadata.

### 7.3 Plan View

Tabs: overview, features and limits, active subscriptions, revenue, change history.

### 7.4 Features List/Create/Update

Source table: `features`.

Columns/fields: module, name, code, data type, unit, description, status.

Actions: create, edit, disable if unused or retired.

### 7.5 Add-ons List/Create/Update

Source table: `addon_plans`.

Fields: name, code, pricing type, price, currency, status.

## 8. Billing

### 8.1 Platform Invoices List

Source tables: `platform_invoices`, `platform_invoice_items`, `tenants`, `subscriptions`.

Columns: invoice number, tenant, subscription, invoice date, due date, subtotal, discount, tax, total, paid, balance, currency, status.

Filters: status, tenant, plan, due date, invoice date, overdue, balance.

Actions: view, create manual invoice, send invoice email, download PDF, record payment, cancel, refund.

### 8.2 Platform Invoice View

Tabs: summary, line items, payments, refunds/adjustments, PDF/file, activity.

Actions: send/resend, record payment, download PDF, cancel, refund payment.

### 8.3 Payments List/View

Source table: `platform_payments`.

Columns: payment number, tenant, invoice, subscription, gateway, gateway payment ID, method, amount, currency, payment status, paid at, failure reason.

Actions: view gateway response, retry failed payment, mark reconciled if reconciliation is added, refund successful payment.

### 8.4 Refunds

Missing table in `database.md`: add `platform_refunds`.

Recommended columns: `id`, `uuid`, `refund_number`, `tenant_id`, `platform_payment_id`, `platform_invoice_id`, `gateway_refund_id`, `amount`, `currency`, `reason`, `refund_status`, `refunded_at`, `raw_response JSON`, `created_by`, timestamps.

Pages:

- Refund list: refund number, tenant, payment, invoice, amount, status, refunded at.
- Refund view: payment details, gateway details, reason, raw response, activity.

Actions: initiate refund, retry failed refund, export, open payment, open invoice.

## 9. Coupons

Source tables: `coupons`, `coupon_plan_assignments`, `coupon_tenant_assignments`, `coupon_redemptions`.

### 9.1 Coupons List

Columns: code, name, discount type/value, starts at, expires at, max redemptions, used count, status.

Filters: status, active now, expired, plan, tenant, discount type.

Actions: create, view, edit, disable, clone.

### 9.2 Coupon Create/Update

Fields: code, name, discount type, discount value, starts at, expires at, max redemptions, status, allowed plans, allowed tenants.

Optional missing fields to add if needed: minimum invoice amount, first payment only, per tenant redemption limit.

### 9.3 Coupon View

Tabs: details, allowed plans, allowed tenants, redemptions, activity.

Redemption columns: tenant, subscription, invoice, discount amount, redeemed at.

## 10. Modules and Feature Controls

Source tables: `features`, `plan_features`, `subscription_usage`, `tenant_settings`.

Missing table recommendation: add `modules` with `id`, `uuid`, `name`, `code`, `description`, `icon`, `category`, `is_core`, `status`, `sort_order`.

Pages:

- Modules list: name, code, category, core flag, status, enabled tenant count.
- Module view: features, plans using it, tenants using it, usage metrics.
- Module create/update: name, code, icon, category, core flag, status, sort order.

Actions: enable/disable globally, enable/disable for tenant through `tenant_settings`, attach features to module.

## 11. Support

The database currently needs extra platform support tables for a complete SaaS support desk.

Recommended missing tables:

| Table | Key Columns |
| --- | --- |
| platform_tickets | id, uuid, ticket_number, tenant_id, opened_by_user_id, assigned_platform_user_id, assigned_platform_team_id, subject, description, priority, status, source, opened_at, resolved_at, closed_at, timestamps |
| platform_ticket_comments | id, ticket_id, author_type, author_id, comment, is_internal, created_at |
| knowledge_base_categories | id, parent_id, name, slug, status, sort_order |
| knowledge_base_articles | id, uuid, category_id, title, slug, content, visibility, status, published_at, created_by, updated_by, timestamps |
| remote_login_sessions | id, uuid, tenant_id, platform_user_id, reason, approved_by, started_at, ended_at, ip_address, status |

### 11.1 Tickets List/View

List columns: ticket number, tenant, subject, priority, status, source, assigned user/team, opened at, resolved at.

View tabs: details, conversation, internal notes, attachments, linked tenant, remote login sessions, activity.

Actions: assign, reply, add internal note, change priority, change status, link incident, close, reopen.

### 11.2 Knowledge Base

Pages: category list/create/update, article list/create/update/view.

Article fields: category, title, slug, content, visibility, status, published date, created/updated by.

Actions: preview, publish, unpublish, archive.

### 11.3 Remote Login

Columns: tenant, platform user, reason, approved by, started at, ended at, IP, status.

Actions: start session, end session, review history.

## 12. Reports

Separate pages:

- Tenant growth report.
- Active/trial/suspended tenant report.
- Subscription MRR/ARR report.
- Churn report.
- Plan performance report.
- Revenue collection report.
- Invoice aging report.
- Payment failure report.
- Coupon usage report.
- Tenant usage report.
- API usage report.
- Storage usage report.
- Support SLA report.
- Security events report.
- Platform staff activity report.

Each report should include filters, grouped totals, charts, export, and drill-down links.

## 13. Monitoring

Source tables: `monitoring_services`, `monitoring_service_logs`, `tenant_usage_snapshots`, `api_request_logs`, `queue_job_logs`, `scheduler_logs`, `security_events`, `system_incidents`, `monitoring_alerts`, webhook/sync logs.

Pages:

- Service health: service, type, status, response time, last checked.
- Server metrics: CPU, memory, disk, uptime. Add a table if persistent history is needed.
- Database health: connection, slow queries, size. Add a table if persistent history is needed.
- Cache/Redis health.
- Queue jobs: queue, job name, status, attempts, exception, started/finished.
- Failed jobs: retry, delete, view exception.
- Scheduler/cron: command, status, output, duration.
- API request logs: tenant, user, method, path, status code, duration, IP, created at.
- Webhook logs: provider, event, status, response code, payload, received at.
- Alerts: severity, message, status, triggered/resolved.
- Incidents: title, severity, status, started/resolved, summary.

Actions: retry failed queue job, mark alert resolved, create/update incident, export logs, view payload/exception safely.

## 14. Integrations

Source tables: `integration_providers`, `tenant_integrations`, `integration_credentials`, `integration_webhooks`, `integration_webhook_logs`, `integration_sync_jobs`, `integration_field_mappings`, `integration_rate_limits`, `tenant_settings`.

Pages:

- Provider catalog: name, code, category, auth type, status.
- Tenant integrations: tenant, provider, name, status, connected by, connected at.
- Credentials: show key names and expiry only, never raw encrypted values.
- Webhooks: provider, event, status, last delivery.
- Sync jobs: tenant, provider, direction, status, started/finished.
- Field mappings: entity type, local field, external field, transform rule.
- Rate limits: window, limit, used.

Integration groups: SMTP/email, payment gateways, Google, Meta/WhatsApp, Firebase/push, S3/storage, SMS.

Actions: connect, disconnect, rotate credentials, test connection, retry sync, retry webhook, disable provider.

## 15. Settings

Source tables: `tenant_settings`, `platform_user_preferences`, `files`, notification/communication tables if added.

Platform setting pages:

- General: app name, default currency, default timezone, support email.
- Branding: platform logo, favicon, colors.
- Security: password policy, 2FA enforcement, session timeout, IP allow/deny rules.
- Email/SMS/WhatsApp templates: subject/body, variables, status.
- Notification templates: channel, trigger, audience, content.
- Billing settings: invoice prefix, tax config, payment gateway defaults.
- Module defaults: default enabled modules/features for new tenants.
- Maintenance mode: enabled flag, message, allowed IPs.
- Backups: schedule, storage disk, retention, last backup status.
- Storage: default disk, max file size, allowed mime types.
- API settings: rate limits, token expiry, webhook signing.

Missing table recommendations:

| Table | Key Columns |
| --- | --- |
| platform_settings | id, group, key, value JSON, value_type, is_encrypted, updated_by, timestamps |
| notification_templates | id, uuid, channel, event, name, subject, body, variables JSON, status, timestamps |
| backup_runs | id, uuid, disk, file_id, backup_type, status, size_bytes, started_at, finished_at, failure_reason |

## 16. Audit Logs

Source tables: `activity_logs`, `security_events`, `platform_payments`, `platform_invoices`, `subscriptions`, `api_request_logs`.

Pages:

- User activity: actor, subject, event, old/new values, IP, time.
- Subscription logs: subscription changes, renewals, cancellations.
- Payment logs: payment status, gateway response, refunds.
- System logs: queues, schedulers, monitoring alerts, incidents.
- Security logs: login failures, password resets, 2FA changes, suspicious access.
- Remote login logs: platform user, tenant, reason, start/end time.

Actions: filter, export, open subject record, compare old/new values, mark security event reviewed.

## 17. Missing Platform Pages To Add

These were missing or incomplete in the original outline:

- Onboarding queue: pending tenants, owner invites, trial setup, failed onboarding.
- Trial management: trials ending soon, trial extension history.
- Subscription usage: per tenant feature usage versus plan limits.
- Feature flags/modules: global and tenant-specific controls.
- Add-ons: sellable addon plans and tenant addon assignments.
- Refunds: needs `platform_refunds`.
- Tax settings: platform GST/tax rules for subscription invoices.
- Legal documents: terms, privacy policy, DPA, tenant agreement acceptance.
- Announcements: platform announcements to tenants.
- Backup runs and restore requests.
- Webhook/event delivery logs.
- Remote login sessions.
- Support tickets and knowledge base.
- Platform API tokens if external platform APIs are offered.

## 18. Permission Map

Recommended platform permissions:

- `dashboard.view`
- `platform_user.view`, `platform_user.create`, `platform_user.edit`, `platform_user.delete`, `platform_user.suspend`
- `platform_role.view`, `platform_role.create`, `platform_role.edit`, `platform_role.delete`
- `platform_permission.view`, `platform_permission.create`, `platform_permission.edit`, `platform_permission.delete`
- `platform_team.view`, `platform_team.create`, `platform_team.edit`, `platform_team.delete`, `platform_team.assign`
- `tenant.view`, `tenant.create`, `tenant.edit`, `tenant.suspend`, `tenant.activate`, `tenant.delete`, `tenant.impersonate`
- `subscription.view`, `subscription.create`, `subscription.edit`, `subscription.upgrade`, `subscription.downgrade`, `subscription.renew`, `subscription.cancel`
- `plan.view`, `plan.create`, `plan.edit`, `plan.delete`
- `feature.view`, `feature.create`, `feature.edit`, `feature.delete`
- `billing.invoice.view`, `billing.invoice.create`, `billing.invoice.edit`, `billing.invoice.send`, `billing.invoice.cancel`
- `billing.payment.view`, `billing.payment.create`, `billing.payment.refund`
- `coupon.view`, `coupon.create`, `coupon.edit`, `coupon.delete`
- `module.view`, `module.edit`
- `support.ticket.view`, `support.ticket.reply`, `support.ticket.assign`, `support.ticket.close`
- `support.knowledge_base.view`, `support.knowledge_base.create`, `support.knowledge_base.edit`, `support.knowledge_base.publish`
- `monitoring.view`, `monitoring.manage`
- `integration.view`, `integration.create`, `integration.edit`, `integration.delete`, `integration.test`
- `setting.view`, `setting.edit`
- `audit_log.view`, `audit_log.export`
- `report.view`, `report.export`