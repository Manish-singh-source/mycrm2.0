# Multi-Tenant SaaS CRM Database Design

Corrected target database design for the SaaS CRM. The current Laravel app still has starter migrations, so use this file as the implementation blueprint.

## Design Rules

| Area | Standard |
| --- | --- |
| IDs | `id BIGINT` internal PK, `uuid UUID UNIQUE` public ID on major records |
| Tenancy | Every tenant business table has `tenant_id`; platform-only tables do not |
| Auth | Login data lives only in `platform_users` and `users` |
| Money | `DECIMAL(18,2)` plus `currency CHAR(3)` |
| Audit | Important tables use `created_by`, `updated_by`, timestamps, and soft deletes |
| Secrets | API keys, tokens, account numbers, and credentials must be encrypted |
| Reuse | Use shared files, attachments, notes, tags, custom fields, activity logs, reminders |
| Uniqueness | Tenant records use `UNIQUE(tenant_id, code/email/number)` |

Delete behavior: cascade child metadata, set creator/updater to null, restrict accounting/payroll/payment deletes, and restrict lookup deletes while used.

## 1. Platform, Tenant, Auth, RBAC

### platform_users

SaaS staff accounts.

| Column | Type |
| --- | --- |
| id | BIGINT PK |
| uuid | UUID UNIQUE |
| employee_code | VARCHAR(50) UNIQUE NULL |
| first_name | VARCHAR(100) |
| last_name | VARCHAR(100) NULL |
| display_name | VARCHAR(200) |
| email | VARCHAR(150) UNIQUE |
| mobile | VARCHAR(20) NULL |
| password | VARCHAR(255) |
| profile_photo_file_id | BIGINT FK files.id NULL |
| designation | VARCHAR(100) NULL |
| department | VARCHAR(100) NULL |
| timezone | VARCHAR(100) DEFAULT 'UTC' |
| locale | VARCHAR(20) DEFAULT 'en' |
| email_verified_at | DATETIME NULL |
| two_factor_enabled | BOOLEAN DEFAULT false |
| last_login_at | DATETIME NULL |
| last_login_ip | VARCHAR(45) NULL |
| status | ENUM(active,inactive,suspended) |
| created_by | BIGINT FK platform_users.id NULL |
| updated_by | BIGINT FK platform_users.id NULL |
| remember_token | VARCHAR(100) NULL |
| created_at / updated_at / deleted_at | TIMESTAMP |

### tenants

Company/organization only. Do not store owner password here.

| Column | Type |
| --- | --- |
| id | BIGINT PK |
| uuid | UUID UNIQUE |
| organization_name | VARCHAR(200) |
| legal_name | VARCHAR(200) NULL |
| display_name | VARCHAR(200) |
| organization_code | VARCHAR(50) UNIQUE |
| slug | VARCHAR(150) UNIQUE |
| business_type_id | BIGINT FK business_types.id NULL |
| industry_id | BIGINT FK industries.id NULL |
| company_size | ENUM(self,small,medium,large,enterprise) NULL |
| gst_number / pan_number | VARCHAR NULL |
| registration_number | VARCHAR(80) NULL |
| website | VARCHAR(255) NULL |
| logo_file_id / favicon_file_id | BIGINT FK files.id NULL |
| default_currency | CHAR(3) DEFAULT 'INR' |
| default_timezone | VARCHAR(100) DEFAULT 'Asia/Kolkata' |
| onboarded_at / trial_ends_at | DATETIME NULL |
| status | ENUM(pending,trial,active,suspended,expired,cancelled,archived) |
| timestamps / deleted_at | TIMESTAMP |

### tenant_offices

Head office, branch, warehouse, store, remote office, etc.

| Column | Type |
| --- | --- |
| id, uuid, tenant_id | BIGINT/UUID/FK |
| office_name | VARCHAR(150) |
| office_code | VARCHAR(50) |
| office_type | ENUM(head_office,branch,regional,warehouse,factory,store,remote,franchise) |
| is_head_office / is_default | BOOLEAN |
| address_line_1 / address_line_2 / landmark | VARCHAR |
| country_id / state_id / city_id | BIGINT FK NULL |
| postal_code | VARCHAR(20) NULL |
| latitude / longitude | DECIMAL(10,7) NULL |
| contact_person / contact_email / contact_phone | VARCHAR NULL |
| timezone | VARCHAR(100) NULL |
| working_hours | JSON NULL |
| gst_number | VARCHAR(30) NULL |
| status | ENUM(active,inactive) |
| audit/timestamps/deleted_at | standard |

Indexes: `UNIQUE(tenant_id, office_code)`, `INDEX(tenant_id, office_type)`.

### users

Tenant login accounts for owners, staff, and client portal users.

| Column | Type |
| --- | --- |
| id, uuid, tenant_id | BIGINT/UUID/FK |
| staff_id | BIGINT FK staff.id NULL |
| client_contact_id | BIGINT FK party_contacts.id NULL |
| default_office_id | BIGINT FK tenant_offices.id NULL |
| employee_code | VARCHAR(50) NULL |
| first_name / last_name / display_name | VARCHAR |
| email | VARCHAR(150) |
| mobile | VARCHAR(20) NULL |
| password | VARCHAR(255) |
| profile_photo_file_id | BIGINT FK files.id NULL |
| timezone / locale | VARCHAR |
| email_verified_at / mobile_verified_at | DATETIME NULL |
| two_factor_enabled | BOOLEAN DEFAULT false |
| account_type | ENUM(owner,staff,client) |
| last_login_at / last_login_ip | DATETIME/VARCHAR NULL |
| status | ENUM(invited,active,inactive,suspended) |
| audit/timestamps/deleted_at | standard |

Indexes: `UNIQUE(tenant_id, email)`, `UNIQUE(tenant_id, employee_code)`, `INDEX(tenant_id, account_type, status)`.

### RBAC

Platform RBAC tables: `platform_roles`, `platform_permissions`, `platform_role_has_permissions`, `platform_model_has_roles`, `platform_model_has_permissions`.

Tenant RBAC tables: `roles`, `permissions`, `role_has_permissions`, `model_has_roles`, `model_has_permissions`.

Rules:

- `roles` are tenant-scoped: `UNIQUE(tenant_id, name, guard_name)`.
- `permissions` are global: `UNIQUE(name, guard_name)`.
- Tenant model pivots must include `tenant_id` to prevent cross-tenant role leakage.
- Pivot PKs: `(role_id, permission_id)`, `(tenant_id, role_id, model_id, model_type)`, `(tenant_id, permission_id, model_id, model_type)`.

## 2. Master Data and Shared Primitives

| Table | Purpose | Key Columns |
| --- | --- | --- |
| countries | Country master | id, name, iso2, iso3, phone_code, currency_code, status |
| states | State master | id, country_id, name, code, status |
| cities | City master | id, country_id, state_id, name, status |
| business_types | Business type master | id, name, code, status |
| industries | Industry master | id, name, code, status |
| tenant_lookups | Custom statuses/priorities/stages/categories/types | id, uuid, tenant_id NULL, group, code, name, description, color, icon, sort_order, is_default, is_system, status, metadata JSON |
| files | File metadata | id, uuid, tenant_id NULL, disk, path, original_name, mime_type, extension, size_bytes, checksum, visibility, uploaded_by, platform_uploaded_by, timestamps, deleted_at |
| attachments | Polymorphic file mapping | id, tenant_id NULL, file_id, attachable_type, attachable_id, label, created_by, created_at |
| notes | Polymorphic notes | id, uuid, tenant_id, notable_type, notable_id, note, visibility, created_by, updated_by, timestamps, deleted_at |
| tags | Tenant tags | id, uuid, tenant_id, name, slug, color, icon, status, timestamps |
| taggables | Polymorphic tag mapping | tenant_id, tag_id, taggable_type, taggable_id, created_at |
| custom_fields | Field definitions | id, uuid, tenant_id, entity_type, name, code, field_type, options JSON, validation_rules JSON, is_required, sort_order, status |
| custom_field_values | Field values | id, tenant_id, custom_field_id, entity_type, entity_id, value_text, value_number, value_date, value_json |
| activity_logs | Unified audit trail | id, tenant_id NULL, actor_user_id NULL, actor_platform_user_id NULL, subject_type, subject_id, event, description, old_values JSON, new_values JSON, ip_address, user_agent, created_at |

Important indexes: `UNIQUE(tenant_id, group, code)` for lookups, `UNIQUE(tenant_id, slug)` for tags, `INDEX(tenant_id, *_type, *_id)` for polymorphic tables.

## 3. Plans, Subscriptions, Coupons, Platform Billing

These are SaaS platform billing tables, not tenant customer invoices.

| Table | Purpose | Key Columns |
| --- | --- | --- |
| plans | Sellable plans | id, uuid, name, code UNIQUE, description, billing_cycle, base_price, currency, trial_days, is_custom, is_public, status, timestamps, deleted_at |
| features | Feature catalog | id, uuid, module, name, code UNIQUE, data_type, unit, description, status |
| plan_features | Plan limits | id, plan_id, feature_id, value, metadata JSON, unique `(plan_id, feature_id)` |
| subscriptions | Tenant subscription | id, uuid, subscription_number UNIQUE, tenant_id, plan_id, current_version, type, billing_cycle, status, renewal_type, starts_at, expires_at, next_billing_at, trial_starts_at, trial_ends_at, cancelled_at, cancellation_reason, paused_at, resumed_at, base_amount, addon_amount, discount_amount, taxable_amount, tax_amount, payable_amount, currency, auto_renew, last_renewed_at, last_platform_invoice_id, last_platform_payment_id, notes, created_by, updated_by, timestamps, deleted_at |
| subscription_versions | Price/feature snapshots | id, subscription_id, version, plan_id, billing_cycle, starts_at, ends_at, pricing_snapshot JSON, feature_snapshot JSON, change_reason, created_by, created_at |
| platform_invoices | SaaS invoices to tenants | id, uuid, invoice_number UNIQUE, tenant_id, subscription_id, invoice_date, due_date, subtotal, discount_amount, taxable_amount, tax_amount, total_amount, paid_amount, balance_amount, currency, status, pdf_file_id, timestamps, deleted_at |
| platform_invoice_items | SaaS invoice lines | id, platform_invoice_id, item_type, description, quantity, unit_price, amount, metadata JSON |
| platform_payments | Tenant subscription payments | id, uuid, payment_number UNIQUE, tenant_id, platform_invoice_id, subscription_id, gateway, gateway_payment_id, payment_method, amount, currency, payment_status, paid_at, failure_reason, raw_response JSON, timestamps |
| addon_plans | Sellable add-ons | id, uuid, name, code, pricing_type, price, currency, status |
| subscription_addons | Active add-ons | id, subscription_id, addon_plan_id, quantity, unit_price, starts_at, ends_at, status |
| subscription_usage | Metered usage | id, tenant_id, subscription_id, feature_id, period_start, period_end, used_value, limit_value |
| coupons | Coupons | id, uuid, code UNIQUE, name, discount_type, discount_value, starts_at, expires_at, max_redemptions, status |
| coupon_plan_assignments | Coupon plans | coupon_id, plan_id |
| coupon_tenant_assignments | Coupon tenants | coupon_id, tenant_id |
| coupon_redemptions | Coupon usage | id, coupon_id, tenant_id, subscription_id, platform_invoice_id, discount_amount, redeemed_at |
| subscription_renewals | Renewal history | id, subscription_id, old_expires_at, new_expires_at, amount, status, renewed_at |

Subscription status: `trial`, `active`, `paused`, `expired`, `cancelled`, `suspended`, `pending_payment`, `grace_period`.

## 4. Settings and Preferences

| Table | Purpose | Key Columns |
| --- | --- | --- |
| tenant_settings | Tenant config | id, tenant_id, group, key, value JSON, value_type, is_encrypted, updated_by, timestamps |
| user_preferences | Tenant user config | id, tenant_id, user_id, group, key, value JSON, timestamps |
| platform_user_preferences | Platform user config | id, platform_user_id, group, key, value JSON, timestamps |

Use keys such as `branding.logo_file_id`, `smtp.host`, `security.password_policy`, `invoice.prefix`, `modules.projects.enabled`, `backup.schedule`.

## 5. Monitoring, Security, Integrations

| Table | Purpose | Key Columns |
| --- | --- | --- |
| monitoring_services | Platform service catalog | id, name, code, service_type, status, check_interval_seconds |
| monitoring_service_logs | Health checks | id, service_id, status, response_time_ms, message, checked_at |
| tenant_usage_snapshots | Tenant resource snapshots | id, tenant_id, period_start, period_end, users_count, storage_bytes, api_requests, projects_count, invoices_count |
| api_request_logs | API traffic | id, tenant_id NULL, user_id NULL, method, path, status_code, duration_ms, ip_address, created_at |
| queue_job_logs | Queue history | id, queue, job_name, status, attempts, exception, started_at, finished_at |
| scheduler_logs | Scheduler history | id, command, status, output, started_at, finished_at |
| security_events | Security audit | id, tenant_id NULL, user_id NULL, event, severity, ip_address, metadata JSON, created_at |
| system_incidents | Platform incidents | id, title, severity, status, started_at, resolved_at, summary |
| monitoring_alerts | Alerts | id, alertable_type, alertable_id, severity, message, status, triggered_at, resolved_at |
| integration_providers | Provider catalog | id, name, code, category, auth_type, status, metadata JSON |
| tenant_integrations | Tenant connections | id, uuid, tenant_id, provider_id, name, status, connected_by, connected_at |
| integration_credentials | Encrypted credentials | id, tenant_integration_id, key, encrypted_value, expires_at |
| integration_webhooks | Webhook config | id, tenant_integration_id, event, secret_hash, status |
| integration_webhook_logs | Webhook logs | id, webhook_id, event, payload JSON, status, response_code, received_at |
| integration_sync_jobs | Sync jobs | id, tenant_integration_id, sync_type, direction, status, started_at, finished_at |
| integration_field_mappings | Field mapping | id, tenant_integration_id, entity_type, local_field, external_field, transform_rule JSON |
| integration_rate_limits | Provider limits | id, tenant_integration_id, window_start, window_end, limit_count, used_count |

## 6. Parties, Clients, Vendors, Leads

Use `parties` for shared identity. Add profile tables for module-specific data.

| Table | Purpose | Key Columns |
| --- | --- | --- |
| parties | Shared company/person identity | id, uuid, tenant_id, party_type, display_name, legal_name, email, phone, website, gst_number, pan_number, industry_id, source_id, status_id, owner_user_id, metadata JSON, created_by, updated_by, timestamps, deleted_at |
| party_contacts | Contact people | id, uuid, tenant_id, party_id, first_name, last_name, display_name, email, mobile, phone, designation, department, is_primary, portal_enabled, status, timestamps, deleted_at |
| party_addresses | Addresses | id, tenant_id, party_id, address_type, address_line_1, address_line_2, country_id, state_id, city_id, postal_code, is_default, timestamps |
| client_profiles | Client details | id, tenant_id, party_id UNIQUE, client_code, client_type, credit_limit, payment_terms_days, onboarding_date, account_manager_id, timestamps |
| vendor_profiles | Vendor details | id, tenant_id, party_id UNIQUE, vendor_code, vendor_category_id, payment_terms_days, rating, account_manager_id, timestamps |
| lead_profiles | Lead details | id, tenant_id, party_id UNIQUE, lead_number, stage_id, priority_id, expected_value, probability, expected_close_date, converted_client_party_id, converted_at, lost_reason, timestamps |
| lead_activities | Lead follow-ups | id, uuid, tenant_id, lead_profile_id, activity_type, subject, description, scheduled_at, completed_at, outcome, assigned_to, created_by, timestamps |

Indexes: `UNIQUE(tenant_id, client_code)`, `UNIQUE(tenant_id, vendor_code)`, `UNIQUE(tenant_id, lead_number)`, `INDEX(tenant_id, party_type, status_id)`.

## 7. Staff and HR

| Table | Purpose | Key Columns |
| --- | --- | --- |
| departments | Department tree | id, uuid, tenant_id, parent_id, name, code, manager_user_id, status |
| designations | Job titles | id, uuid, tenant_id, department_id, name, code, status |
| teams | Team master | id, uuid, tenant_id, parent_team_id, department_id, office_id, team_type_id, name, code, description, lead_user_id, assistant_lead_user_id, email, phone, color, icon, visibility, is_default, status, created_by, updated_by, timestamps, deleted_at |
| team_roles | Team member roles | id, uuid, tenant_id, name, code, description, permissions JSON, sort_order, is_system, status, timestamps |
| team_members | Team users/staff | id, uuid, tenant_id, team_id, user_id, staff_id, team_role_id, member_type, allocation_percent, is_primary, effective_from, effective_to, joined_at, left_at, status, created_by, updated_by, timestamps |
| team_permissions | Optional team-level permissions | id, tenant_id, team_id, permission_id, granted_by, granted_at |
| team_settings | Team preferences/config | id, tenant_id, team_id, group, key, value JSON, value_type, timestamps |
| team_assignments | Polymorphic team ownership | id, tenant_id, team_id, assignable_type, assignable_id, assignment_role, assigned_by, assigned_at, released_at, status |
| staff | Staff profiles | id, uuid, tenant_id, employee_code, first_name, last_name, display_name, personal_email, work_email, mobile, gender, date_of_birth, joining_date, exit_date, department_id, designation_id, office_id, primary_team_id, reporting_manager_id, employment_type, employment_status, created_by, updated_by, timestamps, deleted_at |
| staff_employment_history | Role history | id, tenant_id, staff_id, department_id, designation_id, office_id, effective_from, effective_to |
| staff_bank_accounts | Salary bank details | id, tenant_id, staff_id, account_holder_name, bank_name, account_number_encrypted, ifsc_code, is_primary |
| staff_salary_structures | Salary history | id, tenant_id, staff_id, effective_from, effective_to, annual_ctc, monthly_gross, currency |
| staff_documents | Documents | id, tenant_id, staff_id, document_type_id, file_id, document_number, expiry_date |
| staff_emergency_contacts | Emergency contacts | id, tenant_id, staff_id, name, relation, mobile, email, address |
| staff_assets | Assigned assets | id, tenant_id, staff_id, asset_name, asset_code, issued_at, returned_at, status |
| staff_certifications | Certifications | id, tenant_id, staff_id, name, provider, issued_on, expires_on, file_id |
| staff_appraisals | Reviews | id, tenant_id, staff_id, review_period, rating, reviewed_by, reviewed_at |
| staff_training | Training | id, tenant_id, staff_id, training_name, provider, started_on, completed_on, status |
| shifts | Shift master | id, tenant_id, name, start_time, end_time, break_minutes, status |
| staff_shift_assignments | Shift mapping | id, tenant_id, staff_id, shift_id, effective_from, effective_to |
| attendance_records | Attendance | id, tenant_id, staff_id, attendance_date, check_in_at, check_out_at, total_minutes, status_id |
| leave_types | Leave master | id, tenant_id, name, code, paid, carry_forward, status |
| leave_requests | Leave workflow | id, tenant_id, staff_id, leave_type_id, start_date, end_date, total_days, reason, status_id, approved_by, approved_at |
| leave_balances | Leave balances | id, tenant_id, staff_id, leave_type_id, year, opening_balance, accrued, used, remaining |

Indexes: `UNIQUE(tenant_id, employee_code)`, `UNIQUE(tenant_id, code)` on teams, `UNIQUE(tenant_id, team_id, user_id, effective_from)` on team memberships, `UNIQUE(tenant_id, team_id, group, key)` on team settings, `INDEX(tenant_id, department_id, employment_status)`, `INDEX(tenant_id, primary_team_id)`. Use `tenant_lookups.group = team_type` for team types such as sales, support, development, operations, finance, HR, management, branch, project, and custom.

## 8. Projects, Tasks, To-Do, Issues

| Table | Purpose | Key Columns |
| --- | --- | --- |
| projects | Project master | id, uuid, tenant_id, project_number, name, description, client_party_id, project_manager_id, category_id, type_id, status_id, priority_id, start_date, due_date, completed_at, budget_amount, billing_type, progress, created_by, updated_by, timestamps, deleted_at |
| project_members | Members | id, tenant_id, project_id, user_id, team_id NULL, role_id, billing_rate, allocation_percent, joined_at, left_at |
| project_phases | Phases | id, tenant_id, project_id, name, start_date, due_date, status_id, sort_order |
| project_milestones | Milestones | id, tenant_id, project_id, phase_id, name, due_date, completed_at, status_id |
| project_time_logs | Project time | id, tenant_id, project_id, task_id, user_id, started_at, ended_at, minutes, billable |
| project_expenses | Project expenses | id, tenant_id, project_id, vendor_party_id, amount, currency, expense_date, status_id |
| tasks | Work and to-do tasks | id, uuid, tenant_id, task_number, parent_task_id, project_id, related_type, related_id, title, description, status_id, priority_id, category_id, assigned_to, assigned_team_id NULL, assigned_by, start_at, due_at, completed_at, estimated_minutes, actual_minutes, progress, is_recurring, recurrence_rule JSON, created_by, updated_by, timestamps, deleted_at |
| task_checklists | Checklist groups | id, tenant_id, task_id, title, sort_order |
| task_checklist_items | Checklist items | id, tenant_id, checklist_id, title, is_completed, completed_by, completed_at, sort_order |
| task_comments | Comments | id, tenant_id, task_id, parent_id, user_id, comment, created_at |
| task_dependencies | Dependencies | id, tenant_id, task_id, depends_on_task_id, dependency_type |
| task_watchers | Watchers | tenant_id, task_id, user_id |
| task_assignments | Assignment history | id, tenant_id, task_id, assigned_to NULL, assigned_team_id NULL, assigned_by, assigned_at, remarks |
| task_time_logs | Task time | id, tenant_id, task_id, user_id, started_at, ended_at, minutes, notes |
| todo_lists | Personal/shared lists | id, uuid, tenant_id, name, description, owner_user_id, team_id NULL, visibility, color, icon, is_default, status, timestamps, deleted_at |
| client_issues | Client support issues | id, uuid, tenant_id, issue_number, client_party_id, contact_id, project_id, title, description, type_id, category_id, status_id, priority_id, assigned_to, assigned_team_id NULL, due_at, resolved_at, closed_at, created_by, updated_by, timestamps, deleted_at |

Indexes: `UNIQUE(tenant_id, project_number)`, `UNIQUE(tenant_id, task_number)`, `UNIQUE(tenant_id, issue_number)`, `INDEX(tenant_id, assigned_to, due_at)`, `INDEX(tenant_id, assigned_team_id, due_at)`, `INDEX(tenant_id, related_type, related_id)`.

Use `related_type` and `related_id` instead of many nullable relation columns.

## 9. Renewals

| Table | Purpose | Key Columns |
| --- | --- | --- |
| renewals | Client/vendor/license renewal master | id, uuid, tenant_id, renewal_number, party_id, renewal_type, title, description, start_date, end_date, renewal_date, amount, currency, reminder_days_before, auto_renew, status_id, owner_user_id, created_by, updated_by, timestamps, deleted_at |
| renewal_items | Line items | id, tenant_id, renewal_id, name, quantity, unit_price, amount |
| renewal_history | History | id, tenant_id, renewal_id, old_end_date, new_end_date, status_id, remarks, created_by, created_at |
| renewal_reminders | Reminder schedule | id, tenant_id, renewal_id, remind_at, channel, sent_at, status |

Index: `UNIQUE(tenant_id, renewal_number)`.

## 10. Calendar and Reminders

| Table | Purpose | Key Columns |
| --- | --- | --- |
| calendars | Calendar master | id, uuid, tenant_id, owner_user_id NULL, team_id NULL, name, calendar_type, color, timezone, visibility, status, timestamps |
| calendar_events | Events/appointments | id, uuid, tenant_id, calendar_id, related_type, related_id, title, description, location, starts_at, ends_at, timezone, all_day, recurrence_rule JSON, status, created_by, updated_by, timestamps, deleted_at |
| calendar_event_attendees | Attendees | id, tenant_id, event_id, attendee_type, user_id NULL, team_id NULL, contact_id NULL, email NULL, response_status |
| calendar_event_reminders | Event reminders | id, tenant_id, event_id, channel, remind_at, sent_at, status |
| meeting_rooms | Meeting rooms | id, tenant_id, name, office_id, location, capacity, status |
| meeting_room_bookings | Room bookings | id, tenant_id, room_id, event_id, booked_by, status |
| video_meetings | Online meetings | id, tenant_id, event_id, provider, meeting_id, meeting_url, passcode |
| calendar_sync_logs | Provider sync | id, tenant_id, calendar_id, provider, external_event_id, sync_status, synced_at |
| reminders | Generic reminders | id, uuid, tenant_id, remindable_type, remindable_id, user_id, channel, remind_at, sent_at, status, metadata JSON, timestamps |

## 11. Tenant Finance

| Table | Purpose | Key Columns |
| --- | --- | --- |
| tenant_invoices | Client invoices | id, uuid, tenant_id, invoice_number, client_party_id, project_id, invoice_date, due_date, subtotal, discount_amount, taxable_amount, tax_amount, total_amount, paid_amount, balance_amount, currency, status, pdf_file_id, created_by, updated_by, timestamps, deleted_at |
| tenant_invoice_items | Invoice lines | id, tenant_id, invoice_id, item_name, description, quantity, unit_price, tax_rate, amount |
| tenant_payments | Client payments | id, uuid, tenant_id, invoice_id, client_party_id, payment_number, amount, currency, method, reference, status, paid_at |
| tenant_expenses | Expenses | id, uuid, tenant_id, vendor_party_id, project_id, expense_number, category_id, amount, currency, expense_date, status_id |
| tenant_expense_items | Expense lines | id, tenant_id, expense_id, description, quantity, unit_price, tax_amount, amount |
| bank_accounts | Bank accounts | id, tenant_id, owner_type, owner_id, bank_name, account_number_encrypted, ifsc_code, is_primary |

Indexes: `UNIQUE(tenant_id, invoice_number)`, `UNIQUE(tenant_id, payment_number)`, `UNIQUE(tenant_id, expense_number)`.

## 12. Payroll

| Table | Purpose | Key Columns |
| --- | --- | --- |
| payroll_cycles | Monthly payroll periods | id, uuid, tenant_id, cycle_name, payroll_month, payroll_year, period_start, period_end, payment_date, status, processed_by, approved_by, processed_at, approved_at, remarks, timestamps |
| payrolls | One staff payroll result | id, uuid, tenant_id, payroll_cycle_id, staff_id, employee_code, working_days, present_days, leave_days, unpaid_leave_days, overtime_hours, gross_salary, total_earnings, total_deductions, taxable_income, tax_amount, net_salary, payment_status, payment_reference, remarks, timestamps |
| payroll_component_types | Component groups | id, tenant_id, name, code, calculation_side, status |
| payroll_components | Salary components | id, tenant_id, component_type_id, name, code, calculation_method, default_value, formula, taxable, affects_pf, affects_esi, status |
| payroll_component_assignments | Staff components | id, tenant_id, staff_id, component_id, amount, effective_from, effective_to |
| payroll_items | Payroll lines | id, tenant_id, payroll_id, component_id, amount, calculation_type, remarks |
| payroll_overtime | Overtime payouts | id, tenant_id, payroll_id, attendance_record_id, overtime_hours, hourly_rate, amount, approved_by |
| payroll_loans | Staff loans | id, tenant_id, staff_id, loan_number, principal_amount, interest_rate, installment_amount, total_installments, remaining_amount, issued_date, status |
| payroll_loan_installments | Loan deductions | id, tenant_id, loan_id, payroll_id, installment_no, amount, paid_at |
| payroll_reimbursements | Reimbursements | id, tenant_id, payroll_id, staff_id, expense_id, amount, approval_status |
| payroll_tax_slabs | Tax rules | id, tenant_id, name, min_amount, max_amount, tax_percentage, cess_percentage, effective_from, effective_to |
| payroll_tax_deductions | Tax applied | id, tenant_id, payroll_id, tax_slab_id, taxable_income, tax_amount |
| payroll_pf_settings | PF settings | id, tenant_id, employee_rate, employer_rate, wage_limit, effective_from |
| payroll_esi_settings | ESI settings | id, tenant_id, employee_rate, employer_rate, wage_limit, effective_from |
| payroll_bank_transfers | Salary transfer | id, tenant_id, payroll_id, bank_account_id, reference, amount, transfer_date, status |
| payroll_payslips | Payslips | id, tenant_id, payroll_id, payslip_number, file_id, generated_at, emailed_at |
| payroll_approvals | Approval workflow | id, tenant_id, payroll_id, approval_level, approved_by, status, remarks, approved_at |

Indexes: `UNIQUE(tenant_id, payroll_month, payroll_year)`, `UNIQUE(tenant_id, payroll_cycle_id, staff_id)`, `UNIQUE(tenant_id, loan_number)`.

## 13. Holidays

| Table | Purpose | Key Columns |
| --- | --- | --- |
| holiday_calendars | Multiple calendars per tenant | id, uuid, tenant_id, name, description, country_id, state_id, is_default, status, created_by, updated_by, timestamps |
| holidays | Holiday records | id, uuid, tenant_id, holiday_calendar_id, name, type_id, category_id, holiday_date, start_date, end_date, total_days, is_half_day, half_day_session, recurring_yearly, optional_holiday, applicable_to_all, description, color, created_by, updated_by, timestamps, deleted_at |
| holiday_applicabilities | Scope rules | id, tenant_id, holiday_id, applicable_type ENUM(country,state,city,office,department,team,staff,group), applicable_id, created_at |
| holiday_groups | Staff groups | id, uuid, tenant_id, name, description, status, timestamps |
| holiday_group_members | Group members | id, tenant_id, holiday_group_id, staff_id, assigned_at |

Use `holiday_applicabilities` instead of separate `holiday_locations`, `holiday_departments`, and `holiday_branches`.

## 14. Notifications and Communication

| Table | Purpose | Key Columns |
| --- | --- | --- |
| notifications | Laravel notification storage | id UUID PK, tenant_id NULL, notifiable_type, notifiable_id, type, data JSON, read_at, timestamps |
| communication_logs | Email/SMS/WhatsApp/call logs | id, uuid, tenant_id NULL, user_id NULL, party_id NULL, channel, direction, subject, body, provider, provider_message_id, status, sent_at, delivered_at, failed_reason, metadata JSON, created_at |

## Migration Order

1. Master data: countries, states, cities, business types, industries.
2. Platform auth and platform RBAC.
3. Tenants and tenant offices.
4. Tenant users and tenant RBAC.
5. Shared primitives: files, lookups, attachments, notes, tags, custom fields, activity logs.
6. Settings and preferences.
7. Plans, subscriptions, platform invoices, payments, coupons.
8. Parties, contacts, addresses, client/vendor/lead profiles.
9. Staff, departments, full team structure, attendance, leave.
10. Projects, tasks, issues, renewals, calendar, reminders.
11. Tenant invoices, payments, expenses, bank accounts.
12. Payroll.
13. Holidays.
14. Monitoring, security, integrations, notifications, communication logs.

## Main Corrections

1. Removed `tenant_owner_details`; owner auth now belongs in `users`.
2. Added tenant-scoped uniqueness and indexes everywhere tenant data can collide.
3. Added tenant scope to RBAC model pivots.
4. Replaced duplicated client/vendor/lead identity tables with `parties`, `party_contacts`, and `party_addresses`.
5. Replaced repeated status/category/priority/stage/type tables with `tenant_lookups`.
6. Replaced repeated module attachments, notes, tags, custom fields, and activity logs with shared polymorphic tables.
7. Separated SaaS platform billing from tenant customer invoicing.
8. Replaced many nullable relationship columns with `related_type` and `related_id`.
9. Consolidated client and vendor renewals into one `renewals` module.
10. Consolidated holiday targeting into `holiday_applicabilities`.
11. Added encrypted storage guidance for integrations and bank data.
12. Added full team structure and updated staff, projects, tasks, calendars, and holidays to support team ownership/assignment.
13. Added a practical migration order for implementation.
