# `nihdi-referral-prescription-create` keeps the previous `orgNihii` (organization) after `services` change

## Type
Bug

## Context / Symptom
In the "Create" showcase (`contrib/showcase/form/create/index.html`), when the user changes the **organization Nihii** field (`orgNihii`) and re-submits the form, the component keeps using the **previous value** (organization / M2M token from the earlier submission). A full page reload is required to get back to a clean state.

## Root Cause
The `services` object (`getAccessToken` / `getIdToken`) injected into the component is consumed through `WcAuthService`, declared `@Injectable({ providedIn: 'root' })`: it is a **singleton shared by all instances** of the custom element present on the page.

This service caches token-derived streams in a persistent way:
- the fields `isProfessional$Internal` and `isOrganization$` are built **only once** (at service construction) with `shareReplay(1)`;
- `getClaims()` / `getResourceAccess()` rely on `getIdToken()` / `getAccessToken()`, which use `first(ready => ready)`.

As a result, when a new component instance calls `authService.init()` with new `services` (hence a new `orgNihii`), the callbacks are correctly replaced, **but the `shareReplay(1)` caches (claims, organization, profile) keep the values from the first token** for the whole page lifetime. Hence the "previous value".

> Note: this `services` cache is a **separate** problem from the shared template-state cleanup (`templateVersionsStateService.cleanupAllInstances()` called in `ngOnDestroy`). This ticket targets **only** the cleanup of `services` / auth.

## Changes to Implement

### 1. `reuse/code/services/auth/auth.service.ts` (base class)
- Add a `reset(): void` method (default `throw new Error('Not implemented')`, mirroring `init`).

### 2. `reuse/code/services/auth/wc-auth.service.ts`
- Implement `reset()`:
  - clear `_getAccessToken` and `_getIdToken`;
  - set `ready$` back to `false` to invalidate the `shareReplay(1)` caches until the next `init()`.
- Replace `first(ready => ready)` with `filter(ready => ready)` in `getAccessToken()` and in the `getIdToken()` source, so the streams can **re-emit** on a new session (`reset()` → `false`, then `init()` → `true`) and the `shareReplay(1)` caches recompute with the new token.

### 3. `wc-prescription-create/src/create-prescription/create-prescription.component.ts`
- In `handleTokenChange()`: call `this.authService.reset()` **before** `this.authService.init(...)` to start from a clean state on every `services` change.
- In `ngOnDestroy()`: add `this.authService.reset()` so the next instance does not reuse the destroyed instance's token/organization.

### 4. Apply the same fix to the other web components consuming `WcAuthService`
- Verify and reproduce the `reset()` in `ngOnDestroy` / on token change for `wc-prescription-details` and `wc-prescription-list` (the auth service is shared via `reuse/`), to avoid the same symptom on those components.

## Impact on the Showcases
The fix lives on the component/service side; **no functional change is strictly required** in the showcases. However:
- The current `setTimeout(appendComponent, 25)` workaround in `renderComponent` (`contrib/showcase/form/create/index.html`) was added to hide this kind of shared-state race. Once `reset()` is in place, **re-evaluate / remove this magic delay** and simplify the component remount logic.
- Check the equivalent showcases: `contrib/showcase/form/details/index.html` and `contrib/showcase/form/list/index.html` (same `authenticateAndRender` / remount patterns).
- Add (or reuse) a manual test scenario: submit with `orgNihii = A`, then re-submit with `orgNihii = B`, and verify without reload that the component correctly reflects `B`.

## Risks / Points of Attention
- **`first` → `filter` semantics change**: `getAccessToken()` / `getIdToken()` no longer **complete** automatically. Usages with `firstValueFrom(...)` and `combineLatest(...)` remain correct, but audit any `.subscribe()` that relies on automatic completion (risk of a non-terminated subscription).
- The root singleton stays shared: validate the behavior when **multiple** instances coexist or succeed each other quickly.

## Acceptance Criteria
- [ ] After changing `orgNihii` and re-submitting (without reload), the component uses the new organization / new M2M token.
- [ ] `WcAuthService.reset()` sets `ready$` back to `false` and clears the callbacks; after a new `init()`, `getClaims()`, `isOrganization()`, `isProfessional()`, `discipline()`, `role()`, `oidc()` reflect the new token.
- [ ] No regression on the first render (single instance).
- [ ] The A → B scenario works in the create/details/list showcases.
- [ ] The showcase `setTimeout(25)` is re-evaluated (removed or justified).

## Tests
- Update / add unit tests in `wc-auth.service.spec.ts`: re-`init()` after `reset()` must produce up-to-date claims/organization; verify the non-completion does not introduce a leak.
- Component unit tests: `ngOnChanges({ services })` triggers `reset()` then `init()`; `ngOnDestroy()` calls `reset()`.
- Run the Jest suites of the three impacted web components.

