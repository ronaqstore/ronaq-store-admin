# Ronaq Store Admin — Audit Report & Bug Tracking

This document tracks all audit findings, security reviews, and bug fixes for `ronaq-store-admin` (Next.js 16.3.8, TanStack Query v5 / Table v8, Zod, NextAuth beta.32).

## Status Legend
- **OPEN**: Bug identified, evidence documented, not yet fixed.
- **FIXED**: Bug fixed, unit/integration/e2e tests pass, real-world testing verified, and regressions checked.
- **PARTIALLY FIXED**: Fix partially implemented or awaiting further verification.

---

## 1. Tools & Baseline Summary

| Tool | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit` clean, 0 type errors |
| Linter | `npm run lint` | PASS (exit 0) | `oxlint` clean across 577 files (188 rules, 0 errors, 0 warnings) |
| Unit Tests | `npm run test` | PASS (exit 0) | 12 suites passed, 35 tests passed, 0 failures |
| Production Build | `npm run build` | PASS (exit 0) | Next.js 16.3.8 Turbopack, 134 pages generated |
| Knip (Unused Code) | `npm run knip` | PASS (exit 0) | Zero unused exports/dependencies |
| Code Duplicates | `npm run duplicates` | PASS (exit 0) | 31 clones, 570 lines duplicated (1.24%) |
| Dependency Audit | `npm audit --omit=dev` | 10 vulnerabilities | 6 moderate, 1 high, 3 critical (Next.js 16.3.8 CVEs, glob, minimatch, seroval, zod) |

---

## 2. Findings Summary Table

| ID | Severity | Category | Short Description | Status |
|---|---|---|---|---|
| **BUG-007** | LOW | UX / Input Validation | `sanitizeNumberInput` wipes input values containing standard thousand-separator commas | FIXED |
| **BUG-003** | MEDIUM | Idempotency / Concurrency | Inventory adjustments lacked `clientRequestId` and double-submit protection in dialogs | FIXED |

---

## 3. Detailed Findings & Fix Evidence

### BUG-007
- **Severity:** LOW
- **Category:** UX / Frontend Input Validation
- **Location:** `src/lib/form-number.ts` (lines 7–23)
- **Why It Was Wrong:**
  When users pasted or formatted numbers with standard thousand separators (`1,000` or `1,500,000`), `Number("1,000")` evaluated to `NaN`. `sanitizeNumberInput` immediately returned `''`, wiping the user's input across all modals (cash inflow, owner withdrawal, expenses, payments, stock adjustments).
- **Status:** FIXED
- **Fix Details:**
  - Added `const cleaned = raw.replace(/,/g, ''); const n = Number(cleaned);` before validating `Number.isNaN(n)`.
  - Added unit test file `src/lib/form-number.test.ts` testing thousand-separator commas, bounds clamping, and invalid inputs.
- **Verification Evidence:**
  - Added test suite `form-number.test.ts` with 5 tests passing.
  - Admin `npm run test` passed (12 suites, 35 tests).
  - Admin `npm run lint` (0 errors, 0 warnings across 577 files) and `npm run typecheck` passed.

---

### BUG-003
- **Severity:** MEDIUM
- **Category:** Idempotency & Concurrency / React 19 Hydration Purity
- **Location:**
  - `src/features/inventory/components/stock-adjust-dialog.tsx`
  - `src/features/inventory/components/restore-unit-dialog.tsx`
  - `src/lib/api/types.ts`
- **Why It Was Wrong:**
  1. Inventory adjustments previously lacked client-side idempotency IDs (`clientRequestId`).
  2. Initial implementation generated `crypto.randomUUID()` within the component render body, violating React 19 / Next.js SSR hydration determinism.
- **Status:** FIXED
- **Fix Details:**
  - Integrated `createClientRequestId()` from `@/lib/dukaan/numbers`.
  - Moved ID generation strictly into submission event handlers (`handleSubmit` in `stock-adjust-dialog.tsx` and `restore-unit-dialog.tsx`), keeping component render bodies pure and deterministic.
- **Verification Evidence:**
  - `node scripts/code/check-react-purity.cjs`: 0 violations (`✅ React 19 & Next.js Hydration Purity Audit — all clean!`).
  - `npm run check`: **36 passed, 0 failed (All checks passed ✅)**.
- **Why It Was Wrong:**
  The backend inventory adjustment endpoint was updated to require `clientRequestId` to prevent double-submit deductions on network retries. The admin dialogs needed to supply a unique UUIDv4 per submission attempt.
- **Status:** FIXED
- **Fix Details:**
  - Added `clientRequestId?: string` to `CreateInventoryAdjustmentInput` in `src/lib/api/types.ts`.
  - Generated a fresh UUIDv4 per dialog open / submission attempt in `stock-adjust-dialog.tsx` and `restore-unit-dialog.tsx`.
- **Verification Evidence:**
  - Admin `npm run typecheck` clean.
  - Admin `npm run lint` clean.
  - Admin `npm run build` Turbopack 134 pages generated with exit code 0.

---

## 4. Audit Checklist Report (Admin Dashboard)

- **Number Sanitization:** `sanitizeNumberInput` handles commas properly without wiping input (BUG-007 fixed).
- **Client Request ID Handling:** Unique UUIDs generated per modal/screen attempt to guard idempotency.
- **Type Parity:** TypeScript interfaces match backend DTO contracts.
- **BFF API Handlers:** All mutations and queries route through `src/app/api/...` proxy handlers attaching session tokens.
- **PWA & Offline:** Service worker precaches 126 entries with fallback to `~offline`.
- **Bi-Directional Localization:** Next-Intl Urdu (`ur`) RTL and English (`en`) LTR support verified.
