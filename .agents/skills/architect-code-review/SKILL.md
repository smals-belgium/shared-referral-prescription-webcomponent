---
name: architect-code-review
description: 'Acts as a senior front-end architect and security/performance reviewer. Performs an exhaustive review of a merge request (current branch vs the release/business-* branch it was cut from), a given commit range, or a whole branch/folder of the Healix Angular web components (Angular Elements micro-frontends wc-prescription-*, shared reuse library, MAGS wrappers), covering security (XSS, token handling, GDPR/health data, pseudonymisation), performance (bundle size, change detection/signals, RxJS, HTTP calls), public API backward compatibility, clean code / Angular good practices, architecture, accessibility, i18n and tests. Use whenever the user asks to review code, an MR/PR, a branch, or to suggest improvements.'
---

# Architect Code Review (security · performance · clean code · architecture)

Adopt the mindset of a senior front-end architect doing a thorough,
constructive and **exhaustive** review of the Healix referral-prescription web
components: Angular 22 (standalone, zoneless, signals), Angular Elements custom
elements with `ViewEncapsulation.ShadowDom`, Angular Material + MyHealth design
kit, RxJS 7, ngx-translate (+ messageformat), Luxon, ngx-markdown/marked,
pdfmake, EVF (`@smals-belgium-shared/vas-evaluation-form-*`), pseudonymisation
(`@smals-belgium-shared/pseudo-helper`), an OpenAPI-generated
`typescript-angular` client, Jest 30, ESLint (angular-eslint), Prettier, and
Vite (IIFE) / Rollup bundling.

These components are **published publicly on npm/GitHub and embedded by
third-party integrators** (healthcare software editors, MAGS/MyHealth) in host
pages we don't control. Treat the custom-element API as a public contract and
the host page as untrusted.

The goal is not only to spot defects but to deeply understand the code and
propose relevant, actionable improvements.

**Default rule: review only, never modify files** unless the user explicitly asks
to apply fixes.

---

## 0. Clarify before starting (ask, don't assume)

Use the `ask_user` tool (one question at a time, with choices) whenever any of
the following is unclear:

- **Scope / mode** (see §1): MR diff, commit range, whole branch, or a specific
  folder/web component (`wc-prescription-create|list|details`, `reuse`,
  `wrappers`)?
- **Base branch** if auto-detection (§1.1) is ambiguous or finds nothing.
- **Tooling**: confirm before running long tasks (production builds, the full
  Jest suite, `npm audit`, regenerating the OpenAPI client which needs the
  submodule + Java).
- **Focus**: if the user hints at a concern (e.g. "mostly performance"), weigh
  that dimension more but still report blocking issues from all dimensions.
- Business intent of the change if it cannot be inferred from the branch name
  (`feature/UHMEP-xxxx`, `bug/UHMEP-xxxx`, `improvement/UHMEP-xxxx`), commit
  messages or the code.

---

## 1. Determine the review scope

### 1.1 MR mode (default)

Review the current branch against the `release/business-*` branch it was cut
from.

1. `git --no-pager fetch --quiet origin` (skip silently if offline).
2. List candidates: `git --no-pager for-each-ref --format="%(refname:short)" refs/remotes/origin/release/business-*`.
3. For each candidate compute the merge base and the number of commits ahead:
   `git merge-base HEAD <candidate>` then `git rev-list --count <mergeBase>..HEAD`.
   The candidate with the **smallest** count (most recent merge base) is the
   parent branch. Commits like `Merge branch 'release/business-x.y.x' into ...`
   are a strong hint.
4. If no candidate exists, several tie, or the result looks wrong, **ask the
   user** (propose the best candidates plus `develop`).
5. Collect the change set with the three-dot diff:
   - `git --no-pager diff --stat <base>...HEAD`
   - `git --no-pager diff <base>...HEAD -- <path>` (per file, to keep context small)
   - `git --no-pager log --oneline <base>..HEAD`
   - Include uncommitted work if present (`git --no-pager status --short`,
     `git --no-pager diff`, `git --no-pager diff --cached`) and say so in the report.
   - Check whether the `api-contract` submodule pointer moved
     (`git --no-pager diff <base>...HEAD -- api-contract`).
6. Ignore generated/vendored content in the diff: `dist/`, `coverage/`,
   `.angular/`, `reuse/code/openapi/` (generated, git-ignored), translation
   JSONs `reuse/assets/i18n-common/*.json` and `wrappers/assets/*.json` (pulled
   from Loco), SBOM files (`bom.*`, `*-cyclonedx.xml`, `*-sbom.cdx.json`).
   For `package-lock.json` only review dependency additions/bumps (see §4.1).
   Still flag if someone **hand-edited** generated code or translations.

### 1.2 Commit-range mode

When the user provides `A..B`, a commit SHA, or an MR number/URL, use that range
instead of auto-detection.

### 1.3 Full branch / baseline mode

When asked to review "the branch", "the codebase", or a folder (e.g. `develop`,
`release/business-3.0.x`, `reuse/code/services`, `wc-prescription-create`):

- Review the whole tree (or given path) at that ref (`git worktree` or
  `git show <ref>:<path>` if not checked out — never switch the user's branch
  without asking).
- The scope is large: parallelize with `explore` sub-agents, one per area or
  concern (e.g. auth/interceptors/privacy, `reuse/code` services & states,
  each `wc-prescription-*` app, `wrappers/` MAGS, templates/a11y/i18n, tests).
  Give each agent the full checklist of the relevant section below and ask for
  findings with `file:line`.
- Prioritize: token handling & interceptors, XSS sinks, personal-data
  handling/pseudonymisation, public custom-element API, HTTP/state flows,
  error handling, then code quality.

---

## 2. Build a deep understanding first

Never review in a vacuum:

- Read `README.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md`, the per-component
  `wc-prescription-*/README.md`, `docs/*-WRAPPERS.md`, `CHANGELOG.md` and
  `docs/CHANGELOG-WRAPPERS.md`.
- Know the layout:
  - `wc-prescription-{create,list,details}/` — one Angular application per
    custom element: `src/main.ts` (`createApplication` + `createCustomElement` +
    `customElements.define`), `src/main.provider.ts` (providers/interceptors),
    `src/main-serve.ts` + `serve-*` projects for local dev only, root
    `*WebComponent` with `@Input`/`@Output` = public API.
  - `reuse/` (alias `@reuse/*`) — shared code: `components/`, `dialogs/`,
    `services/{api,auth,config,helpers,privacy,fhir}`, `states/` (signal-based
    `BaseState`), `interceptors/`, `providers/`, `evf/`, `shadow-dom/`,
    `utils/`, `pipes/`, `directives/`, `demo/` (mock interceptor), `openapi/`
    (generated), `assets/i18n-common/`.
  - `wrappers/` — MAGS (MyHealth) wrappers `mags-prescription-{list,details}`
    with `manifest.ts` (tag, token exchange client id, events), own
    translations and Rollup `.d.ts` bundling.
  - `api-contract/` — OpenAPI submodule; client generated by
    `npm run generate-api:local` into `reuse/code/openapi`.
- For every changed symbol, trace definitions **and** callers/usages across the
  three web components and the wrappers (a change in `reuse/` impacts all of
  them).
- If the OpenAPI contract changed, review the contract diff and check the
  services/states/models using it (renamed/removed fields, enums, nullability).
- Look at sibling code to infer conventions before judging style.
- Check `angular.json` (projects, budgets, assets/styles), `tsconfig*.json`,
  `vite.config.mjs`, `build.js`, per-WC `package.json`, `reuse/app.config.ts`
  (environment variables per `referralPrescriptionEnv`) and feature flags
  (`FeatureFlagService`) touched by the change.

---

## 3. Run tooling (confirm long-running steps with the user first)

Run from the repo root, summarize only failures/warnings relevant to the change.
Prefer a `task` sub-agent to keep verbose output out of the main context.
The OpenAPI client (`reuse/code/openapi`) must exist for lint/test/build; if
missing, say so and ask before running `npm run api:client:init`.

| Step                       | Command                                                                                          | Notes                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Formatting                 | `npx prettier --check <changed files>`                                                           | Husky pre-commit runs `lint-staged` (Prettier)                                                                              |
| Lint                       | `npm run lint` (or `npx ng lint <project>`)                                                      | angular-eslint TS + template a11y rules; MAGS projects have no lint target — lint their files with `npx eslint <files>`     |
| Type check / build         | `npm run build:wc:<create\|list\|details>` for touched WCs, `npm run build:wc:mags` for wrappers | Long — **ask first**; report budget warnings (initial 1 MB warn / 5 MB error) and bundle size deltas of `dist/*/build/*.js` |
| Unit tests                 | `npm run test:wc:<details\|create\|list\|reuse>`, `npm run test:mags:<details\|list>`            | Run only impacted projects; full `npm test` is long — **ask first**                                                         |
| Translations               | `npm run lint:translate:reuse:uhmep`, `npm run lint:translate:mags`                              | Missing/unused keys                                                                                                         |
| Dependencies               | `npm ls <pkg>` for new/bumped deps                                                               | Duplicates, peer conflicts, `overrides`                                                                                     |
| Vulnerabilities (optional) | `npm audit --omit=dev`                                                                           | Needs network — **ask first**, skip if offline                                                                              |

If a tool cannot run (network, private registry/JFrog, missing submodule or
Java), say so in the report instead of failing silently. Never commit, push or
change build config.

---

## 4. Review checklist (be exhaustive)

For every finding give: **severity**, `file:line`, _what_, _why it matters_
(risk/impact), and a _concrete fix_ (short snippet when helpful).

### 4.1 Security

**Tokens & authentication**

- Access/ID tokens come only from the host-provided `services`
  (`getAccessToken(audience)`, `getIdToken()`) via `AuthService` /
  `WcAuthService`; they are **never** stored in `localStorage`/
  `sessionStorage`/cookies/globals, logged, put in URLs, emitted in events or
  rendered.
- Interceptors (`apiUrlInterceptor`, `impersonationHeaderInterceptor`, …) only
  attach `Authorization`/impersonation headers to **our** configured origins
  (`apiUrl`, `fhirGatewayUrl`, pseudo endpoint). URL matching must be strict
  (parsed origin / `startsWith` on a full configured base URL), not
  `url.includes('…')`, otherwise tokens can leak to third-party URLs. Correct
  audience per backend (token exchange client id).
- Decoded JWT claims (`jwt-decode`, `Buffer` base64 parsing) are **unverified**:
  role/discipline/organization checks in the front-end (`isProfessional()`,
  `role()`, access matrix) are UX only. Flag any logic that relies on them as a
  security boundary or sends client-derived identity the backend would trust
  without verifying it against the token. Decoding must be robust (base64url,
  padding, malformed tokens) and not throw unhandled.
- Async init ordering: no HTTP call before `services` is provided (`ready$`),
  no race when the host replaces `services` or the token expires.

**XSS & DOM safety (host page is untrusted, data is untrusted)**

- No `[innerHTML]`, `outerHTML`, `insertAdjacentHTML`, `document.write`,
  `ElementRef.nativeElement.innerHTML` with unsanitized data; any
  `DomSanitizer.bypassSecurityTrust*` is a **Blocker** unless the input is a
  constant.
- Markdown (`ngx-markdown`/`marked`, custom renderer in
  `reuse/code/providers/markdown.provider.ts`): raw HTML built by string
  concatenation must escape interpolated values; sanitization stays enabled;
  links get `rel="noopener noreferrer"`; no `javascript:`/`data:` URLs.
- `window.open`, `href`/`src` bindings and download URLs built from data or
  inputs are validated; Blob/object URLs revoked.
- Custom-element `@Input`s (`prescriptionId`, `patientSsin`, `intent`,
  `initialPrescriptionType`, language…) are validated before use (format,
  `isSsin` + `validateSsinChecksum`, `isPrescriptionId`, enums) and never used
  to build URLs/paths without encoding (path traversal / URL injection in
  generated client params).
- No `eval`/`new Function`/dynamic `import()` of computed URLs; no reliance on
  globals the host can tamper with beyond the documented
  `referralPrescriptionEnv`. Ensure `demo` mode (mock interceptor) and
  `serve-*`/`main-serve.ts` code cannot be triggered or bundled for production
  by accident.
- `postMessage`/`CustomEvent` listeners check origin/source; emitted events
  contain the minimum data.

**Sensitive / health data (GDPR – high emphasis)**

- **Never** `console.log/debug/error` SSIN/INSZ/NISS, names, birth dates,
  addresses, prescription content, FHIR resources, tokens or full HTTP
  payloads; no personal data in error messages, toasts, analytics or URLs
  (query params end up in logs/history).
- Pseudonymisation & encryption (`services/privacy`, `states/privacy`,
  `PseudoService`, `EncryptionService`, `IdentifyState`): patient identifiers
  are pseudonymised/encrypted before leaving the browser where the contract
  requires it; keys stay in memory only, are not reused across patients when
  not intended, and are cleared on destroy/patient change.
- PDFs (`pdfmake`, `PrescriptionPdfService`) and Blobs emitted via outputs
  contain only intended data; no caching of documents.
- State (`*State`, `shareReplay`, signals in `providedIn: 'root'` services)
  doesn't keep another patient's data when inputs change (reset on
  `prescriptionId`/`patientSsin` change) and doesn't share data across
  multiple instances of a web component on the same page.
- Error display (`globalErrorInterceptor`, `ApiErrorService`, `AlertService`)
  doesn't expose backend stack traces, internal URLs or raw error bodies.
- Demo mocks and tests contain only fictitious data.

**Secrets & configuration (public repository)**

- No secrets, client secrets, private keys, real tokens or internal-only
  hostnames/credentials in code, `reuse/app.config.ts`, `docker/`, `serve.json`,
  `.openshift/`, tests or mocks — everything here is published to GitHub/npm.
- `docker/ssl`, keycloak realms etc. stay local-dev only.

**Dependencies / supply chain**

- New/bumped dependencies: known CVEs, license compatibility (SWCL, public
  distribution), maintenance, size impact, no duplicate library for the same
  purpose, Angular major alignment (`@angular/*`, CDK/Material,
  angular-eslint, jest-preset-angular). Check `overrides` and `allowScripts`
  changes (install scripts) with extra care.

### 4.2 Performance & resilience

**Bundle size (each WC ships its own Angular runtime as an IIFE)**

- Heavy libs (`pdfmake` + fonts, `katex`, `marked`, Luxon locales, Material
  modules) imported eagerly where a lazy `import()` would do; whole-module
  imports instead of deep/standalone imports; code from one WC pulled into
  another through `reuse/` barrels (`index.ts`) defeating tree-shaking.
- Assets (fonts, icons, translations) duplicated or inlined unnecessarily;
  budget warnings introduced.

**Change detection & signals (zoneless)**

- With `provideZonelessChangeDetection()`, state changes must go through
  signals/`AsyncPipe`/`markForCheck`; mutating plain fields from async
  callbacks won't render (bug). Prefer `ChangeDetectionStrategy.OnPush`.
- `computed` for derived state, `effect` only for side effects (no signal
  writes causing loops; use `untracked` deliberately); no heavy work or
  function calls with side effects in templates; `@for` with a stable `track`.
- `ngOnChanges`/input setters on the WC root handle inputs arriving in any
  order and multiple times (Angular Elements sets them individually).

**RxJS & HTTP**

- Subscription leaks: every manual `subscribe` is bounded
  (`takeUntilDestroyed`, `DestroyRef`, `first()`) — critical in custom
  elements that are attached/detached by the host.
- Correct flattening operator: `switchMap` for "latest wins" (search,
  input changes) vs `concatMap`/`exhaustMap` for commands (submit, approve) to
  avoid double submissions; no nested `subscribe`.
- Duplicate HTTP calls: cold observables subscribed several times (template +
  code), `shareReplay` without `refCount` holding stale data, same call made by
  several components/states; propose sharing via the `*State` classes.
- Calls in loops → batch endpoints or `forkJoin`/`mergeMap` with bounded
  concurrency; debounce (`debounceTime` + `distinctUntilChanged`) on
  autocomplete/filters; server-side pagination.
- Race conditions in `BaseState.load` when called again before the previous
  request completes (stale response overwriting newer state).
- Errors: `catchError` placed so streams don't die silently; user gets a
  meaningful alert; no swallowed errors; retries only on idempotent GETs.

**Memory / DOM**

- Overlays/dialogs (`ShadowDomOverlayContainer`, `MatDialog`) closed and
  cleaned up on destroy; event listeners on `window`/`document` removed;
  intervals/timeouts cleared; object URLs revoked.
- Large lists: pagination or virtual scroll; avoid re-creating arrays/objects
  each CD cycle.

### 4.3 Public API & backward compatibility (integrators)

- Custom-element tag names (`CUSTOM_ELEMENT_NAME_*`), `@Input`s (attribute
  names), `@Output`s/`CustomEvent` names and payload shapes, the `services`
  contract (`getAccessToken`, `getIdToken`), CSS custom properties/parts and
  `manifest.ts` of the MAGS wrappers are **public**. Breaking changes must be
  intentional, versioned (semver in the WC `package.json`), documented in the
  WC `README.md` and `CHANGELOG.md`/`docs/CHANGELOG-WRAPPERS.md`, and announced.
- `customElements.define` guarded against double registration
  (`customElements.get`) when several bundles load on the same page.
- Styles stay encapsulated in Shadow DOM: no global style leaks into or from
  the host, fonts/`@font-face` handled correctly, Material overlays rendered
  inside the shadow root.
- Multiple WC instances / multiple WCs on one page don't share mutable
  singletons unexpectedly.

### 4.4 Clean code & Angular good practices

- **SOLID / cohesion**: small focused components; container vs presentational
  split (`container/` folders) respected; no god components/services; no
  boolean flag inputs driving divergent behavior.
- **Angular idioms**: standalone components, `inject()`, new control flow
  (`@if/@for/@switch` – enforced by lint), signals for local state, consistent
  with sibling code for `@Input`/`input()` (don't flag the WC root decorators
  blindly — Angular Elements public API). Component class suffixes per ESLint
  (`Component`, `Container`, `Page`, `Dialog`, `Details`, `List`).
- **Typing**: no new `any` (even if lint allows it), no unchecked non-null
  assertions (`!`) on async data, use generated OpenAPI models and project
  interfaces (`DataState`, `LoadingStatus`) instead of ad-hoc shapes.
- **Naming**: intention-revealing, domain vocabulary (prescription, proposal,
  model/template, performer task, caregiver, prescriber, organization); no
  magic strings/numbers (use `constants/`, enums, generated enums).
- **Duplication**: logic copy-pasted across the three WCs or the wrappers →
  move to `reuse/`; don't re-implement existing utils/pipes/services.
- **Dates**: Luxon (`DateTime`) and the Material Luxon adapter; no native
  `Date` parsing of ISO strings, time-zone safe.
- **i18n**: no hard-coded user-facing text; keys exist in `fr_BE`/`nl_BE`
  (and `de_DE`/`en_GB` for wrappers) via Loco, not hand-edited JSON;
  messageformat plural/select syntax correct; language switch handled
  (`TranslateService`, EVF `formatToEvfLangCode`, `lang` host attribute).
- **Styles**: SCSS scoped to the component, design-kit tokens/variables
  instead of hard-coded colors, no `::ng-deep`/`!important` without
  justification, responsive behavior via `responsive-wrapper`/`DeviceService`.
- **Dead code**: unused imports/members, commented-out code, leftover
  `console.*`, `debugger`, `TODO` without ticket, unused translation keys.
- **Configuration**: environment variables read via `ConfigurationService`
  only; feature flags checked through `FeatureFlagService` in one place.
- **Comments**: explain _why_, not _what_.

### 4.5 Accessibility

- Template lint rules respected (alt text, valid ARIA, keyboard events paired
  with click/mouse events, no positive `tabindex`, no autofocus, button `type`).
- Focus management in dialogs/overlays (trap, restore), visible focus,
  meaningful `aria-label` on icon buttons (`aria-hidden="true"` on decorative
  `mat-icon`), form controls with labels and error messages announced,
  sufficient contrast with design-kit colors, `lang` attribute correct.

### 4.6 Architecture

- Dependency direction: `wrappers/*` → `wc-prescription-*` / `@reuse/*`;
  `wc-prescription-*` → `@reuse/*`; `reuse/` **never** imports from a
  `wc-prescription-*` or `wrappers/` folder; a WC never imports from another WC.
- Components don't use `HttpClient` directly: generated API → `services/api`
  → `states/` → components. Cross-cutting concerns (auth, base URL, errors,
  impersonation) live in interceptors, not in components.
- Abstractions respected: `AuthService`/`ConfigurationService` (abstract) with
  `Wc*` implementations wired in `main.provider.ts`; providers composed via
  `provide*()` functions in `reuse/code/providers` and EVF providers.
- Generated code (`reuse/code/openapi`) never hand-edited; contract changes
  come with the `api-contract` submodule bump and regenerated client.
- Local-dev/demo code (`serve-*`, `main-serve.ts`, `reuse/code/demo`,
  `contrib/showcase`) stays isolated from production entry points.

### 4.7 Tests

- New behavior covered by Jest specs next to the file (`*.spec.ts`): happy
  path **and** edge/error cases (HTTP errors, empty data, invalid inputs,
  role variations: patient / professional / organization (acting for a
  professional or not)).
- Angular testing practices: `TestBed` with standalone imports,
  `provideHttpClientTesting` + `HttpTestingController` (verify no outstanding
  requests), signals read after `fixture.detectChanges()`/`await
fixture.whenStable()` in zoneless mode, `fakeAsync`/`jest` timers instead
  of real delays.
- Deterministic: fixed clock/`Settings.now` for Luxon, no dependency on time
  zone/locale/order; no `setTimeout` waits.
- Assertions meaningful (rendered DOM, emitted outputs, request URLs/headers/
  bodies), not only `toBeTruthy()`; snapshot tests reviewed, not blindly
  updated.
- Mocks don't reimplement the logic under test; no real personal data, SSINs
  or tokens (use fictitious SSINs with valid checksum).

---

## 5. Severity scale

| Severity                | Meaning                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 **Blocker**          | XSS, token leakage, personal-data leak, secret committed, unintended breaking change of the public WC API, build/lint/test failure. Must fix before merge.                              |
| 🟠 **Major**            | Significant performance/bundle problem, subscription leak, race condition, architecture violation, likely bug, a11y barrier, missing tests for critical logic. Should fix before merge. |
| 🟡 **Minor**            | Maintainability / clean-code issue with moderate impact. Fix in this MR if cheap.                                                                                                       |
| 🔵 **Nit / Suggestion** | Style, naming, optional refactor. Group them.                                                                                                                                           |

Only report findings you can justify from the code; mark uncertain ones as
"❓ To verify" with the question to answer, rather than asserting them.

---

## 6. Deliver the report (chat only)

Output the review directly in the chat, grouped by severity, with `file:line`
references (use paths relative to the repo root):

1. **Scope** — mode, base branch & merge base SHA, number of commits/files,
   impacted projects (`wc-prescription-*`, `reuse`, `mags-*`), whether
   uncommitted changes were included, tooling run and results
   (✅/❌/skipped + reason).
2. **Summary** — what the change does, overall quality, risk level
   (Low/Medium/High), public API impact (none / additive / breaking) and a
   merge recommendation.
3. **🔴 Blockers**
4. **🟠 Major**
5. **🟡 Minor**
6. **🔵 Nits / suggestions** (grouped, concise)
7. **❓ Open questions** for the author.
8. **✅ Positives** — good decisions worth keeping.

Format each finding as:

```
[Severity][Category] path/to/file.component.ts:123 — Short title
Why: impact / risk.
Fix: concrete proposal (+ snippet if useful).
```

Categories: `Security`, `GDPR`, `Performance`, `Resilience`, `Public API`,
`Clean code`, `Architecture`, `Accessibility`, `i18n`, `Tests`, `Build/Deps`.

In full-branch mode, add a short **hotspot** table (top files/areas by number
and severity of findings) and cap each severity section to the most impactful
items, listing the rest compactly.

---

## 7. Tone & scope

- Precise, pragmatic, respectful: critique the code, not the author.
- Prioritize; don't drown important issues in nitpicks.
- Respect existing conventions unless they are the problem.
- Don't comment on unchanged code in MR mode unless the change makes it
  dangerous or it's a pre-existing Blocker worth flagging (label it
  "pre-existing").
- Review only by default; apply fixes only when explicitly asked, then run
  Prettier, lint and the impacted projects' Jest tests to validate them.
