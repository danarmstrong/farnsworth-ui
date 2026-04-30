# Dark Template - Internal Developer Guide

This README is for personal/internal use while turning this template into your own product.

It covers:
- Daily development with `pnpm`
- How the template currently uses mock APIs
- How to connect to your real backend (including `/auth/login`)
- How to implement real auth cleanly
- How to build and deploy to Ubuntu with Nginx

For icon usage with the bundled Solar and Tabler sets, see [`17) Icons Quickstart`](#17-icons-quickstart).

## Quick links

- [Project overview](#1-project-overview)
- [Run and validate locally](#4-run-and-validate-locally)
- [Auth and API strategy](#7-recommended-real-api-strategy)
- [Deployment](#10-deploy-on-ubuntu-with-nginx-recommended)
- [Layout and navigation map](#16-layout-and-navigation-customization-map)
- [Icons quickstart](#17-icons-quickstart)
- [Default landing page](#19-changing-the-default-index--landing-page)

## 1) Project Overview

Tech stack in this package:
- Vue 3 + TypeScript + Vite
- Vuetify 3
- Pinia for state
- Vue Router
- axios + axios-mock-adapter (template mock data)

Important entry points:
- `src/main.ts` - app bootstrap, plugins, and mock wiring
- `src/router/index.ts` - router and auth guard
- `src/features/auth/stores/authStore.ts` - login/logout state
- `src/utils/helpers/fetch-wrapper.ts` - auth-aware `fetch` helper
- `src/utils/axios.ts` - shared axios instance used by most stores

## 2) Prerequisites

Confirmed from this package:
- `pnpm-lock.yaml` exists, so this guide is pnpm-only
- Scripts are defined in `package.json`

Install dependencies:

```bash
pnpm install
```

## 3) Environment Configuration

Current `.env` now uses real-backend mode by default:

```dotenv
VITE_API_URL="/api"
VITE_ENABLE_MOCKS="false"
```

Use `.env.example` as the baseline for new environments.

- `VITE_API_URL` controls where frontend API calls go
- `VITE_ENABLE_MOCKS` toggles template mocks on/off

Recommended production-style value:

```dotenv
VITE_API_URL="/api"
```

Why `/api` is recommended:
- Lets Nginx proxy frontend and backend under one domain
- Avoids most CORS complexity
- Keeps local and production patterns closer

If you prefer direct backend URL, you can also use:

```dotenv
VITE_API_URL="https://api.your-domain.com"
VITE_ENABLE_MOCKS="false"
```

## 4) Run and Validate Locally

Development server:

```bash
pnpm dev
```

Type check:

```bash
pnpm typecheck
```

Lint:

```bash
pnpm lint
```

Run pre-deploy checks (typecheck + lint):

```bash
pnpm check
```

Production build:

```bash
pnpm build
```

One command for deploy prep (checks + build):

```bash
pnpm deploy:prepare
```

Preview production build:

```bash
pnpm preview
```

## 5) How the Template Works Right Now (Mock Mode)

Mock behavior is now controlled by `VITE_ENABLE_MOCKS` in `src/main.ts`.

- `VITE_ENABLE_MOCKS="true"` loads `./_mockApis` (axios-mock-adapter) for both auth and feature endpoints
- `VITE_ENABLE_MOCKS="false"` skips all mock interception (recommended for real backend)

Auth login mock is in `src/_mockApis/auth.ts` and handles:
- `POST /auth/login` endpoint
- Returns proper token response shape for the auth store

Mock credentials (template only):
- Username: `info@wrappixel.com`
- Password: `admin123`

These are used in `src/_mockApis/auth.ts` and are for local template behavior only.

## 6) What `fetchWrapper` Means

`fetchWrapper` (`src/utils/helpers/fetch-wrapper.ts`) is a small helper around browser `fetch` that:
- Adds `Authorization: Bearer <token>` if user is logged in
- Reads auth state from `useAuthStore`
- Auto-logs out on `401`/`403`

Current state:
- `src/features/auth/stores/authStore.ts` now uses axios for `/auth/login`
- `fetchWrapper` remains available for any fetch-based store calls still in the codebase

## 7) Recommended Real API Strategy

Use one API style consistently. Current implementation now does:
- Auth login in `src/features/auth/stores/authStore.ts` via axios
- Calls `POST /auth/login` (resolved through axios `baseURL = VITE_API_URL`)
- Persists auth user/token in localStorage (`user` key)
- Adds bearer token automatically in `src/utils/axios.ts` request interceptor

### 7.1 Disable Mocks When Moving to Real Backend

Set in `.env`:

```dotenv
VITE_ENABLE_MOCKS="false"
```

No code comment/removal is required as long as this flag is false.

### 7.2 Auth Endpoint Contract

Configured login route:
- `POST ${VITE_API_URL}/auth/login`

Typical payload:

```json
{
  "username": "user@example.com",
  "password": "secret"
}
```

Supported token fields from backend response:
- `accessToken` (preferred)
- `token`
- `jwt`

Expected response shape (example):

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "Your User"
  },
  "accessToken": "jwt-or-token-value",
  "refreshToken": "optional-refresh-token"
}
```

Then `useAuthStore` persists normalized user state and redirects to `returnUrl` or `/dashboard1`.

### 7.3 Route Protection

Current guard is in `src/router/index.ts` and checks `meta.requiresAuth`.
Keep this pattern:
- Public pages under routes without `requiresAuth`
- Protected pages under routes with `requiresAuth: true`
- Redirect unauthenticated users to `/auth/login`

## 8) Migrating Feature Stores from Mock to Real Endpoints

Many stores currently call template endpoints like `/api/data/...` and are mocked in `src/_mockApis/*`.

Example migration process:
1. Pick one store (for example `src/stores/apps/chat.ts`)
2. Replace `/api/data/chat/ChatData` with your backend route
3. Ensure response mapping matches store expectations (`data.data` vs `data`)
4. Remove matching mock handler from `src/_mockApis/...`
5. Test the feature end-to-end

Repeat store by store (chat, email, notes, invoice, tickets, etc.).

## 9) Build for Deployment

Create production assets:

```bash
pnpm build
```

Output directory:
- `dist/`

You deploy static files from `dist/` to your server.

## 10) Deploy on Ubuntu with Nginx (Recommended)

This is the recommended pattern for your setup:
- Nginx serves Vue SPA static files
- Nginx proxies `/api/` requests to your backend service
- Frontend uses `VITE_API_URL="/api"`

### 10.1 Example Nginx Site Config

Adjust domain, paths, and backend port:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/spike-dark/dist;
    index index.html;

    # SPA fallback (equivalent to Netlify _redirects behavior)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API to backend app
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If your backend expects `/api` prefix to be preserved, use:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    ...
}
```

### 10.2 Basic Deploy Flow (Ubuntu)

Build locally or on server, then copy `dist`:

```bash
pnpm install
pnpm build
```

Place/copy files to your web root, then reload Nginx.

Example (paths may differ):

```bash
sudo mkdir -p /var/www/spike-dark
sudo rsync -av --delete dist/ /var/www/spike-dark/dist/
sudo nginx -t
sudo systemctl reload nginx
```

## 11) Production Auth Notes

For real auth in production:
- Use HTTPS
- Prefer short-lived access tokens + refresh strategy
- Handle token expiry (refresh or force re-login)
- Avoid storing sensitive data beyond what the UI needs
- Keep logout clearing local state and persisted auth storage

## 12) Internal Working Conventions

Suggested workflow for edits:
1. Update feature code in `src/views`, `src/components`, `src/stores`
2. Run:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm build`
3. Validate routes manually with `pnpm preview`
4. Deploy only after local production build passes

## 13) Quick Troubleshooting

- Blank page after deploy:
  - Check Nginx `try_files ... /index.html` SPA fallback
- API calls failing:
  - Check `VITE_API_URL` value
  - Check Nginx `/api/` proxy target and backend port
- Login loops to `/auth/login`:
  - Verify token is saved in auth store/localStorage
  - Verify guard condition in `src/router/index.ts`
- Data still looks mocked:
  - Ensure `VITE_ENABLE_MOCKS="false"`

## 14) Next Cleanup You May Want

As you productionize further, consider:
- Consolidating auth + API calls on one client pattern (axios-only or fetch-only)
- Adding strict types for backend response DTOs
- Adding automated tests for auth store and route guard behavior

## 15) Mock Auth Handler Details

When `VITE_ENABLE_MOCKS="true"`, the app intercepts `POST /auth/login` via axios-mock-adapter.

**Mock auth handler location:**
- `src/_mockApis/auth.ts` - intercepts login requests and returns mock token response
- Imported in `src/_mockApis/index.ts` so it activates with all other mocks

**To replace with real backend:**
1. Set `VITE_ENABLE_MOCKS="false"` in `.env`
2. Update `VITE_API_URL` to point to your backend (e.g., `/api` or full URL)
3. Ensure your backend's `/auth/login` returns response with `user` object and `accessToken` field
4. The auth store (`src/features/auth/stores/authStore.ts`) will automatically read and persist the token

The mock handler in `src/_mockApis/auth.ts` is safe to leave in place even after deleting the mock wiring, as it will never be called if `VITE_ENABLE_MOCKS="false"`.

## 16) Layout and Navigation Customization Map

If you are not sure where to edit layout/navigation, use this file map first.

### Core layout shells

- Main app shell (sidebar + header + content): `src/layouts/full/FullLayout.vue`
- Auth/public-minimal shell: `src/layouts/blank/BlankLayout.vue`
- Main protected route group using full layout: `src/router/MainRoutes.ts`
- Auth/public route group using blank layout: `src/router/AuthRoutes.ts`

### Side navigation sources

- Vertical sidebar menu data: `src/layouts/full/vertical-sidebar/sidebarItems.ts`
- Vertical sidebar renderer: `src/layouts/full/vertical-sidebar/VerticalSidebar.vue`
- Horizontal menu data: `src/layouts/full/horizontal-sidebar/horizontalItems.ts`
- Horizontal menu renderer: `src/layouts/full/horizontal-sidebar/HorizontalSidebar.vue`

Important: if you support both vertical and horizontal layouts, keep both menu files in sync.

### Header, profile menu, and top bar

- Vertical header layout/actions: `src/layouts/full/vertical-header/VerticalHeader.vue`
- Horizontal header layout/actions: `src/layouts/full/horizontal-header/HorizontalHeader.vue`
- Profile dropdown (logout button, profile links): `src/layouts/full/vertical-header/ProfileDD.vue`
- Notification/search/language pieces are in the same `vertical-header` folder.

### Theme/layout toggles and defaults

- Runtime UI toggles panel: `src/layouts/full/customizer/Customizer.vue`
- Layout/theme state store: `src/stores/customizer.ts`
- Default startup values: `src/config.ts`
- Vuetify theme registration: `src/plugins/vuetify.ts`
- Theme color definitions: `src/theme/LightTheme.ts`, `src/theme/DarkTheme.ts`

### Logo and branding

- Logo selector component: `src/layouts/full/logo/Logo.vue`
- Actual logo variants: `src/layouts/full/logo/LogoLight.vue`, `src/layouts/full/logo/LogoDark.vue`, `src/layouts/full/logo/LogoLightRtl.vue`, `src/layouts/full/logo/LogoDarkRtl.vue`
- Image assets: `src/assets/images/logos/`

### Front/marketing layout files

These are separate from admin shell and useful if you customize the marketing pages:

- Front page wrapper: `src/views/pages/front-pages/Layout.vue`
- Front header/nav/footer: `src/components/frontpages/layout/Header.vue`, `src/components/frontpages/layout/Navigation.vue`, `src/components/frontpages/layout/Footer.vue`

### Styling files for layout chrome

- Sidebar styles: `src/scss/layout/_sidebar.scss`
- Top/header styles: `src/scss/layout/_topbar.scss`
- Horizontal menu styles: `src/scss/layout/_horizontal.scss`
- RTL, container, customizer styles: `src/scss/layout/_rtl.scss`, `src/scss/layout/_container.scss`, `src/scss/layout/_customizer.scss`

### Common customization recipes

1. Add/remove a sidebar item
    - Add route in `src/router/MainRoutes.ts` (or `src/router/AuthRoutes.ts` if public)
    - Add menu entry in `src/layouts/full/vertical-sidebar/sidebarItems.ts`
    - If horizontal layout is enabled, mirror it in `src/layouts/full/horizontal-sidebar/horizontalItems.ts`

2. Change default layout behavior
    - Edit defaults in `src/config.ts` (`mini_sidebar`, `setHorizontalLayout`, `setRTLLayout`, `boxed`, `actTheme`)

3. Force one layout mode and hide user toggles
    - Keep desired value in `src/config.ts`
    - Remove/hide corresponding controls in `src/layouts/full/customizer/Customizer.vue`

4. Replace branding
    - Swap logo assets in `src/assets/images/logos/`
    - Update logo components in `src/layouts/full/logo/*` if dimensions/markup differ

5. Customize header actions (icons, cart, profile, search)
    - Edit `src/layouts/full/vertical-header/VerticalHeader.vue` and/or `src/layouts/full/horizontal-header/HorizontalHeader.vue`

6. Customize front-page top nav and footer links
    - Edit nav items array in `src/components/frontpages/layout/Navigation.vue`
    - Edit footer component and data source (`@/_mockApis/front-pages/PagesData`) used in `src/components/frontpages/layout/Footer.vue`

## 17) Icons Quickstart

Both icon systems used by the template are already installed. You do not need extra setup to start using them.

### Use Solar icons when you want string-based icons

The template uses Solar icons through `@iconify/vue`. This is the pattern you see in places like:
- `src/layouts/full/horizontal-header/HorizontalHeader.vue`
- `src/layouts/full/vertical-sidebar/NavItem/index.vue`

Minimal example:

```vue
<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
    <Icon icon="solar:widget-5-bold" height="20" width="20" />
</template>
```

Notes:
- Use the full icon name in components, for example `solar:widget-5-bold`.
- You can browse Solar names in the app at `/icons/solar` (`src/views/icons/IconifyIcons.vue`) or online via the Iconify Solar set.

### Special case: sidebar items store Solar names without the prefix

In `src/layouts/full/vertical-sidebar/sidebarItems.ts`, sidebar entries save Solar names without `solar:` because the renderer adds it automatically in `src/layouts/full/vertical-sidebar/NavItem/index.vue`.

Minimal sidebar example:

```ts
{
    title: 'Reports',
    icon: 'chart-line-duotone',
    BgColor: 'primary',
    to: '/reports'
}
```

That becomes `solar:chart-line-duotone` when rendered.

### Use Tabler icons when you want Vue icon components

The template also includes `vue-tabler-icons`. It is registered in `src/main.ts` with `app.use(VueTablerIcons)`, and many views also import specific icons directly.

Minimal example:

```vue
<script setup lang="ts">
import { AlarmIcon } from 'vue-tabler-icons';
</script>

<template>
    <AlarmIcon size="20" />
</template>
```

Notes:
- This is the same component-based pattern used in files like `src/views/pages/account-settings/AccountSettings.vue`.
- You can browse Tabler icons in the app at `/icons/tabler` (`src/views/icons/TablerIcons.vue`) or on `https://tabler-icons.io/`.

### Quick rule of thumb

- Use Solar icons for most existing template UI that already expects Iconify string names.
- Use Tabler icons where a component import fits better or where surrounding code already uses `vue-tabler-icons`.

## 18) Minimal Starter Layout Recipe (Trim Template Quickly)

If you want to strip the template down to a basic admin shell (one layout mode, no clutter) in ~15 minutes, follow this checklist.

### Step 1 - Remove non-essential demo routes

- [ ] Open `src/router/MainRoutes.ts`, remove or comment out the following demo sections:
    - Forms (all form-layout, form-validation, etc. routes)
    - UI Components (buttons, badges, alerts, etc.)
    - Charts, Tables (sample table and calendar routes)
    - Icons (tabler icons showcase)
    - School Pages (if not needed)
    - Keep only: Dashboard, Profile, and any core app-specific routes you need

- [ ] Open `src/router/AuthRoutes.ts`, remove or comment out:
    - Front-page routes (`/`, `/front-page/*`)
    - Keep only: `/auth/login`, `/auth/register`, `/auth/forgot-password` (or your auth routes)

### Step 2 - Sync sidebar and horizontal menu

- [ ] Open `src/layouts/full/vertical-sidebar/sidebarItems.ts`, remove menu items matching deleted routes.
- [ ] Open `src/layouts/full/horizontal-sidebar/horizontalItems.ts`, apply same removals.

### Step 3 - Simplify header

- [ ] Open `src/layouts/full/vertical-header/VerticalHeader.vue`
    - Remove/comment unused badges, icons, search, language switcher if you don't need them
    - Keep essentials: logo, main nav links, profile dropdown, logout

- [ ] Open `src/layouts/full/horizontal-header/HorizontalHeader.vue` if using horizontal layout
    - Apply same simplifications

### Step 4 - Lock one layout mode

- [ ] Open `src/config.ts`
    - Set `setHorizontalLayout: false` to force vertical-only (or `true` for horizontal-only)
    - Set `setRTLLayout: false` unless you need RTL

- [ ] Open `src/layouts/full/customizer/Customizer.vue`
    - Comment out layout mode toggles (horizontal/vertical switch, RTL toggle) to hide from users
    - Users will still see theme toggles if you want them

### Step 5 - Replace branding

- [ ] Replace logo assets in `src/assets/images/logos/`.
- [ ] Update logo components only if needed: `src/layouts/full/logo/Logo.vue`, `src/layouts/full/logo/LogoLight.vue`, `src/layouts/full/logo/LogoDark.vue`, `src/layouts/full/logo/LogoLightRtl.vue`, `src/layouts/full/logo/LogoDarkRtl.vue`.

### Step 6 - Remove front/marketing pages if not needed

- [ ] Remove front routes from `src/router/AuthRoutes.ts` (`/front-page/*`, `/`).
- [ ] Optionally stop using front wrapper in `src/views/pages/front-pages/Layout.vue`.
- [ ] Remove/edit front nav and footer content in `src/components/frontpages/layout/Navigation.vue` and `src/components/frontpages/layout/Footer.vue`.

### Step 7 - Keep only your theme set

- [ ] Keep only desired themes in `src/plugins/vuetify.ts` `theme.themes`.
- [ ] Edit palette values in `src/theme/LightTheme.ts` and `src/theme/DarkTheme.ts`.
- [ ] Set default startup theme in `src/config.ts` (`actTheme`).

### Step 8 - Final sanity pass

- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm preview` and spot-check a few routes to ensure they load and nav works.
- [ ] Commit your changes.

Done! You now have a lean admin shell ready for your own features.

## 19) Changing the Default Index / Landing Page

There are three things that control what page a user sees first.

### A) After login — where the auth store redirects

`src/features/auth/stores/authStore.ts` — after a successful login the store does:

```typescript
router.push(this.returnUrl || '/dashboard1');
```

Change `'/dashboard1'` to any route path you want to be the post-login home, e.g.:

```typescript
router.push(this.returnUrl || '/apps/chats');
```

### B) The root path `/` — what loads when someone visits the bare domain

The root path is defined in `src/router/AuthRoutes.ts` (it points to the front-pages landing by default).  
To redirect `/` straight to your dashboard instead:

```typescript
// src/router/AuthRoutes.ts
{
    path: '/',
    redirect: '/dashboard1'   // <-- change this target
}
```

If you have removed front-pages entirely and there is no root route, add the redirect to `src/router/index.ts`:

```typescript
// src/router/index.ts
routes: [
    { path: '/', redirect: '/dashboard1' },  // add this line
    { path: '/:pathMatch(.*)*', component: () => import('@/views/authentication/Error.vue') },
    MainRoutes,
    AuthRoutes
]
```

### C) The `requiresAuth` guard and return URL

The guard in `src/router/index.ts` saves the originally requested URL before bouncing to login:

```typescript
auth.returnUrl = to.fullPath;
return next('/auth/login');
```

After login the user is sent to `returnUrl` first (if set), then falls back to the default from step A.  
Deep-linking works automatically — no extra changes needed.

### Quick-reference table

| What to change | File | What to edit |
|---|---|---|
| Page shown after login | `src/features/auth/stores/authStore.ts` | Default path in `router.push(returnUrl.value \|\| '...')` |
| What `/` loads | `src/router/AuthRoutes.ts` | `redirect` value on the `'/'` route |
| Fallback 404 page | `src/router/index.ts` | Component on the `'/:pathMatch(.*)*'` route |

