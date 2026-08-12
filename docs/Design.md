# MyCRM Frontend Design System

This guide keeps Platform Admin and Tenant CRM pages visually consistent. Every new page should reuse the shared shell, page header, KPI cards, tables, tabs, modals, drawers, and form patterns instead of creating one-off layouts.

## Design Goals

- Keep Platform and Tenant pages using the same structure and interaction patterns.
- Show live data in readable UI. Do not display raw JSON to users.
- Use clear labels, title case display text, and relational dropdowns instead of UUID inputs.
- Keep pages compact, scannable, and work-focused.
- Use placeholders only when a backend table/API is genuinely missing, and clearly say the module route is ready.

## Global App Structure

Use the shared app shell for both Platform and Tenant:

- Sidebar: `AppSidebar`
- Topbar: `AppTopbar`
- Layouts: `PlatformLayout` and `TenantLayout`
- Page body wrapper: `enterprise-module-page`

All pages should follow this order:

1. Page title section with breadcrumbs/title on the left and actions on the right.
2. KPI/summary cards when the page has counts, totals, or health values.
3. Main data section: table, grid, Kanban, tabs, or form.
4. Modals/drawers for secondary workflows.

## Page Header

Always use `PageHeader` for module pages.

Header rules:

- Title uses the module/page name.
- Description should be short and business-focused.
- Main actions stay on the right.
- Use icons in buttons when available from `lucide-react`.
- Do not create custom hero sections for admin/CRM modules.

Example:

```tsx
<PageHeader
  title="Clients"
  description="Live clients from party and client profile tables."
  actions={<Button type="button">Create Client</Button>}
/>
```

## KPI Cards

Use `summary-grid` with `summary-card`.

KPI rules:

- Place KPIs directly after `PageHeader`.
- Use 3 to 6 cards when possible.
- Labels must be title case.
- Values must be formatted for humans: currency, percentages, counts, dates.
- Do not repeat the same value later unless the later section needs context.

Example:

```tsx
<div className="summary-grid">
  <article className="summary-card">
    <span>Open Leads</span>
    <strong>{openLeads}</strong>
  </article>
</div>
```

## Tables

Use the shared `DataTable` for list pages.

Every list table should include:

- Search
- Views
- Filters
- Columns
- Export
- Import, when backend supports import
- Pagination
- Multi-select when bulk actions exist

Table rules:

- Use readable columns first: name, code, email, status, owner, amount, created date.
- Hide internal IDs unless users need them for support/debugging.
- Never show UUID as an input field. Use dropdown selectors and submit the UUID in the payload.
- Use `StatusBadge` for status, priority, severity, health, active/inactive values.
- Display values in title case where possible.
- Format dates, money, booleans, and empty values.
- Empty value text should be `-`.

Row actions:

- Prefer a 3-dot action menu for more than 3 actions.
- If inline actions are used temporarily, keep them compact with `inline-actions`.
- Common actions: View, Edit, Activate, Deactivate, Delete, Export.
- Destructive actions must use confirmation modals.

## View Pages

View pages should use:

- `PageHeader`
- Optional KPI/summary cards
- `Tabs`
- `detail-grid` for object details
- `RecordList` or `DataTable` for related rows

View page rules:

- Do not repeat the same information in multiple sections.
- Keep identity and profile details separated when the backend returns both.
- Use readable field labels, not database column names.
- Do not show raw JSON. For object values, show the best human label or `Details available`.
- Use tabs for related resources instead of stacking everything vertically.

Recommended tab order:

- Overview
- Contacts
- Addresses
- Main related business records
- Files/Documents
- Notes
- Timeline/Activity

## Forms

Use shared form styling:

- `enterprise-form` for full-page forms
- `settings-panel` for small forms
- `form-grid form-grid--two` for two-column forms
- `FormField` when using shared component forms

Form rules:

- Labels must be human-readable and title case.
- Required fields should be clear.
- Relational fields must use dropdowns or searchable selects.
- Submit UUIDs internally, but show names/codes/emails to users.
- Booleans should use checkbox/toggle style.
- Dates should use date/datetime inputs.
- Money/percentage fields should use numeric inputs.

Relational dropdown examples:

- User fields: show `display_name` and `email`, submit `uuid`.
- Client/vendor/lead fields: show `display_name`, code, and email, submit `uuid`.
- File fields: show `original_name`, submit `uuid`.
- Lookup fields: show lookup `name` and `code`, submit `uuid`.

## Modals And Drawers

Use:

- `AppModal` for confirmations, short forms, import/export, wizard steps.
- `AppDrawer` for detail inspection, long editors, timelines, compare views, payload views.

Modal/drawer rules:

- Header title must describe the action.
- Footer buttons are always right aligned.
- Secondary button closes/cancels.
- Primary button performs the action.
- Destructive button uses `variant="danger"`.
- Show loading and error states inside the modal/drawer.
- Keep modal fields in `form-grid`.
- Use drawers for workflows that need more vertical space.

Common workflow components:

- `ExportModal`
- `ImportWizard`
- `ConfirmDialog`
- `StatusChangeModal`
- `AuditCompareDrawer`
- `RawPayloadDrawer` only for technical/admin debug screens, not normal user views.

## Popups And Wizards

Use consistent steps and language.

Required patterns:

- Import wizard: upload, mapping, preview, progress, complete.
- Export popup: format, delivery, scope, timezone, email when ready.
- Merge wizard: primary record dropdown, duplicate records selector, reason, confirm.
- Assign owner/role/team: dropdown selector, confirm.
- Bank account popup: masked preview, no plain account number after save.
- Token create/rotate: copy-once view.

## Navigation

Navigation must use shared route constants:

- Platform routes: `PLATFORM_ROUTES`
- Tenant routes: `TENANT_ROUTES`

Navigation rules:

- Sidebar links must point to implemented list/dashboard routes.
- Disabled modules should be hidden or disabled by tenant guard/permissions.
- Permission-restricted pages must use `RequirePermission`.
- Inner pages must have working back/list links.
- Do not hard-code tenant slugs. Use route params and route helpers.

## Data Display

Never show raw API responses.

Use these display patterns:

- Object detail: `detail-grid`
- List rows: `DataTable`
- Small related rows: `record-list`
- Status: `StatusBadge`
- Empty data: `empty-state`
- Loading: `surface-state`
- Error: `surface-error`

Display formatting:

- Booleans: `Yes` / `No`
- Empty values: `-`
- Arrays: `3 items`
- Objects: best label from `display_name`, `name`, `title`, `subject`, `email`, `status`
- Dates: localized readable date/time
- Money: currency format
- Percent: include `%`

Avoid:

- `JSON.stringify(...)` in user-facing UI
- Raw IDs/UUIDs as visible inputs
- Long unwrapped text in table cells
- Repeating the same field in overview and profile sections

## Buttons

Use shared `Button` and `PermissionButton`.

Button rules:

- Primary: main page action or final modal action.
- Secondary: navigation, edit, filters, non-destructive secondary actions.
- Danger: delete, revoke, suspend, mark lost, destructive confirmations.
- Ghost: low-emphasis icon actions.
- Use icons for create, edit, export, import, refresh, upload, download, delete, settings.
- Keep button text short.

## Status And Feedback

Use:

- `StatusBadge` for statuses.
- `surface-state` for success, loading, and neutral states.
- `surface-error` for API errors.
- `empty-state` for no records.

Status tones:

- Success: active, approved, completed, paid, won, operational.
- Warning: pending, queued, open, invited, partial.
- Danger: inactive, failed, suspended, lost, overdue, cancelled.
- Neutral: draft, unknown, archived.

## Layout Rules

- Use `enterprise-module-page` for all module pages.
- Use `settings-grid` for two-column panels.
- Use `settings-panel` for independent panels.
- Use `summary-grid` for KPI cards.
- Use `detail-grid` for field/value display.
- Use `form-grid form-grid--two` for standard forms.
- Do not nest cards inside cards.
- Keep cards/panels at `8px` to `10px` radius.
- Use responsive grids with `auto-fit` or collapse to one column on mobile.
- Text must wrap cleanly and never overlap.

## Color And Visual Style

Current app style:

- Background: light blue-gray workspace.
- Surfaces: white panels with subtle borders.
- Sidebar: dark blue gradient.
- Primary action: blue.
- Accent: cyan.
- Success: green.
- Warning: amber/orange.
- Danger: red.

Rules:

- Do not introduce a new dominant color theme per module.
- Do not use decorative gradient blobs or marketing-style hero blocks in admin modules.
- Keep operational pages quiet, dense, and scannable.
- Use shadows lightly and consistently through existing surface classes.

## Platform And Tenant Consistency

Platform and Tenant pages should feel like the same product:

- Same sidebar/topbar structure.
- Same page header structure.
- Same KPI cards.
- Same table toolbar.
- Same modal/drawer behavior.
- Same empty/loading/error states.
- Same tabs and detail-grid display.

Differences are allowed only for content and permissions, not layout language.

## Implementation Checklist

Before considering a page complete:

- Page uses `enterprise-module-page`.
- Page uses `PageHeader`.
- List view uses `DataTable`.
- Search works.
- Navigation links work.
- View page tabs render live data or a clear placeholder.
- Buttons call real APIs or show a clear missing-API placeholder.
- Relational fields use dropdowns, not UUID text inputs.
- No raw JSON is displayed.
- Empty/loading/error states are present.
- Import/export shows queued job feedback when applicable.
- Destructive actions have confirmation.
- Page passes `npm run typecheck`.
- Page builds with `npm run build`.

## Queue Note

When import/export is queued, use:

```bash
php artisan queue:work --queue=exports,imports,default
```
