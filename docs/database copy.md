Multi Tenant SaaS Application Database Design


=================================== Phase 1 ====================================== 

Platform RBAC: Only for SaaS Admins. Tenants will have their own RBAC system.

platform_users

platform_roles

platform_permissions

platform_role_has_permissions

platform_model_has_roles

platform_model_has_permissions


Tenant RBAC: 

users

roles

permissions

role_has_permissions

model_has_roles

model_has_permissions


---------------------------------------------------------------------------

Platform RBAC (SaaS Owner): These tables are only used by your SaaS staff.

1. platform_users:

| Column             | Type                            | Nullable | Description       |
| ------------------ | ------------------------------- | -------- | ----------------- |
| id                 | BIGINT PK                       | ❌        | Primary Key       |
| uuid               | UUID                            | ❌        | Public Identifier |
| employee_code      | VARCHAR(50) UNIQUE              | ✅        | EMP0001           |
| first_name         | VARCHAR(100)                    | ❌        |                   |
| last_name          | VARCHAR(100)                    | ✅        |                   |
| full_name          | VARCHAR(200)                    | ❌        |                   |
| email              | VARCHAR(150) UNIQUE             | ❌        |                   |
| mobile             | VARCHAR(20)                     | ✅        |                   |
| password           | VARCHAR(255)                    | ❌        |                   |
| profile_photo      | VARCHAR(255)                    | ✅        |                   |
| designation        | VARCHAR(100)                    | ✅        |                   |
| department         | VARCHAR(100)                    | ✅        |                   |
| timezone           | VARCHAR(100)                    | ✅        |                   |
| language           | VARCHAR(50)                     | ✅        |                   |
| last_login_at      | DATETIME                        | ✅        |                   |
| last_login_ip      | VARCHAR(45)                     | ✅        |                   |
| email_verified_at  | DATETIME                        | ✅        |                   |
| two_factor_enabled | BOOLEAN                         | ❌        |                   |
| status             | ENUM(active,inactive,suspended) | ❌        |                   |
| created_by         | BIGINT FK                       | ✅        | Self Reference    |
| updated_by         | BIGINT FK                       | ✅        |                   |
| remember_token     | VARCHAR(100)                    | ✅        |                   |
| created_at         | TIMESTAMP                       | ❌        |                   |
| updated_at         | TIMESTAMP                       | ❌        |                   |
| deleted_at         | TIMESTAMP                       | ✅        | Soft Delete       |


2. platform_roles: 
| Column       | Type                  |
| ------------ | --------------------- |
| id           | BIGINT PK             |
| uuid         | UUID                  |
| name         | VARCHAR(100)          |
| display_name | VARCHAR(150)          |
| description  | TEXT                  |
| guard_name   | VARCHAR(50)           |
| is_system    | BOOLEAN               |
| status       | ENUM(active,inactive) |
| created_by   | BIGINT FK             |
| updated_by   | BIGINT FK             |
| created_at   | TIMESTAMP             |
| updated_at   | TIMESTAMP             |


Example:

Super Admin
Billing Manager
Support Manager
Developer
Finance
Operations


3. platform_permissions:

| Column       | Type         |
| ------------ | ------------ |
| id           | BIGINT PK    |
| uuid         | UUID         |
| module       | VARCHAR(100) |
| name         | VARCHAR(150) |
| display_name | VARCHAR(150) |
| description  | TEXT         |
| guard_name   | VARCHAR(50)  |
| is_system    | BOOLEAN      |
| created_at   | TIMESTAMP    |
| updated_at   | TIMESTAMP    |


Example:

tenant.view
tenant.create
tenant.edit
tenant.delete

subscription.manage

coupon.manage

billing.refund

support.assign

settings.manage


4. platform_role_has_permissions:
| Column        | Type      |
| ------------- | --------- |
| permission_id | BIGINT FK |
| role_id       | BIGINT FK |


Primary Key:
permission_id
role_id

5. platform_model_has_roles: 

| Column     | Type         |
| ---------- | ------------ |
| role_id    | BIGINT FK    |
| model_type | VARCHAR(255) |
| model_id   | BIGINT       |

Primary Key:
role_id
model_id
model_type


6. platform_model_has_permissions:
| Column        | Type         |
| ------------- | ------------ |
| permission_id | BIGINT FK    |
| model_type    | VARCHAR(255) |
| model_id      | BIGINT       |

Primary Key:

permission_id
model_id
model_type


--------------------------------------------------------------------------------------------------

Tenant RBAC: These tables are used by every tenant independently.

1. users:

| Column             | Type                            | Nullable | Description       |
| ------------------ | ------------------------------- | -------- | ----------------- |
| id                 | BIGINT PK                       | ❌        | Primary Key       |
| uuid               | UUID                            | ❌        | Public Identifier |
| tenant_id          | BIGINT FK                       | ❌        | Tenant            |
| staff_id           | BIGINT FK                       | ✅        | Linked Staff      |
| client_id          | BIGINT FK                       | ✅        | Linked Client     |
| team_id            | BIGINT FK                       | ✅        | Default Team      |
| employee_code      | VARCHAR(50)                     | ✅        |                   |
| first_name         | VARCHAR(100)                    | ❌        |                   |
| last_name          | VARCHAR(100)                    | ✅        |                   |
| full_name          | VARCHAR(200)                    | ❌        |                   |
| email              | VARCHAR(150)                    | ❌        |                   |
| mobile             | VARCHAR(20)                     | ✅        |                   |
| password           | VARCHAR(255)                    | ❌        |                   |
| profile_photo      | VARCHAR(255)                    | ✅        |                   |
| timezone           | VARCHAR(100)                    | ✅        |                   |
| language           | VARCHAR(50)                     | ✅        |                   |
| last_login_at      | DATETIME                        | ✅        |                   |
| last_login_ip      | VARCHAR(45)                     | ✅        |                   |
| email_verified_at  | DATETIME                        | ✅        |                   |
| two_factor_enabled | BOOLEAN                         | ❌        |                   |
| account_type       | ENUM(owner,staff,client)        | ❌        |                   |
| status             | ENUM(active,inactive,suspended) | ❌        |                   |
| created_by         | BIGINT FK                       | ✅        |                   |
| updated_by         | BIGINT FK                       | ✅        |                   |
| remember_token     | VARCHAR(100)                    | ✅        |                   |
| created_at         | TIMESTAMP                       | ❌        |                   |
| updated_at         | TIMESTAMP                       | ❌        |                   |
| deleted_at         | TIMESTAMP                       | ✅        | Soft Delete       |


2. roles:

| Column       | Type                  |
| ------------ | --------------------- |
| id           | BIGINT PK             |
| uuid         | UUID                  |
| tenant_id    | BIGINT FK             |
| name         | VARCHAR(100)          |
| display_name | VARCHAR(150)          |
| description  | TEXT                  |
| guard_name   | VARCHAR(50)           |
| is_system    | BOOLEAN               |
| status       | ENUM(active,inactive) |
| created_by   | BIGINT FK             |
| updated_by   | BIGINT FK             |
| created_at   | TIMESTAMP             |
| updated_at   | TIMESTAMP             |


Unique Index:
tenant_id
name
guard_name


3. permissions: Permissions remain global and reusable across all tenants.

| Column       | Type                |
| ------------ | ------------------- |
| id           | BIGINT PK           |
| uuid         | UUID                |
| module       | VARCHAR(100)        |
| name         | VARCHAR(150) UNIQUE |
| display_name | VARCHAR(150)        |
| description  | TEXT                |
| guard_name   | VARCHAR(50)         |
| created_at   | TIMESTAMP           |
| updated_at   | TIMESTAMP           |

Example

project.create
project.edit
project.delete

client.create

lead.convert

invoice.generate

task.assign

salary.view

4. role_has_permissions:

| Column        | Type      |
| ------------- | --------- |
| permission_id | BIGINT FK |
| role_id       | BIGINT FK |


Primary Key:

permission_id
role_id

5. model_has_roles:

| Column     | Type         |
| ---------- | ------------ |
| role_id    | BIGINT FK    |
| model_type | VARCHAR(255) |
| model_id   | BIGINT       |


Primary Key:
role_id
model_id
model_type

6. model_has_permissions:
| Column        | Type         |
| ------------- | ------------ |
| permission_id | BIGINT FK    |
| model_type    | VARCHAR(255) |
| model_id      | BIGINT       |

Primary Key:
permission_id
model_id
model_type







=================================== Phase 2 ====================================== 


1. tenants

Purpose: Store only organization/company information.


| Column              | Type                                                                  | Description |
| ------------------- | --------------------------------------------------------------------- | ----------- |
| id                  | BIGINT                                                                |             |
| uuid                | UUID                                                                  |             |
| organization_name   | VARCHAR(200)                                                          |             |
| legal_name          | VARCHAR(200)                                                          |             |
| display_name        | VARCHAR(200)                                                          |             |
| organization_code   | VARCHAR(50)                                                           |             |
| slug                | VARCHAR(150) UNIQUE                                                   |             |
| business_type_id    | FK                                                                    |             |
| industry_id         | FK                                                                    |             |
| company_size        | ENUM                                                                  |             |
| gst_number          | VARCHAR(30)                                                           |             |
| pan_number          | VARCHAR(30)                                                           |             |
| registration_number | VARCHAR(80)                                                           |             |
| website             | VARCHAR(255)                                                          |             |
| description         | TEXT                                                                  |             |
| logo                | VARCHAR(255)                                                          |             |
| favicon             | VARCHAR(255)                                                          |             |
| subscription_id     | FK                                                                    |             |
| status              | ENUM(Pending, Trial, Active, Suspended, Expired, Cancelled, Archived) |             |
| onboarded_at        | DATETIME                                                              |             |
| created_at          | TIMESTAMP                                                             |             |
| updated_at          | TIMESTAMP                                                             |             |
| deleted_at          | TIMESTAMP                                                             |             |




2. tenant_owner_details

One tenant has only one primary owner.


| Column             | Type   |
| ------------------ | ------ |
| id                 | BIGINT |
| tenant_id          | FK     |
| first_name         |        |
| last_name          |        |
| display_name       |        |
| email              |        |
| mobile             |        |
| alternate_mobile   |        |
| designation        |        |
| profile_photo      |        |
| password           |        |
| two_factor_enabled |        |
| email_verified_at  |        |
| mobile_verified_at |        |
| last_login         |        |
| status             |        |
| created_at         |        |
| updated_at         |        |



3. tenant_offices

Instead of a single address table, make it support Head Office, Branch, Warehouse, etc.
One tenant → Many offices.


| Column         | Type   |
| -------------- | ------ |
| id             | BIGINT |
| tenant_id      | FK     |
| office_name    |        |
| office_code    |        |
| office_type    |        |
| is_head_office |        |
| is_default     |        |
| address_line_1 |        |
| address_line_2 |        |
| landmark       |        |
| country_id     |        |
| state_id       |        |
| city_id        |        |
| zip_code       |        |
| latitude       |        |
| longitude      |        |
| contact_person |        |
| contact_email  |        |
| contact_phone  |        |
| working_hours  |        |
| timezone       |        |
| status         |        |
| created_at     |        |
| updated_at     |        |




office_type:
Head Office
Branch Office
Regional Office
Warehouse
Factory
Store
Remote Office
Franchise




Future Scalability

This design lets you add features later without schema changes, such as:

Office-wise staff assignment
Office-wise projects
Office-wise attendance
Office-wise inventory
Office-wise GST numbers
Office-wise billing
Office-wise clients
Office-wise reporting
Office-wise holidays
Office-wise working hours



Plan (Master Data)

A plan defines what is available for purchase.

plans

plans
------
id
name
code
description
price
billing_cycle
trial_days
is_custom
status
created_at
updated_at



features
---------
id
name
code
data_type



plan_features
--------------
id
plan_id
feature_id
value


subscriptions
--------------

| Column              | Type                | Nullable | Description                          |
| ------------------- | ------------------- | -------- | ------------------------------------ |
| id                  | BIGINT              | ❌        | Primary Key                          |
| uuid                | UUID                | ❌        | Public Identifier                    |
| subscription_number | VARCHAR(100) UNIQUE | ❌        | SUB-2026-000001                      |
| tenant_id           | BIGINT FK           | ❌        | Tenant                               |
| plan_id             | BIGINT FK           | ❌        | Current Active Plan                  |
| current_version     | INT                 | ❌        | Current Subscription Version         |
| subscription_type   | ENUM                | ❌        | trial, paid, complimentary           |
| billing_cycle       | ENUM                | ❌        | monthly, quarterly, yearly, lifetime |
| subscription_status | ENUM                | ❌        | See below                            |
| renewal_type        | ENUM                | ❌        | automatic, manual                    |
| starts_at           | DATETIME            | ❌        | Subscription Start                   |
| expires_at          | DATETIME            | ❌        | Subscription Expiry                  |
| next_billing_at     | DATETIME            | ✅        | Next Billing Date                    |
| trial_starts_at     | DATETIME            | ✅        | Trial Start                          |
| trial_ends_at       | DATETIME            | ✅        | Trial End                            |
| cancelled_at        | DATETIME            | ✅        | Cancellation Date                    |
| cancellation_reason | TEXT                | ✅        | Reason                               |
| paused_at           | DATETIME            | ✅        | Pause Date                           |
| resumed_at          | DATETIME            | ✅        | Resume Date                          |
| current_price       | DECIMAL(12,2)       | ❌        | Base Plan Price                      |
| addon_total         | DECIMAL(12,2)       | ❌        | Active Add-on Total                  |
| discount_total      | DECIMAL(12,2)       | ❌        | Active Discounts                     |
| taxable_amount      | DECIMAL(12,2)       | ❌        | Taxable Amount                       |
| tax_total           | DECIMAL(12,2)       | ❌        | Tax Amount                           |
| payable_amount      | DECIMAL(12,2)       | ❌        | Current Payable                      |
| currency            | CHAR(3)             | ❌        | Currency                             |
| auto_renew          | BOOLEAN             | ❌        | Auto Renewal Enabled                 |
| last_renewed_at     | DATETIME            | ✅        | Last Successful Renewal              |
| last_invoice_id     | BIGINT FK           | ✅        | Latest Invoice                       |
| last_payment_id     | BIGINT FK           | ✅        | Latest Payment                       |
| notes               | TEXT                | ✅        | Internal Notes                       |
| status              | ENUM                | ❌        | active, inactive                     |
| created_by          | BIGINT FK           | ❌        | Created By                           |
| updated_by          | BIGINT FK           | ✅        | Updated By                           |
| created_at          | TIMESTAMP           | ❌        |                                      |
| updated_at          | TIMESTAMP           | ❌        |                                      |
| deleted_at          | TIMESTAMP           | ✅        | Soft Delete                          |



subscription_status: 

trial
active
paused
expired
cancelled
suspended
pending_payment
grace_period

renewal_type: 

automatic
manual

subscription_type: 
trial
paid
complimentary




Plan
 │
 │
 ├───────────────┐
 │               │
 │               │
Subscription     Subscription
 │               │
Tenant A         Tenant B




Recommended Enterprise Structure:

plans                     (Master Catalog)
features                  (Master Features)
plan_features             (Feature limits per plan)
subscriptions             (Tenant's active contract)

subscription_history      (Plan changes & renewals)
subscription_invoices     (Billing records)
subscription_payments     (Payment transactions)
subscription_usage        (Track usage against limits)
subscription_addons       (Extra storage, users, API quota, etc.)
subscription_discounts    (Applied coupons or negotiated discounts)


1. subscription_history

Purpose: Maintain a complete audit trail of all subscription lifecycle events (renewals, upgrades, downgrades, pauses, cancellations, etc.).

| Column           | Type          | Description                                                                 |
| ---------------- | ------------- | --------------------------------------------------------------------------- |
| id               | BIGINT        | Primary Key                                                                 |
| subscription_id  | BIGINT FK     | Subscription                                                                |
| version          | INT           | Version Number                                                              |
| previous_version | INT           | Previous Version                                                            |
| action_type      | ENUM          | created, renewed, upgraded, downgraded, paused, resumed, cancelled, expired |
| previous_plan_id | BIGINT FK     | Previous Plan                                                               |
| new_plan_id      | BIGINT FK     | New Plan                                                                    |
| previous_amount  | DECIMAL(12,2) | Previous Amount                                                             |
| new_amount       | DECIMAL(12,2) | New Amount                                                                  |
| previous_expiry  | DATETIME      | Old Expiry                                                                  |
| new_expiry       | DATETIME      | New Expiry                                                                  |
| changed_by       | BIGINT FK     | User Who Changed                                                            |
| reason           | TEXT          | Reason                                                                      |
| created_at       | TIMESTAMP     | Timestamp                                                                   |



action_type:
created
renewed
upgraded
downgraded
extended
paused
resumed
cancelled
expired
reactivated


2. subscription_invoices

Purpose: Billing records generated for subscriptions.

| Column               | Type                 |
| -------------------- | -------------------- |
| id                   | BIGINT               |
| subscription_id      | FK                   |
| tenant_id            | FK                   |
| invoice_id           | FK (billing invoice) |
| invoice_number       | VARCHAR(100)         |
| billing_period_start | DATE                 |
| billing_period_end   | DATE                 |
| subtotal             | DECIMAL(12,2)        |
| discount_amount      | DECIMAL(12,2)        |
| tax_amount           | DECIMAL(12,2)        |
| total_amount         | DECIMAL(12,2)        |
| due_date             | DATE                 |
| paid_date            | DATE                 |
| invoice_status       | ENUM                 |
| created_at           | TIMESTAMP            |


invoice_status:
draft
pending
paid
partially_paid
overdue
cancelled
refunded

3. subscription_payments

Purpose: Store payment transactions.

| Column                  | Type          |
| ----------------------- | ------------- |
| id                      | BIGINT        |
| subscription_invoice_id | FK            |
| subscription_id         | FK            |
| tenant_id               | FK            |
| payment_gateway         | ENUM          |
| gateway_transaction_id  | VARCHAR(255)  |
| payment_reference       | VARCHAR(255)  |
| payment_method          | ENUM          |
| currency                | CHAR(3)       |
| amount                  | DECIMAL(12,2) |
| gateway_fee             | DECIMAL(12,2) |
| tax_amount              | DECIMAL(12,2) |
| net_amount              | DECIMAL(12,2) |
| payment_status          | ENUM          |
| payment_date            | DATETIME      |
| gateway_response        | JSON          |
| remarks                 | TEXT          |
| created_at              | TIMESTAMP     |

payment_gateway:
Stripe
Razorpay
PayPal
PayU
Bank Transfer
Cash


payment_method:
Credit Card
Debit Card
UPI
Net Banking
Wallet
Bank Transfer
Cash

payment_status:
pending
processing
success
failed
cancelled
refunded
partially_refunded


4. subscription_usage

Purpose: Track actual usage against plan limits.

| Column          | Type                          |
| --------------- | ----------------------------- |
| id              | BIGINT                        |
| subscription_id | FK                            |
| tenant_id       | FK                            |
| feature_id      | FK                            |
| feature_name    | VARCHAR(100)                  |
| allocated_limit | BIGINT                        |
| used_limit      | BIGINT                        |
| remaining_limit | BIGINT                        |
| exceeded_limit  | BOOLEAN                       |
| reset_period    | ENUM(monthly,yearly,lifetime) |
| last_reset_at   | DATETIME                      |
| updated_at      | TIMESTAMP                     |



5. addon_master

Purpose: Master catalog of all add-ons available for purchase. Instead of storing free-text add-on names in subscription_addons, reference this table.

| Column           | Type               | Nullable | Description                          |
| ---------------- | ------------------ | -------- | ------------------------------------ |
| id               | BIGINT             | ❌        | Primary Key                          |
| uuid             | UUID               | ❌        | Public Identifier                    |
| code             | VARCHAR(50) UNIQUE | ❌        | Add-on Code (EXTRA_STORAGE_100GB)    |
| name             | VARCHAR(150)       | ❌        | Add-on Name                          |
| description      | TEXT               | ✅        | Description                          |
| category         | ENUM               | ❌        | See Below                            |
| pricing_type     | ENUM               | ❌        | See Below                            |
| billing_cycle    | ENUM               | ❌        | monthly, quarterly, yearly, one_time |
| default_quantity | INT                | ❌        | Default Quantity                     |
| minimum_quantity | INT                | ❌        | Minimum Purchase Quantity            |
| maximum_quantity | INT                | ✅        | Maximum Allowed                      |
| unit             | VARCHAR(50)        | ❌        | GB, Users, Credits, Projects         |
| price            | DECIMAL(12,2)      | ❌        | Price Per Unit                       |
| currency         | CHAR(3)            | ❌        | Currency                             |
| taxable          | BOOLEAN            | ❌        | Tax Applicable                       |
| tax_percentage   | DECIMAL(5,2)       | ✅        | Default Tax                          |
| is_feature_limit | BOOLEAN            | ❌        | Counts toward feature usage          |
| feature_id       | BIGINT FK          | ✅        | Related Feature                      |
| display_order    | INT                | ❌        | UI Sorting                           |
| status           | ENUM               | ❌        | draft, active, inactive, archived    |
| created_by       | BIGINT FK          | ❌        | Platform User                        |
| created_at       | TIMESTAMP          | ❌        |                                      |
| updated_at       | TIMESTAMP          | ❌        |                                      |
| deleted_at       | TIMESTAMP          | ✅        | Soft Delete                          |


category: 
storage
users
projects
clients
api
ai
communication
branding
security
reports
integration
custom

pricing_type: 
fixed
per_unit
tiered
custom




6. subscription_addons

Purpose: Store purchased add-ons beyond the base plan.

| Column          | Type      |
| --------------- | --------- |
| id              | BIGINT    |
| subscription_id | FK        |
| tenant_id       | FK        |
| addon_master_id | FK        |
| quantity        | INT       |
| unit_price      | DECIMAL   |
| total_price     | DECIMAL   |
| billing_cycle   | ENUM      |
| starts_at       | DATE      |
| expires_at      | DATE      |
| auto_renew      | BOOLEAN   |
| status          | ENUM      |
| created_at      | TIMESTAMP |



addon_type:
Storage
Additional Users
Additional Clients
Projects
API Calls
AI Credits
WhatsApp Messages
SMS Credits
Email Credits
Custom Domain
White Label

status: 
active
expired
cancelled
pending


7. subscription_discounts

Purpose: Record discounts applied to a subscription.

| Column              | Type          |
| ------------------- | ------------- |
| id                  | BIGINT        |
| subscription_id     | FK            |
| tenant_id           | FK            |
| coupon_id           | FK            |
| discount_type       | ENUM          |
| discount_value      | DECIMAL(12,2) |
| calculated_discount | DECIMAL(12,2) |
| applied_on          | ENUM          |
| applied_by          | BIGINT FK     |
| starts_at           | DATE          |
| expires_at          | DATE          |
| remarks             | TEXT          |
| created_at          | TIMESTAMP     |


discount_type: 
percentage
fixed
manual

applied_on: 
subscription
renewal
upgrade
downgrade
addon


7. subscription_renewals
Purpose: Stores every renewal event, including successful, pending, failed, automatic, and manual renewals.

This table acts as the renewal history and scheduler.

Table: subscription_renewals

| Column              | Type          | Nullable | Description       |
| ------------------- | ------------- | -------- | ----------------- |
| id                  | BIGINT        | ❌        | Primary Key       |
| subscription_id     | BIGINT FK     | ❌        | Subscription      |
| tenant_id           | BIGINT FK     | ❌        | Tenant            |
| renewal_number      | VARCHAR(50)   | ❌        | REN-2026-0001     |
| renewal_type        | ENUM          | ❌        | automatic, manual |
| previous_start_date | DATE          | ❌        | Previous Period   |
| previous_end_date   | DATE          | ❌        | Previous Expiry   |
| new_start_date      | DATE          | ❌        | New Period        |
| new_end_date        | DATE          | ❌        | New Expiry        |
| renewal_amount      | DECIMAL(12,2) | ❌        | Before Discount   |
| discount_amount     | DECIMAL(12,2) | ❌        | Discount          |
| tax_amount          | DECIMAL(12,2) | ❌        | Tax               |
| final_amount        | DECIMAL(12,2) | ❌        | Payable Amount    |
| invoice_id          | BIGINT FK     | ✅        | Generated Invoice |
| payment_id          | BIGINT FK     | ✅        | Payment Record    |
| coupon_id           | BIGINT FK     | ✅        | Applied Coupon    |
| renewal_status      | ENUM          | ❌        | See Below         |
| reminder_sent       | BOOLEAN       | ❌        | Reminder Sent     |
| reminder_count      | INT           | ❌        | Total Reminders   |
| last_reminder_at    | DATETIME      | ✅        | Last Reminder     |
| renewed_at          | DATETIME      | ✅        | Completion Time   |
| remarks             | TEXT          | ✅        | Internal Notes    |
| processed_by        | BIGINT FK     | ✅        | Manual Renewal By |
| created_at          | TIMESTAMP     | ❌        |                   |
| updated_at          | TIMESTAMP     | ❌        |                   |



renewal_type: 
automatic
manual


renewal_status: 
scheduled
pending
processing
successful
failed
cancelled
expired


Example Lifecycle: 

Subscription Created
        │
        ▼
Renewal Scheduled
        │
        ▼
Reminder -30 Days
        │
        ▼
Reminder -15 Days
        │
        ▼
Reminder -7 Days
        │
        ▼
Reminder -1 Day
        │
        ▼
Payment Attempt
        │
   ┌────┴────┐
   ▼         ▼
Success    Failed
   │         │
   ▼         ▼
Renewed   Retry / Expired




Relationship Diagram: 

plans
   │
   ▼
subscriptions
   │
   ├──────────────┐
   │              │
   ▼              ▼
subscription_history
subscription_usage
   │
   ├──────────────┐
   ▼              ▼
subscription_addons
subscription_discounts
   │
   ▼
subscription_invoices
   │
   ▼
subscription_payments



Complete Subscription Module:

plans
│
├── features
│
├── plan_features
│
└──────────────┐
               │
subscriptions
│
├── subscription_history
├── subscription_usage
├── subscription_addons
├── subscription_discounts
├── subscription_renewals
├── subscription_invoices
└── subscription_payments
               │
               ▼
        addon_master










=================================== Phase 3 ====================================== 

1. coupons

Purpose: Stores the coupon definition.

| Column                  | Type               | Description                                           |
| ----------------------- | ------------------ | ----------------------------------------------------- |
| id                      | BIGINT PK          | Primary Key                                           |
| uuid                    | UUID               | Public Identifier                                     |
| coupon_code             | VARCHAR(50) UNIQUE | Coupon Code                                           |
| title                   | VARCHAR(200)       | Coupon Title                                          |
| description             | TEXT               | Description                                           |
| discount_type           | ENUM               | percentage, fixed                                     |
| discount_value          | DECIMAL(12,2)      | Discount Amount                                       |
| max_discount_amount     | DECIMAL(12,2)      | Max Discount (for %)                                  |
| minimum_purchase_amount | DECIMAL(12,2)      | Minimum Invoice Amount                                |
| applies_to              | ENUM               | subscription, renewal, upgrade, downgrade, addon, all |
| visibility              | ENUM               | public, private                                       |
| auto_apply              | BOOLEAN            | Auto Apply                                            |
| allow_coupon_stacking   | BOOLEAN            | Can combine with other coupons                        |
| first_purchase_only     | BOOLEAN            | Only first purchase                                   |
| trial_only              | BOOLEAN            | Trial tenants only                                    |
| max_global_usage        | INT                | Overall usage limit                                   |
| max_usage_per_tenant    | INT                | Per-tenant limit                                      |
| starts_at               | DATETIME           | Valid From                                            |
| expires_at              | DATETIME           | Expiry                                                |
| status                  | ENUM               | draft, active, inactive, expired, archived            |
| created_by              | BIGINT FK          | Platform User                                         |
| updated_by              | BIGINT FK          | Platform User                                         |
| created_at              | TIMESTAMP          |                                                       |
| updated_at              | TIMESTAMP          |                                                       |
| deleted_at              | TIMESTAMP          | Soft Delete                                           |


discount_type: 

percentage
fixed

applies_to:
subscription
renewal
upgrade
downgrade
addon
all

visibility: 
public
private

status:
draft
active
inactive
expired
archived


2. coupon_plan_assignments

Purpose: Restrict coupons to selected subscription plans.

| Column     | Type      |
| ---------- | --------- |
| id         | BIGINT PK |
| coupon_id  | BIGINT FK |
| plan_id    | BIGINT FK |
| created_at | TIMESTAMP |



3. coupon_usage

Purpose: Stores every successful coupon usage.

| Column          | Type          | Description     |
| --------------- | ------------- | --------------- |
| id              | BIGINT PK     |                 |
| coupon_id       | BIGINT FK     | Coupon          |
| tenant_id       | BIGINT FK     | Tenant          |
| subscription_id | BIGINT FK     | Subscription    |
| invoice_id      | BIGINT FK     | Invoice         |
| payment_id      | BIGINT FK     | Payment         |
| original_amount | DECIMAL(12,2) | Before Discount |
| discount_amount | DECIMAL(12,2) | Discount        |
| payable_amount  | DECIMAL(12,2) | Final Amount    |
| used_at         | DATETIME      | Usage Time      |
| created_at      | TIMESTAMP     |                 |



4. coupon_restrictions

Purpose: Flexible eligibility rules.

| Column            | Type         |
| ----------------- | ------------ |
| id                | BIGINT PK    |
| coupon_id         | BIGINT FK    |
| restriction_type  | ENUM         |
| operator          | ENUM         |
| restriction_value | VARCHAR(255) |
| created_at        | TIMESTAMP    |


restriction_type: 

plan
subscription_type
billing_cycle
country
currency
industry
business_type
tenant
email_domain
payment_gateway

operator: 
=
!=
>
<
>=
<=
IN
NOT IN



5. coupon_tenant_assignments (Optional but Recommended)

Purpose: Assign private coupons to specific tenants.

| Column      | Type                  |
| ----------- | --------------------- |
| id          | BIGINT PK             |
| coupon_id   | BIGINT FK             |
| tenant_id   | BIGINT FK             |
| assigned_by | BIGINT FK             |
| assigned_at | DATETIME              |
| expires_at  | DATETIME              |
| status      | ENUM(active,inactive) |
| created_at  | TIMESTAMP             |


Relationships: 

plans
    │
    ▼
coupon_plan_assignments
    │
    ▼
coupons
    │
    ├──────────────┐
    │              │
    ▼              ▼
coupon_usage   coupon_restrictions
    │
    ▼
subscriptions
    │
    ▼
subscription_invoices
    │
    ▼
subscription_payments

coupons
    │
    ▼
coupon_tenant_assignments
    │
    ▼
tenants





=================================== Phase 4 ====================================== 

# Monitoring Module

## 1. monitoring_services

Purpose: Register all services/components that can be monitored.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| uuid | UUID | ❌ | Public Identifier |
| service_name | VARCHAR(150) | ❌ | Service Name |
| service_code | VARCHAR(100) UNIQUE | ❌ | Unique Code |
| service_type | ENUM | ❌ | application, database, queue, cache, storage, api, mail, websocket, scheduler |
| endpoint | VARCHAR(255) | ✅ | URL/IP |
| port | INT | ✅ | Port |
| description | TEXT | ✅ | Description |
| status | ENUM(active,inactive) | ❌ | Current Status |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 2. monitoring_service_logs

Purpose: Store health checks of every monitored service.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| service_id | BIGINT FK | ❌ | Monitoring Service |
| status | ENUM | ❌ | healthy, warning, critical, offline |
| response_time_ms | INT | ✅ | Response Time |
| cpu_usage | DECIMAL(5,2) | ✅ | CPU % |
| memory_usage | DECIMAL(5,2) | ✅ | Memory % |
| disk_usage | DECIMAL(5,2) | ✅ | Disk % |
| message | TEXT | ✅ | Remarks |
| checked_at | DATETIME | ❌ | Check Time |
| created_at | TIMESTAMP | ❌ | |

---

## 3. tenant_usage

Purpose: Track tenant resource usage.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ❌ | Tenant |
| total_users | INT | ❌ | Users |
| total_clients | INT | ❌ | Clients |
| total_projects | INT | ❌ | Projects |
| total_tasks | INT | ❌ | Tasks |
| storage_used_mb | DECIMAL(12,2) | ❌ | Storage |
| api_requests | BIGINT | ❌ | API Usage |
| emails_sent | BIGINT | ❌ | Emails |
| sms_sent | BIGINT | ❌ | SMS |
| whatsapp_messages | BIGINT | ❌ | WhatsApp |
| updated_at | TIMESTAMP | ❌ | |

---

## 4. api_request_logs

Purpose: Monitor API requests.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ✅ | Tenant |
| user_id | BIGINT FK | ✅ | User |
| method | VARCHAR(10) | ❌ | GET, POST |
| endpoint | VARCHAR(255) | ❌ | API Endpoint |
| status_code | INT | ❌ | HTTP Status |
| response_time_ms | INT | ❌ | Response Time |
| ip_address | VARCHAR(45) | ✅ | Client IP |
| user_agent | TEXT | ✅ | Browser |
| requested_at | DATETIME | ❌ | Request Time |

---

## 5. queue_job_logs

Purpose: Queue and background job monitoring.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| queue_name | VARCHAR(100) | ❌ | Queue |
| job_name | VARCHAR(150) | ❌ | Job |
| tenant_id | BIGINT FK | ✅ | Tenant |
| status | ENUM | ❌ | pending, processing, completed, failed |
| attempts | INT | ❌ | Retry Count |
| started_at | DATETIME | ✅ | Started |
| finished_at | DATETIME | ✅ | Completed |
| execution_time_ms | INT | ✅ | Duration |
| error_message | TEXT | ✅ | Error |

---

## 6. scheduler_logs

Purpose: Scheduled task monitoring.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| command_name | VARCHAR(150) | ❌ | Scheduler Command |
| tenant_id | BIGINT FK | ✅ | Tenant |
| status | ENUM | ❌ | success, failed |
| started_at | DATETIME | ❌ | Start |
| finished_at | DATETIME | ❌ | Finish |
| execution_time_ms | INT | ❌ | Duration |
| error_message | TEXT | ✅ | Error |

---

## 7. storage_usage_logs

Purpose: Track tenant storage growth.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ❌ | Tenant |
| used_storage_mb | DECIMAL(12,2) | ❌ | Used |
| available_storage_mb | DECIMAL(12,2) | ❌ | Remaining |
| total_storage_mb | DECIMAL(12,2) | ❌ | Allocated |
| checked_at | DATETIME | ❌ | Check Time |

---

## 8. security_events

Purpose: Security monitoring.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ✅ | Tenant |
| user_id | BIGINT FK | ✅ | User |
| event_type | ENUM | ❌ | login_failed, account_locked, permission_denied, suspicious_activity |
| ip_address | VARCHAR(45) | ✅ | IP |
| user_agent | TEXT | ✅ | Browser |
| severity | ENUM | ❌ | low, medium, high, critical |
| description | TEXT | ✅ | Description |
| occurred_at | DATETIME | ❌ | Event Time |

---

## 9. system_incidents

Purpose: Record outages and major incidents.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| service_id | BIGINT FK | ❌ | Service |
| incident_number | VARCHAR(50) UNIQUE | ❌ | Incident ID |
| title | VARCHAR(255) | ❌ | Title |
| severity | ENUM | ❌ | low, medium, high, critical |
| status | ENUM | ❌ | open, investigating, resolved |
| started_at | DATETIME | ❌ | Start |
| resolved_at | DATETIME | ✅ | Resolved |
| root_cause | TEXT | ✅ | Root Cause |
| resolution | TEXT | ✅ | Resolution |
| created_at | TIMESTAMP | ❌ | |

---

## 10. monitoring_alerts

Purpose: Alert history.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ✅ | Tenant |
| service_id | BIGINT FK | ✅ | Service |
| incident_id | BIGINT FK | ✅ | Incident |
| alert_type | ENUM | ❌ | email, sms, whatsapp, push |
| severity | ENUM | ❌ | info, warning, critical |
| recipient | VARCHAR(255) | ❌ | Email/Mobile |
| message | TEXT | ❌ | Alert Message |
| status | ENUM | ❌ | pending, sent, failed |
| sent_at | DATETIME | ✅ | Sent Time |
| created_at | TIMESTAMP | ❌ | |
```

## Relationship Diagram

```text
monitoring_services
        │
        ▼
monitoring_service_logs
        │
        ▼
system_incidents
        │
        ▼
monitoring_alerts

tenants
   │
   ├── tenant_usage
   ├── api_request_logs
   ├── queue_job_logs
   ├── scheduler_logs
   ├── storage_usage_logs
   ├── security_events
   └── monitoring_alerts




=================================== Phase 5 ====================================== 


# Integrations Module

## 1. integration_providers

Purpose: Master list of all supported integrations.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| uuid | UUID | ❌ | Public Identifier |
| code | VARCHAR(100) UNIQUE | ❌ | Provider Code |
| name | VARCHAR(150) | ❌ | Provider Name |
| category | ENUM | ❌ | CRM, Email, SMS, Payment, Storage, Communication, Accounting, Marketing, AI, ERP, Social Media, Cloud |
| authentication_type | ENUM | ❌ | OAuth2, API Key, Basic Auth, Bearer Token, Webhook, JWT |
| api_base_url | VARCHAR(255) | ✅ | Base URL |
| documentation_url | VARCHAR(255) | ✅ | Documentation |
| icon | VARCHAR(255) | ✅ | Logo |
| description | TEXT | ✅ | Description |
| supports_webhooks | BOOLEAN | ❌ | Webhook Support |
| supports_oauth | BOOLEAN | ❌ | OAuth Support |
| supports_refresh_token | BOOLEAN | ❌ | Refresh Token Support |
| status | ENUM(active,inactive) | ❌ | Status |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 2. tenant_integrations

Purpose: Integration enabled by a tenant.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| uuid | UUID | ❌ | Public Identifier |
| tenant_id | BIGINT FK | ❌ | Tenant |
| provider_id | BIGINT FK | ❌ | Integration Provider |
| display_name | VARCHAR(150) | ❌ | Custom Name |
| authentication_type | ENUM | ❌ | OAuth2, API Key, etc. |
| status | ENUM(active,inactive,error,expired) | ❌ | Connection Status |
| connected_at | DATETIME | ✅ | Connected On |
| disconnected_at | DATETIME | ✅ | Disconnected On |
| expires_at | DATETIME | ✅ | Token Expiry |
| auto_sync | BOOLEAN | ❌ | Auto Sync Enabled |
| sync_interval | ENUM | ❌ | realtime, 5min, 15min, hourly, daily, manual |
| last_sync_at | DATETIME | ✅ | Last Sync |
| next_sync_at | DATETIME | ✅ | Next Sync |
| created_by | BIGINT FK | ❌ | User |
| updated_by | BIGINT FK | ✅ | User |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 3. integration_credentials

Purpose: Secure storage of credentials.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Tenant Integration |
| client_id | TEXT | ✅ | Encrypted |
| client_secret | TEXT | ✅ | Encrypted |
| access_token | LONGTEXT | ✅ | Encrypted |
| refresh_token | LONGTEXT | ✅ | Encrypted |
| api_key | TEXT | ✅ | Encrypted |
| api_secret | TEXT | ✅ | Encrypted |
| webhook_secret | TEXT | ✅ | Encrypted |
| token_type | VARCHAR(50) | ✅ | Bearer |
| expires_at | DATETIME | ✅ | Token Expiry |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 4. integration_webhooks

Purpose: Incoming and outgoing webhooks.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Integration |
| event_name | VARCHAR(150) | ❌ | Event |
| webhook_url | VARCHAR(255) | ❌ | URL |
| http_method | ENUM(GET,POST,PUT,PATCH,DELETE) | ❌ | Method |
| secret_key | TEXT | ✅ | Secret |
| status | ENUM(active,inactive) | ❌ | Status |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 5. integration_webhook_logs

Purpose: Webhook execution history.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| webhook_id | BIGINT FK | ❌ | Webhook |
| tenant_id | BIGINT FK | ❌ | Tenant |
| request_headers | JSON | ✅ | Headers |
| request_body | JSON | ✅ | Payload |
| response_code | INT | ✅ | HTTP Code |
| response_body | JSON | ✅ | Response |
| execution_time_ms | INT | ✅ | Time |
| status | ENUM(success,failed) | ❌ | Status |
| created_at | TIMESTAMP | ❌ | |

---

## 6. integration_sync_jobs

Purpose: Every synchronization task.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Integration |
| sync_type | ENUM(import,export,bidirectional) | ❌ | Sync Type |
| module_name | VARCHAR(100) | ❌ | Contacts, Leads, etc. |
| status | ENUM(pending,running,completed,failed) | ❌ | Status |
| records_processed | INT | ❌ | Total |
| success_count | INT | ❌ | Success |
| failed_count | INT | ❌ | Failed |
| started_at | DATETIME | ✅ | Start |
| completed_at | DATETIME | ✅ | Finish |
| error_message | TEXT | ✅ | Error |
| created_at | TIMESTAMP | ❌ | |

---

## 7. integration_field_mappings

Purpose: Map CRM fields to provider fields.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Integration |
| module_name | VARCHAR(100) | ❌ | Leads, Clients |
| local_field | VARCHAR(150) | ❌ | CRM Field |
| external_field | VARCHAR(150) | ❌ | Provider Field |
| transformation_rule | TEXT | ✅ | Optional Mapping Logic |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 8. integration_event_mappings

Purpose: Define which CRM events trigger integrations.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Integration |
| crm_event | VARCHAR(150) | ❌ | lead.created |
| provider_event | VARCHAR(150) | ❌ | create_contact |
| direction | ENUM(outgoing,incoming,bidirectional) | ❌ | Direction |
| is_enabled | BOOLEAN | ❌ | Enabled |
| created_at | TIMESTAMP | ❌ | |
| updated_at | TIMESTAMP | ❌ | |

---

## 9. integration_rate_limits

Purpose: Track API quota usage.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Integration |
| request_limit | INT | ❌ | Allowed Requests |
| requests_used | INT | ❌ | Used Requests |
| remaining_requests | INT | ❌ | Remaining |
| reset_at | DATETIME | ❌ | Reset Time |
| updated_at | TIMESTAMP | ❌ | |

---

## 10. integration_activity_logs

Purpose: Complete audit trail.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_integration_id | BIGINT FK | ❌ | Integration |
| tenant_id | BIGINT FK | ❌ | Tenant |
| user_id | BIGINT FK | ✅ | User |
| activity | VARCHAR(150) | ❌ | connected, disconnected, synced, token_refreshed |
| description | TEXT | ✅ | Details |
| ip_address | VARCHAR(45) | ✅ | IP |
| user_agent | TEXT | ✅ | Browser |
| created_at | TIMESTAMP | ❌ | |











=================================== Phase 6 ====================================== 

# Settings Module

## 1. tenant_settings

Purpose: General tenant settings.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ❌ | Tenant |
| company_name | VARCHAR(255) | ❌ | Company Name |
| legal_name | VARCHAR(255) | ✅ | Legal Name |
| company_email | VARCHAR(150) | ❌ | Email |
| company_phone | VARCHAR(25) | ✅ | Phone |
| website | VARCHAR(255) | ✅ | Website |
| timezone | VARCHAR(100) | ❌ | Timezone |
| date_format | VARCHAR(30) | ❌ | Date Format |
| time_format | ENUM(12,24) | ❌ | Time Format |
| week_start | ENUM(sunday,monday) | ❌ | Week Start |
| language | VARCHAR(50) | ❌ | Language |
| currency_id | BIGINT FK | ❌ | Currency |
| fiscal_year_start | DATE | ✅ | Fiscal Year |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 2. branding_settings

Purpose: Branding.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| logo |
| favicon |
| login_background |
| primary_color |
| secondary_color |
| accent_color |
| font_family |
| login_title |
| footer_text |
| custom_css |
| custom_js |
| created_at |
| updated_at |

---

## 3. localization_settings

Purpose: Localization.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| language |
| currency_id |
| timezone |
| decimal_separator |
| thousand_separator |
| number_format |
| measurement_unit |
| created_at |
| updated_at |

---

## 4. smtp_settings

Purpose: SMTP.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| mail_driver |
| host |
| port |
| username |
| password (Encrypted) |
| encryption |
| from_name |
| from_email |
| reply_to_email |
| status |
| created_at |
| updated_at |

---

## 5. sms_gateway_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| provider |
| api_key |
| api_secret |
| sender_id |
| status |
| created_at |
| updated_at |

---

## 6. whatsapp_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| provider |
| phone_number_id |
| business_account_id |
| access_token |
| verify_token |
| webhook_secret |
| status |
| created_at |
| updated_at |

---

## 7. notification_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| email_enabled |
| sms_enabled |
| whatsapp_enabled |
| push_enabled |
| browser_notifications |
| reminder_notifications |
| created_at |
| updated_at |

---

## 8. payment_gateway_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| gateway |
| merchant_id |
| api_key |
| api_secret |
| webhook_secret |
| mode |
| status |
| created_at |
| updated_at |

---

## 9. invoice_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| invoice_prefix |
| quotation_prefix |
| payment_prefix |
| next_invoice_number |
| next_quote_number |
| next_payment_number |
| tax_enabled |
| default_tax |
| created_at |
| updated_at |

---

## 10. security_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| password_expiry_days |
| minimum_password_length |
| require_special_character |
| require_uppercase |
| require_number |
| require_2fa |
| login_attempt_limit |
| account_lock_minutes |
| session_timeout_minutes |
| ip_whitelist |
| created_at |
| updated_at |

---

## 11. backup_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| backup_frequency |
| backup_time |
| retention_days |
| storage_provider |
| storage_path |
| encryption_enabled |
| last_backup_at |
| created_at |
| updated_at |

---

## 12. storage_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| driver |
| bucket_name |
| region |
| access_key |
| secret_key |
| endpoint |
| max_upload_size |
| allowed_extensions |
| created_at |
| updated_at |

---

## 13. api_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| api_enabled |
| api_key |
| rate_limit |
| webhook_enabled |
| created_at |
| updated_at |

---

## 14. login_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| allow_google_login |
| allow_microsoft_login |
| allow_facebook_login |
| allow_linkedin_login |
| allow_sso |
| created_at |
| updated_at |

---

## 15. module_settings

Purpose: Enable/disable modules.

| Column | Type |
|---------|------|
| id |
| tenant_id |
| module_id |
| enabled |
| created_at |
| updated_at |

---

## 16. feature_settings

Purpose: Enable premium features.

| Column | Type |
|---------|------|
| id |
| tenant_id |
| feature_id |
| enabled |
| created_at |
| updated_at |

---

## 17. automation_settings

| Column | Type |
|---------|------|
| id |
| tenant_id |
| auto_assign_leads |
| auto_close_tasks |
| auto_invoice_generation |
| auto_backup |
| auto_renew_subscription |
| created_at |
| updated_at |

---

## 18. system_preferences

Purpose: UI preferences.

| Column | Type |
|---------|------|
| id |
| tenant_id |
| default_theme |
| sidebar_collapsed |
| dashboard_layout |
| table_page_size |
| default_calendar_view |
| default_landing_page |
| created_at |
| updated_at |







=================================== Phase 6 ====================================== 


# Platform Users Settings Module

This module stores settings related to Platform Users (SaaS Staff) such as Super Admin, Support, Finance, Sales, Developers, etc.

---

# 1. platform_user_settings

Purpose:
Stores general account preferences for each platform user.

| Column | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | BIGINT PK | No | | Primary Key |
| platform_user_id | BIGINT FK | No | | Platform User |
| language_id | BIGINT FK | No | | Preferred Language |
| timezone_id | BIGINT FK | No | | User Timezone |
| date_format_id | BIGINT FK | No | | Date Format |
| time_format_id | BIGINT FK | No | | Time Format |
| currency_id | BIGINT FK | Yes | NULL | Preferred Currency |
| theme_id | BIGINT FK | Yes | NULL | Default Theme |
| dashboard_layout | ENUM(default,compact,analytics) | No | default | Dashboard Style |
| rows_per_page | SMALLINT | No | 25 | Pagination |
| default_calendar_view | ENUM(day,week,month) | No | month | Calendar |
| landing_page | VARCHAR(100) | Yes | dashboard | Default Landing Page |
| created_at | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | No | CURRENT_TIMESTAMP | |

Indexes

- UNIQUE(platform_user_id)

---

# 2. platform_user_security_settings

Purpose:
Stores login and security preferences.

| Column | Type | Nullable | Default |
|---------|------|----------|---------|
| id | BIGINT PK | No | |
| platform_user_id | BIGINT FK | No | |
| two_factor_enabled | BOOLEAN | No | FALSE |
| two_factor_method | ENUM(email,sms,authenticator) | Yes | NULL |
| login_alerts | BOOLEAN | No | TRUE |
| session_timeout_minutes | SMALLINT | No | 30 |
| allow_multiple_sessions | BOOLEAN | No | FALSE |
| trusted_devices_only | BOOLEAN | No | FALSE |
| password_expiry_days | SMALLINT | No | 90 |
| force_password_change | BOOLEAN | No | FALSE |
| created_at | TIMESTAMP | No | |
| updated_at | TIMESTAMP | No | |

Indexes

- UNIQUE(platform_user_id)

---

# 3. platform_user_notification_settings

Purpose:
Notification preferences.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| platform_user_id BIGINT FK |
| email_notifications BOOLEAN |
| sms_notifications BOOLEAN |
| whatsapp_notifications BOOLEAN |
| browser_notifications BOOLEAN |
| desktop_notifications BOOLEAN |
| push_notifications BOOLEAN |
| ticket_notifications BOOLEAN |
| billing_notifications BOOLEAN |
| tenant_notifications BOOLEAN |
| maintenance_notifications BOOLEAN |
| marketing_notifications BOOLEAN |
| security_notifications BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 4. platform_user_dashboard_widgets

Purpose:
Stores dashboard widgets visible to the user.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| widget_code VARCHAR(100) |
| widget_name VARCHAR(150) |
| position_x SMALLINT |
| position_y SMALLINT |
| width SMALLINT |
| height SMALLINT |
| collapsed BOOLEAN |
| visible BOOLEAN |
| display_order SMALLINT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

Unique Index

(platform_user_id, widget_code)

---

# 5. platform_user_shortcuts

Purpose:
Quick menu shortcuts.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| module_id BIGINT FK |
| title VARCHAR(150) |
| icon VARCHAR(100) |
| url VARCHAR(255) |
| display_order SMALLINT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 6. platform_user_favorites

Purpose:
Favorite pages.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| module_id BIGINT FK |
| title VARCHAR(150) |
| route_name VARCHAR(150) |
| icon VARCHAR(100) |
| created_at TIMESTAMP |

---

# 7. platform_user_login_devices

Purpose:
Remembered devices.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| device_name VARCHAR(150) |
| operating_system VARCHAR(100) |
| browser VARCHAR(100) |
| device_identifier VARCHAR(255) |
| ip_address VARCHAR(45) |
| location VARCHAR(255) |
| trusted BOOLEAN |
| last_login_at DATETIME |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 8. platform_user_api_tokens

Purpose:
Personal API tokens.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| token_name VARCHAR(150) |
| token_hash VARCHAR(255) |
| abilities JSON |
| last_used_at DATETIME |
| expires_at DATETIME |
| revoked_at DATETIME NULL |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 9. platform_user_preferences

Purpose:
UI preferences.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| sidebar_collapsed BOOLEAN |
| compact_sidebar BOOLEAN |
| dark_mode BOOLEAN |
| color_scheme VARCHAR(50) |
| font_size ENUM(small,medium,large) |
| animation_enabled BOOLEAN |
| show_breadcrumb BOOLEAN |
| show_help_tooltips BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 10. platform_user_activity_preferences

Purpose:
Activity log settings.

| Column | Type |
|---------|------|
| id BIGINT PK |
| platform_user_id BIGINT FK |
| receive_activity_summary BOOLEAN |
| summary_frequency ENUM(daily,weekly,monthly) |
| retain_activity_days SMALLINT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# Relationships

platform_users
│
├── platform_user_settings
├── platform_user_security_settings
├── platform_user_notification_settings
├── platform_user_dashboard_widgets
├── platform_user_shortcuts
├── platform_user_favorites
├── platform_user_login_devices
├── platform_user_api_tokens
├── platform_user_preferences
└── platform_user_activity_preferences



============================================== Phase 7 =======================================


# Clients Module

## Tables

1. clients
2. client_contacts
3. client_addresses
4. client_companies
5. client_company_contacts
6. client_documents
7. client_notes
8. client_tags
9. client_tag_map
10. client_sources
11. client_statuses
12. client_industries
13. client_social_links
14. client_bank_accounts
15. client_portals
16. client_activity_logs

---

# 1. clients

Purpose:
Stores master client information.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ❌ | Organization |
| uuid | UUID | ❌ | Public UUID |
| client_code | VARCHAR(50) UNIQUE | ❌ | Client Code |
| company_id | BIGINT FK | ✅ | Company (Optional) |
| first_name | VARCHAR(100) | ❌ | First Name |
| middle_name | VARCHAR(100) | ✅ | Middle Name |
| last_name | VARCHAR(100) | ❌ | Last Name |
| display_name | VARCHAR(200) | ❌ | Display Name |
| email | VARCHAR(150) | ❌ | Login Email |
| mobile | VARCHAR(25) | ❌ | Mobile |
| alternate_mobile | VARCHAR(25) | ✅ | Alternate Mobile |
| website | VARCHAR(255) | ✅ | Website |
| industry_id | BIGINT FK | ✅ | Industry |
| source_id | BIGINT FK | ✅ | Source |
| status_id | BIGINT FK | ❌ | Status |
| gst_number | VARCHAR(30) | ✅ | GST |
| pan_number | VARCHAR(30) | ✅ | PAN |
| tax_number | VARCHAR(50) | ✅ | Other Tax |
| currency_id | BIGINT FK | ✅ | Currency |
| language_id | BIGINT FK | ✅ | Language |
| timezone_id | BIGINT FK | ✅ | Timezone |
| notes | LONGTEXT | ✅ | Internal Notes |
| created_by | BIGINT FK | ❌ | User |
| updated_by | BIGINT FK | ✅ | User |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | |

Indexes

- tenant_id
- email
- mobile
- client_code
- status_id

---

# 2. client_contacts

Purpose:
Multiple contact persons for a client.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| first_name VARCHAR(100) |
| last_name VARCHAR(100) |
| designation VARCHAR(150) |
| department VARCHAR(150) |
| email VARCHAR(150) |
| mobile VARCHAR(25) |
| alternate_mobile VARCHAR(25) |
| is_primary BOOLEAN |
| birthday DATE |
| notes TEXT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 3. client_addresses

Purpose:
Unlimited addresses.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| address_type_id BIGINT FK |
| address_line_1 VARCHAR(255) |
| address_line_2 VARCHAR(255) |
| landmark VARCHAR(255) |
| city_id BIGINT FK |
| state_id BIGINT FK |
| country_id BIGINT FK |
| postal_code VARCHAR(20) |
| latitude DECIMAL(10,7) |
| longitude DECIMAL(10,7) |
| is_primary BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 4. client_companies

Purpose:
Company details for B2B clients.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| company_name VARCHAR(255) |
| legal_name VARCHAR(255) |
| registration_number VARCHAR(100) |
| gst_number VARCHAR(30) |
| pan_number VARCHAR(30) |
| website VARCHAR(255) |
| email VARCHAR(150) |
| phone VARCHAR(25) |
| industry_id BIGINT FK |
| employee_count INT |
| annual_turnover DECIMAL(18,2) |
| description TEXT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 5. client_company_contacts

Purpose:
Contacts linked to companies.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| company_id BIGINT FK |
| client_contact_id BIGINT FK |
| designation |
| department |
| is_primary |
| created_at |
| updated_at |

---

# 6. client_documents

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| document_type_id BIGINT FK |
| title VARCHAR(255) |
| file_path VARCHAR(255) |
| file_size BIGINT |
| mime_type VARCHAR(100) |
| expiry_date DATE |
| uploaded_by BIGINT FK |
| created_at TIMESTAMP |

---

# 7. client_notes

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| note LONGTEXT |
| visibility ENUM(private,team,client) |
| created_by BIGINT FK |
| created_at TIMESTAMP |

---

# 8. client_tags

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| status BOOLEAN |
| created_at |
| updated_at |

---

# 9. client_tag_map

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| tag_id BIGINT FK |

---

# 10. client_sources

Examples

- Website
- Referral
- Facebook
- Google Ads
- IndiaMART
- JustDial
- Manual
- Existing Client
- Exhibition
- Cold Call

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(150) |
| description TEXT |
| status BOOLEAN |

---

# 11. client_statuses

Examples

- Active
- Inactive
- Prospect
- VIP
- Blocked

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| status BOOLEAN |

---

# 12. client_industries

Examples

- IT
- Healthcare
- Manufacturing
- Retail
- Education
- Logistics

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(150) |
| description TEXT |

---

# 13. client_social_links

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| platform VARCHAR(100) |
| profile_url VARCHAR(255) |
| username VARCHAR(150) |

---

# 14. client_bank_accounts

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| account_holder_name VARCHAR(150) |
| bank_name VARCHAR(150) |
| branch_name VARCHAR(150) |
| account_number VARCHAR(100) |
| ifsc_code VARCHAR(30) |
| swift_code VARCHAR(30) |
| account_type VARCHAR(50) |
| is_primary BOOLEAN |

---

# 15. client_portals

Purpose:
Client login information.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| user_id BIGINT FK |
| portal_enabled BOOLEAN |
| portal_access_level ENUM(read,limited,full) |
| last_login_at DATETIME |
| created_at TIMESTAMP |

---

# 16. client_activity_logs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| user_id BIGINT FK |
| activity VARCHAR(255) |
| description TEXT |
| ip_address VARCHAR(45) |
| created_at TIMESTAMP |

---

# Relationships

tenants
    │
    ├── clients
    │     ├── client_contacts
    │     ├── client_addresses
    │     ├── client_documents
    │     ├── client_notes
    │     ├── client_tag_map
    │     ├── client_social_links
    │     ├── client_bank_accounts
    │     ├── client_portals
    │     └── client_activity_logs
    │
    ├── client_companies
    │     └── client_company_contacts
    │
    ├── client_tags
    ├── client_sources
    ├── client_statuses
    └── client_industries






=============================================== Phase 8 =======================================

# Staff Module

## Tables

1. staffs
2. staff_employment
3. staff_salary
4. staff_bank_accounts
5. staff_attendance
6. staff_leave_requests
7. staff_leave_balances
8. staff_shift_assignments
9. staff_work_schedules
10. staff_documents
11. staff_certifications
12. staff_assets
13. staff_expenses
14. staff_appraisals
15. staff_training
16. staff_emergency_contacts
17. staff_activity_logs

---

# 1. staffs

Purpose:
Stores staff-specific information linked to users.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ❌ | Tenant |
| user_id | BIGINT FK | ❌ | User Account |
| employee_id | VARCHAR(50) UNIQUE | ❌ | Employee Code |
| department_id | BIGINT FK | ❌ | Department |
| designation_id | BIGINT FK | ❌ | Designation |
| team_id | BIGINT FK | ✅ | Team |
| reporting_manager_id | BIGINT FK | ✅ | Manager |
| employment_status | ENUM(active,probation,notice,resigned,terminated) | ❌ | Employment Status |
| joining_date | DATE | ❌ | Joining Date |
| confirmation_date | DATE | ✅ | Confirmation Date |
| resignation_date | DATE | ✅ | Resignation Date |
| exit_date | DATE | ✅ | Exit Date |
| work_location | VARCHAR(150) | ✅ | Office |
| remarks | TEXT | ✅ | Notes |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | ✅ | Soft Delete |

Indexes

- tenant_id
- user_id
- employee_id
- department_id

---

# 2. staff_employment

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| employment_type ENUM(full_time,part_time,contract,intern,freelancer) |
| probation_period_months SMALLINT |
| notice_period_days SMALLINT |
| weekly_work_hours DECIMAL(5,2) |
| overtime_allowed BOOLEAN |
| overtime_rate DECIMAL(10,2) |
| contract_start DATE |
| contract_end DATE |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 3. staff_salary

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| salary_type ENUM(monthly,hourly,daily) |
| basic_salary DECIMAL(15,2) |
| hra DECIMAL(15,2) |
| da DECIMAL(15,2) |
| allowances DECIMAL(15,2) |
| incentives DECIMAL(15,2) |
| deductions DECIMAL(15,2) |
| pf_number VARCHAR(100) |
| esi_number VARCHAR(100) |
| uan_number VARCHAR(100) |
| tax_number VARCHAR(100) |
| effective_from DATE |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 4. staff_bank_accounts

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| account_holder_name VARCHAR(150) |
| bank_name VARCHAR(150) |
| branch_name VARCHAR(150) |
| account_number VARCHAR(100) |
| ifsc_code VARCHAR(20) |
| swift_code VARCHAR(20) |
| account_type ENUM(savings,current) |
| is_primary BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 5. staff_attendance

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| attendance_date DATE |
| check_in DATETIME |
| check_out DATETIME |
| total_hours DECIMAL(5,2) |
| overtime_hours DECIMAL(5,2) |
| status ENUM(present,absent,leave,holiday,half_day,work_from_home) |
| remarks TEXT |
| created_at TIMESTAMP |

---

# 6. staff_leave_requests

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| leave_type_id BIGINT FK |
| from_date DATE |
| to_date DATE |
| total_days DECIMAL(4,1) |
| reason TEXT |
| approval_status ENUM(pending,approved,rejected,cancelled) |
| approved_by BIGINT FK |
| approved_at DATETIME |
| created_at TIMESTAMP |

---

# 7. staff_leave_balances

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| leave_type_id BIGINT FK |
| allocated_days DECIMAL(5,2) |
| used_days DECIMAL(5,2) |
| remaining_days DECIMAL(5,2) |
| year YEAR |

---

# 8. staff_shift_assignments

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| shift_id BIGINT FK |
| effective_from DATE |
| effective_to DATE |

---

# 9. staff_work_schedules

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| weekday ENUM(monday,tuesday,wednesday,thursday,friday,saturday,sunday) |
| start_time TIME |
| end_time TIME |
| break_minutes SMALLINT |

---

# 10. staff_documents

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| document_type_id BIGINT FK |
| document_number VARCHAR(100) |
| file_path VARCHAR(255) |
| issue_date DATE |
| expiry_date DATE |
| verified BOOLEAN |

---

# 11. staff_certifications

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| certification_name VARCHAR(200) |
| issuing_authority VARCHAR(200) |
| issue_date DATE |
| expiry_date DATE |
| certificate_file VARCHAR(255) |

---

# 12. staff_assets

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| asset_name VARCHAR(150) |
| asset_code VARCHAR(100) |
| serial_number VARCHAR(100) |
| assigned_date DATE |
| return_date DATE |
| status ENUM(assigned,returned,lost,damaged) |

---

# 13. staff_expenses

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| expense_type VARCHAR(100) |
| amount DECIMAL(15,2) |
| expense_date DATE |
| receipt_file VARCHAR(255) |
| approval_status ENUM(pending,approved,rejected) |

---

# 14. staff_appraisals

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| appraisal_period VARCHAR(100) |
| reviewer_id BIGINT FK |
| overall_rating DECIMAL(3,2) |
| comments TEXT |
| appraisal_date DATE |

---

# 15. staff_training

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| training_name VARCHAR(200) |
| trainer_name VARCHAR(200) |
| start_date DATE |
| end_date DATE |
| completion_status ENUM(pending,completed) |

---

# 16. staff_emergency_contacts

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| contact_name VARCHAR(150) |
| relationship_type_id BIGINT FK |
| mobile VARCHAR(25) |
| email VARCHAR(150) |
| address TEXT |

---

# 17. staff_activity_logs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| activity VARCHAR(255) |
| description TEXT |
| performed_by BIGINT FK |
| ip_address VARCHAR(45) |
| created_at TIMESTAMP |

---

# Relationships

users
    │
    ▼
staffs
    ├── staff_employment
    ├── staff_salary
    ├── staff_bank_accounts
    ├── staff_attendance
    ├── staff_leave_requests
    ├── staff_leave_balances
    ├── staff_shift_assignments
    ├── staff_work_schedules
    ├── staff_documents
    ├── staff_certifications
    ├── staff_assets
    ├── staff_expenses
    ├── staff_appraisals
    ├── staff_training
    ├── staff_emergency_contacts
    └── staff_activity_logs








=============================================== Phase 9 =======================================

# Vendor Module

## Tables

1. vendors
2. vendor_contacts
3. vendor_addresses
4. vendor_bank_accounts
5. vendor_documents
6. vendor_services
7. vendor_categories
8. vendor_statuses
9. vendor_tags
10. vendor_tag_map
11. vendor_notes
12. vendor_contracts
13. vendor_activity_logs

---

# 1. vendors

Purpose:
Stores vendor/supplier information.

| Column | Type | Nullable | Description |
|---------|------|----------|-------------|
| id | BIGINT PK | ❌ | Primary Key |
| tenant_id | BIGINT FK | ❌ | Tenant |
| uuid | UUID | ❌ | UUID |
| vendor_code | VARCHAR(50) UNIQUE | ❌ | Vendor Code |
| company_name | VARCHAR(255) | ❌ | Company Name |
| legal_name | VARCHAR(255) | ✅ | Legal Name |
| category_id | BIGINT FK | ✅ | Vendor Category |
| status_id | BIGINT FK | ❌ | Vendor Status |
| gst_number | VARCHAR(30) | ✅ | GST |
| pan_number | VARCHAR(30) | ✅ | PAN |
| registration_number | VARCHAR(100) | ✅ | Registration |
| website | VARCHAR(255) | ✅ | Website |
| email | VARCHAR(150) | ❌ | Email |
| phone | VARCHAR(25) | ❌ | Phone |
| alternate_phone | VARCHAR(25) | ✅ | Alternate Phone |
| currency_id | BIGINT FK | ✅ | Currency |
| language_id | BIGINT FK | ✅ | Language |
| timezone_id | BIGINT FK | ✅ | Timezone |
| notes | LONGTEXT | ✅ | Notes |
| created_by | BIGINT FK | ❌ | Created By |
| updated_by | BIGINT FK | ✅ | Updated By |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | ✅ | Soft Delete |

Indexes

- tenant_id
- vendor_code
- status_id
- category_id
- email

---

# 2. vendor_contacts

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| first_name VARCHAR(100) |
| last_name VARCHAR(100) |
| designation VARCHAR(150) |
| department VARCHAR(150) |
| email VARCHAR(150) |
| mobile VARCHAR(25) |
| alternate_mobile VARCHAR(25) |
| is_primary BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 3. vendor_addresses

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| address_type_id BIGINT FK |
| address_line_1 VARCHAR(255) |
| address_line_2 VARCHAR(255) |
| city_id BIGINT FK |
| state_id BIGINT FK |
| country_id BIGINT FK |
| postal_code VARCHAR(20) |
| latitude DECIMAL(10,7) |
| longitude DECIMAL(10,7) |
| is_primary BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 4. vendor_bank_accounts

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| account_holder_name VARCHAR(150) |
| bank_name VARCHAR(150) |
| branch_name VARCHAR(150) |
| account_number VARCHAR(100) |
| ifsc_code VARCHAR(20) |
| swift_code VARCHAR(20) |
| account_type ENUM(savings,current) |
| is_primary BOOLEAN |

---

# 5. vendor_documents

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| document_type_id BIGINT FK |
| title VARCHAR(255) |
| document_number VARCHAR(100) |
| file_path VARCHAR(255) |
| issue_date DATE |
| expiry_date DATE |
| verified BOOLEAN |
| created_at TIMESTAMP |

---

# 6. vendor_services

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| service_name VARCHAR(255) |
| description TEXT |
| status BOOLEAN |

---

# 7. vendor_categories

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(150) |
| color VARCHAR(20) |
| description TEXT |
| status BOOLEAN |

---

# 8. vendor_statuses

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| status BOOLEAN |

---

# 9. vendor_tags

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| status BOOLEAN |

---

# 10. vendor_tag_map

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| tag_id BIGINT FK |

---

# 11. vendor_notes

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| note LONGTEXT |
| created_by BIGINT FK |
| created_at TIMESTAMP |

---

# 12. vendor_contracts

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| contract_name VARCHAR(255) |
| contract_number VARCHAR(100) |
| start_date DATE |
| end_date DATE |
| contract_value DECIMAL(18,2) |
| status ENUM(active,expired,terminated) |
| attachment VARCHAR(255) |

---

# 13. vendor_activity_logs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| activity VARCHAR(255) |
| description TEXT |
| user_id BIGINT FK |
| ip_address VARCHAR(45) |
| created_at TIMESTAMP |










=============================== Phase 10 =======================================

# Vendor Renewal Module

## Tables

1. vendor_renewals
2. vendor_renewal_items
3. vendor_renewal_history
4. vendor_renewal_reminders
5. vendor_renewal_documents

---

# 1. vendor_renewals

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| vendor_id BIGINT FK |
| renewal_type_id BIGINT FK |
| title VARCHAR(255) |
| reference_number VARCHAR(100) |
| start_date DATE |
| expiry_date DATE |
| renewal_date DATE |
| amount DECIMAL(18,2) |
| currency_id BIGINT FK |
| reminder_days SMALLINT |
| auto_renew BOOLEAN |
| status ENUM(active,pending,renewed,expired,cancelled) |
| assigned_to BIGINT FK |
| notes LONGTEXT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. vendor_renewal_items

| Column | Type |
|---------|------|
| id BIGINT PK |
| vendor_renewal_id BIGINT FK |
| item_name VARCHAR(255) |
| description TEXT |
| amount DECIMAL(18,2) |
| quantity DECIMAL(10,2) |
| total DECIMAL(18,2) |

---

# 3. vendor_renewal_history

| Column | Type |
|---------|------|
| id BIGINT PK |
| vendor_renewal_id BIGINT FK |
| previous_expiry_date DATE |
| renewed_on DATE |
| renewed_by BIGINT FK |
| amount DECIMAL(18,2) |
| remarks TEXT |

---

# 4. vendor_renewal_reminders

| Column | Type |
|---------|------|
| id BIGINT PK |
| vendor_renewal_id BIGINT FK |
| reminder_date DATE |
| reminder_type ENUM(email,sms,whatsapp,notification) |
| sent BOOLEAN |
| sent_at DATETIME |

---

# 5. vendor_renewal_documents

| Column | Type |
|---------|------|
| id BIGINT PK |
| vendor_renewal_id BIGINT FK |
| document_name VARCHAR(255) |
| file_path VARCHAR(255) |
| uploaded_by BIGINT FK |
| created_at TIMESTAMP |











=============================== Phase 11 =======================================

# Client Renewal Module

## Tables

1. client_renewals
2. client_renewal_items
3. client_renewal_history
4. client_renewal_reminders
5. client_renewal_documents

---

# 1. client_renewals

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| client_id BIGINT FK |
| project_id BIGINT FK NULL |
| service_id BIGINT FK NULL |
| renewal_type_id BIGINT FK |
| title VARCHAR(255) |
| reference_number VARCHAR(100) |
| start_date DATE |
| expiry_date DATE |
| renewal_date DATE |
| amount DECIMAL(18,2) |
| currency_id BIGINT FK |
| reminder_days SMALLINT |
| auto_renew BOOLEAN |
| status ENUM(active,pending,renewed,expired,cancelled) |
| assigned_to BIGINT FK |
| notes LONGTEXT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. client_renewal_items

| Column | Type |
|---------|------|
| id BIGINT PK |
| client_renewal_id BIGINT FK |
| item_name VARCHAR(255) |
| description TEXT |
| amount DECIMAL(18,2) |
| quantity DECIMAL(10,2) |
| total DECIMAL(18,2) |

---

# 3. client_renewal_history

| Column | Type |
|---------|------|
| id BIGINT PK |
| client_renewal_id BIGINT FK |
| previous_expiry_date DATE |
| renewed_on DATE |
| renewed_by BIGINT FK |
| amount DECIMAL(18,2) |
| remarks TEXT |

---

# 4. client_renewal_reminders

| Column | Type |
|---------|------|
| id BIGINT PK |
| client_renewal_id BIGINT FK |
| reminder_date DATE |
| reminder_type ENUM(email,sms,whatsapp,notification) |
| sent BOOLEAN |
| sent_at DATETIME |

---

# 5. client_renewal_documents

| Column | Type |
|---------|------|
| id BIGINT PK |
| client_renewal_id BIGINT FK |
| document_name VARCHAR(255) |
| file_path VARCHAR(255) |
| uploaded_by BIGINT FK |
| created_at TIMESTAMP |







=============================== Phase 12 =======================================

# Projects Module

## Tables

1. projects
2. project_members
3. project_phases
4. project_milestones
5. project_statuses
6. project_priorities
7. project_categories
8. project_types
9. project_documents
10. project_notes
11. project_time_logs
12. project_expenses
13. project_tags
14. project_tag_map
15. project_activity_logs

---

# 1. projects

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| project_code VARCHAR(50) UNIQUE |
| client_id BIGINT FK |
| project_name VARCHAR(255) |
| short_name VARCHAR(100) |
| description LONGTEXT |
| project_type_id BIGINT FK |
| project_category_id BIGINT FK |
| project_status_id BIGINT FK |
| priority_id BIGINT FK |
| manager_id BIGINT FK |
| billing_type ENUM(fixed,hourly,milestone) |
| estimated_hours DECIMAL(10,2) |
| actual_hours DECIMAL(10,2) |
| budget DECIMAL(18,2) |
| currency_id BIGINT FK |
| start_date DATE |
| expected_end_date DATE |
| completed_date DATE |
| progress DECIMAL(5,2) |
| is_billable BOOLEAN |
| remarks LONGTEXT |
| created_by BIGINT FK |
| updated_by BIGINT FK |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |
| deleted_at TIMESTAMP |

---

# 2. project_members

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| project_id BIGINT FK |
| user_id BIGINT FK |
| role VARCHAR(100) |
| joined_at DATETIME |
| left_at DATETIME |

---

# 3. project_phases

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| project_id BIGINT FK |
| phase_name VARCHAR(200) |
| description TEXT |
| start_date DATE |
| end_date DATE |
| progress DECIMAL(5,2) |
| status_id BIGINT FK |

---

# 4. project_milestones

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| project_id BIGINT FK |
| phase_id BIGINT FK |
| title VARCHAR(255) |
| description TEXT |
| due_date DATE |
| completed_date DATE |
| status_id BIGINT FK |

---

# 5. project_statuses

id
tenant_id
name
color
display_order
is_default
status

---

# 6. project_priorities

id
tenant_id
name
color
display_order

---

# 7. project_categories

id
tenant_id
name
description

---

# 8. project_types

id
tenant_id
name
description

---

# 9. project_documents

id
tenant_id
project_id
document_type_id
title
file_path
uploaded_by
created_at

---

# 10. project_notes

id
tenant_id
project_id
note
visibility
created_by
created_at

---

# 11. project_time_logs

id
tenant_id
project_id
user_id
task_id
date
start_time
end_time
hours
description

---

# 12. project_expenses

id
tenant_id
project_id
expense_category_id
amount
expense_date
description
attachment

---

# 13. project_tags

id
tenant_id
name
color

---

# 14. project_tag_map

id
tenant_id
project_id
tag_id

---

# 15. project_activity_logs

id
tenant_id
project_id
user_id
activity
description
ip_address
created_at









=============================== Phase 13 =======================================

# Tasks Module

## Tables

1. tasks
2. task_checklists
3. task_checklist_items
4. task_comments
5. task_attachments
6. task_time_logs
7. task_dependencies
8. task_watchers
9. task_statuses
10. task_priorities
11. task_labels
12. task_activity_logs

---

# 1. tasks

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| task_code VARCHAR(50) UNIQUE |
| project_id BIGINT FK |
| milestone_id BIGINT FK |
| parent_task_id BIGINT FK |
| assigned_to BIGINT FK |
| assigned_by BIGINT FK |
| task_title VARCHAR(255) |
| description LONGTEXT |
| task_status_id BIGINT FK |
| priority_id BIGINT FK |
| estimated_hours DECIMAL(10,2) |
| actual_hours DECIMAL(10,2) |
| start_date DATE |
| due_date DATE |
| completed_date DATE |
| progress DECIMAL(5,2) |
| billable BOOLEAN |
| created_by BIGINT FK |
| updated_by BIGINT FK |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. task_checklists

id
tenant_id
task_id
title
display_order

---

# 3. task_checklist_items

id
checklist_id
title
completed
completed_by
completed_at

---

# 4. task_comments

id
tenant_id
task_id
user_id
comment
parent_comment_id
created_at

---

# 5. task_attachments

id
tenant_id
task_id
file_name
file_path
uploaded_by
created_at

---

# 6. task_time_logs

id
tenant_id
task_id
user_id
date
start_time
end_time
hours
description

---

# 7. task_dependencies

id
tenant_id
task_id
depends_on_task_id

---

# 8. task_watchers

id
tenant_id
task_id
user_id

---

# 9. task_statuses

id
tenant_id
name
color
display_order
is_default

---

# 10. task_priorities

id
tenant_id
name
color
display_order

---

# 11. task_labels

id
tenant_id
name
color

---

# 12. task_activity_logs

id
tenant_id
task_id
user_id
activity
description
created_at



=============================== Phase 14 =======================================

# Client Raised Issues

## Tables

1. client_issues
2. issue_comments
3. issue_attachments
4. issue_statuses
5. issue_priorities
6. issue_categories
7. issue_types
8. issue_assignments
9. issue_watchers
10. issue_time_logs
11. issue_activity_logs

---

# 1. client_issues

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| ticket_number VARCHAR(50) UNIQUE |
| client_id BIGINT FK |
| project_id BIGINT FK NULL |
| task_id BIGINT FK NULL |
| issue_type_id BIGINT FK |
| category_id BIGINT FK |
| priority_id BIGINT FK |
| status_id BIGINT FK |
| assigned_to BIGINT FK |
| raised_by BIGINT FK |
| subject VARCHAR(255) |
| description LONGTEXT |
| expected_resolution_date DATE |
| resolved_at DATETIME |
| closed_at DATETIME |
| resolution_notes LONGTEXT |
| satisfaction_rating TINYINT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. issue_comments

id
tenant_id
issue_id
user_id
comment
parent_comment_id
created_at

---

# 3. issue_attachments

id
tenant_id
issue_id
file_name
file_path
uploaded_by
created_at

---

# 4. issue_statuses

id
tenant_id
name
color
display_order
is_default

Examples

Open

In Progress

Waiting for Client

Resolved

Closed

Cancelled

---

# 5. issue_priorities

id
tenant_id
name
color
display_order

Examples

Low

Medium

High

Critical

Emergency

---

# 6. issue_categories

id
tenant_id
name
description

Examples

Bug

Feature Request

Training

Support

Complaint

Billing

Enhancement

---

# 7. issue_types

id
tenant_id
name
description

Examples

Technical

Functional

UI

API

Server

Database

Mobile App

---

# 8. issue_assignments

id
tenant_id
issue_id
assigned_to
assigned_by
assigned_at

---

# 9. issue_watchers

id
tenant_id
issue_id
user_id

---

# 10. issue_time_logs

id
tenant_id
issue_id
user_id
date
start_time
end_time
hours
description

---

# 11. issue_activity_logs

id
tenant_id
issue_id
user_id
activity
description
created_at





=============================== Phase 15 =======================================

# Leads Management Module

## Tables

1. leads
2. lead_contacts
3. lead_addresses
4. lead_sources
5. lead_statuses
6. lead_stages
7. lead_priorities
8. lead_categories
9. lead_tags
10. lead_tag_map
11. lead_assignments
12. lead_followups
13. lead_activities
14. lead_notes
15. lead_documents
16. lead_attachments
17. lead_emails
18. lead_calls
19. lead_meetings
20. lead_tasks
21. lead_products
22. lead_quotes
23. lead_quote_items
24. lead_custom_fields
25. lead_custom_field_values
26. lead_import_logs
27. lead_source_integrations
28. lead_conversion_history
29. lead_duplicate_logs
30. lead_activity_logs

---

# 1. leads

Purpose:
Stores master lead information.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| lead_code VARCHAR(50) UNIQUE |
| company_name VARCHAR(255) |
| first_name VARCHAR(100) |
| middle_name VARCHAR(100) |
| last_name VARCHAR(100) |
| display_name VARCHAR(255) |
| email VARCHAR(150) |
| mobile VARCHAR(25) |
| alternate_mobile VARCHAR(25) |
| website VARCHAR(255) |
| lead_source_id BIGINT FK |
| lead_stage_id BIGINT FK |
| lead_status_id BIGINT FK |
| priority_id BIGINT FK |
| category_id BIGINT FK |
| assigned_to BIGINT FK |
| assigned_by BIGINT FK |
| expected_value DECIMAL(18,2) |
| probability DECIMAL(5,2) |
| expected_closing_date DATE |
| industry_id BIGINT FK |
| employee_count INT |
| annual_revenue DECIMAL(18,2) |
| gst_number VARCHAR(30) |
| notes LONGTEXT |
| last_contacted_at DATETIME |
| converted BOOLEAN |
| converted_client_id BIGINT FK |
| converted_project_id BIGINT FK |
| converted_at DATETIME |
| created_by BIGINT FK |
| updated_by BIGINT FK |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |
| deleted_at TIMESTAMP |

Indexes

tenant_id

lead_code

email

mobile

assigned_to

lead_stage_id

lead_status_id

---

# 2. lead_contacts

Stores multiple contact persons.

id

tenant_id

lead_id

first_name

last_name

designation

department

email

mobile

alternate_mobile

is_primary

created_at

updated_at

---

# 3. lead_addresses

id

tenant_id

lead_id

address_type_id

address_line_1

address_line_2

city_id

state_id

country_id

postal_code

latitude

longitude

is_primary

---

# 4. lead_sources

Examples

Manual

Website

Meta Ads

Facebook

Instagram

Google Ads

IndiaMART

JustDial

TradeIndia

Referral

Cold Call

Email Campaign

WhatsApp

API

CSV Import

---

Columns

id

tenant_id

name

description

icon

color

is_system

status

---

# 5. lead_statuses

Examples

New

Contacted

Qualified

Lost

Won

Junk

Spam

Inactive

---

Columns

id

tenant_id

name

color

display_order

is_default

status

---

# 6. lead_stages

Examples

New Lead

First Contact

Discussion

Requirement Gathering

Demo Scheduled

Proposal Sent

Negotiation

Follow-up

Won

Lost

---

Columns

id

tenant_id

name

display_order

color

probability

status

---

# 7. lead_priorities

Examples

Low

Medium

High

Urgent

Critical

---

Columns

id

tenant_id

name

color

display_order

---

# 8. lead_categories

Examples

Hot

Warm

Cold

Enterprise

Retail

Government

Education

Healthcare

---

Columns

id

tenant_id

name

description

status

---

# 9. lead_tags

id

tenant_id

name

color

---

# 10. lead_tag_map

id

tenant_id

lead_id

tag_id

---

# 11. lead_assignments

Stores assignment history.

id

tenant_id

lead_id

assigned_to

assigned_by

assigned_at

remarks

---

# 12. lead_followups

id

tenant_id

lead_id

followup_date

followup_time

followup_type_id

status

remarks

next_followup

assigned_to

completed_at

created_by

---

# 13. lead_activities

Examples

Created

Updated

Assigned

Called

Meeting

WhatsApp

Email

Quotation

Demo

Proposal

---

Columns

id

tenant_id

lead_id

activity_type

description

performed_by

performed_at

---

# 14. lead_notes

id

tenant_id

lead_id

note

visibility

created_by

created_at

---

# 15. lead_documents

id

tenant_id

lead_id

document_type_id

title

file_path

uploaded_by

created_at

---

# 16. lead_attachments

id

tenant_id

lead_id

file_name

file_path

uploaded_by

created_at

---

# 17. lead_emails

Stores email communication.

id

tenant_id

lead_id

subject

body

from_email

to_email

sent_by

status

sent_at

---

# 18. lead_calls

Stores call logs.

id

tenant_id

lead_id

call_type

phone_number

duration

recording_url

remarks

created_by

created_at

---

# 19. lead_meetings

id

tenant_id

lead_id

meeting_title

meeting_type

meeting_location

meeting_link

meeting_date

start_time

end_time

status

created_by

---

# 20. lead_tasks

Tasks related to lead.

id

tenant_id

lead_id

task_title

assigned_to

priority

status

due_date

completed_at

---

# 21. lead_products

Products discussed.

id

tenant_id

lead_id

product_id

quantity

price

discount

tax

total

---

# 22. lead_quotes

Quotation header.

id

tenant_id

lead_id

quote_number

quote_date

valid_until

subtotal

discount

tax

grand_total

status

created_by

---

# 23. lead_quote_items

id

lead_quote_id

product_id

description

quantity

price

discount

tax

total

---

# 24. lead_custom_fields

Dynamic custom fields.

id

tenant_id

field_name

field_type

module

required

display_order

---

# 25. lead_custom_field_values

id

tenant_id

lead_id

custom_field_id

value

---

# 26. lead_import_logs

Tracks CSV/API imports.

id

tenant_id

source

imported_by

total_records

success_records

failed_records

file_name

created_at

---

# 27. lead_source_integrations

Stores source mapping.

id

tenant_id

source_id

external_source

external_form_id

external_campaign_id

api_reference

status

---

# 28. lead_conversion_history

Stores conversion history.

id

tenant_id

lead_id

client_id

project_id

converted_by

converted_at

remarks

---

# 29. lead_duplicate_logs

Duplicate detection.

id

tenant_id

lead_id

duplicate_lead_id

matched_by

created_at

---

# 30. lead_activity_logs

Complete audit trail.

id

tenant_id

lead_id

user_id

activity

description

ip_address

created_at













=============================== Phase 16 =======================================

# Calendar & Appointments Module

## Tables

1. calendars
2. calendar_events
3. calendar_event_attendees
4. calendar_event_reminders
5. calendar_event_recurrence
6. calendar_event_attachments
7. calendar_availability
8. calendar_busy_slots
9. calendar_categories
10. calendar_statuses
11. meeting_rooms
12. meeting_room_bookings
13. video_meeting_integrations
14. calendar_sync_logs
15. calendar_activity_logs

---

# 1. calendars

Purpose:
Each tenant can create multiple calendars.

Examples

Sales Calendar

HR Calendar

Project Calendar

Personal Calendar

Support Calendar

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| calendar_name VARCHAR(150) |
| description TEXT |
| color VARCHAR(20) |
| owner_user_id BIGINT FK |
| visibility ENUM(private,team,public) |
| is_default BOOLEAN |
| timezone_id BIGINT FK |
| status BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. calendar_events

Purpose:
Stores appointments, meetings and events.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| calendar_id BIGINT FK |
| uuid UUID |
| event_number VARCHAR(50) UNIQUE |
| title VARCHAR(255) |
| description LONGTEXT |
| category_id BIGINT FK |
| status_id BIGINT FK |
| event_type ENUM(meeting,appointment,call,demo,followup,holiday,leave,birthday,reminder,task,other) |
| client_id BIGINT FK NULL |
| lead_id BIGINT FK NULL |
| project_id BIGINT FK NULL |
| task_id BIGINT FK NULL |
| issue_id BIGINT FK NULL |
| organizer_id BIGINT FK |
| location VARCHAR(255) |
| meeting_room_id BIGINT FK NULL |
| meeting_url VARCHAR(500) |
| start_datetime DATETIME |
| end_datetime DATETIME |
| timezone_id BIGINT FK |
| is_all_day BOOLEAN |
| is_recurring BOOLEAN |
| recurrence_id BIGINT FK NULL |
| priority ENUM(low,medium,high,urgent) |
| visibility ENUM(private,team,public) |
| color VARCHAR(20) |
| notes LONGTEXT |
| created_by BIGINT FK |
| updated_by BIGINT FK |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |
| deleted_at TIMESTAMP |

Indexes

tenant_id

calendar_id

start_datetime

end_datetime

organizer_id

client_id

lead_id

project_id

---

# 3. calendar_event_attendees

Purpose:
Multiple attendees per event.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| event_id BIGINT FK |
| attendee_type ENUM(user,client,lead,guest) |
| user_id BIGINT FK NULL |
| client_id BIGINT FK NULL |
| lead_id BIGINT FK NULL |
| guest_name VARCHAR(150) |
| guest_email VARCHAR(150) |
| guest_mobile VARCHAR(25) |
| attendance_status ENUM(pending,accepted,declined,tentative) |
| checked_in BOOLEAN |
| checked_in_at DATETIME |
| created_at TIMESTAMP |

---

# 4. calendar_event_reminders

Purpose:
Multiple reminders per event.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| event_id BIGINT FK |
| reminder_type ENUM(notification,email,sms,whatsapp) |
| reminder_before_minutes INT |
| reminder_datetime DATETIME |
| sent BOOLEAN |
| sent_at DATETIME |
| created_at TIMESTAMP |

---

# 5. calendar_event_recurrence

Purpose:
Recurring events.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| recurrence_type ENUM(daily,weekly,monthly,yearly) |
| interval_value SMALLINT |
| weekdays JSON |
| monthly_day SMALLINT |
| yearly_month SMALLINT |
| yearly_day SMALLINT |
| starts_on DATE |
| ends_on DATE |
| occurrence_count INT |
| created_at TIMESTAMP |

---

# 6. calendar_event_attachments

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| event_id BIGINT FK |
| document_name VARCHAR(255) |
| file_path VARCHAR(255) |
| uploaded_by BIGINT FK |
| uploaded_at DATETIME |

---

# 7. calendar_availability

Purpose:
Working hours.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| user_id BIGINT FK |
| weekday ENUM(monday,tuesday,wednesday,thursday,friday,saturday,sunday) |
| start_time TIME |
| end_time TIME |
| slot_duration SMALLINT |
| break_start TIME |
| break_end TIME |
| timezone_id BIGINT FK |
| created_at TIMESTAMP |

---

# 8. calendar_busy_slots

Purpose:
Blocked time.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| user_id BIGINT FK |
| start_datetime DATETIME |
| end_datetime DATETIME |
| reason VARCHAR(255) |
| created_at TIMESTAMP |

---

# 9. calendar_categories

Examples

Meeting

Appointment

Sales

Support

Holiday

Birthday

Training

Demo

Interview

Internal

Client Visit

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| icon VARCHAR(100) |
| display_order SMALLINT |
| is_default BOOLEAN |
| status BOOLEAN |

---

# 10. calendar_statuses

Examples

Scheduled

Confirmed

Pending

Completed

Cancelled

No Show

Rescheduled

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| display_order SMALLINT |
| is_default BOOLEAN |

---

# 11. meeting_rooms

Purpose:
Office meeting rooms.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| room_name VARCHAR(150) |
| location VARCHAR(255) |
| capacity SMALLINT |
| description TEXT |
| status BOOLEAN |

---

# 12. meeting_room_bookings

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| room_id BIGINT FK |
| event_id BIGINT FK |
| booked_by BIGINT FK |
| booking_status ENUM(booked,cancelled) |
| created_at TIMESTAMP |

---

# 13. video_meeting_integrations

Purpose:
Store online meeting details.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| event_id BIGINT FK |
| provider ENUM(google_meet,zoom,microsoft_teams,webex) |
| meeting_id VARCHAR(255) |
| meeting_url VARCHAR(500) |
| host_url VARCHAR(500) |
| passcode VARCHAR(100) |
| created_at TIMESTAMP |

---

# 14. calendar_sync_logs

Purpose:
Google Calendar / Outlook sync history.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| calendar_id BIGINT FK |
| provider ENUM(google,outlook,apple) |
| external_event_id VARCHAR(255) |
| sync_type ENUM(import,export,bidirectional) |
| sync_status ENUM(success,failed) |
| synced_at DATETIME |

---

# 15. calendar_activity_logs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| event_id BIGINT FK |
| user_id BIGINT FK |
| activity VARCHAR(255) |
| description TEXT |
| ip_address VARCHAR(45) |
| created_at TIMESTAMP |







=============================== Phase 17 =======================================

# To-Do Tasks Module

## Tables

1. todo_lists
2. todo_tasks
3. todo_task_checklists
4. todo_task_checklist_items
5. todo_task_comments
6. todo_task_attachments
7. todo_task_reminders
8. todo_task_recurrence
9. todo_task_labels
10. todo_task_label_map
11. todo_task_categories
12. todo_task_priorities
13. todo_task_statuses
14. todo_task_dependencies
15. todo_task_time_logs
16. todo_task_assignments
17. todo_task_watchers
18. todo_task_activity_logs

---

# 1. todo_lists

Purpose:
Users can create multiple personal or shared lists.

Examples

My Tasks

Today's Work

Personal

Development

HR

Sales

Follow Ups

Urgent

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| list_name VARCHAR(150) |
| description TEXT |
| owner_user_id BIGINT FK |
| color VARCHAR(20) |
| icon VARCHAR(100) |
| visibility ENUM(private,team,public) |
| is_default BOOLEAN |
| status BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. todo_tasks

Purpose:
Stores individual To-Do tasks.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| uuid UUID |
| todo_list_id BIGINT FK |
| task_number VARCHAR(50) UNIQUE |
| parent_task_id BIGINT FK NULL |
| title VARCHAR(255) |
| description LONGTEXT |
| category_id BIGINT FK |
| priority_id BIGINT FK |
| status_id BIGINT FK |
| assigned_to BIGINT FK |
| assigned_by BIGINT FK |
| related_client_id BIGINT FK NULL |
| related_lead_id BIGINT FK NULL |
| related_project_id BIGINT FK NULL |
| related_task_id BIGINT FK NULL |
| related_issue_id BIGINT FK NULL |
| related_event_id BIGINT FK NULL |
| start_datetime DATETIME |
| due_datetime DATETIME |
| completed_at DATETIME |
| estimated_minutes INT |
| actual_minutes INT |
| progress DECIMAL(5,2) |
| is_recurring BOOLEAN |
| recurrence_id BIGINT FK NULL |
| is_starred BOOLEAN |
| is_pinned BOOLEAN |
| notes LONGTEXT |
| created_by BIGINT FK |
| updated_by BIGINT FK |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |
| deleted_at TIMESTAMP |

Indexes

tenant_id

assigned_to

status_id

priority_id

due_datetime

---

# 3. todo_task_checklists

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| title VARCHAR(255) |
| display_order SMALLINT |
| created_at TIMESTAMP |

---

# 4. todo_task_checklist_items

| Column | Type |
|---------|------|
| id BIGINT PK |
| checklist_id BIGINT FK |
| item_title VARCHAR(255) |
| is_completed BOOLEAN |
| completed_by BIGINT FK |
| completed_at DATETIME |
| display_order SMALLINT |

---

# 5. todo_task_comments

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| user_id BIGINT FK |
| comment LONGTEXT |
| parent_comment_id BIGINT FK NULL |
| created_at TIMESTAMP |

---

# 6. todo_task_attachments

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| file_name VARCHAR(255) |
| file_path VARCHAR(255) |
| mime_type VARCHAR(100) |
| file_size BIGINT |
| uploaded_by BIGINT FK |
| uploaded_at TIMESTAMP |

---

# 7. todo_task_reminders

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| reminder_type_id BIGINT FK |
| reminder_datetime DATETIME |
| sent BOOLEAN |
| sent_at DATETIME |
| created_at TIMESTAMP |

---

# 8. todo_task_recurrence

| Column | Type |
|---------|------|
| id BIGINT PK |
| recurrence_type_id BIGINT FK |
| interval_value SMALLINT |
| weekdays JSON |
| monthly_day SMALLINT |
| yearly_month SMALLINT |
| yearly_day SMALLINT |
| starts_on DATE |
| ends_on DATE |
| occurrence_count INT |
| created_at TIMESTAMP |

---

# 9. todo_task_labels

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| icon VARCHAR(100) |
| status BOOLEAN |

---

# 10. todo_task_label_map

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| label_id BIGINT FK |

---

# 11. todo_task_categories

Examples

Personal

Office

Meeting

Call

Email

Reminder

Finance

Development

HR

Sales

Support

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| icon VARCHAR(100) |
| display_order SMALLINT |
| status BOOLEAN |

---

# 12. todo_task_priorities

Examples

Low

Medium

High

Urgent

Critical

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| display_order SMALLINT |
| is_default BOOLEAN |

---

# 13. todo_task_statuses

Examples

Pending

In Progress

Waiting

Completed

Cancelled

Deferred

Archived

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| color VARCHAR(20) |
| display_order SMALLINT |
| is_default BOOLEAN |

---

# 14. todo_task_dependencies

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| depends_on_task_id BIGINT FK |

---

# 15. todo_task_time_logs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| user_id BIGINT FK |
| start_time DATETIME |
| end_time DATETIME |
| total_minutes INT |
| notes TEXT |

---

# 16. todo_task_assignments

Purpose:
Keeps assignment history.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| assigned_to BIGINT FK |
| assigned_by BIGINT FK |
| assigned_at DATETIME |
| remarks TEXT |

---

# 17. todo_task_watchers

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| user_id BIGINT FK |
| created_at TIMESTAMP |

---

# 18. todo_task_activity_logs

Purpose:
Complete audit history.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| todo_task_id BIGINT FK |
| user_id BIGINT FK |
| activity VARCHAR(255) |
| description TEXT |
| ip_address VARCHAR(45) |
| created_at TIMESTAMP |








=============================== Phase 18 =======================================

# Payroll Module

## Tables

1. payroll_cycles
2. payrolls
3. payroll_items
4. payroll_components
5. payroll_component_types
6. payroll_component_assignments
7. payroll_overtime
8. payroll_bonus
9. payroll_incentives
10. payroll_deductions
11. payroll_loans
12. payroll_loan_installments
13. payroll_reimbursements
14. payroll_tax_slabs
15. payroll_tax_deductions
16. payroll_pf_settings
17. payroll_esi_settings
18. payroll_bank_transfers
19. payroll_payslips
20. payroll_approvals
21. payroll_activity_logs

---

# 1. payroll_cycles

Purpose:
Monthly payroll periods.

Examples

January 2026

February 2026

March 2026

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| cycle_name VARCHAR(100) |
| payroll_month TINYINT |
| payroll_year YEAR |
| period_start DATE |
| period_end DATE |
| payment_date DATE |
| status ENUM(draft,processing,approved,paid,closed) |
| processed_by BIGINT FK |
| approved_by BIGINT FK |
| processed_at DATETIME |
| approved_at DATETIME |
| remarks TEXT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 2. payrolls

Purpose:
Payroll record for one employee.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_cycle_id BIGINT FK |
| staff_id BIGINT FK |
| employee_code VARCHAR(50) |
| working_days SMALLINT |
| present_days SMALLINT |
| absent_days SMALLINT |
| leave_days DECIMAL(5,2) |
| paid_leave_days DECIMAL(5,2) |
| unpaid_leave_days DECIMAL(5,2) |
| overtime_hours DECIMAL(10,2) |
| gross_salary DECIMAL(18,2) |
| total_earnings DECIMAL(18,2) |
| total_deductions DECIMAL(18,2) |
| taxable_income DECIMAL(18,2) |
| tax_amount DECIMAL(18,2) |
| net_salary DECIMAL(18,2) |
| payment_status ENUM(pending,approved,paid,failed) |
| payment_reference VARCHAR(150) |
| remarks LONGTEXT |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 3. payroll_items

Purpose:
Individual earning/deduction entries.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| component_id BIGINT FK |
| amount DECIMAL(18,2) |
| calculation_type ENUM(fixed,percentage,formula) |
| remarks TEXT |
| created_at TIMESTAMP |

---

# 4. payroll_components

Purpose:
Salary structure components.

Examples

Basic Salary

HRA

DA

Medical Allowance

Travel Allowance

Bonus

PF

Professional Tax

TDS

ESI

Loan Deduction

Advance

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| component_type_id BIGINT FK |
| component_name VARCHAR(150) |
| component_code VARCHAR(50) |
| calculation_method ENUM(fixed,percentage,formula) |
| default_value DECIMAL(18,2) |
| formula TEXT |
| taxable BOOLEAN |
| affects_pf BOOLEAN |
| affects_esi BOOLEAN |
| display_order SMALLINT |
| status BOOLEAN |
| created_at TIMESTAMP |
| updated_at TIMESTAMP |

---

# 5. payroll_component_types

Examples

Earning

Deduction

Reimbursement

Employer Contribution

Employee Contribution

Bonus

Allowance

Tax

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| name VARCHAR(100) |
| description TEXT |
| status BOOLEAN |

---

# 6. payroll_component_assignments

Purpose:
Assign salary structure to staff.

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| component_id BIGINT FK |
| amount DECIMAL(18,2) |
| effective_from DATE |
| effective_to DATE |
| created_at TIMESTAMP |

---

# 7. payroll_overtime

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| attendance_id BIGINT FK |
| overtime_hours DECIMAL(10,2) |
| hourly_rate DECIMAL(18,2) |
| amount DECIMAL(18,2) |
| approved_by BIGINT FK |
| approved_at DATETIME |

---

# 8. payroll_bonus

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| bonus_type VARCHAR(100) |
| amount DECIMAL(18,2) |
| remarks TEXT |

---

# 9. payroll_incentives

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| incentive_type VARCHAR(100) |
| amount DECIMAL(18,2) |
| remarks TEXT |

---

# 10. payroll_deductions

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| deduction_type VARCHAR(100) |
| amount DECIMAL(18,2) |
| remarks TEXT |

---

# 11. payroll_loans

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| staff_id BIGINT FK |
| loan_number VARCHAR(50) |
| loan_amount DECIMAL(18,2) |
| interest_rate DECIMAL(5,2) |
| installment_amount DECIMAL(18,2) |
| total_installments SMALLINT |
| remaining_amount DECIMAL(18,2) |
| issued_date DATE |
| status ENUM(active,completed,closed) |

---

# 12. payroll_loan_installments

| Column | Type |
|---------|------|
| id BIGINT PK |
| loan_id BIGINT FK |
| payroll_id BIGINT FK |
| installment_no SMALLINT |
| deduction_amount DECIMAL(18,2) |
| paid BOOLEAN |
| paid_at DATETIME |

---

# 13. payroll_reimbursements

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| expense_category_id BIGINT FK |
| amount DECIMAL(18,2) |
| description TEXT |
| attachment VARCHAR(255) |
| approval_status ENUM(pending,approved,rejected) |

---

# 14. payroll_tax_slabs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| slab_name VARCHAR(100) |
| min_amount DECIMAL(18,2) |
| max_amount DECIMAL(18,2) |
| tax_percentage DECIMAL(6,2) |
| cess_percentage DECIMAL(6,2) |
| effective_from DATE |
| effective_to DATE |

---

# 15. payroll_tax_deductions

| Column | Type |
|---------|------|
| id BIGINT PK |
| payroll_id BIGINT FK |
| tax_slab_id BIGINT FK |
| taxable_income DECIMAL(18,2) |
| tax_amount DECIMAL(18,2) |

---

# 16. payroll_pf_settings

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| employee_pf_rate DECIMAL(6,2) |
| employer_pf_rate DECIMAL(6,2) |
| wage_limit DECIMAL(18,2) |
| effective_from DATE |

---

# 17. payroll_esi_settings

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| employee_rate DECIMAL(6,2) |
| employer_rate DECIMAL(6,2) |
| wage_limit DECIMAL(18,2) |
| effective_from DATE |

---

# 18. payroll_bank_transfers

| Column | Type |
|---------|------|
| id BIGINT PK |
| payroll_id BIGINT FK |
| bank_account_id BIGINT FK |
| transfer_reference VARCHAR(150) |
| transfer_amount DECIMAL(18,2) |
| transfer_date DATETIME |
| transfer_status ENUM(pending,success,failed) |

---

# 19. payroll_payslips

| Column | Type |
|---------|------|
| id BIGINT PK |
| payroll_id BIGINT FK |
| payslip_number VARCHAR(100) |
| pdf_path VARCHAR(255) |
| generated_at DATETIME |
| emailed BOOLEAN |
| emailed_at DATETIME |

---

# 20. payroll_approvals

| Column | Type |
|---------|------|
| id BIGINT PK |
| payroll_id BIGINT FK |
| approval_level SMALLINT |
| approved_by BIGINT FK |
| approval_status ENUM(pending,approved,rejected) |
| remarks TEXT |
| approved_at DATETIME |

---

# 21. payroll_activity_logs

| Column | Type |
|---------|------|
| id BIGINT PK |
| tenant_id BIGINT FK |
| payroll_id BIGINT FK |
| user_id BIGINT FK |
| activity VARCHAR(255) |
| description TEXT |
| ip_address VARCHAR(45) |
| created_at TIMESTAMP |











=============================== Phase 19 =======================================


# Holidays Module

## Tables

1. holiday_calendars
2. holidays
3. holiday_locations
4. holiday_departments
5. holiday_branches
6. holiday_groups
7. holiday_group_members
8. holiday_activity_logs

---

# 1. holiday_calendars

Purpose:
A tenant can maintain multiple holiday calendars.

Examples

India Calendar

USA Calendar

Corporate Calendar

Factory Calendar

Delhi Office

Mumbai Office

International Team

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| uuid | UUID |
| calendar_name | VARCHAR(150) |
| description | TEXT |
| country_id | BIGINT FK NULL |
| state_id | BIGINT FK NULL |
| is_default | BOOLEAN |
| status | BOOLEAN |
| created_by | BIGINT FK |
| updated_by | BIGINT FK |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Indexes

tenant_id

calendar_name

country_id

---

# 2. holidays

Purpose:
Stores all holidays.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| uuid | UUID |
| holiday_calendar_id | BIGINT FK |
| holiday_name | VARCHAR(255) |
| holiday_type_id | BIGINT FK |
| holiday_category_id | BIGINT FK |
| holiday_date | DATE |
| start_date | DATE |
| end_date | DATE |
| total_days | DECIMAL(5,2) |
| is_half_day | BOOLEAN |
| half_day_session | ENUM(first_half,second_half) |
| recurring_yearly | BOOLEAN |
| optional_holiday | BOOLEAN |
| applicable_to_all | BOOLEAN |
| description | LONGTEXT |
| color | VARCHAR(20) |
| created_by | BIGINT FK |
| updated_by | BIGINT FK |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |
| deleted_at | TIMESTAMP |

Indexes

tenant_id

holiday_calendar_id

holiday_date

holiday_type_id

---

# 3. holiday_locations

Purpose:
Applicable only to specific locations.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| holiday_id | BIGINT FK |
| country_id | BIGINT FK |
| state_id | BIGINT FK NULL |
| city_id | BIGINT FK NULL |
| created_at | TIMESTAMP |

---

# 4. holiday_departments

Purpose:
Applicable only for selected departments.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| holiday_id | BIGINT FK |
| department_id | BIGINT FK |
| created_at | TIMESTAMP |

---

# 5. holiday_branches

Purpose:
Applicable only for selected office branches.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| holiday_id | BIGINT FK |
| office_address_id | BIGINT FK |
| created_at | TIMESTAMP |

---

# 6. holiday_groups

Purpose:
Custom employee holiday groups.

Examples

Corporate Staff

Factory Staff

Sales Team

Support Team

Night Shift

International Employees

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| group_name | VARCHAR(150) |
| description | TEXT |
| status | BOOLEAN |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# 7. holiday_group_members

Purpose:
Assign staff to holiday groups.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| holiday_group_id | BIGINT FK |
| staff_id | BIGINT FK |
| assigned_at | DATETIME |

---

# 8. holiday_activity_logs

Purpose:
Audit trail.

| Column | Type |
|---------|------|
| id | BIGINT PK |
| tenant_id | BIGINT FK |
| holiday_id | BIGINT FK |
| user_id | BIGINT FK |
| activity | VARCHAR(255) |
| description | TEXT |
| ip_address | VARCHAR(45) |
| created_at | TIMESTAMP |












holiday_types
-------------

1. National Holiday
2. Government Holiday
3. Company Holiday
4. Regional Holiday
5. Religious Holiday
6. Festival Holiday
7. Weekly Off
8. Emergency Holiday
9. Optional Holiday
10. Special Holiday

holiday_categories
------------------

1. Public
2. Company
3. Department
4. Branch
5. Team
6. Location
7. Shift
8. Employee Group

holiday_statuses
----------------

1. Active
2. Inactive
3. Archived

