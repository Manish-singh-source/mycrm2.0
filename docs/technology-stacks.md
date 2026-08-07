# Technology Stacks and External Services

This document lists the technology stack, external APIs, tools, and operational services needed for the SaaS CRM project.

Project targets:

- Backend APIs: Laravel.
- Frontend website/admin app: React.
- Mobile/tablet application: Flutter.
- Product type: multi-tenant enterprise SaaS CRM with platform admin and tenant CRM surfaces.

## 1. High-Level Architecture


| Layer         | Recommended Stack                                        | Purpose                                                                      |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Backend API   | Laravel, PHP, MySQL/PostgreSQL, Redis, queues, scheduler | Multi-tenant APIs, auth, RBAC, billing, CRM, HRMS, payroll, finance, reports |
| Web frontend  | React, TypeScript, Vite, React Router, TanStack Query    | Platform admin and tenant web app                                            |
| Mobile app    | Flutter, Dart, Material 3, Dio, Riverpod/Bloc            | Tenant mobile/tablet app and optional platform admin app                     |
| Database      | MySQL 8 or PostgreSQL                                    | Primary relational data store                                                |
| Cache/queue   | Redis                                                    | Cache, sessions, queues, rate limiting, locks                                |
| File storage  | Local for dev, S3-compatible storage for production      | Documents, invoices, payslips, profile photos, imports/exports               |
| Search        | Database search first, Meilisearch/OpenSearch later      | Fast CRM/project/support search                                              |
| Notifications | Email, SMS, WhatsApp, push                               | User, client, staff, billing, support, HR workflows                          |
| Payments      | Razorpay/Stripe/Cashfree or gateway required by market   | SaaS subscription payments and tenant payment integrations                   |
| Observability | Logs, error tracking, uptime monitoring, metrics         | Production health and debugging                                              |
| CI/CD         | GitHub Actions or similar                                | Automated tests, builds, deployments                                         |

## 2. Backend API Stack: Laravel

### 2.1 Core Runtime


| Need               | Recommended Technology                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| Language           | PHP 8.2+ or PHP 8.3+                                                    |
| Framework          | Laravel 11/12 depending project compatibility                           |
| API style          | REST JSON APIs with standard response envelopes                         |
| Web server         | Nginx or Apache in production; XAMPP is fine for local development only |
| Process manager    | PHP-FPM on Linux production                                             |
| Package manager    | Composer                                                                |
| Background workers | Laravel queues with Redis driver                                        |
| Scheduler          | Laravel Scheduler using cron or supervisor-managed runner               |
| Realtime events    | Laravel Reverb, Pusher, Ably, or Soketi if realtime is required         |

### 2.2 Laravel Packages


| Area                | Package/Tool                                        | Purpose                                                       |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Auth tokens         | Laravel Sanctum or Passport                         | API auth for web/mobile; Sanctum is simpler for first version |
| RBAC                | spatie/laravel-permission                           | Platform and tenant roles/permissions                         |
| Activity logs       | spatie/laravel-activitylog or custom`activity_logs` | Audit trail                                                   |
| Media/files         | spatie/laravel-medialibrary or custom`files` table  | File metadata and attachments                                 |
| Excel import/export | maatwebsite/excel                                   | Staff/client/vendor/lead/attendance imports and exports       |
| PDF generation      | dompdf, Browsershot, or wkhtmltopdf                 | Invoices, payslips, reports                                   |
| Query filtering     | spatie/laravel-query-builder or custom filters      | Search, filters, sorting, includes, fields                    |
| Settings            | spatie/laravel-settings or custom`tenant_settings`  | Tenant/platform settings                                      |
| Backups             | spatie/laravel-backup                               | Backup runs if not custom                                     |
| CORS                | Laravel CORS config                                 | React/Flutter API access                                      |
| Debug local         | Laravel Telescope, Debugbar                         | Local debugging only                                          |
| API docs            | Scribe or OpenAPI generator                         | API documentation and examples                                |
| Testing             | PHPUnit/Pest                                        | Backend automated testing                                     |
| Code style          | Laravel Pint                                        | PHP formatting                                                |
| Static analysis     | PHPStan/Larastan                                    | Type and bug checks                                           |

### 2.3 Backend Architecture Standards

Use these backend structure conventions:

```text
app/
  Actions/
  DTOs/
  Enums/
  Events/
  Exceptions/
  Http/
    Controllers/
      Platform/
      Tenant/
    Middleware/
    Requests/
    Resources/
  Jobs/
  Listeners/
  Models/
  Notifications/
  Policies/
  Services/
    Platform/
    Tenant/
  Support/
  Traits/
```

Backend rules:

- Separate platform and tenant controllers, policies, requests, resources, and services.
- Every tenant query must be scoped by `tenant_id`.
- Every important mutation must write activity/audit logs.
- Use FormRequest validation for every create/update/action endpoint.
- Use API Resources for response shape consistency.
- Use Policies or permission middleware for every protected action.
- Use queues for emails, notifications, PDF generation, imports, exports, reports, backups, sync jobs, and webhooks.
- Encrypt secrets, tokens, account numbers, payment credentials, and integration credentials.

## 3. Database and Storage

### 3.1 Database


| Need       | Recommended Technology                                       |
| ------------ | -------------------------------------------------------------- |
| Primary DB | MySQL 8 or PostgreSQL                                        |
| Local DB   | MySQL through XAMPP is acceptable for development            |
| Migrations | Laravel migrations                                           |
| Seeders    | Laravel seeders for permissions, plans, lookups, master data |
| Backups    | Automated DB dumps and object storage backup                 |
| Audit      | `activity_logs`, `security_events`, API logs                 |

Database standards:

- Use `id BIGINT` internal primary keys and `uuid` for public IDs on major records.
- Use tenant-scoped unique indexes for tenant records.
- Use soft deletes where recovery is required.
- Restrict deletes for accounting, payroll, payment, and compliance records.
- Keep platform billing separate from tenant customer finance.

### 3.2 Cache, Queue, Sessions


| Need           | Recommended Technology                             |
| ---------------- | ---------------------------------------------------- |
| Cache          | Redis                                              |
| Queue          | Redis queue driver                                 |
| Session        | Redis/database/session driver depending deployment |
| Locks          | Redis atomic locks                                 |
| Rate limiting  | Laravel rate limiter backed by Redis               |
| Worker monitor | Laravel Horizon if Redis queues are used           |

### 3.3 File Storage


| Environment | Recommended Storage                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Local       | Laravel local/public disks                                                    |
| Production  | AWS S3, DigitalOcean Spaces, Wasabi, MinIO, or another S3-compatible provider |
| CDN         | CloudFront, Cloudflare CDN, Bunny CDN if public assets need acceleration      |
| Antivirus   | ClamAV or external malware scanning if uploads are high-risk                  |

File categories:

- Profile photos, logos, favicons.
- Documents and attachments.
- Invoice PDFs and payslips.
- Import files and export files.
- Backup archives.

## 4. React Web Frontend Stack

### 4.1 Core Stack


| Need                | Recommended Technology                                        |
| --------------------- | --------------------------------------------------------------- |
| Framework           | React with TypeScript                                         |
| Build tool          | Vite                                                          |
| Routing             | React Router                                                  |
| Data fetching/cache | TanStack Query                                                |
| Forms               | React Hook Form                                               |
| Validation          | Zod                                                           |
| HTTP client         | Axios or fetch wrapper                                        |
| Tables              | TanStack Table                                                |
| Charts              | Recharts, ECharts, or ApexCharts                              |
| Date handling       | date-fns or Day.js                                            |
| State               | Context/Zustand for UI state; TanStack Query for server state |
| Icons               | Lucide React                                                  |
| Styling             | Tailwind CSS or a mature component library plus custom tokens |
| Testing             | Vitest, React Testing Library, MSW, Playwright                |
| Lint/format         | ESLint, Prettier                                              |

### 4.2 React Architecture

Recommended structure:

```text
src/
  app/
  config/
  lib/
    api/
    auth/
    format/
    validation/
  layouts/
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

React standards:

- Separate platform and tenant routes, layouts, API clients, permissions, and navigation.
- Use shared UI primitives for lists, drawers, forms, modals, confirmation dialogs, imports, exports, activity, files, notes, reminders, and communication composer.
- Use TypeScript types for every request and response body.
- Use route-level lazy loading.
- Use permission guards for routes and actions.
- Use a consistent enterprise data-table pattern across modules.

## 5. Flutter App Stack

### 5.1 Core Stack


| Need               | Recommended Technology                                        |
| -------------------- | --------------------------------------------------------------- |
| Framework          | Flutter stable                                                |
| Language           | Dart                                                          |
| UI system          | Material 3                                                    |
| Routing            | go_router                                                     |
| State management   | Riverpod or Bloc                                              |
| HTTP client        | Dio                                                           |
| Models             | freezed, json_serializable                                    |
| Secure storage     | flutter_secure_storage                                        |
| Local cache        | Hive, Isar, Drift, or shared_preferences depending complexity |
| File picker        | file_picker, image_picker                                     |
| Push notifications | Firebase Cloud Messaging                                      |
| Deep links         | app_links or uni_links                                        |
| PDF/files          | open_filex, printing, path_provider                           |
| Charts             | fl_chart or syncfusion_flutter_charts                         |
| Testing            | flutter_test, mocktail, integration_test                      |
| Linting            | flutter_lints or very_good_analysis                           |

### 5.2 Flutter Architecture

Recommended structure:

```text
lib/
  app/
  core/
    config/
    network/
    auth/
    storage/
    utils/
    widgets/
  features/
    platform/
    tenant/
    shared/
  l10n/
  main.dart
```

Flutter standards:

- Keep platform and tenant modules separated.
- Store tokens only in secure storage.
- Support phone and tablet layouts.
- Use bottom sheets for quick actions and full-screen dialogs for complex forms.
- Support offline read-only cache for dashboards/lists where useful.
- Do not queue offline mutations unless a deliberate sync engine is implemented.
- Mask secrets and private values.
- Use permission-aware navigation and actions.

## 6. External APIs and Services

### 6.1 Email


| Provider   | Use Case                                                    |
| ------------ | ------------------------------------------------------------- |
| Amazon SES | Production transactional email, scalable and cost-effective |
| SendGrid   | Transactional email and templates                           |
| Mailgun    | Transactional email and inbound email handling              |
| SMTP       | Tenant-provided SMTP integrations                           |

Required email features:

- Verification emails.
- Password reset emails.
- Staff/user invites.
- Invoices and payment reminders.
- Lead/client/vendor communication.
- Payroll payslips.
- Support ticket replies.
- System alerts.

### 6.2 SMS


| Provider           | Use Case                             |
| -------------------- | -------------------------------------- |
| Twilio             | Global SMS and OTP                   |
| MSG91              | India SMS/OTP                        |
| Textlocal/Fast2SMS | India transactional SMS alternatives |

Required SMS features:

- OTP/2FA if SMS-based auth is used.
- Leave/payroll/attendance notifications.
- Invoice/payment reminders.
- CRM follow-up reminders.

### 6.3 WhatsApp


| Provider                         | Use Case                              |
| ---------------------------------- | --------------------------------------- |
| Meta WhatsApp Business Cloud API | Direct WhatsApp messaging             |
| Twilio WhatsApp                  | Managed WhatsApp integration          |
| Interakt/WATI/Gupshup            | India-focused WhatsApp business tools |

Required WhatsApp features:

- Client communication.
- Invoice reminders.
- Lead follow-ups.
- Support updates.
- Template-based notifications.

### 6.4 Push Notifications


| Provider                 | Use Case                                            |
| -------------------------- | ----------------------------------------------------- |
| Firebase Cloud Messaging | Flutter push notifications and web push if required |
| OneSignal                | Managed notification campaigns and device targeting |

Required push features:

- Task assignments.
- Support issue updates.
- Leave approvals.
- Payroll/payslip notifications.
- Calendar reminders.
- Security alerts.

### 6.5 Payment Gateways


| Provider | Use Case                            |
| ---------- | ------------------------------------- |
| Razorpay | India subscription/payment gateway  |
| Cashfree | India payments and payouts          |
| Stripe   | Global SaaS subscriptions           |
| PayPal   | International payments where needed |

Payment needs:

- SaaS subscription payments for tenants.
- Platform invoice payments.
- Failed payment retries.
- Refunds.
- Webhook verification.
- Payment reconciliation.

### 6.6 Maps, Location, Address


| Provider                | Use Case                                      |
| ------------------------- | ----------------------------------------------- |
| Google Maps Platform    | Maps, places, geocoding, address autocomplete |
| Mapbox                  | Maps and geocoding alternative                |
| OpenStreetMap/Nominatim | Low-cost geocoding/maps for limited use       |

Use cases:

- Tenant offices.
- Client/vendor address autocomplete.
- Attendance location if geo check-in is required.
- Map view for clients/offices if enabled.

### 6.7 Calendar and Meetings


| Provider                  | Use Case                              |
| --------------------------- | --------------------------------------- |
| Google Calendar API       | Calendar sync                         |
| Microsoft Graph Calendar  | Outlook/Microsoft 365 sync            |
| Zoom API                  | Video meetings                        |
| Google Meet via Calendar  | Meeting links through Google Calendar |
| Microsoft Teams via Graph | Teams meeting links                   |

Use cases:

- Calendar event sync.
- Meeting invites.
- Video meeting links.
- Room/event scheduling.

### 6.8 Storage and Drive Integrations


| Provider                                | Use Case                             |
| ----------------------------------------- | -------------------------------------- |
| AWS S3                                  | Production object storage            |
| DigitalOcean Spaces                     | S3-compatible storage                |
| Wasabi                                  | Cost-effective S3-compatible storage |
| MinIO                                   | Self-hosted S3-compatible storage    |
| Google Drive API                        | Tenant storage integration           |
| OneDrive/SharePoint via Microsoft Graph | Microsoft storage integration        |

Use cases:

- Documents and attachments.
- Backup storage.
- Tenant external file sync.

### 6.9 Authentication and Identity Providers


| Provider           | Use Case                                                       |
| -------------------- | ---------------------------------------------------------------- |
| Google OAuth       | Login/integration for tenant users                             |
| Microsoft OAuth    | Microsoft 365 login/integration                                |
| SAML/OIDC provider | Enterprise SSO for larger tenants                              |
| Firebase Auth      | Optional mobile auth helper, not required if Laravel owns auth |

Recommendation:

- Keep Laravel as the primary source of auth for this project.
- Add SSO later for enterprise tenants.

### 6.10 Tax, GST, Invoice, Compliance


| Provider/Tool               | Use Case                                                       |
| ----------------------------- | ---------------------------------------------------------------- |
| GST API provider            | GSTIN validation, e-invoicing, compliance if required in India |
| ClearTax/IRIS/Zoho GST APIs | GST/e-invoice workflows if needed                              |
| Exchange rate API           | Multi-currency reports if needed                               |

Use cases:

- GST number validation.
- Platform tax settings.
- Tenant invoice tax workflows.
- Multi-currency reporting.

### 6.11 Search, AI, and Automation


| Tool                     | Use Case                                                                   |
| -------------------------- | ---------------------------------------------------------------------------- |
| Meilisearch              | Fast app search with simple operations                                     |
| OpenSearch/Elasticsearch | Advanced search/log analytics                                              |
| OpenAI API               | Optional AI summaries, email drafts, ticket summaries, report explanations |
| Queue workers            | Automation, reminders, follow-ups, scheduled reports                       |

Recommendation:

- Start with database search.
- Add Meilisearch when global search becomes slow or complex.
- Add AI only after core workflows are stable.

## 7. DevOps and Infrastructure

### 7.1 Hosting


| Layer          | Recommended Options                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Laravel API    | VPS, Laravel Forge, Ploi, AWS, DigitalOcean, Hetzner, Render, Kubernetes later |
| React web      | Same server, S3/CloudFront, Netlify, Vercel, Cloudflare Pages                  |
| Flutter app    | Google Play Console, Apple Developer Program/TestFlight/App Store              |
| Database       | Managed MySQL/PostgreSQL preferred for production                              |
| Redis          | Managed Redis preferred for production                                         |
| Object storage | S3-compatible storage                                                          |

### 7.2 Server Services


| Need          | Tool                                          |
| --------------- | ----------------------------------------------- |
| Web server    | Nginx or Apache                               |
| PHP process   | PHP-FPM                                       |
| Queue workers | Supervisor or systemd                         |
| Scheduler     | Cron running Laravel scheduler                |
| SSL           | Let's Encrypt, Cloudflare SSL, or managed SSL |
| Backups       | DB backups plus file/object backups           |
| Firewall      | UFW/security groups                           |

### 7.3 CI/CD


| Need           | Tool                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Source control | GitHub/GitLab/Bitbucket                                             |
| CI/CD          | GitHub Actions, GitLab CI, Bitbucket Pipelines                      |
| Backend checks | composer install, php artisan test, pint, PHPStan/Larastan          |
| React checks   | npm install, typecheck, lint, test, build                           |
| Flutter checks | flutter pub get, dart format, flutter analyze, flutter test, builds |
| Deployment     | Forge/Ploi scripts, Docker, SSH deploy, or cloud-native deployment  |

### 7.4 Docker

Docker is recommended for consistent environments, especially when the team grows.

Suggested containers:

- PHP-FPM/Laravel.
- Nginx.
- MySQL/PostgreSQL.
- Redis.
- Queue worker.
- Scheduler.
- Node build container.
- Mailpit for local email testing.
- MinIO for local S3 testing.

## 8. Observability and Operations


| Need             | Recommended Tool                                                           |
| ------------------ | ---------------------------------------------------------------------------- |
| App errors       | Sentry, Bugsnag, Rollbar                                                   |
| Logs             | Laravel logs, CloudWatch, Papertrail, Logtail/Better Stack, ELK/OpenSearch |
| Uptime           | Better Stack, UptimeRobot, Pingdom                                         |
| Performance/APM  | New Relic, Datadog, Blackfire, Sentry Performance                          |
| Queue monitoring | Laravel Horizon                                                            |
| API monitoring   | Custom`api_request_logs`, external uptime checks                           |
| Security events  | `security_events` plus alerting                                            |

Operational needs:

- Error alerts for backend, React, and Flutter.
- Failed queue job alerts.
- Payment webhook failure alerts.
- Backup failure alerts.
- Scheduler failure alerts.
- High API latency alerts.
- Tenant usage limit alerts.

## 9. Security Stack


| Need            | Recommended Approach                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| API auth        | Laravel Sanctum/Passport with token scopes                                |
| RBAC            | Platform and tenant role/permission systems                               |
| MFA/2FA         | TOTP authenticator app first; SMS optional                                |
| Secrets         | Laravel encrypted casts/config, env manager, secret manager in production |
| Password policy | Configurable policy in settings                                           |
| Rate limiting   | Laravel rate limiter + Redis                                              |
| Audit logs      | `activity_logs`, `security_events`, login history                         |
| File safety     | MIME validation, size limits, optional antivirus scanning                 |
| CORS            | Strict allowed origins                                                    |
| Headers         | CSP, HSTS, X-Frame-Options, X-Content-Type-Options                        |
| Backups         | Encrypted backups, retention policy                                       |
| Compliance      | Data retention, consent/legal acceptance if required                      |

Security rules:

- Never return raw credentials or tokens after creation.
- Use signed URLs for private file downloads.
- Enforce tenant scoping in policies and queries.
- Enforce permission checks server-side, not only in UI.
- Log remote login/impersonation with reason and duration.
- Require typed confirmations for high-risk UI actions.

## 10. Testing Stack

### 10.1 Backend Testing


| Test Type          | Tool                     |
| -------------------- | -------------------------- |
| Unit/feature tests | PHPUnit or Pest          |
| API tests          | Laravel HTTP tests       |
| Permission tests   | PHPUnit/Pest             |
| Queue/job tests    | Laravel queue fake/tests |
| PDF/export tests   | Snapshot/file assertions |
| Static analysis    | PHPStan/Larastan         |
| Code style         | Laravel Pint             |

### 10.2 React Testing


| Test Type       | Tool                  |
| ----------------- | ----------------------- |
| Unit tests      | Vitest                |
| Component tests | React Testing Library |
| API mocks       | MSW                   |
| E2E tests       | Playwright            |
| Type checks     | TypeScript            |
| Lint/format     | ESLint, Prettier      |

### 10.3 Flutter Testing


| Test Type         | Tool                                |
| ------------------- | ------------------------------------- |
| Unit tests        | flutter_test                        |
| Widget tests      | flutter_test                        |
| Mocking           | mocktail                            |
| Integration tests | integration_test                    |
| Static analysis   | flutter analyze                     |
| Linting           | flutter_lints or very_good_analysis |

## 11. Local Development Tools


| Need              | Tool                                                |
| ------------------- | ----------------------------------------------------- |
| PHP/Laravel local | XAMPP, Laravel Herd, Laragon, Docker, or native PHP |
| Database GUI      | TablePlus, DBeaver, phpMyAdmin, MySQL Workbench     |
| API testing       | Postman, Insomnia, Bruno                            |
| Mail testing      | Mailpit, Mailhog, Mailtrap                          |
| Redis GUI         | RedisInsight                                        |
| Git GUI           | GitHub Desktop, SourceTree, Fork                    |
| Logs              | Laravel Telescope local, terminal logs              |
| Mobile testing    | Android Studio, Xcode, physical devices             |
| Design            | Figma                                               |
| Documentation     | Markdown docs, Scribe/OpenAPI                       |

## 12. Product and Business Tools


| Area               | Recommended Tools                                                |
| -------------------- | ------------------------------------------------------------------ |
| Project management | Jira, Linear, ClickUp, Trello, GitHub Projects                   |
| Support desk       | Built-in support module first; Zendesk/Freshdesk later if needed |
| Product analytics  | PostHog, Plausible, Google Analytics, Mixpanel                   |
| Session replay     | LogRocket, FullStory, PostHog session replay                     |
| Customer messaging | Intercom, Crisp, Tawk.to                                         |
| Status page        | Better Stack status page, Atlassian Statuspage, Cachet           |
| Documentation/help | Built-in KB, GitBook, Docusaurus                                 |

## 13. Recommended Integration Phases

### Phase 1: Core MVP

- Laravel API, MySQL/PostgreSQL, Redis.
- React web app.
- Flutter tenant mobile app foundation.
- Auth, RBAC, tenant scoping.
- Files on local/S3 storage.
- Email provider.
- Basic notifications.
- Basic reports.
- CI/CD and backups.
- Error tracking.

### Phase 2: SaaS Billing and Operations

- Payment gateway.
- Subscription billing webhooks.
- Invoice PDFs.
- Queue monitoring.
- Platform monitoring and alerts.
- Import/export flows.
- Push notifications.
- WhatsApp/SMS integrations.

### Phase 3: Enterprise Features

- SSO/SAML/OIDC.
- Advanced search with Meilisearch/OpenSearch.
- Advanced reports and scheduled exports.
- External calendar sync.
- Google/Microsoft integrations.
- Tenant backups/restores.
- Knowledge base and support portal.
- Legal document acceptance.

### Phase 4: Scale and Intelligence

- Multi-region infrastructure if needed.
- CDN and advanced object storage policies.
- Data warehouse/BI integrations.
- AI summaries/drafts/insights.
- Advanced audit/compliance features.
- Mobile offline read cache and deep links.

## 14. Final Stack Summary

### Backend: Laravel APIs

- PHP, Laravel, Composer.
- MySQL/PostgreSQL.
- Redis for cache, queues, locks, rate limits.
- Sanctum/Passport for API auth.
- Spatie Permission for RBAC.
- Queues, scheduler, Horizon.
- S3-compatible storage.
- PDF, Excel import/export, notifications.
- PHPUnit/Pest, Pint, PHPStan/Larastan.

### Frontend Website: React

- React, TypeScript, Vite.
- React Router.
- TanStack Query and TanStack Table.
- React Hook Form and Zod.
- Axios/fetch API clients.
- Recharts/ECharts/ApexCharts.
- Tailwind CSS or enterprise component system.
- Vitest, React Testing Library, MSW, Playwright.

### Mobile App: Flutter

- Flutter, Dart, Material 3.
- go_router.
- Riverpod or Bloc.
- Dio.
- freezed/json_serializable.
- flutter_secure_storage.
- file_picker/image_picker.
- Firebase Cloud Messaging.
- flutter_test, mocktail, integration_test.

### External Services

- Email: SES/SendGrid/Mailgun/SMTP.
- SMS: Twilio/MSG91/Textlocal/Fast2SMS.
- WhatsApp: Meta Cloud API/Twilio/WATI/Interakt/Gupshup.
- Push: Firebase Cloud Messaging/OneSignal.
- Payments: Razorpay/Cashfree/Stripe/PayPal.
- Storage: AWS S3/DigitalOcean Spaces/Wasabi/MinIO.
- Maps: Google Maps/Mapbox/OpenStreetMap.
- Calendar/meetings: Google Calendar, Microsoft Graph, Zoom, Teams.
- Monitoring: Sentry, Better Stack/UptimeRobot, Horizon, logs/APM.
- CI/CD: GitHub Actions or equivalent.

## 15. Decision Notes

- Start simple: Laravel + MySQL + Redis + React + Flutter + S3 + Email + Error tracking.
- Add complex integrations only when workflows need them.
- Keep all integrations behind provider interfaces so tenants can use different providers later.
- Prioritize backend tenant scoping and permission checks before frontend polish.
- Build React first for full admin/tenant coverage, then Flutter for high-value mobile workflows.
