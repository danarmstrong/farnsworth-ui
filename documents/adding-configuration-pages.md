# Adding new configuration pages (AI agent guide)

This document explains how to register a **new Jack Henry configuration page**: reference-data CRUD (or similar) that appears under the **Configuration** area in the app shell.

Use it together with:

- **[`AGENTS.md`](../AGENTS.md)** — high-level checklist for a new slice.
- **[`documents/vertical-feature-slice.md`](vertical-feature-slice.md)** — types, Pinia store, form/table components, axios patterns, and thin view structure.

This guide focuses only on **routing**, **URLs**, and **left-rail navigation** for the two-panel configuration layout.

---

## What “configuration” means here

- **Main sidebar** ([`src/layouts/full/vertical-sidebar/sidebarItems.ts`](../src/layouts/full/vertical-sidebar/sidebarItems.ts)): a single top-level item **Configuration** opens the shell. Do **not** add per-feature entries there for Jack Henry reference data.
- **Shell** ([`src/views/configuration/ConfigurationLayout.vue`](../src/views/configuration/ConfigurationLayout.vue)): left column = static links from [`configurationNavItems.ts`](../src/views/configuration/configurationNavItems.ts) plus CAP-specific dynamic links; right column = `<RouterView />` for the active page.
- **URLs**: all such pages live under **`/configuration/<segment>`** (for example `/configuration/widgets`). Legacy **`/admin/<segment>`** redirects exist for older bookmarks only when a matching redirect row is present in the router.

---

## Checklist (configuration wiring only)

Assume the vertical slice (types, store, table, form) and a thin view [`src/views/admin/<Feature>View.vue`](../src/views/admin/) already exist or you are adding them per the vertical-feature-slice guide.

1. **Choose a URL segment** — kebab-case, plural or conventional for the domain (examples: `job-titles`, `pay-grades`). Full path: `/configuration/<segment>`.

2. **Register the nested route** — in [`src/router/MainRoutes.ts`](../src/router/MainRoutes.ts), inside the parent object with `path: '/configuration'`, add a **child** next to the existing entries:

   - **`path`**: relative string only (no leading slash), e.g. `'widgets'`.
   - **`name`**: human-readable, unique among siblings (e.g. `'Widgets'`).
   - **`component`**: lazy import of the thin view, e.g. `() => import('@/views/admin/WidgetsView.vue')`.

   The parent already uses `FullLayout` and `requiresAuth` via `MainRoutes`; nested children inherit that context.

3. **Add the left-rail link** — in [`src/views/configuration/configurationNavItems.ts`](../src/views/configuration/configurationNavItems.ts), append to **`configurationSectionLinks`**:

   - Use **`CONFIGURATION_BASE`** for the prefix so the `to` value stays consistent, for example:

     ```ts
     { title: 'Widgets', to: `${CONFIGURATION_BASE}/widgets` }
     ```
   - Keep **`title`** user-facing and aligned with the view heading.
   - **Order** in the array is the order of items in the left nav.

4. **Optional: legacy `/admin/...` redirect** — if old links or docs used `/admin/<segment>`, add a redirect sibling next to the other legacy admin redirects in `MainRoutes.ts`:

   ```ts
   { path: '/admin/widgets', redirect: '/configuration/widgets' }
   ```

5. **API** — unchanged from the slice guide: REST paths and [`src/utils/axios.ts`](../src/utils/axios.ts) / `VITE_API_URL` must match the backend.

---

## Conventions to match

| Item | Convention |
|------|----------------|
| Feature folder | `src/features/jack-henry/<domain-kebab>/` |
| Thin page | `src/views/admin/<Feature>View.vue` — `v-card`, title, one table (or composed panels); keep it thin |
| Route child `path` | kebab-case segment; must match the last segment of `to` in `configurationSectionLinks` |
| `configurationSectionLinks[].to` | Must equal `'/configuration/'` + same segment as the route child |

Copy an existing pair (for example **Job Titles**: `JobTitlesView.vue`, path `job-titles`, link title `Job Titles`) and rename consistently.

---

## Special cases

### Query parameters on the same path

**CAP Projects** uses the same path for the table (`/configuration/cap-projects`) and per-project reports (`?projectId=...`). The shell [`ConfigurationLayout.vue`](../src/views/configuration/ConfigurationLayout.vue) contains **hard-coded** active-state and list-item logic for that path only. If you add another page with multiple “modes” on one path, you must extend that layout (or refactor shared nav behavior) so the correct left-rail item stays highlighted.

### Dynamic left-rail items (not in `configurationNavItems`)

CAP **report** shortcuts are built in `ConfigurationLayout` from `useCapProjectStore()`. For a different feature that needs dynamic sub-links, either:

- add them beside the static list in `ConfigurationLayout` (similar pattern), or
- introduce a small composable or config module so the layout stays readable.

Do not reintroduce per-project links in the main vertical sidebar; keep dynamic shortcuts inside the configuration shell.

---

## Verification

1. Navigate from the main sidebar **Configuration** — default redirect should still work; your new segment appears in the left list and navigates correctly.
2. Direct URL `/configuration/<segment>` loads the thin view in the **right** column only (left rail remains the shell).
3. `pnpm run typecheck` (and `pnpm run build` if you changed routes or imports) succeeds.
4. If you added a legacy redirect, `/admin/<segment>` reaches the new page and preserves behavior you care about (query preserved only if you use a function redirect like CAP projects).

---

## Files reference (quick map)

| Concern | File |
|--------|------|
| Nested routes + legacy redirects | [`src/router/MainRoutes.ts`](../src/router/MainRoutes.ts) |
| Left-rail static links | [`src/views/configuration/configurationNavItems.ts`](../src/views/configuration/configurationNavItems.ts) |
| Two-panel shell + CAP dynamic links | [`src/views/configuration/ConfigurationLayout.vue`](../src/views/configuration/ConfigurationLayout.vue) |
| Main app sidebar (single Configuration entry) | [`src/layouts/full/vertical-sidebar/sidebarItems.ts`](../src/layouts/full/vertical-sidebar/sidebarItems.ts) |
| Slice implementation detail | [`documents/vertical-feature-slice.md`](vertical-feature-slice.md) |
