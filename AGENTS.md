# Agent instructions

When adding or extending **Jack Henry** features in this package, follow the **vertical feature slice** pattern: colocate types, Pinia store, and components under `src/features/jack-henry/<domain-kebab>/`, wire a thin page in `src/views/admin/`, register the route in `MainRoutes` as a **child of `/configuration`** (two-panel shell), and add a left-rail link in [`ConfigurationLayout.vue`](src/views/configuration/ConfigurationLayout.vue) (reuse paths from [`configurationNavItems.ts`](src/views/configuration/configurationNavItems.ts) for static sections). Match naming, axios usage, and UI patterns from existing slices (for example Job Titles and Pay Grades).

**Authoritative guide:** [documents/vertical-feature-slice.md](documents/vertical-feature-slice.md)

**Configuration shell only (nested `/configuration` routes and left nav):** [documents/adding-configuration-pages.md](documents/adding-configuration-pages.md)

## Checklist for a new admin CRUD slice

1. **Types** — `src/features/jack-henry/<feature>/types/<Entity>.ts` (entity, `Create`/`Update` DTOs, domain unions if needed).
2. **Store** — `stores/<entity>Store.ts` (REST path constant, `fetch` / optional `getById` / `create` / `update` / `delete`, `clearError`, shared `axios` + error helper).
3. **Components** — `<Entity>Form.vue` (dialog, expose `openCreate` / `openEdit` / `close`) and `<Entity>Table.vue` (list, search, save/delete wiring, `useConfirm` for delete).
4. **View** — `src/views/admin/<Feature>View.vue` (card + title + table only).
5. **Router** — nested child in [`src/router/MainRoutes.ts`](src/router/MainRoutes.ts) under the `/configuration` parent (path like `'/configuration/<feature-segment>'` using a relative child `path` next to siblings such as `job-titles`), lazy-loaded view.
6. **Navigation** — top-level **Configuration** item in [`sidebarItems.ts`](src/layouts/full/vertical-sidebar/sidebarItems.ts) opens the shell; add your section to `configurationSectionLinks` in [`configurationNavItems.ts`](src/views/configuration/configurationNavItems.ts) and to the `children` array of the `/configuration` route in `MainRoutes`.
7. **API** — confirm REST path segments and [`src/utils/axios.ts`](src/utils/axios.ts) base URL (`VITE_API_URL`) match the backend.

For step-by-step detail, file references, and optional variations (related entities, non-admin routes), use the linked guide.
