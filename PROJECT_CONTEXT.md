# PROJECT_CONTEXT.md

Context file for continuing development across sessions. Reflects the actual state of the codebase as of the last update.

---

## Overview

Fullstack recipe-sharing application. Users register, log in, and manage their own recipes. Each recipe generates a public shareable link accessible without authentication.

Built as a technical challenge (Terrand). Evaluated on: logic, state management, componentization, DB modeling, code quality.

---

## Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js + NestJS 11 |
| ORM | Prisma 7 + PostgreSQL |
| Frontend | Next.js 16 (App Router) + React 19 |
| Forms | React Hook Form 7 + Zod 4 |
| Auth | JWT in httpOnly cookie (no localStorage) |
| Password hashing | Argon2id |
| Styling | Tailwind CSS 4 |
| File upload | Multer (disk storage, included via @nestjs/platform-express) |
| Containerization | Docker Compose (PostgreSQL only) |

---

## Repository Structure

```
/
├── api/          # NestJS backend (port 3001)
├── web/          # Next.js frontend (port 3000)
└── docker-compose.yml
```

---

## Backend Architecture

### Design Principles

The backend follows Clean Architecture, separating each feature module into three layers:

- **Domain** — pure TypeScript interfaces and types; no framework dependencies. Defines ports (repository interfaces) and domain types.
- **Application** — business logic as injectable services. Depends only on domain ports, never on Prisma or HTTP directly.
- **Infrastructure** — concrete implementations: HTTP controllers, Prisma repositories, Zod schemas, cookie utilities.

This separation means the business logic is fully decoupled from the database and HTTP framework. Swapping Prisma for another ORM would only require changing the infrastructure layer.

### Module Layout

```
api/src/
├── modules/
│   ├── auth/
│   │   ├── domain/ports/         # UserRepository, PasswordHasher (interfaces)
│   │   ├── application/          # AuthApplicationService
│   │   ├── infrastructure/       # AuthController, JwtStrategy, PrismaUserRepository,
│   │   │                         # Argon2PasswordHasher, auth-cookie, schemas
│   │   └── auth.module.ts
│   └── recipes/
│       ├── domain/
│       │   ├── recipe.types.ts   # Recipe, RecipeIngredient, RecipeStep, RecipeWithIngredients
│       │   └── ports/            # RecipeRepository (interface)
│       ├── application/          # RecipesApplicationService
│       ├── infrastructure/       # RecipesController, PrismaRecipeRepository,
│       │                         # create/update schemas, parse-body
│       └── recipes.module.ts
├── prisma/                       # PrismaService, PrismaModule
├── uploads/                      # Uploaded recipe images (served statically at /uploads)
└── app.module.ts
```

### Database Schema

```
User
  id, firstName, lastName, email (unique), passwordHash, createdAt, updatedAt

Recipe
  id (UUID), ownerId (FK → User), publicId (unique, nanoid 10 chars),
  title, description, imageUrl (nullable), createdAt, updatedAt

RecipeIngredient
  id, recipeId (FK → Recipe), position (int), text
  UNIQUE(recipeId, position)

RecipeStep
  id, recipeId (FK → Recipe), position (int), text
  UNIQUE(recipeId, position)
```

**Key decision:** `publicId` is a separate short identifier (nanoid) used for public-facing URLs. The internal UUID is never exposed in public-facing routes.

**Key decision:** `passwordHash` is never returned by any query that flows to HTTP responses. The `UserRepository` port defines two separate methods: `findByEmailForAuth` (returns hash, used only during login) and `findByIdPublic` (excludes hash, used for session responses).

**Key decision:** `RecipeStep` follows the exact same pattern as `RecipeIngredient` — position-based ordering, UNIQUE(recipeId, position), full-replacement update strategy (deleteMany + createMany in a Prisma transaction). No diffing logic.

**Key decision:** `imageUrl` is stored as a relative path (`/uploads/filename.ext`). The frontend constructs the full URL by prepending `getApiBaseUrl()`. This keeps the value environment-agnostic in the DB.

---

## Auth Module

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account. Returns user + sets cookie. |
| POST | `/auth/login` | Public | Authenticate. Returns user + sets cookie. |
| POST | `/auth/logout` | Public | Clears auth cookie. |
| GET | `/auth/me` | JWT required | Returns current user from cookie session. |

### Auth Flow

1. On register/login, the server signs a JWT with `{ sub: userId }` and sets it as an `httpOnly` cookie named `auth`.
2. The cookie has `sameSite: lax` and `secure: true` in production.
3. Every subsequent request includes the cookie automatically (browser behavior).
4. Protected routes use `@UseGuards(AuthGuard('jwt'))`. The `JwtStrategy` extracts the JWT from the cookie and validates it.
5. On logout, the cookie is cleared server-side.

### Security Decisions

- **httpOnly cookie** prevents XSS-based token theft (no JavaScript access).
- **Argon2id** is used for password hashing (memory-hard, resistant to GPU attacks).
- **Email normalization** (trim + lowercase) before any DB operation prevents duplicate accounts with different casing.
- No refresh tokens — JWT expiry defaults to 7 days (configurable via `JWT_EXPIRES_IN`).

---

## Recipes Module

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/recipes` | JWT required | Create recipe with ingredients and steps. |
| GET | `/recipes` | JWT required | List caller's recipes (metadata only, no ingredients/steps). |
| PATCH | `/recipes/:id` | JWT required + owner | Update recipe. Replaces ingredients and steps entirely. |
| PATCH | `/recipes/:id/image` | JWT required + owner | Upload or replace the recipe cover image. |
| DELETE | `/recipes/:id` | JWT required + owner | Delete recipe. Returns 204. Cascades to ingredients and steps. |
| GET | `/recipes/feed` | Public | List all recipes from all users (title, description, imageUrl, owner name, createdAt). Used for the public home page feed. |
| GET | `/recipes/details/:id` | JWT required + owner | Get own recipe with ingredients and steps (for edit pre-fill). |
| GET | `/recipes/:publicId` | Public | Get recipe by publicId with ingredients and steps. |

**Route order note:** `PATCH /recipes/:id/image` is declared before `PATCH /recipes/:id` to avoid pattern conflicts. `GET /recipes/feed` and `GET /recipes/details/:id` are declared before `GET /recipes/:publicId`. Static segments take precedence over dynamic ones in NestJS.

### Business Rules

- Only authenticated users can create or edit recipes.
- Only the owner can edit or fetch detail of a recipe (`ownerId` check in application layer, returns 403 otherwise).
- `publicId` is generated with `nanoid(10)` in the application layer at creation time.
- Ingredient positions and step positions are assigned by the caller based on array index.
- Ingredient update strategy: **full replacement** — `deleteMany` + `createMany` inside a Prisma transaction.
- Step update strategy: **full replacement** — same pattern as ingredients.
- Image upload: `PATCH /recipes/:id/image` accepts `multipart/form-data` with field name `image`. Multer saves the file to `api/uploads/` with a `nanoid(12)` filename. Max file size: 5 MB. Only `image/*` MIME types accepted. The stored `imageUrl` is a relative path (`/uploads/filename.ext`).
- Static files in `api/uploads/` are served at `http://localhost:3001/uploads/` via `app.useStaticAssets()` in `main.ts`. The uploads directory is created automatically on startup if it doesn't exist.
- Delete: `DELETE /recipes/:id` validates ownership (404/403), then calls `repo.delete(id)`. The DB cascades the delete to `recipe_ingredients` and `recipe_steps` via `onDelete: Cascade` in the Prisma schema. Returns 204 No Content.
- Public feed: `GET /recipes/feed` returns `PublicFeedRecipe[]` — each item includes `publicId, title, description, imageUrl, createdAt` plus `owner: { firstName, lastName }`. No auth required. Ordered by `createdAt desc`.

---

## Frontend Architecture

### Visual Identity

- **App name:** Recetario. Brand mark: amber-500 badge with "R" initial, used consistently in the header, auth pages, and footer.
- **Color palette:** zinc scale for all UI + `amber-500` as the single brand accent. No other accent colors.
- **Background:** pages use `bg-zinc-50` (recipes list, create, edit, public view) while cards are `bg-white` — creates surface depth without heavy shadows.
- **Header:** sticky, `backdrop-blur`, brand on the left, navigation on the right. Consistent across all pages.
- **Footer:** `AppFooter` component — brand mark + name + tagline on the left, "© 2026 — Lautaro Lamaita" on the right. `border-t border-zinc-100 bg-white`, matches navbar tone.
- **AppNav (guest):** uses `usePathname()` to hide the link that matches the current route.
- **AppNav (authenticated):** user avatar (amber circle with initials) + first name + chevron. Dropdown with "Mis recetas", "Nueva receta", "Cerrar sesión".
- **Recipe card:** title + date in header row, description clamped to 2 lines, thumbnail (64×64) on the right if imageUrl exists, actions row with `justify-between` — "Editar" as filled black button (primary), "Link público" as secondary text link.
- **Recipes list:** `bg-zinc-50` page, white cards, animated skeleton on load, dashed-border empty state.
- **Recipe form pages (create/edit):** form wrapped in white card on `bg-zinc-50`. Both create and edit pages have a "Imagen de portada" card above the form. On create, image is held in state and uploaded after recipe creation. On edit, upload triggers immediately on file selection.
- **Home page:** compact gradient hero (white → amber-50/50) with auth-aware CTAs, followed by a public "Recetas de la comunidad" feed — 3-column grid of `FeedCard` components with animated skeleton on load and dashed empty state.

### Key Decisions

- **Next.js 16 App Router** — `params` in dynamic routes is a `Promise`. Server Components use `await params`; Client Components use `useParams()` hook (synchronous).
- **Feature-based structure** — each feature has its own folder under `src/features/`, avoiding coupling between unrelated parts.
- **Auth state via React Context** — `AuthProvider` wraps the entire app in root layout. All components access session via `useAuth()`.
- **Session initialized via `/auth/me`** — on app load, `AuthProvider` calls the API. If the cookie is valid, user state is populated; if 401, user is null.
- **No token storage on the client** — the cookie is handled entirely by the browser; the frontend never reads or stores the JWT.
- **Image URLs** — `imageUrl` from the API is a relative path (`/uploads/...`). Components prepend `getApiBaseUrl()` to construct the full URL. All `next/image` components for recipe images use `unoptimized` to bypass the Next.js optimization pipeline (avoids server-side fetch issues in local dev). `remotePatterns` in `next.config.ts` still configured for `localhost:3001`.
- **Two-step image upload** — images are uploaded separately from the recipe form via `PATCH /recipes/:id/image`. The frontend uses `apiUpload()` (FormData, no `Content-Type: application/json` header) instead of `apiJson()`. On the **create** page, the file is held in React state and uploaded immediately after recipe creation before redirecting. On the **edit** page, upload triggers on file selection and updates state in-place.
- **Logout redirect** — `logout()` in `AuthProvider` sets `loggingOut: true` before clearing user state, then calls `router.push("/")`. `PrivateGate` skips its redirect-to-login logic when `loggingOut` is true, preventing a race condition where the guard would override the logout destination.

### Folder Structure

```
web/src/
├── app/
│   ├── layout.tsx                  # Root layout: AuthProvider + AppNav + AppFooter
│   ├── page.tsx                    # Public home page
│   ├── login/page.tsx              # /login
│   ├── register/page.tsx           # /register
│   ├── (private)/                  # Route group — all routes require auth
│   │   ├── layout.tsx              # Wraps children with PrivateGate
│   │   └── recipes/
│   │       ├── page.tsx            # /recipes — list (bg-zinc-50)
│   │       ├── new/page.tsx        # /recipes/new — create (form in white card)
│   │       └── [id]/edit/page.tsx  # /recipes/[id]/edit — edit (image card + form card)
│   └── r/
│       └── [publicId]/page.tsx     # /r/:publicId — public view (hero image + 2-col layout)
├── features/
│   ├── auth/
│   │   ├── auth-context.tsx        # AuthProvider, useAuth hook
│   │   ├── private-session.tsx     # PrivateGate component
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── schemas.ts              # Zod schemas for login/register
│   │   └── return-path.ts         # Safe redirect resolution after login
│   └── recipes/
│       ├── schemas.ts              # recipeSchema (title, description, ingredients[], steps[])
│       ├── recipe-form.tsx         # Shared form: title, description, ingredients, steps
│       ├── ingredient-fields.tsx   # Dynamic list with useFieldArray (add/remove)
│       ├── step-fields.tsx         # Dynamic list of steps with textarea per step
│       └── recipe-card.tsx         # Card: thumbnail, title, date, description, actions
├── lib/api/
│   ├── client.ts                   # apiJson wrapper, apiUpload (FormData), ApiError, getApiBaseUrl
│   ├── auth.ts                     # loginRequest, registerRequest, logoutRequest, fetchCurrentUser
│   └── recipes.ts                  # createRecipe, listMyRecipes, getMyRecipeById,
│                                   # updateRecipe, uploadRecipeImage, getPublicRecipe,
│                                   # getPublicFeed, PublicFeedRecipe type
└── components/
    ├── app-nav.tsx                  # Auth-aware nav
    ├── app-footer.tsx               # Global footer: brand + tagline + copyright
    └── auth-shell.tsx               # Layout wrapper for auth pages
```

### Route Protection

The `(private)` route group uses a layout that wraps children in `PrivateGate`. This component:

1. Reads auth state from `useAuth()`.
2. While loading: shows a loading indicator.
3. If no user: redirects to `/login?from=<current-path>` (preserving the intended destination).
4. If user exists: renders children.

After successful login or register, `resolveReturnPath(searchParams.get('from'))` is used to redirect. It validates the `from` value (must start with `/`, no `://`) to prevent open redirects. Default destination is `/recipes`.

### Form Architecture

All forms use **React Hook Form** with **Zod** resolvers:

- Schema defined separately in `schemas.ts` with user-friendly Spanish error messages.
- `RecipeForm` is a reusable component that accepts `defaultValues` (for edit pre-fill), `onSubmit` callback, `submitLabel`, and `serverError`. The parent page owns the API call and error state.
- `IngredientFields` uses `useFieldArray` for dynamic add/remove of ingredients (single-line `input`).
- `StepFields` uses `useFieldArray` for dynamic add/remove of steps (multi-line `textarea`, rows=3).
- Ingredient and step positions are **not part of the form schema** — they are computed from array index at submit time by the parent page before calling the API.
- Image upload is handled independently of the form on both create and edit pages. On edit, a file input triggers `uploadRecipeImage()` immediately on change. On create, the file is stored in state (`pendingImage`) and uploaded after `createRecipe()` resolves, before the router redirect.

### Public Recipe Page Layout

`/r/:publicId` is a Server Component. Layout:

1. **Hero image** (full-width, 256px–320px tall) — shown only if `recipe.imageUrl` is set.
2. **Title + description** (full width).
3. **Two-column grid** (`lg:grid-cols-[260px_1fr]`):
   - Left: ingredients card (`bg-white`, sticky on desktop at `top-20`).
   - Right: numbered steps with filled zinc-900 circle indicators.
4. **Backlink** — "← Compartido desde Recetario" at the bottom.

---

## Environment Variables

### Backend (`api/.env`)

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE_MS=604800000
```

### Frontend (`web/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Current Implementation Status

| Feature | Status |
|---|---|
| Auth backend (register, login, logout, me) | ✅ Complete |
| Auth frontend (forms, context, protected routes) | ✅ Complete |
| Session management (AuthProvider, PrivateGate) | ✅ Complete |
| Auth-aware navigation (AppNav) | ✅ Complete |
| Recipes backend (CRUD + public endpoint) | ✅ Complete |
| Recipes frontend (list, create, edit, public view) | ✅ Complete |
| Public recipe page (`/r/:publicId`) | ✅ Complete |
| Recipe steps (full-stack: DB, API, form, public view) | ✅ Complete |
| Recipe image upload (Cloudinary, frontend) | ✅ Complete |
| Image upload on create page | ✅ Complete |
| UI polish (brand identity, landing page, footer, card hierarchy) | ✅ Complete |
| Public recipe feed (home page) | ✅ Complete |
| Logout redirects to home | ✅ Complete |
| Unit tests (auth + recipes application services) | ✅ Complete |
| Delete recipe (backend + frontend) | ✅ Complete |

## Testing

Unit tests live alongside the application services they cover:

```
api/src/modules/auth/application/auth.application.service.spec.ts
api/src/modules/recipes/application/recipes.application.service.spec.ts
```

**Run tests:**
```bash
cd api
npm test                        # all tests
npm test -- --no-coverage      # without coverage report
```

**Coverage:**
- `AuthApplicationService` — 11 tests: email normalization, name trimming, ConflictException on duplicate email, password hashing, passwordHash not leaked in login response, UnauthorizedException on bad credentials, token returned on success.
- `RecipesApplicationService` — 19 tests: field trimming, publicId generation, NotFoundException and ForbiddenException on all ownership-checked operations, public feed delegation.

All tests use `jest.fn()` mocks for repository interfaces, PasswordHasher, and JwtService — no database required.

## What Remains (Optional / Future)

| Feature | Notes |
|---|---|
| Recipe ratings | New model `Rating(userId, recipeId, score)`. Unique per user/recipe pair. Natural home: public recipe page (`/r/:publicId`) and/or the home feed cards. |
| Forgot password | Allow users to reset their password via email. Requires an email provider (e.g. Resend). Flow: user enters email → receives a signed token link → sets a new password. Affects: new `PasswordReset` model, new auth endpoints, new frontend pages. |

---

## Deploy

### URLs de producción

| Service | URL |
|---|---|
| Frontend (Vercel) | `https://recipe-app-fullstack-three.vercel.app` |
| Backend (Railway) | `https://recipe-app-fullstack-production.up.railway.app` |
| Base de datos | Supabase (PostgreSQL) |
| Imágenes | Cloudinary (`recetario/` folder) |

### Stack de infraestructura

| Layer | Platform |
|---|---|
| Frontend | Vercel (auto-deploy desde `main`) |
| Backend | Railway (auto-deploy desde `main`) |
| Base de datos | Supabase (PostgreSQL) |
| Imágenes | Cloudinary |

### Variables de entorno requeridas

**Backend (Railway):**
```
DATABASE_URL          postgresql://... (Supabase connection string)
JWT_SECRET            string largo y aleatorio
JWT_EXPIRES_IN        7d
COOKIE_MAX_AGE_MS     604800000
WEB_ORIGIN            https://recipe-app-fullstack-three.vercel.app
CLOUDINARY_CLOUD_NAME tu-cloud-name
CLOUDINARY_API_KEY    tu-api-key
CLOUDINARY_API_SECRET tu-api-secret
```

**Frontend (Vercel):**
```
NEXT_PUBLIC_API_URL   https://recipe-app-fullstack-production.up.railway.app
```

### Decisiones técnicas del deploy

- **`sameSite: 'none'`** en producción: necesario para que la cookie httpOnly viaje en requests cross-origin (Vercel → Railway son dominios distintos). En desarrollo sigue siendo `'lax'`.
- **`prisma generate` en build**: agregado al script `build` del `package.json` del backend para que Railway genere el cliente Prisma antes de compilar TypeScript.
- **Cloudinary**: reemplaza el almacenamiento en disco local (`api/uploads/`). El `CloudinaryService` recibe el buffer del archivo en memoria (`memoryStorage`) y devuelve una URL pública permanente (`secure_url`). `resolveImageUrl()` en el cliente frontend detecta si la URL ya es absoluta (Cloudinary) y en ese caso la usa directamente.
- **401 en `/auth/me`**: tratado como "no hay sesión activa" (user = null, status = ready) en vez de error de API. Así los usuarios no autenticados ven la app normalmente en lugar de la pantalla de error.
- **`WEB_ORIGIN` en Railway**: debe coincidir exactamente con la URL de producción de Vercel. Las URLs de preview de Vercel no están en la whitelist — para testing usar la URL de producción.

### Correr migraciones en producción

```bash
cd api
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## README — Contenido sugerido

El README debería cubrir:

### Secciones

1. **Descripción** — app de recetas fullstack, challenge técnico Terrand.
2. **Demo** — link a `https://recipe-app-fullstack-three.vercel.app`
3. **Stack** — tabla igual a la de este documento.
4. **Arquitectura** — Clean Architecture en el backend (Domain / Application / Infrastructure), feature-based en el frontend.
5. **Requisitos locales** — Node 20+, Docker (para PostgreSQL), cuenta de Cloudinary.
6. **Setup local**:
   ```bash
   # 1. Clonar
   git clone <repo>

   # 2. Backend
   cd api
   cp .env.example .env        # completar con tus valores
   docker-compose up -d        # levanta PostgreSQL
   npm install
   npx prisma migrate dev
   npm run start:dev

   # 3. Frontend (otra terminal)
   cd web
   cp .env.example .env.local  # completar NEXT_PUBLIC_API_URL
   npm install
   npm run dev
   ```
7. **Variables de entorno** — tabla con todas las vars y dónde conseguirlas.
8. **Tests**:
   ```bash
   cd api && npm test
   ```
9. **Deploy** — Railway (backend) + Vercel (frontend) + Supabase (DB) + Cloudinary (imágenes).

### Nota importante sobre Cloudinary en local

Sin las credenciales de Cloudinary en `api/.env`, el endpoint `PATCH /recipes/:id/image` falla. Para desarrollo sin Cloudinary, la alternativa es no subir imágenes durante el testing.

---

## Deploy Checklist

### ⚠️ Bloqueante: migrar imágenes a Cloudinary

El almacenamiento actual usa disco local (`api/uploads/`). En producción el filesystem es efímero — cada redeploy borra los archivos. Hay que migrar a Cloudinary antes de deployar.

#### 1. Crear cuenta y obtener credenciales

- Ir a https://cloudinary.com → crear cuenta gratuita
- En el dashboard copiar: `Cloud Name`, `API Key`, `API Secret`
- Agregarlos al `.env` del backend:

```
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

#### 2. Instalar el SDK en el backend

```bash
cd api
npm install cloudinary
```

#### 3. Cambiar el storage de Multer en el controller

Archivo: `api/src/modules/recipes/infrastructure/recipes.controller.ts`

Reemplazar el `diskStorage` por `memoryStorage` (guarda el archivo en RAM en vez de disco, para pasárselo a Cloudinary):

```typescript
import { memoryStorage } from 'multer';

const imageStorage = memoryStorage(); // ← reemplaza diskStorage(...)
```

#### 4. Crear un servicio de Cloudinary

Nuevo archivo: `api/src/modules/recipes/infrastructure/cloudinary.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'recetario' }, (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url); // URL pública permanente
        })
        .end(file.buffer);
    });
  }
}
```

#### 5. Actualizar el endpoint de upload en el controller

Archivo: `api/src/modules/recipes/infrastructure/recipes.controller.ts`

Inyectar `CloudinaryService` e invocar el upload:

```typescript
// En el constructor:
constructor(
  private readonly recipes: RecipesApplicationService,
  private readonly cloudinary: CloudinaryService,
) {}

// En el endpoint uploadImage:
async uploadImage(...) {
  if (!file) throw new BadRequestException('No se recibió ninguna imagen');
  const url = await this.cloudinary.upload(file);        // ← sube a Cloudinary
  return this.recipes.updateRecipeImage(user.userId, id, url); // ← guarda la URL completa
}
```

#### 6. Actualizar `imageUrl` en base de datos

Con Cloudinary, `imageUrl` pasa a ser una URL completa (`https://res.cloudinary.com/...`) en vez de una ruta relativa (`/uploads/...`). Hay que ajustar el frontend:

- En todos los componentes que hacen `${getApiBaseUrl()}${recipe.imageUrl}`, cambiar a usar `recipe.imageUrl` directamente (ya es una URL completa).
- Afecta: `recipe-card.tsx`, `edit/page.tsx`, `new/page.tsx`, `r/[publicId]/page.tsx`, `page.tsx` (feed).

#### 7. Eliminar lo que ya no se usa

- `app.useStaticAssets(...)` en `main.ts` — ya no sirve archivos locales
- `api/uploads/` — ya no se necesita la carpeta
- `diskStorage` import en el controller

---

### Configuración de env vars por plataforma

Una vez resuelto el storage, lo único que queda es configurar variables en cada plataforma.

#### Backend → Railway o Render

En el dashboard de la plataforma, en "Environment Variables":

```
DATABASE_URL        postgresql://user:pass@host:5432/db   ← de Supabase/Railway DB
JWT_SECRET          un-string-aleatorio-largo-y-seguro
JWT_EXPIRES_IN      7d
COOKIE_MAX_AGE_MS   604800000
WEB_ORIGIN          https://tu-app.vercel.app              ← URL del frontend en Vercel
PORT                3001
CLOUDINARY_CLOUD_NAME   tu-cloud-name
CLOUDINARY_API_KEY      tu-api-key
CLOUDINARY_API_SECRET   tu-api-secret
```

#### Frontend → Vercel

En el dashboard de Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL   https://tu-api.railway.app   ← URL del backend deployado
```

#### Base de datos → Supabase (recomendado) o Railway

1. Crear proyecto en https://supabase.com (plan gratuito disponible)
2. Copiar la `DATABASE_URL` desde Settings → Database → Connection String
3. Correr las migraciones apuntando a la DB de producción:

```bash
cd api
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

#### Orden de deploy recomendado

1. Crear DB en Supabase → copiar `DATABASE_URL`
2. Correr `prisma migrate deploy` contra esa DB
3. Deployar el backend en Railway → configurar todas las env vars → copiar la URL pública
4. Deployar el frontend en Vercel → setear `NEXT_PUBLIC_API_URL` con la URL del backend

---

## Changelog — Session 2026-04-20

### Feat: Delete recipe — full stack (Commit 5)

| File | Change |
|---|---|
| `api/src/modules/recipes/domain/ports/recipe.repository.ts` | Added `delete(id): Promise<void>` to `RecipeRepository` interface. |
| `api/src/modules/recipes/infrastructure/prisma-recipe.repository.ts` | Implemented `delete()` — `prisma.recipe.delete({ where: { id } })`. Cascade handles ingredients and steps. |
| `api/src/modules/recipes/application/recipes.application.service.ts` | Added `deleteRecipe(userId, recipeId)` — ownership check (404/403), then delegates to `repo.delete()`. |
| `api/src/modules/recipes/infrastructure/recipes.controller.ts` | Added `DELETE /recipes/:id` endpoint (`@HttpCode(204)`). Declared before `PATCH /:id` to avoid conflicts. |
| `web/src/lib/api/recipes.ts` | Added `deleteRecipe(id)` — calls `DELETE /recipes/:id` via `apiJson`. |
| `web/src/features/recipes/recipe-card.tsx` | Added optional `onDelete` prop. When provided, renders an "Eliminar" red text button alongside "Editar". |
| `web/src/app/(private)/recipes/page.tsx` | Added `handleDelete(id)`: confirms via `window.confirm`, calls `deleteRecipe`, removes from state optimistically with `filter`. |

---

### Fix: Recipe images broken (Commit 1)

| File | Change |
|---|---|
| `web/src/features/recipes/recipe-card.tsx` | Added `unoptimized` to `<Image>` thumbnail. |
| `web/src/app/(private)/recipes/[id]/edit/page.tsx` | Added `unoptimized` to image preview `<Image>`. |
| `web/src/app/r/[publicId]/page.tsx` | Added `unoptimized` to hero `<Image>`. |

**Root cause:** Next.js image optimization pipeline was failing for local `localhost:3001` URLs in dev. `unoptimized` bypasses the pipeline and loads directly from the source URL.

### Feat: Image upload on create page (Commit 2)

| File | Change |
|---|---|
| `web/src/app/(private)/recipes/new/page.tsx` | Added "Imagen de portada" card with file input and local preview (`URL.createObjectURL`). `pendingImage` state holds the file. On submit: `createRecipe()` → `uploadRecipeImage()` → redirect. |

### Fix: Logout redirects to home (Commit 3)

| File | Change |
|---|---|
| `web/src/features/auth/auth-context.tsx` | Added `loggingOut: boolean` state. Set to `true` at start of `logout()`. Exposed in `AuthContextValue`. `logout()` now calls `router.push("/")` instead of `router.push("/login")`. |
| `web/src/features/auth/private-session.tsx` | `PrivateGate` reads `loggingOut` from context and skips its redirect-to-login `useEffect` when true, preventing race condition. |

### Feat: Public recipe feed on home page (Commit 4)

| File | Change |
|---|---|
| `api/src/modules/recipes/domain/recipe.types.ts` | Added `PublicFeedRecipe` type (`publicId, title, description, imageUrl, createdAt, owner: { firstName, lastName }`). |
| `api/src/modules/recipes/domain/ports/recipe.repository.ts` | Added `findAll(): Promise<PublicFeedRecipe[]>` to `RecipeRepository` interface. |
| `api/src/modules/recipes/infrastructure/prisma-recipe.repository.ts` | Implemented `findAll()` — Prisma query with `owner` select, ordered by `createdAt desc`. |
| `api/src/modules/recipes/application/recipes.application.service.ts` | Added `getPublicFeed()` method delegating to `recipes.findAll()`. |
| `api/src/modules/recipes/infrastructure/recipes.controller.ts` | Added `GET /recipes/feed` (public, no auth). Declared before `GET /:publicId` to avoid route conflict. |
| `web/src/lib/api/recipes.ts` | Added `PublicFeedRecipe` type and `getPublicFeed()` function calling `GET /recipes/feed`. |
| `web/src/app/page.tsx` | Replaced landing-only home with hero + public feed section. `FeedCard` component: image/placeholder, title, description (2-line clamp), owner name, date. Grid 1→2→3 cols. Skeleton on load, dashed empty state with register CTA for guests. |

---

## Changelog — Session 2026-04-18

All changes introduced in this development session, file by file.

### UI Polish (Commit 1)

| File | Change |
|---|---|
| `web/src/features/recipes/recipe-card.tsx` | Redesigned actions: "Editar" → filled black button (primary), "Link público" → secondary text link aligned right with `justify-between`. Thumbnail slot (64×64) on the right when `imageUrl` exists. |
| `web/src/app/(private)/recipes/page.tsx` | Added `bg-zinc-50` to `<main>`, increased card gap to `gap-4`, skeleton adjusted for new bg. |
| `web/src/components/app-footer.tsx` | **New file.** Global footer: amber brand mark + "Recetario" + tagline on the left, "© 2026 — Lautaro Lamaita" on the right. `border-t border-zinc-100 bg-white`. |
| `web/src/app/layout.tsx` | Imported and added `<AppFooter />` inside `AuthProvider`, after `{children}`. |

### Recipe Steps — Full Stack (Commit 2)

| File | Change |
|---|---|
| `api/prisma/schema.prisma` | Added `RecipeStep` model (`id, recipeId, position, text`). Added `steps RecipeStep[]` relation to `Recipe`. |
| `api/prisma/migrations/20260418223000_add_recipe_steps/` | Migration that creates `recipe_steps` table with UNIQUE(recipeId, position). |
| `api/src/modules/recipes/domain/recipe.types.ts` | Added `RecipeStep` type. Added `steps: RecipeStep[]` to `RecipeWithIngredients`. |
| `api/src/modules/recipes/domain/ports/recipe.repository.ts` | Added `steps: { position, text }[]` to `CreateRecipeData` and `UpdateRecipeData`. |
| `api/src/modules/recipes/application/recipes.application.service.ts` | Added `steps` to `CreateRecipeInput`, `UpdateRecipeInput`, and forwarding calls to repository. |
| `api/src/modules/recipes/infrastructure/prisma-recipe.repository.ts` | Added `steps` to `withIngredientsSelect`. Handles `steps: { create: data.steps }` in `create()`. In `update()` transaction: `deleteMany` + `createMany` for steps alongside ingredients. |
| `api/src/modules/recipes/infrastructure/create-recipe.schema.ts` | Added `steps` array (Zod, min 1, each `text` max 2000 chars). |
| `api/src/modules/recipes/infrastructure/update-recipe.schema.ts` | Added `steps` array optional (same schema). |
| `web/src/lib/api/recipes.ts` | Added `RecipeStep` type. Added `steps: RecipeStep[]` to `RecipeWithIngredients`. Added `steps` to `RecipeInput`. |
| `web/src/features/recipes/schemas.ts` | Added `steps` array to `recipeSchema` (min 1, each `text` max 2000). |
| `web/src/features/recipes/step-fields.tsx` | **New file.** `StepFields` component: `useFieldArray` on `steps`, textarea per step (rows=3), numbered pill indicator, add/remove controls. |
| `web/src/features/recipes/recipe-form.tsx` | Imported `StepFields`. Added `steps: [{ text: '' }]` to defaultValues. Added `StepFields` section with a `<hr>` divider. Updated description placeholder. |
| `web/src/app/(private)/recipes/new/page.tsx` | Maps `data.steps` to `{ position, text }[]` at submit. Wrapped form in white card on `bg-zinc-50`. |
| `web/src/app/(private)/recipes/[id]/edit/page.tsx` | Includes `steps: recipe.steps.map(...)` in `defaultValues`. Maps `data.steps` at submit. |
| `web/src/app/r/[publicId]/page.tsx` | Two-column layout (`lg:grid-cols-[260px_1fr]`): ingredients sticky on the left, numbered steps on the right (zinc-900 circle indicators). `max-w-5xl` instead of `max-w-2xl`. |

### Recipe Image Upload — Full Stack (Commit 3)

| File | Change |
|---|---|
| `api/prisma/schema.prisma` | Added `imageUrl String? @map("image_url")` to `Recipe`. |
| `api/prisma/migrations/20260418234527_add_recipe_image_url/` | Migration that adds `image_url` nullable column to `recipes`. |
| `api/package.json` / `api/package-lock.json` | Added `@types/multer` as devDependency. |
| `api/src/modules/recipes/domain/recipe.types.ts` | Added `imageUrl: string \| null` to `Recipe`. |
| `api/src/modules/recipes/domain/ports/recipe.repository.ts` | Added `imageUrl?: string` to `UpdateRecipeData`. |
| `api/src/modules/recipes/infrastructure/prisma-recipe.repository.ts` | Added `imageUrl: true` to `publicSelect`. Added `imageUrl` conditional spread in `update()`. |
| `api/src/modules/recipes/application/recipes.application.service.ts` | Added `updateRecipeImage(userId, recipeId, imageUrl)` method — validates ownership, calls `update({ imageUrl })`. |
| `api/src/modules/recipes/infrastructure/recipes.controller.ts` | Added `PATCH :id/image` endpoint with `FileInterceptor` (multer disk storage, `nanoid(12)` filename, image/* filter, 5MB limit). Declared before `PATCH :id` to avoid route conflict. |
| `api/src/main.ts` | Switched to `NestExpressApplication`. Added `app.useStaticAssets(uploadsDir, { prefix: '/uploads' })`. Auto-creates `uploads/` on startup. |
| `api/uploads/.gitkeep` | **New file.** Ensures the uploads directory exists in the repo. |
| `web/src/lib/api/client.ts` | Added `apiUpload<T>(path, formData)` function — sends FormData via PATCH without `Content-Type` header (browser sets it with multipart boundary). |
| `web/src/lib/api/recipes.ts` | Added `imageUrl: string \| null` to `Recipe` type. Added `uploadRecipeImage(id, file)` function using `apiUpload`. |
| `web/src/app/(private)/recipes/[id]/edit/page.tsx` | Added "Imagen de portada" card above the form: shows current image (`next/image`, fill), "Subir/Cambiar imagen" button, hidden file input, uploading/error states. Image updates in-place without page reload. |
| `web/src/app/r/[publicId]/page.tsx` | Added full-width hero image (`h-64 sm:h-80`, `object-cover`) above the content when `imageUrl` exists. |
| `web/src/features/recipes/recipe-card.tsx` | Added 64×64 thumbnail on the right of the card content when `imageUrl` exists. |

---

## Changelog — Session 2026-04-20 (continuación)

### Refactor: Code quality improvements (7 commits)

| Change | Files |
|---|---|
| `parseBody` extraído a `api/src/shared/` — duplicado entre auth y recipes eliminado | `shared/parse-body.ts` (new), ambos controllers |
| `assertOwnership` método privado en `RecipesApplicationService` — patrón findById→404→403 repetido 4 veces → 1 método | `recipes.application.service.ts` |
| `ingredientSchema` / `stepSchema` extraídos a `recipe-field-schemas.ts` compartido | `recipe-field-schemas.ts` (new), create/update schemas |
| `baseCookieOptions()` elimina opciones de cookie duplicadas en auth-cookie | `auth-cookie.ts` |
| `parseResponse` elimina bloque de parseo duplicado entre `apiJson` y `apiUpload` | `client.ts` |
| `resolveImageUrl` centraliza concatenación `getApiBaseUrl() + imageUrl` — 4 componentes unificados | `client.ts`, `recipe-card.tsx`, `edit/page`, `home page`, `public page` |
| `toPositioned` elimina `.map` duplicado en create y edit pages | `recipes.ts`, `new/page`, `edit/page` |
| Fix: `delete: jest.fn()` agregado al mock del test (bug preexistente) | `recipes.application.service.spec.ts` |

### Feat: Cloudinary image storage

| File | Change |
|---|---|
| `api/src/modules/recipes/infrastructure/cloudinary.service.ts` | **New.** Injectable service — configura Cloudinary con env vars, expone `upload(file)` que devuelve `secure_url`. |
| `api/src/modules/recipes/infrastructure/recipes.controller.ts` | `diskStorage` → `memoryStorage`. Inyecta `CloudinaryService`. `uploadImage` ahora sube a Cloudinary y guarda URL completa. |
| `api/src/modules/recipes/recipes.module.ts` | Registra `CloudinaryService` como provider. |
| `api/src/main.ts` | Elimina `useStaticAssets` y creación automática de `uploads/`. Vuelve a `NestFactory.create` base. |
| `api/.env.example` | Agrega `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. |
| `api/package.json` | Agrega `cloudinary` a dependencies. |

### Fix: Production deploy issues

| Fix | File | Detalle |
|---|---|---|
| `prisma generate` en build | `api/package.json` | Railway no generaba el cliente Prisma antes de compilar — `build` script cambiado a `prisma generate && nest build`. |
| `sameSite: 'none'` en producción | `api/src/modules/auth/infrastructure/auth-cookie.ts` | Cookie no viajaba cross-origin (Vercel → Railway) con `sameSite: 'lax'`. En producción se usa `'none'` (requiere `secure: true`). |
| Cloudinary en `remotePatterns` | `web/next.config.ts` | `res.cloudinary.com` no estaba en la whitelist de Next.js Image — imágenes bloqueadas. |
| 401 en `/auth/me` tratado como unauthenticated | `web/src/features/auth/auth-context.tsx` | Un 401 mostraba la pantalla de error "¿La API está disponible?" en vez de renderizar la app sin sesión. Ahora 401 → `user = null, status = ready`. |
| `web/next.config.ts` | Added `images.remotePatterns` for `http://localhost:3001/uploads/**` to allow `next/image` to load from the API. |
