# Frontend Architecture

This React frontend is organized for two product surfaces:

- `src/features/platform`: SaaS owner/staff administration.
- `src/features/tenant`: tenant-scoped CRM workspaces.
- `src/shared`: reusable primitives, composition components, hooks, utilities, and types.
- `src/lib/api`: shared HTTP machinery plus platform and tenant client entry points.
- `src/app`: application providers, router, and cross-app bootstrapping.

## Routing

Route constants live beside each feature:

- `src/features/platform/routes/platformRoutes.ts`
- `src/features/tenant/routes/tenantRoutes.ts`

The active router is intentionally a shell in `src/app/router/appRouter.tsx`; full page routes should be added module by module.

## API Clients

Platform APIs use `/api/platform/v1` and tenant APIs use `/api/tenant/v1`, matching the docs. The tenant client requires a tenant slug or UUID so every request can include `X-Tenant`.

Use `platformClient` and `createTenantClient(tenant)` from `src/lib/api`. Responses are normalized to `{ data, meta, links }`, including paginated list envelopes. API errors are thrown as `ApiError` with `status`, `code`, `validationErrors`, and `requestId`.

Common list query params should be built with `createListQuery` and `withFilter`, which serialize filters as `filter[field]`. Mutating billing, finance, payroll, security, and bulk actions should pass `withIdempotency(group, action, subjectId)` so the API receives an `Idempotency-Key`.

The HTTP wrapper retries read requests only for transient network/server failures. Mutations are never retried automatically.

## Shared UI

Reusable component folders are in:

- `src/shared/components/data-table`
- `src/shared/components/drawer`
- `src/shared/components/modal`
- `src/shared/components/form`
- `src/shared/components/chart`
- `src/shared/components/file`
- `src/shared/components/activity`
- `src/shared/components/navigation`

These are light placeholders for now and should be expanded into the production component system before implementing hundreds of pages.

## Quality Setup

Recommended baseline:

- ESLint for TypeScript, React hooks, and React refresh.
- Prettier for formatting.
- Vitest, Testing Library, and jsdom for unit and component tests.
- Add Playwright later for route shell, permissions, list controls, modal/drawer, and workflow tests.
