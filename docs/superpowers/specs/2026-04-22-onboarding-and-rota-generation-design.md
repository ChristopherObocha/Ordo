# Onboarding & Rota Generation — Design Spec
**Date:** 2026-04-22  
**Status:** Approved

---

## Overview

This spec covers the complete rebuild of the post-signup onboarding flow, the romcal liturgical calendar integration, the rota auto-generation engine, extended rota preview ranges, a floating generate button on the dashboard, and multi-format export.

The chosen approach is **phased onboarding with resume** (Option B): three distinct phases — Setup, Import, Generate — each persisted to Convex so a user can drop off and resume exactly where they left.

---

## Architecture & Data Model

### Routing Logic

After any sign-in or sign-up, the app checks:
1. Does the user have a `parishMember` record? → No → `/onboarding`
2. If yes, what is `users.onboardingPhase`?
   - `"setup" | "import" | "generate"` → `/onboarding?phase=X`
   - `"complete"` → `/dashboard`

`/onboarding` is a single resumable page, not separate routes per step.

### Schema Additions

**`users` table — new fields:**
- `onboardingPhase: v.optional(v.union(v.literal("setup"), v.literal("import"), v.literal("generate"), v.literal("complete")))` — current phase
- `onboardingStep: v.optional(v.number())` — sub-step within the phase for granular resume

**`rotaShares` — new table:**
- `rotaId: v.id("rotas")`
- `token: v.string()` — unique, used as URL slug
- `expiresAt: v.optional(v.number())` — unix timestamp, optional
- `createdBy: v.id("users")`
- Index: `by_token`

### New Convex Files

| File | Purpose |
|---|---|
| `convex/liturgical.ts` | Action: generate + cache liturgical year via romcal |
| `convex/rotaGeneration.ts` | Action: auto-assign clergy to activity slots |
| `convex/rotaShares.ts` | Mutations/queries for shareable rota links |
| `convex/icalImport.ts` | Action: fetch + parse iCal URL server-side |

---

## Onboarding Flow

### Layout

- Dark left sidebar: Ordo wordmark, feature highlights, current phase label
- White right panel: step content with horizontal slide + fade transitions between steps
- Persistent progress bar at top of right panel showing position within phase
- Phase labels: **Setup · Import · Generate**

---

### Phase 1: Setup (4 steps)

**Step 1 — Personal info & role**
- Name field (pre-filled from auth if available)
- Two dropdowns side by side:
  - *Your role in the parish*: `parish_priest` / `administrator`
  - *I am a*: `bishop` / `priest` / `deacon` / `religious` / `sister`
- Updates `users` record with name + role fields
- Saves `onboardingPhase = "setup"`, `onboardingStep = 1`
- Note: the user's own `clergy` record is created at Step 4 once the parish exists

**Step 2 — Parish info**
- Parish name, type (parish/cathedral/abbey/seminary/chaplaincy/shrine), diocese
- Country/locale dropdown (defaults to `en-GB` / England & Wales)
- Timezone (auto-populated from locale, editable)
- On save: creates `parishes` record, fires `generateLiturgicalYear(currentYear, locale)` as a non-blocking action
- Saves `onboardingStep = 2`

**Step 3 — Churches**
- Main church name pre-filled as parish name, editable
- "Add satellite church" inline card: name + type (outstation/chapel/oratory)
- Cards add with smooth expand animation; removable
- Travel time between churches: optional, can be populated later from clergy screen
- Creates `churches` records on continue
- Saves `onboardingStep = 3`

**Step 4 — Clergy**
- Table-style input: each row = name, type dropdown, roles (multi-tag input)
- Row 1 = the current user, pre-filled and locked
- "Add another" button adds new row with expand animation
- Smart prefix suggestions as you type (Fr., Deacon, Sr., Br.) based on selected type
- Email optional — invite links can be sent later from clergy screen
- Creates `clergy` records on continue
- Marks `onboardingPhase = "import"`, `onboardingStep = 0`, transitions to Phase 2

---

### Phase 2: Import (3 steps)

**Step 1 — Choose import method**
Two large cards with icons and hover glow:
- **Connect iCal** — paste a calendar URL
- **Enter manually** — add activities by hand

**Step 2a — iCal import**
- Text input for iCal URL + "Fetch" button
- Fires `convex/icalImport.ts` action server-side (avoids CORS)
- Loading state: pulse animation with "Fetching your calendar…"
- Displays grouped list of events found (by recurrence type)
- Error states: invalid URL / unreachable / no events found — each with retry option

**Step 2b — Manual entry**
- Table-style input: activity name, type dropdown, schedule, time
- Pre-populated defaults: "Sunday Mass" 10:00, "Saturday Vigil Mass" 18:00
- "Add another" with expand animation

**Step 3 — Event mapping (iCal path only)**
- Grid of parsed events as cards: title, time/recurrence, auto-assigned type badge
- Auto-categorisation: keyword match on title (mass, confessions, exposition, vespers, baptism → matching type; unknown → "other")
- Each card has inline editable type dropdown — updating swaps badge with smooth animation
- Unrecognised events: soft amber border, must be resolved before continuing
- "Create new type" option at bottom of each dropdown (saves as `type: "other"` with custom name)
- Saves all as `activities` records
- Marks `onboardingPhase = "generate"`, `onboardingStep = 0`, transitions to Phase 3

---

### Phase 3: Generate (3 steps)

**Step 1 — Rules (optional)**
- "Skip for now" link top-right
- Locked default chips (read-only): "Each Mass requires 1 priest", "Each Confession requires 1 priest"
- "Add a rule" → sentence-builder form: [Activity A] + [Activity B] + "must be assigned to" + [same/different priest]
- Rules saved to `rules` table with `type: "soft"`

**Step 2 — Preview rota**
- Date range toggle: **1 month · 3 months (default) · 6 months · End of year** (End of year = 31 December of the current calendar year)
- On entering step, `generateRota` action fires automatically
- Full-screen loading state: animated liturgical cross motif + "Generating your rota…"
- Renders as scrollable monthly calendar grid (broader view, not the weekly dashboard grid)
- Assigned clergy shown as coloured chips matching existing type colour palette
- Violations: soft red border + tooltip ("No priest available")
- Inline drag-to-reassign and click-to-assign modal (same as dashboard)

**Step 3 — Finalise & export**
- Summary: "X activities across Y weeks, Z clergy assigned"
- Four export buttons: **PDF · CSV · DOCX · Copy link**
  - PDF: client-side via `@react-pdf/renderer`
  - CSV: client-side, instant download
  - DOCX: client-side via `docx` npm package
  - Copy link: creates `rotaShares` record, copies `/share/[token]` to clipboard with "Copied!" toast
- "Go to rota" button: marks `onboardingPhase = "complete"`, navigates to `/dashboard/rota`

---

## Dashboard Rota Screen Changes

### Date Range Selector
- Toggle added to the top of `/dashboard/rota`: **1 month · 3 months (default) · 6 months · End of year** (End of year = 31 December of the current calendar year)
- Selecting a range switches from weekly grid to scrollable monthly overview
- Clicking any week row in monthly view expands to the existing weekly drill-down
- `getForWeek` query extended to `getForRange(parishId, startDate, endDate)`

### Floating Generate Button (FAB)
- Fixed circular button, bottom-right corner
- `--ordo-primary` fill, subtle shadow, grid-with-sparkle icon
- On click: modal slides up from bottom containing:
  - Date range picker (pre-filled to current month)
  - Checkboxes to include/exclude activity types
  - Clergy inclusion list (all active clergy checked by default)
  - "Generate" button — fires `generateRota` action
- Results load into rota grid, replacing draft assignments for that range
- If published assignments exist in range: warning prompt before overwriting

---

## Backend

### `convex/liturgical.ts` — Romcal integration
- Dependency: `romcal` npm package
- Action `generateLiturgicalYear(year, locale)`:
  1. Query `liturgicalCache` for matching `{ year, locale }` — return immediately if found
  2. Call romcal calendar generation for that year + locale
  3. Store result in `liturgicalCache.data` (map of date strings → `{ season, colour, rank, name }`)
  4. Return cached data
- Called fire-and-forget from onboarding parish step once locale is confirmed
- Liturgical colour derived from this cache at rota generation time

### `convex/rotaGeneration.ts` — Auto-assignment engine
- Action `generateRota(parishId, startDate, endDate)`:
  1. Load all active `activities` for parish
  2. Load all active `clergy` + their `availability` (default: 7-day full availability if no records)
  3. Load active `rules` + hardcoded defaults (Mass → 1 priest, Confession → 1 priest)
  4. Expand each activity's schedule across date range into individual dated slots
  5. For each slot, filter eligible clergy by `requiredRoles` + availability
  6. Assign via round-robin for even load distribution
  7. Flag slots with no eligible clergy: `hasViolation: true`, `violationDetail: "No eligible priest"`
  8. Create `rotas` record (status: `draft`), bulk-insert `assignments`

### `convex/icalImport.ts` — iCal parsing
- HTTP action: fetch iCal URL server-side (avoids CORS)
- Parse using `ical.js` npm package
- Return structured list: `{ title, dtstart, rrule?, duration }`
- Auto-categorise each event by keyword matching against activity types

### `convex/rotaShares.ts` — Shareable links
- Mutation `createShare(rotaId)`: generates unique token, inserts `rotaShares` record, returns token
- Query `getByToken(token)`: public, no auth required — used by `/share/[token]`
- Next.js route `/share/[token]`: public read-only rota view, styled for print, no auth wall

### Export
- **CSV**: client-side, no backend — flattens assignments to rows, triggers download
- **DOCX**: client-side via `docx` package, generated in browser
- **PDF**: client-side via `@react-pdf/renderer`
- **Share link**: `createShare` mutation → token → `/share/[token]` copied to clipboard

---

## Animation & Design Language

All animations follow the existing Ordo design system:
- Fonts: EB Garamond (headings), DM Sans (body), DM Mono (codes/tokens)
- Colours: existing CSS variables (`--ordo-primary`, `--ordo-success`, `--ordo-satellite`, etc.)
- Onboarding step transitions: horizontal slide (80px) + opacity fade, 300ms ease-out
- Phase transitions: slightly longer cross-fade (500ms) to signal a bigger jump
- Expand animations (add clergy row, add church card): max-height + opacity, 200ms
- FAB: subtle scale-up on hover (1.05), shadow deepens
- Loading states: opacity pulse on skeleton elements, no spinners
- Toasts: slide in from bottom-right, auto-dismiss after 3s

---

## Out of Scope

- Online parish directory lookup (deferred to later version)
- Full Google OAuth calendar integration (iCal URL used instead)
- Advanced rules engine beyond sentence-builder (non-essential for MVP)
- Travel time optimisation between churches (schema supports it, UI deferred)
- Clergy invitation emails during onboarding (done post-onboarding from clergy screen)
