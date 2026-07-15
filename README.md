<div align="center">

# Gaza Reconstruction Platform

**Rebuilding, together, with transparency**

A digital platform that coordinates the reconstruction of Gaza — connecting **beneficiaries** whose homes and property were damaged with vetted **reconstruction teams**, and enabling **donors** to fund specific projects and follow their impact transparently, from damage assessment through handover.

*The platform's Arabic brand name is حنعمرها (Han-Amerha). The application UI is fully bilingual; this document is maintained in English.*

</div>

---

## Overview

The platform serves three roles:

- **Beneficiaries** — property owners who register damage, submit reconstruction requests, and track their projects through every phase.
- **Reconstruction teams** — contractors and engineers who carry out the projects.
- **Donors** — supporters who fund specific projects or the general fund and track the impact of their contributions.

The application is **fully bilingual** (English is the default locale, Arabic RTL is secondary with a runtime toggle), **mobile-first**, and currently runs against a **mock backend** seeded with realistic Gaza-context data until it is connected to a real server.

> This project is a full reimagining of an existing Angular 11 customer portal (`topproz-customer-web`), rebuilt in a modern Angular 20 stack, re-skinned to the **"Reconstruction & Resilience"** design system, and renamed end-to-end to the Gaza reconstruction domain.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | **Angular 20** — standalone components, signals, new control flow (`@if`/`@for`/`@switch`), `inject()`, lazy routes |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens), RTL via logical properties |
| Rendering | **SSR** (`@angular/ssr`) for public pages; the `/app/*` shell is client-rendered |
| PWA | `@angular/service-worker` (offline-tolerant caching) |
| i18n | Hand-rolled runtime translation service (signals + `httpResource`), single build, no locale split |
| State | Angular signals + `providedIn: 'root'` services (no NgRx) |
| HTTP | `HttpClient` + functional interceptors (`auth`, `error`, `mock-api`) + typed DTO/mapper layer |
| Icons | `@lucide/angular` (per-icon attribute directives) |
| Maps | `leaflet` (lazy, SSR-guarded) |
| Fonts | `@fontsource/ibm-plex-sans-arabic` (self-hosted, no CDN) |
| Quality | ESLint (angular-eslint, flat config) + Prettier, `strict: true`, no `any` |

---

## Design system — "Reconstruction & Resilience"

Colors come from **`DESIGN.md`'s authoritative front-matter** (a Material-3 token set), applied via one `@theme` block in `src/styles.css` so the whole app re-skins from a single file.

| Token | Value | Use |
|---|---|---|
| `brand-500` (primary) | `#006a45` | Primary actions, active states |
| `brand-600` | `#005c3b` | Hover |
| `sand-300` / `sand-700` | `#fdc170` / `#81550b` | Warm "construction" accent |
| `ink-900 / 700 / 500 / 300` | `#191c1b` … `#bdcabf` | Headings / body / secondary / borders |
| `canvas` | `#f8faf8` | Page background |
| `nav-bg` | `#0f3a29` | Sidebar (deep emerald) |
| `success / warning / danger / info` | `#006a45 / #9a6a05 / #ba1a1a / #2563eb` | Semantic |
| radius `rounded-card` | `0.875rem` (14px) | Cards, buttons, inputs |

Principles: **trauma-informed, calm, dignified** tone; mobile-first (360px baseline, responsive upward); RTL-first discipline (logical properties only); touch targets ≥44px; typography in **IBM Plex Sans Arabic** for both scripts.

---

## Architecture

```
src/app/
├─ core/
│  ├─ models/         # typed domain models (all domains)
│  ├─ api/            # per-domain API services + dto/ mappers
│  ├─ session/        # SessionStore (signal-based single source of truth)
│  ├─ interceptors/   # auth, error, mock-api
│  ├─ guards/         # authGuard, roleGuard
│  ├─ i18n/           # TranslationService + TranslatePipe
│  ├─ toast/          # ToastService
│  └─ mock/           # in-memory mock backend: fixtures/ + handlers/
├─ shared/ui/         # 27 reusable components (design-system building blocks)
├─ layout/            # AppShell, Sidebar (role-aware), Header
├─ features/
│  ├─ public/         # landing, public project, public team profile, public nav
│  ├─ auth/           # email-check sign-in, auth callback
│  ├─ requests/ projects/ teams/
│  ├─ estimates/ funding/ donations/         # (building)
│  ├─ support/ complaints/ account/          # (building)
│  ├─ notifications/ dashboard/ content/ wizards/  # (building)
│  └─ coming-soon/    # placeholder (being retired as real pages land)
└─ app.routes.ts / app.config.ts
```

### Mock backend
There is no real server yet. `mock-api.interceptor.ts` intercepts every request to `environment.apiUrl`, routes it by method + path to a per-domain handler (`core/mock/handlers/*`), and serves an in-memory store seeded from `core/mock/fixtures/*` with realistic Gaza-context data (teams, projects across all five governorates, requests, estimates, funding, donations, support, complaints, notifications). It short-circuits before any network/SSR call, so it is SSR-safe by construction. Swapping to a real backend is just pointing `environment.apiUrl` at it — the typed service/DTO layer stays the same.

### Demo accounts
The sign-in page lists these; all use password **`Demo@1234`**:

| Role | Email |
|---|---|
| Beneficiary | `youssef@example.com` |
| Donor | `amina@example.com` |
| Team | `team@example.com` |

---

## Domain rename (topproz → Gaza reconstruction)

The original home-services vocabulary was renamed end-to-end (code, routes, and UI):

| Original | Gaza domain | Route |
|---|---|---|
| Customer | Beneficiary | — |
| Pro / My Pros | Team | `/app/teams` |
| Lead / Call | Request | `/app/requests` |
| Invoice | Funding & disbursement | `/app/funding` |
| Estimate (quote) | Estimate / BOQ | `/app/estimates` |
| Book a Pro / Get Quotes | Request wizards | `/app/request/*` |
| Pay deposit / card payment | Donor funding (Stripe, deferred) | `/app/donations` |

---

## Running the project

```bash
npm install          # install dependencies
npm start            # dev server → http://localhost:4200
npm run build        # production build (SSR)
npm run lint         # ESLint
npm test             # unit tests (Karma)
```

The language toggle is in the header (globe icon); the choice persists in `localStorage`.

---

## Build status

| Domain | Pages | Status |
|---|---|---|
| Design tokens (DESIGN.md palette) | — | ✅ Applied |
| Core (models, session, interceptors, guards, i18n, mock backend) | — | ✅ Done |
| Shared UI components | 27 | ✅ Done |
| App shell (sidebar, header, footer) | — | ✅ Done |
| Public site + Auth | landing, public project, public team, email sign-in, callback | ✅ Done |
| Requests | list, detail | ✅ Done |
| Projects | list, detail (phase stepper, team review) | ✅ Done |
| Teams | list, profile (dual public/authenticated) | ✅ Done |
| Data layer for remaining domains | APIs + DTOs + mock fixtures/handlers | ✅ Done |
| Estimates | list, BOQ view (approve/reject/sign) | 🚧 Building |
| Funding & disbursements | list, details, signature, transaction | 🚧 Building |
| Donations | list, donate, detail (+ public donate) | 🚧 Building |
| Support | list, form, view | 🚧 Building |
| Complaints | list, form, view | 🚧 Building |
| Profile / Account / Notification prefs | 3 | 🚧 Building |
| Notifications + Dashboard | 2 | 🚧 Building |
| Content (privacy / terms / help) | 3 | 🚧 Building |
| Request wizards (to-team / assessment / new beneficiary) | 3 | 🚧 Building |
| Route wiring, i18n merge, verification | — | ⏳ Pending |

Legend: ✅ done · 🚧 in progress · ⏳ pending

### Known deferrals
- **Stripe / card capture** for donations is intentionally deferred; the donation flow is functional against the mock backend without real payment.
- **Logo** is a placeholder abstract mark in the brand palette pending the final asset.
- **Team/contractor dashboard** and **admin** are out of scope for this phase.

---

## Changelog

- **Tooling** — removed the deprecated `baseUrl` compiler option (path aliases now resolve without it).
- **Reconstruction & Resilience re-skin** — adopted DESIGN.md's authoritative Material-3 palette (primary `#006a45`).
- **Full data layer** for estimates, funding, donations, support, complaints, notifications, profile, assessment questions, and request creation.
- **Foundation + first verticals** — Angular 20 scaffold, Tailwind v4 tokens, i18n (en/ar RTL), PWA/SSR, mock backend, 27 shared components, app shell, and the Public / Auth / Requests / Projects / Teams pages.

*This README is maintained continuously in English as the project progresses.*
