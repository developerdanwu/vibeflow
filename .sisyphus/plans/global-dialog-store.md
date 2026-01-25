# Global Dialog Store with XState Store

## Context

### Original Request
Adapt the dialog pattern from kaolin-bookings (using XState Store globally) for VibeFlow to enable opening alert/confirm dialogs from anywhere in the application.

### Interview Summary
**Key Discussions**:
- **Dialog types**: Alert/Confirm only initially (no custom content dialogs)
- **URL sync**: NOT needed for alerts (only for future entity dialogs like edit-event)
- **Provider placement**: `src/router.tsx` in the `Wrap` component
- **Component**: Use existing `Dialog` component from shadcn/ui
- **Multiple dialogs**: Replace behavior (new dialog replaces current)
- **Mutation tracking**: Not included (keeping simple)
- **API pattern**: Follow existing `calendarStore.ts` pattern with `on` handlers

**Research Findings**:
- XState Store already installed: `@xstate/store@3.15.0`, `@xstate/store-react@1.0.1`
- Existing pattern at `src/components/big-calendar/store/calendarStore.ts` uses `createStore` with `on` handlers
- Provider setup in `src/router.tsx` uses TanStack Router's `Wrap` pattern
- Existing Dialog component at `src/components/ui/dialog.tsx` is fully featured

### Metis Review
**Identified Gaps** (addressed):
- **XState Store API mismatch**: Reference used `emits` API, but existing codebase uses `on` handlers. Resolved: Follow existing `calendarStore.ts` pattern
- **URL sync behavior**: Clarified - NO URL sync for alerts (future feature for entity dialogs)
- **Multi-dialog behavior**: Clarified - Replace immediately
- **onCancel callback**: Added - Optional callback support

---

## Work Objectives

### Core Objective
Create a global dialog store using XState Store that enables any component to open alert/confirm dialogs programmatically via `dialogStore.send({ type: "openAlertDialog", ... })`.

### Concrete Deliverables
- `src/lib/dialog-store.tsx` - XState store with context provider and hook
- `src/components/dialogs/global-alert-dialog.tsx` - Dialog component that renders based on store state
- Modified `src/router.tsx` - Provider integration

### Definition of Done
- [x] `pnpm check` passes with no errors in new/modified files
- [x] `pnpm build` completes successfully
- [x] Alert dialog can be opened from any component using `useDialogStore()`
- [x] Confirm dialog calls `onConfirm` callback when confirmed
- [x] Dialog closes via cancel button, close button, or ESC key
- [x] Opening new dialog while one is open replaces it

### Must Have
- Type-safe dialog options (title, description, confirmText, cancelText)
- `openAlertDialog` action (OK button only)
- `openConfirmDialog` action (OK + Cancel buttons)
- `closeDialog` action
- Optional `onConfirm` and `onCancel` callbacks
- Provider component for React context
- `useDialogStore()` hook for component access

### Must NOT Have (Guardrails)
- ❌ NO URL synchronization (future feature for entity dialogs)
- ❌ NO custom React content in dialogs (string title/description only)
- ❌ NO mutation tracking / loading states
- ❌ NO dialog queuing or stacking
- ❌ NO modifications to existing dialog components
- ❌ NO modifications to existing `Dialog` UI component
- ❌ NO custom styling beyond shadcn defaults
- ❌ NO animations beyond shadcn defaults

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **User wants tests**: Manual-only
- **Framework**: N/A

### Manual QA Only

Each TODO includes detailed manual verification procedures.

**Evidence Required:**
- Browser console verification
- Visual inspection of dialogs
- Callback execution confirmation

---

## Task Flow

```
Task 1 (Store) → Task 2 (Component) → Task 3 (Provider) → Task 4 (Verification)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | None | Foundation |
| 2 | 1 | Needs store types/exports |
| 3 | 1, 2 | Needs provider and component |
| 4 | 3 | Needs full integration |

---

## TODOs

- [x] 1. Create Dialog Store

  **What to do**:
  - Create `src/lib/dialog-store.tsx`
  - Define store context type with dialog state:
    ```typescript
    type DialogState = {
      isOpen: boolean;
      type: "alert" | "confirm" | null;
      title: string;
      description: string;
      confirmText: string;
      cancelText: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
    ```
  - Create store using `createStore` from `@xstate/store`:
    - `openAlertDialog` action: sets dialog state with type "alert"
    - `openConfirmDialog` action: sets dialog state with type "confirm"
    - `closeDialog` action: resets dialog state
  - Create React context and provider
  - Export `useDialogStore` hook

  **Must NOT do**:
  - Do NOT use `emits` API (use `on` handlers like calendarStore)
  - Do NOT add URL sync logic
  - Do NOT add mutation tracking

  **Parallelizable**: NO (foundation task)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/big-calendar/store/calendarStore.ts:1-75` - XState Store pattern with `createStore`, context type, and `on` handlers. Follow this structure exactly.
  - `src/components/big-calendar/contexts/calendar-context.tsx:1-50` - React context + provider pattern wrapping XState store

  **API/Type References** (contracts to implement against):
  - `@xstate/store` - `createStore` function signature
  - `@xstate/store/react` - `useSelector` hook for reactive state access

  **External References** (libraries and frameworks):
  - XState Store docs: https://stately.ai/docs/xstate-store

  **WHY Each Reference Matters**:
  - `calendarStore.ts` shows the exact API pattern used in this codebase (NOT the `emits` pattern from reference repo)
  - `calendar-context.tsx` shows how to wrap XState store in React context with proper typing

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created at `src/lib/dialog-store.tsx`
  - [ ] No TypeScript errors: `pnpm check` passes
  - [ ] Exports: `DialogStoreProvider`, `useDialogStore`, `dialogStore`
  - [ ] Store has actions: `openAlertDialog`, `openConfirmDialog`, `closeDialog`

  **Commit**: YES
  - Message: `feat(dialog): create global dialog store with XState Store`
  - Files: `src/lib/dialog-store.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 2. Create Global Alert Dialog Component

  **What to do**:
  - Create `src/components/dialogs/global-alert-dialog.tsx`
  - Import `useDialogStore` from the store
  - Use `useSelector` from `@xstate/store/react` to read dialog state
  - Render Dialog component from `@/components/ui/dialog` based on state:
    - When `isOpen` is true, show dialog
    - Show title in `DialogTitle`
    - Show description in `DialogDescription`
    - For "alert" type: Show single OK button
    - For "confirm" type: Show Cancel and Confirm buttons
  - Handle button clicks:
    - Cancel: call `onCancel` if exists, then `closeDialog`
    - Confirm: call `onConfirm` if exists, then `closeDialog`
  - Handle dialog close (X button, ESC, overlay click): call `closeDialog`

  **Must NOT do**:
  - Do NOT accept children or custom content
  - Do NOT add loading states
  - Do NOT modify the base Dialog component

  **Parallelizable**: NO (depends on Task 1)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/ui/dialog.tsx:1-158` - Full Dialog component API (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose)
  - `src/components/big-calendar/components/dialogs/add-event-dialog.tsx` - Example dialog implementation with form content

  **API/Type References** (contracts to implement against):
  - `src/lib/dialog-store.tsx` - The store created in Task 1, provides `useDialogStore` hook

  **External References** (libraries and frameworks):
  - `@xstate/store/react` - `useSelector` hook: `useSelector(store, (state) => state.context.fieldName)`

  **WHY Each Reference Matters**:
  - `dialog.tsx` provides all the building blocks (DialogContent, DialogHeader, etc.)
  - `add-event-dialog.tsx` shows how to compose these into a working dialog
  - `useSelector` is the reactive hook for reading XState store state

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] File created at `src/components/dialogs/global-alert-dialog.tsx`
  - [ ] No TypeScript errors: `pnpm check` passes
  - [ ] Exports: `GlobalAlertDialog` component
  - [ ] Component renders nothing when `isOpen` is false

  **Commit**: YES
  - Message: `feat(dialog): create global alert dialog component`
  - Files: `src/components/dialogs/global-alert-dialog.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 3. Integrate Provider and Dialog into Router

  **What to do**:
  - Edit `src/router.tsx`
  - Import `DialogStoreProvider` from `@/lib/dialog-store`
  - Import `GlobalAlertDialog` from `@/components/dialogs/global-alert-dialog`
  - Wrap existing `Wrap` component children with `DialogStoreProvider`
  - Add `GlobalAlertDialog` as sibling to children inside provider
  - Provider order should be:
    ```tsx
    <AuthKitProvider>
      <ConvexProviderWithAuth>
        <DialogStoreProvider>
          {children}
          <GlobalAlertDialog />
        </DialogStoreProvider>
      </ConvexProviderWithAuth>
    </AuthKitProvider>
    ```

  **Must NOT do**:
  - Do NOT change provider order of AuthKit or Convex
  - Do NOT modify any other part of router configuration

  **Parallelizable**: NO (depends on Tasks 1 and 2)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/router.tsx:71-80` - Current Wrap component structure with AuthKitProvider and ConvexProviderWithAuth

  **API/Type References** (contracts to implement against):
  - `src/lib/dialog-store.tsx` - DialogStoreProvider component
  - `src/components/dialogs/global-alert-dialog.tsx` - GlobalAlertDialog component

  **WHY Each Reference Matters**:
  - `router.tsx` is the ONLY file to modify - shows exact provider nesting structure

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `src/router.tsx` modified with provider and dialog
  - [ ] No TypeScript errors: `pnpm check` passes
  - [ ] `pnpm build` completes successfully
  - [ ] App starts without errors: `pnpm dev`

  **Commit**: YES
  - Message: `feat(dialog): integrate dialog store provider into router`
  - Files: `src/router.tsx`
  - Pre-commit: `pnpm check`

---

- [x] 4. Manual Verification - Full Integration Test

  **What to do**:
  - Start dev server: `pnpm dev`
  - Open browser to localhost:3000
  - Open browser DevTools console
  - Test alert dialog:
    ```javascript
    // In browser console
    window.__dialogStore = window.__dialogStore || document.querySelector('[data-dialog-store]').__store
    // Or use React DevTools to access store
    ```
  - Create a temporary test by adding to any existing component:
    ```tsx
    const dialogStore = useDialogStore();
    // Then call: dialogStore.send({ type: "openAlertDialog", title: "Test", description: "This is a test" })
    ```
  - Verify:
    1. Alert dialog appears with title and description
    2. OK button closes the dialog
    3. ESC key closes the dialog
    4. Clicking outside closes the dialog
  - Test confirm dialog with callbacks:
    ```tsx
    dialogStore.send({
      type: "openConfirmDialog",
      title: "Confirm Action",
      description: "Are you sure?",
      onConfirm: () => console.log("Confirmed!"),
      onCancel: () => console.log("Cancelled!")
    })
    ```
  - Verify:
    1. Confirm dialog appears with two buttons
    2. Cancel button calls onCancel and closes
    3. Confirm button calls onConfirm and closes
  - Test replace behavior:
    1. Open alert dialog
    2. While open, open another alert dialog
    3. Verify new dialog replaces old one

  **Must NOT do**:
  - Do NOT commit test code to repository
  - Do NOT leave console.log statements in production code

  **Parallelizable**: NO (depends on Task 3)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References**:
  - N/A - This is manual testing

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Alert dialog opens with correct title/description
  - [ ] Alert dialog has single OK button
  - [ ] Confirm dialog has Cancel and Confirm buttons
  - [ ] onConfirm callback fires on confirm click
  - [ ] onCancel callback fires on cancel click
  - [ ] Dialog closes on ESC key
  - [ ] Dialog closes on overlay click (if enabled)
  - [ ] New dialog replaces existing open dialog
  - [ ] No console errors during any operation

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(dialog): create global dialog store with XState Store` | `src/lib/dialog-store.tsx` | `pnpm check` |
| 2 | `feat(dialog): create global alert dialog component` | `src/components/dialogs/global-alert-dialog.tsx` | `pnpm check` |
| 3 | `feat(dialog): integrate dialog store provider into router` | `src/router.tsx` | `pnpm check && pnpm build` |
| 4 | No commit | N/A | Manual testing |

---

## Success Criteria

### Verification Commands
```bash
pnpm check    # Expected: No errors in new/modified files
pnpm build    # Expected: Build succeeds
pnpm dev      # Expected: App starts, dialogs work
```

### Final Checklist
- [x] All "Must Have" features present
- [x] All "Must NOT Have" guardrails respected
- [x] Dialog opens from any component via `useDialogStore()`
- [x] Alert and Confirm dialog types work correctly
- [x] Callbacks fire at correct times
- [x] Replace behavior works for multiple dialogs
- [x] No TypeScript errors
- [x] Build succeeds
