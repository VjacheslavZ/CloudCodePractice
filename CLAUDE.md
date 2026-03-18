# Croatian Grammar — MVP Development Plan

## Context

An application for learning Croatian grammar through interactive exercises. Target platforms: Android, iOS, Web, and Admin Panel (web only). MVP with subscription, trial period, and gamification system.

---

## Technology Stack

| Layer              | Technology                                |
| ------------------ | ----------------------------------------- |
| Shared code        | Git submodule (`@cro/shared`)             |
| Web + Admin UI     | React.js + TypeScript + Material UI (MUI) |
| Mobile             | Expo Go (React Native) + Expo Router      |
| Backend            | NestJS + TypeScript (Node.js 24 LTS)      |
| Database           | PostgreSQL + Prisma ORM                   |
| Cache / Queues     | Redis + BullMQ                            |
| State              | Redux Toolkit + TanStack Query            |
| Forms              | React Hook Form + Zod                     |
| i18n               | i18next + react-i18next (cro-web + cro-mobile only; cro-admin uses English only) |
| Auth (Students)    | Passport.js (Google OAuth2 + Apple) + JWT |
| Auth (Admin)       | Email/password (bcrypt) + JWT             |
| Auth (Mobile)      | expo-auth-session + expo-web-browser + expo-crypto + expo-apple-authentication |
| Web Payments       | Stripe (Checkout + Customer Portal)       |
| Mobile Payments    | RevenueCat (App Store + Google Play IAP)  |
| Push Notifications | Expo Notifications + BullMQ               |
| Frontend Tests     | Jest + React Testing Library              |
| Backend Tests      | Node.js `node:test` (built-in)            |
| Linting            | ESLint (eslint-config-airbnb) + Prettier  |
| Pre-commit         | Husky + lint-staged (runs tests)          |
| Error Monitoring   | Sentry                                    |
| API Deploy         | Railway (PostgreSQL + Redis included)     |
| Web/Admin Deploy   | Vercel                                    |
| Mobile Dev         | Expo Go                                   |
| Mobile Deploy      | Expo EAS Build + EAS Submit               |

---

## Repository Structure

The project is split into **5 separate Git repositories**. Shared code is distributed via a **Git submodule** (`cro-shared`), included in each app repo at `shared/`.

### `cro-shared` — shared TS types, constants, utilities

```
cro-shared/
├── src/
│   ├── types/            # shared TypeScript types
│   ├── constants/        # shared constants
│   └── utils/            # shared utility functions
├── package.json
└── tsconfig.json
```

### `cro-api` — NestJS backend

```
cro-api/
├── .github/
│   └── workflows/
│       ├── ci.yml            # lint + typecheck + test on every PR
│       └── deploy.yml        # deploy on merge to main
├── .husky/
│   ├── pre-commit            # runs lint-staged
│   └── commit-msg            # commitlint (Conventional Commits)
├── shared/                   # ← git submodule (cro-shared)
├── src/
│   ├── modules/              # feature modules (see below)
│   ├── common/               # guards, interceptors, decorators
│   ├── config/               # ConfigModule + env validation via zod
│   └── prisma/               # PrismaService + schema.prisma
├── test/                     # e2e tests (supertest)
├── package.json
├── docker-compose.yml        # postgres + redis for local development
└── .nvmrc                    # Node 24 LTS
```

### `cro-web` — React app for students

```
cro-web/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── shared/                   # ← git submodule (cro-shared)
├── src/
│   ├── app/                  # providers, routing
│   ├── features/             # auth, exercises, progress, subscription
│   ├── store/                # Redux store + RTK slices
│   ├── api/                  # TanStack Query hooks + axios client
│   └── i18n/                 # Russian/Ukrainian/English locales
├── package.json
└── .nvmrc
```

### `cro-admin` — React admin panel

```
cro-admin/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── shared/                   # ← git submodule (cro-shared)
├── src/
│   ├── features/             # auth, content-mgmt, users, analytics, pricing
│   ├── store/                # Redux store + RTK slices
│   └── api/                  # TanStack Query hooks + axios client
├── package.json
└── .nvmrc
```

### `cro-mobile` — Expo app

```
cro-mobile/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── shared/                   # ← git submodule (cro-shared)
├── app/                      # Expo Router (file-based routing)
│   ├── (auth)/               # login.tsx
│   └── (tabs)/               # index, exercises, profile
├── package.json
└── .nvmrc
```

---

## Database Schema (PostgreSQL + Prisma)

### Key Entities

```
User
  id, email, name, avatarUrl, role (STUDENT|ADMIN)
  nativeLanguage (RU|UK|EN)
  googleId, appleId
  xpTotal, currentStreak, longestStreak, lastPracticeDate
  expoPushToken
  isBlocked
  createdAt, updatedAt

SubscriptionPlan             <- configured via admin panel
  name, intervalMonths (1|12)
  priceEur, priceUsd
  stripePriceIdEur, stripePriceIdUsd
  rcProductIdIos, rcProductIdAndroid

Subscription
  userId (1:1 with User)
  planId, platform (STRIPE|APP_STORE|GOOGLE_PLAY)
  status (TRIALING|ACTIVE|PAST_DUE|CANCELED|EXPIRED)
  currency (EUR|USD)
  trialStartedAt, trialEndsAt
  currentPeriodStart, currentPeriodEnd
  stripeCustomerId, stripeSubscriptionId
  rcOriginalAppUserId
  createdAt, updatedAt

WebhookEvent                 <- idempotent processing
  source ("stripe"|"revenuecat")
  externalEventId @unique    <- idempotency key
  payload (Json)

Category
  nameHr, nameRu, nameUk, nameEn
  sortOrder, isActive

WordSet
  categoryId, nameHr, nameRu, nameUk, nameEn
  sortOrder, isActive

Word
  wordSetId
  baseForm          <- Croatian (nominative case, singular)
  pluralForm        <- Croatian (nominative case, plural)
  translationRu, translationUk, translationEn
  sentenceHr        <- sentence with {{BLANK}} for fill-in-the-blank
  sentenceBlankAnswer
  wrongOptions (Json)  <- 3 distractor options for multiple choice
  sortOrder
  createdAt, updatedAt

WordExerciseConfig
  wordId + exerciseType @unique   <- which exercise types are enabled for a word

UserWordProgress
  userId + wordId + exerciseType  @unique
  seenInCurrentCycle (Boolean)
  cycleNumber
  totalAttempts, correctAttempts
  lastSeenAt, lastCorrectAt

ExerciseSession
  userId, exerciseType, wordSetId
  status (IN_PROGRESS|COMPLETED|ABANDONED)
  totalQuestions, correctAnswers, xpEarned
  createdAt, completedAt

SessionAnswer
  sessionId, wordId, givenAnswer, isCorrect

StreakLog
  userId + date @unique   <- one record per day
  xpEarned

Admin
  id, email, passwordHash
  createdAt, updatedAt
```

---

## NestJS Modules

| Module                | Responsibility                                                 |
| --------------------- | -------------------------------------------------------------- |
| `AuthModule`          | Google OAuth2 + Apple, email/password (admins), JWT (access 15m + refresh 30d in Redis) |
| `UsersModule`         | profile, language, push token, account deletion (GDPR)         |
| `ContentModule`       | CRUD for categories / word sets / words (write — admin only)   |
| `ExercisesModule`     | sessions, results processing                                   |
| `ProgressModule`      | `UserWordProgress`, word cycle logic                           |
| `SubscriptionsModule` | subscription status, plan list with currency                   |
| `PaymentsModule`      | Stripe Checkout, Customer Portal, webhook                      |
| `RevenueCatModule`    | RevenueCat webhook (HMAC verification)                         |
| `GamificationModule`  | XP, streak, StreakLog                                          |
| `NotificationsModule` | BullMQ producer/consumer for Expo push                         |
| `AnalyticsModule`     | aggregations for admin (registrations, subscriptions)          |
| `AdminModule`         | `AdminGuard` + admin-only endpoints, admin user management (add new admins) |

---

## Key API Endpoints

### Auth

```
POST /auth/google
POST /auth/apple
POST /auth/refresh
POST /auth/logout
```

### Admin Auth

```
POST /admin/auth/login
POST /admin/auth/refresh
POST /admin/auth/logout
```

### Users

```
GET    /users/me
PATCH  /users/me
POST   /users/me/push-token
DELETE /users/me
```

### Content (public read)

```
GET /content/categories
GET /content/categories/:id/word-sets
GET /content/word-sets/:id/words
```

### Exercises (protected by SubscriptionGuard)

```
POST /exercises/sessions              # create session, get words + correct answers
POST /exercises/sessions/:id/finish  # submit results, award XP
GET  /exercises/sessions/:id         # get session data (includes correct answers)
```

**Session resume strategy**: If the app closes mid-session, the session is restarted from scratch. No partial progress is persisted server-side. The `GET /exercises/sessions/:id` endpoint returns session metadata and correct answers, but not prior user responses. Abandoned sessions (status = `IN_PROGRESS` with no activity) can be cleaned up via a scheduled job.

### Subscriptions & Payments

```
GET  /subscriptions/plans            # prices in currency by IP
GET  /subscriptions/me
POST /payments/stripe/checkout
POST /payments/stripe/portal
POST /payments/stripe/webhook        # raw body, no auth guard
POST /revenuecat/webhook             # HMAC verification
```

### Admin (protected by AdminGuard)

```
POST /admin/admins                    # add new admin
GET  /admin/admins                    # list all admins
POST/PATCH/DELETE /admin/categories
POST/PATCH/DELETE /admin/word-sets
POST/PATCH/DELETE /admin/words
PATCH /admin/words/:id/exercise-configs
POST/PATCH        /admin/subscription-plans
GET  /admin/users
PATCH /admin/users/:id/block
GET  /admin/analytics/overview
```

---

## Admin Panel — Authentication

### Overview

The admin panel uses a separate email/password authentication system, independent of student OAuth. Admin credentials are stored in a dedicated `Admin` table (not the `User` table). There is no self-registration — new admin accounts can only be created by an already authenticated admin.

### Login flow

1. Admin enters email + password on the login page
2. `POST /admin/auth/login` → backend verifies credentials (bcrypt compare)
3. On success, backend returns JWT access + refresh tokens with `type: "admin"` claim
4. `AdminGuard` checks the `type: "admin"` claim on every protected admin endpoint
5. Refresh flow works identically to student auth (`POST /admin/auth/refresh`), with tokens stored in Redis

### Adding new admins

Authenticated admins can add new admin accounts via the "Add Admin" form in the admin panel:

- **Fields**: email, password, confirm password
- **Validation**: valid email format, password min 8 characters, passwords match
- **Endpoint**: `POST /admin/admins` (protected by `AdminGuard`)

### Default credentials

| Email            | Password   | Notes                                  |
| ---------------- | ---------- | -------------------------------------- |
| test@gmail.com   | zxcv1234   | Seeded via `prisma db seed`            |

The default admin account is created automatically when running the seed script. Change credentials in production.

### Security notes

- Passwords are hashed with **bcrypt** (cost factor 10) before storage
- `@nestjs/throttler` rate-limits login attempts to prevent brute force
- Refresh tokens are stored in **Redis** with 30-day TTL (same as student tokens)
- Admin JWTs include `type: "admin"` claim — `AdminGuard` rejects tokens without this claim

---

## Exercise Types (MVP)

| Type                  | Mechanics                                               | Validation                                                                 |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Jednina i množina** | A word is shown -> user enters the plural form          | trim + lowercase + NFC normalization, client-side comparison with correct answer |
| **Flashcards**        | Word -> tap "I knew it" / "I didn't know" (self-report) | `KNOWN` -> isCorrect=true; `UNKNOWN` -> isCorrect=false                         |
| **Multiple choice**   | 4 options (1 correct + 3 from `wrongOptions`)           | Client compares selected option with correct answer (sent with session data)    |
| **Fill-in-the-blank** | Sentence with a gap (`{{BLANK}}`)                       | Client-side comparison with `sentenceBlankAnswer` (sent with session data)      |

---

## Admin Panel — Content Management UI

### Content hierarchy

Admin manages content in a three-level hierarchy: **Category → Word Set → Word**. Each level has a list view and a create/edit form.

### Category management

- **List view**: table with columns — name (in admin's language), `sortOrder`, `isActive` toggle, edit/delete actions
- **Create/Edit form**: `nameHr`, `nameRu`, `nameUk`, `nameEn`, `sortOrder` (number input), `isActive` (checkbox, default: true)
- **Delete**: soft-check — block deletion if category has word sets (show error: "Remove all word sets first")

### Word Set management

- **List view**: filtered by selected category. Columns — name, word count, `sortOrder`, `isActive` toggle, edit/delete actions
- **Create/Edit form**: select parent category, `nameHr`, `nameRu`, `nameUk`, `nameEn`, `sortOrder`, `isActive`
- **Delete**: block if word set has words

### Word management

- **List view**: filtered by selected word set. Columns — `baseForm`, `pluralForm`, translations (collapsible), enabled exercise types (icon badges), edit/delete actions. Sortable by `sortOrder`.
- **Create/Edit form** — split into sections:

#### Section 1 — Base fields (required for all exercise types)

| Field             | Input type | Validation                          |
| ----------------- | ---------- | ----------------------------------- |
| `baseForm`        | text       | required, Croatian characters       |
| `translationRu`   | text       | required                            |
| `translationUk`   | text       | required                            |
| `translationEn`   | text       | required                            |
| `sortOrder`       | number     | required, integer ≥ 0              |

#### Section 2 — Jednina i množina fields

| Field        | Input type | Validation                                             |
| ------------ | ---------- | ------------------------------------------------------ |
| `pluralForm` | text       | required if exercise type enabled, Croatian characters  |

- Admin enters the correct plural form. The student will see `baseForm` and must type the plural.
- **Preview**: show a read-only card "Student sees: **[baseForm]** → enters: **___**. Correct answer: **[pluralForm]**"

#### Section 3 — Flashcards fields

No additional fields needed — flashcards use `baseForm` + translations (from Section 1). The student sees the Croatian word and self-reports whether they knew the translation.

- **Preview**: show a read-only flashcard "Front: **[baseForm]** → Back: **[translationRu / translationUk / translationEn]** (based on user's language)"

#### Section 4 — Exercise type toggles

A row of toggle switches for each exercise type (maps to `WordExerciseConfig`):

| Toggle                | Enabled when                                             |
| --------------------- | -------------------------------------------------------- |
| Jednina i množina     | `pluralForm` is filled in                                |
| Flashcards            | always available (base fields are sufficient)            |
| Multiple choice       | `wrongOptions` has 3 entries (Phase 3+)                  |
| Fill-in-the-blank     | `sentenceHr` and `sentenceBlankAnswer` are filled (Phase 3+) |

- Toggles for Multiple choice and Fill-in-the-blank are **disabled/hidden** until Phase 3 Step 8 adds those types
- If admin tries to enable a toggle but required fields are missing → show inline validation error ("Fill in `pluralForm` to enable this exercise type")
- Saving the form sends `PATCH /admin/words/:id/exercise-configs` with the updated toggle states

### Bulk operations

- **Word list**: checkbox column + bulk actions: "Enable exercise type for selected", "Disable exercise type for selected"
- Useful for enabling Flashcards across an entire word set at once

---

## Word Cycle Logic

```
getNextWords(userId, exerciseType, wordSetId, count):

1. Find words with seenInCurrentCycle = false
2. If enough -> return them
3. If words are exhausted -> offer user to reset:
     UPDATE userWordProgress
     SET seenInCurrentCycle = false,
         cycleNumber = cycleNumber + 1
     WHERE userId AND exerciseType AND wordSetId
4. If user agrees, return first N words from the reset cycle

On session finish -> bulk markWordsSeen() -> seenInCurrentCycle = true for all answered words
```

**New users**: On first opening of a word set — create `UserWordProgress` records for all words with `seenInCurrentCycle = false`. This simplifies cycle queries.

---

## Payment Architecture

### Currency Detection

`CurrencyMiddleware` -> `geoip-lite.lookup(req.ip)` -> EU countries = EUR, others = USD -> attached to request context.

### Stripe (Web)

```
Click "Subscribe" ->
POST /payments/stripe/checkout { planId } ->
stripe.checkout.sessions.create(...) ->
redirect to Stripe Checkout ->
webhook: checkout.session.completed -> update Subscription in DB
```

Webhook security: `stripe.webhooks.constructEvent(rawBody, sig, secret)`. Idempotency: check `WebhookEvent.externalEventId` before processing.

### RevenueCat (Mobile)

```
Purchases.configure({ apiKey, appUserID: userId }) ->
Purchases.purchasePackage(package) ->
App Store / Google Play IAP ->
RevenueCat webhook -> POST /revenuecat/webhook ->
update Subscription in DB
```

Webhook security: HMAC from `Authorization` header (shared secret from RevenueCat dashboard).

### Trial

- Automatically activated on first login (server creates trial during auth — no separate endpoint)
- `status=TRIALING`, `trialEndsAt = now + 7 days`
- BullMQ schedules push notifications: 48h and 2h before expiry
- `SubscriptionGuard` checks `status IN [TRIALING, ACTIVE] AND period_end > now`

---

## Pre-commit Hooks

Each repo has its own `.husky/pre-commit` + `lint-staged` config:

```bash
# .husky/pre-commit -> lint-staged (per repo)

*.{ts,tsx}:
  - eslint --fix --max-warnings=0
  - prettier --write

# cro-api:
src/**/*.ts -> node --test (backend unit tests)

# cro-web / cro-admin:
src/**/*.tsx -> jest --findRelatedTests --passWithNoTests

# cro-mobile:
app/**/*.tsx -> jest --findRelatedTests --passWithNoTests
```

`--findRelatedTests` runs only tests for changed files -> pre-commit < 10 seconds.

---

## Testing Strategy

### Backend (`node:test`)

Priorities:

1. `ProgressService` — word cycle logic
2. `ExercisesService` — results processing, XP calculation
3. `GamificationService` — streak, XP
4. `PaymentsService` — webhook idempotency
5. `AdminAuthService` — login, password hashing, token generation

### Frontend (Jest + React Testing Library)

Priorities:

1. Exercise components — input, result
2. Auth flow
3. Paywall — trial / plan display
4. Redux slices

### Coverage (MVP)

- Backend services: 70% lines
- Frontend features: 60% lines
- Mobile: manual testing + Expo Go

---

## Gamification

- **XP**: 10 XP per correct answer (constant in config)
- **Streak**: +1 day if `lastPracticeDate` = yesterday; reset to 0 if a day is missed
- `StreakLog` — one record per day (`@@unique([userId, date])`)
- Display: web header + mobile tab bar

---

## MVP Development Phases

### Phase 1 — Foundation

- Initialize separate repos (`cro-api`, `cro-web`, `cro-admin`) + `cro-shared` submodule
- ESLint (airbnb) + Prettier, Husky, Docker Compose
- NestJS: ConfigModule + Prisma + Swagger
- Prisma migration (full schema)
- AuthModule: Google + Apple, email/password (admins), JWT, refresh in Redis
- Admin login page (email + password) + `AdminGuard`
- Vite + React + MUI for web and admin
- i18next (RU/UK/EN) in web and admin
- Redux + TanStack Query setup for web and admin
- Language selection screen (first login onboarding: set `nativeLanguage`)
- CORS configuration for cross-origin requests (web/admin on Vercel → API on Railway)
- Basic CI (lint + typecheck + test)

**Result**: Working Google/Apple login on web with language selection onboarding. Admin panel login with email/password.

### Phase 2 — Content + Exercise Engine

- ContentModule (CRUD + Redis cache)
- Database seed script (`prisma db seed`) — initial categories, word sets, words, and default admin account (test@gmail.com / zxcv1234)
- Admin UI: categories, word sets, words
- Admin UI: "Add Admin" form (manage admin accounts from the panel)
- ProgressModule + cycle logic
- ExercisesModule: sessions, results processing, 2 exercise types (Jednina i množina + Flashcards)
- Exercise screens on web for these 2 types
- GamificationModule: XP + streak
- Unit tests: word cycle, results processing, streak

**Result**: 2 exercise types working. Content created via admin panel.

### Phase 3 — Mobile App

**Step 1 — Initialize `cro-mobile` repo & clean up Expo starter**

- Initialize `cro-mobile` repo with `cro-shared` submodule
- ESLint (airbnb) + Prettier, Husky, basic CI
- Remove example screens content (`explore.tsx` placeholder, `modal.tsx` demo)
- Remove example components (`HelloWave`, `ParallaxScrollView`, `Collapsible`, example assets)
- Update `app.json`: set `name` → "Croatian Grammar", `slug` → "croatian-grammar", `scheme` → "crogrammar"
- Keep useful components: `ThemedText`, `ThemedView`, `IconSymbol`, `HapticTab`, `ExternalLink`
- Keep theme system (`constants/theme.ts`, `useColorScheme`, `useThemeColor`)

**Expected result**: App launches with a clean Home tab showing "Croatian Grammar" title. No example/demo content remains. `npm run dev` in the `cro-mobile` repo starts without errors.

---

**Step 2 — Set up i18n (i18next + react-i18next)**

- Install `i18next`, `react-i18next`, `expo-localization`
- Create `i18n/` directory with `index.ts` config and `locales/` (en.json, ru.json, uk.json)
- Locale keys: `common.*`, `auth.*`, `nav.*`, `profile.*` (same structure as web app)
- Detect device language via `expo-localization`, fallback to `en`
- Initialize i18n in root `_layout.tsx`
- Replace hardcoded strings in tab labels and screens with `t()` calls

**Expected result**: App displays UI strings from locale files. Changing device language to RU/UK switches app strings accordingly. Fallback to English for unsupported languages.

---

**Step 3 — Set up Redux Toolkit store**

- Install `@reduxjs/toolkit`, `react-redux`
- Create `store/index.ts` with `configureStore`, typed hooks (`useAppDispatch`, `useAppSelector`)
- Create `store/auth.slice.ts` with `AuthState` (`user`, `isAuthenticated`), actions: `setUser`, `clearUser`
- Use `@cro/shared` `UserProfile` type for user state
- Wrap app with `<ReduxProvider>` in root `_layout.tsx`

**Expected result**: Redux store initializes on app launch. Auth slice is accessible via `useAppSelector`. No UI changes yet — state layer is ready for auth integration.

---

**Step 4 — Set up TanStack Query + axios API client**

- Install `@tanstack/react-query`, `axios`, `expo-secure-store`
- Create `api/client.ts` with axios instance (baseURL from env/constants)
- Add request interceptor: attach access token from `expo-secure-store`
- Add response interceptor: on 401, attempt token refresh via `/auth/refresh`, retry original request; on failure, clear tokens and set `isAuthenticated = false`
- Create `api/query-client.ts` with `QueryClient` (staleTime: 5 min, retry: 1)
- Wrap app with `<QueryClientProvider>` in root `_layout.tsx`

**Expected result**: API client is configured and exported. Token storage uses secure native storage (not AsyncStorage). Automatic 401 → refresh → retry flow is in place. `npm run typecheck` in the `cro-mobile` repo passes.

---

**Step 5 — Set up auth navigation layout (auth vs main groups)**

- Restructure Expo Router groups:
  - `app/(auth)/` — unauthenticated screens: `login.tsx`
  - `app/(tabs)/` — authenticated screens: `index.tsx` (Home), `exercises.tsx`, `profile.tsx`
- Update root `_layout.tsx`: read `isAuthenticated` from Redux store, redirect to `/(auth)/login` or `/(tabs)` accordingly
- Configure 3-tab bottom navigation: Home, Exercises, Profile (with i18n labels from `nav.*` keys)
- Add tab icons using `IconSymbol` component

**Expected result**: App shows login screen by default (unauthenticated state). Manually setting `isAuthenticated = true` in Redux shows the 3-tab layout. Navigation between tabs works. Tab labels display in the current locale language.

---

**Step 6 — Create login screen (Google + Apple sign-in buttons)**

- Create `app/(auth)/login.tsx` with app logo, welcome text, and two sign-in buttons
- Style buttons: "Sign in with Google" and "Sign in with Apple" (Apple button only on iOS via `expo-apple-authentication` availability check)
- Use i18n keys `auth.signInWithGoogle`, `auth.signInWithApple` for button labels
- Buttons are non-functional placeholders (onPress logs to console) — API connection in next step

**Expected result**: Login screen shows app name, welcome message, and sign-in buttons. Apple button only appears on iOS. Text is translated based on device language. UI is clean and themed (light/dark mode supported).

---

**Step 7 — Connect auth to API (Google + Apple OAuth flow + token storage)**

- Install `expo-auth-session`, `expo-web-browser`, `expo-crypto`, `expo-apple-authentication`
- Implement Google OAuth flow: `useAuthRequest` (via `expo-auth-session`) + `expo-web-browser` → open Google consent screen → receive auth code → send to `POST /auth/google` → receive JWT tokens
- Implement Apple Sign-In: `expo-apple-authentication` → receive identity token → send to `POST /auth/apple` → receive JWT tokens (iOS only)
- Store `accessToken` and `refreshToken` in `expo-secure-store`
- Dispatch `setUser` action with user profile from API response
- On logout: call `POST /auth/logout`, clear tokens from secure store, dispatch `clearUser`
- Add "Sign out" button to Profile tab screen
- Handle deep link redirect after OAuth (`scheme` in `app.json`)

**Expected result**: Tapping "Sign in with Google" opens Google consent screen via `expo-web-browser`. Tapping "Sign in with Apple" (iOS) opens native Apple Sign-In dialog. After successful auth, user lands on the Home tab with their profile loaded. Tokens are stored securely. App persists auth state across restarts (checks secure store on launch). Sign out returns to login screen. `npm run typecheck` in the `cro-mobile` repo passes.

---

**Step 8 — Remaining exercise types on web**

- Add exercise types 3-4 (Multiple choice + Fill-in-the-blank) to backend and web
- Unit tests for all 4 exercise types

**Result**: All 4 exercise types working on web.

---

**Step 9 — Exercise screens + gamification on mobile**

- Exercise screens for all 4 exercise types (port from web)
- Gamification display: XP + streak in tab bar

**Result**: Mobile app with auth, exercises, and gamification — ready for subscriptions.

### Phase 4 — Subscriptions + Payments

- SubscriptionsModule + trial
- CurrencyMiddleware (geoip-lite)
- PaymentsModule: Stripe Checkout, portal, webhooks
- RevenueCatModule: webhooks + HMAC
- `react-native-purchases` (RevenueCat mobile SDK)
- Paywall screens on web and mobile
- Pricing UI in admin
- Push: trial expiry warnings (BullMQ + `expo-notifications`)

**Result**: Full monetization cycle on all platforms (web + mobile).

### Phase 5 — Notifications + Analytics + Polish

- BullMQ: daily reminders + trial expiry jobs
- Admin analytics: registration and subscription charts
- Admin: user management (view, block)
- Sentry in all 4 apps
- Performance: Redis content cache, TanStack Query tuning
- Test coverage improvements
- E2e tests: login, exercise session, subscription purchase
- Manual testing + Expo Go for mobile
- Staging deploy + smoke test
- Production deploy (API, web, admin) + EAS Build + EAS Submit

**Result**: Release-ready MVP on all platforms (web + mobile).

---

## Deploy (MVP)

| Component   | Platform                                      |
| ----------- | --------------------------------------------- |
| NestJS API  | Railway (includes managed PostgreSQL + Redis) |
| PostgreSQL  | Railway managed                               |
| Redis       | Railway managed                               |
| Web app     | Vercel                                        |
| Admin panel | Vercel (separate project)                     |
| Mobile      | Expo EAS Build + EAS Submit                   |
| Mobile dev  | Expo Go (scan QR code)                        |
| Local dev   | Docker Compose (postgres + redis)             |

### EAS Mobile CI/CD

```json
// eas.json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  }
}
```

OTA updates via `expo-updates` for JS changes without resubmitting to stores.

---

## Additional Libraries

| Library                                                     | Purpose                                             |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `zod`                                                       | env variable validation + form schemas              |
| `react-hook-form`                                           | frontend forms                                      |
| `date-fns`                                                  | date handling                                       |
| `geoip-lite`                                                | country detection by IP -> currency                 |
| `class-validator` + `class-transformer`                     | NestJS DTO validation                               |
| `@nestjs/swagger`                                           | automatic API documentation                         |
| `@nestjs/throttler`                                         | rate-limiting                                       |
| `helmet`                                                    | security headers                                    |
| `bcrypt`                                                    | password hashing for admin accounts                 |
| `passport-google-oauth20` + `passport-apple`                | OAuth strategies                                    |
| `@nestjs/jwt`                                               | JWT tokens                                          |
| `stripe` (Node SDK)                                         | Stripe API                                          |
| `@stripe/stripe-js` + `@stripe/react-stripe-js`             | Stripe frontend                                     |
| `react-native-purchases`                                    | RevenueCat mobile SDK                               |
| `expo-auth-session`                                         | OAuth flow for mobile (Google)                      |
| `expo-web-browser`                                          | in-app browser for OAuth redirects                  |
| `expo-crypto`                                               | PKCE code verifier/challenge for OAuth              |
| `expo-apple-authentication`                                 | native Apple Sign-In on iOS                         |
| `expo-notifications`                                        | push notifications                                  |
| `winston` or `pino`                                         | structured logging                                  |
| `@sentry/nestjs` + `@sentry/react` + `@sentry/react-native` | error monitoring                                    |
| `commitlint`                                                | Conventional Commits                                |

---

## Verification (How to Check Everything Works)

1. `docker compose up -d` (in `cro-api` repo) -> `npm run dev` in each repo -> all 4 apps start without errors
2. Log in via Google on web -> land on language selection screen -> choose language -> redirected to home
3. Open a word set, start a "Jednina i množina" session, enter correct and incorrect answers — verify XP and word status
4. Complete all words in a set -> confirm the cycle resets and words are shown again when user confirms reset
5. Streak: log in on two consecutive days -> confirm streak = 2
6. Open paywall -> create a Stripe Checkout session -> complete test payment -> confirm status changed to ACTIVE
7. Log in to admin panel with default credentials (test@gmail.com / zxcv1234) -> land on admin dashboard
8. Add a new admin account via "Add Admin" form -> log out -> log in with the new account -> confirm access works
9. Admin: create a category -> word set -> word with translations -> confirm word appears in the app
10. Admin: change subscription price -> confirm new price is displayed in the app
11. `npm test` in each repo -> all tests pass
12. `npm run lint` and `npm run typecheck` in each repo -> no errors

---

## Local Development Setup

### Prerequisites

- **Node.js 24 LTS** — install via [nvm](https://github.com/nvm-sh/nvm): `nvm install` (reads `.nvmrc`)
- **Docker** — for PostgreSQL and Redis containers
- **npm** — comes with Node.js (v11+)

### 1. Clone repositories with submodules

```bash
git clone --recurse-submodules <repo-url>
# Or, if already cloned:
git submodule update --init --recursive
```

Repeat for each repo (`cro-api`, `cro-web`, `cro-admin`, `cro-mobile`).

### 2. Install dependencies

In each repo:

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in at least:

- `DATABASE_URL` — already set for local Docker
- `REDIS_URL` — already set for local Docker
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — any random strings (min 16 chars)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` — from Google Cloud Console (OAuth 2.0 credentials)

Apple OAuth and Stripe/RevenueCat keys are optional for local development.

### 4. Start infrastructure

```bash
docker compose up -d
```

This starts:

- **PostgreSQL 17** on `localhost:5432` (user: `cro`, password: `cro_dev_password`, db: `cro_grammar`)
- **Redis 7** on `localhost:6379`

### 5. Run database migrations (in `cro-api` repo)

```bash
npx prisma migrate dev --schema=src/prisma/schema.prisma
```

To explore the database visually:

```bash
npx prisma studio --schema=src/prisma/schema.prisma
```

### 6. Start each app

In each repo:

```bash
npm run dev
```

| App                | URL                                     |
| ------------------ | --------------------------------------- |
| API (NestJS)       | http://localhost:3000                   |
| API Docs (Swagger) | http://localhost:3000/api/docs          |
| Web app            | http://localhost:5173                   |
| Admin panel        | http://localhost:5174                   |
| Mobile (Expo)      | Scan QR code from terminal with Expo Go |

### 7. Verify everything works

In each repo:

```bash
npm run lint                    # ESLint — should pass with 0 warnings
npm run typecheck               # TypeScript — should pass with 0 errors
npm test                        # Tests — should pass
```

### Useful commands (in `cro-api` repo)

```bash
npx prisma format --schema=src/prisma/schema.prisma    # Format Prisma schema
npx prisma validate --schema=src/prisma/schema.prisma   # Validate schema
npx prisma generate --schema=src/prisma/schema.prisma   # Regenerate Prisma Client
npm run format                                           # Prettier on all files
```

### Updating the shared submodule

```bash
cd shared
git pull origin main
cd ..
git add shared
git commit -m "chore: update shared submodule"
```

---

## Critical Files for Implementation

- `shared/src/types/index.ts` (in `cro-shared` submodule) — shared TS types; define in Phase 1
- `src/prisma/schema.prisma` (in `cro-api`) — full data schema; migrate before any module development
- `src/modules/progress/progress.service.ts` (in `cro-api`) — word cycle logic; most critical business logic
- `src/modules/payments/payments.service.ts` (in `cro-api`) — webhook + idempotency; bugs = financial losses
- `docker-compose.yml` (in `cro-api`) — local dev stack
- `.husky/pre-commit` + lint-staged config (in each repo) — pre-commit gates
