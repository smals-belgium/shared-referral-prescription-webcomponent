---
name: uhmep-web-component-architecture
description: 'Architecture conventions for the UHMEP referral-prescription Angular web components (layer responsibilities, state/service/OpenAPI layers, shared signals and idempotency keys, host communication, alerts, access pipes, i18n and tooling) — use it when adding or reviewing code in this repo.'
---

# UHMEP referral-prescription web components — architecture conventions

Use this skill when writing, refactoring or reviewing code in the
`referral-prescription-web-components` repo, so changes follow the existing layering
instead of inventing new patterns.

## 1. Repo layout

| Folder | Contains |
| --- | --- |
| `reuse/code/` | Everything shared between web components |
| `reuse/code/openapi/` | **Generated** OpenAPI client — never edit by hand |
| `reuse/code/services/api/` | Thin wrappers around the generated client |
| `reuse/code/services/helpers/` | `ToastService`, `AlertService`, `DeviceService`, `IconRegistryService`, PDF, … |
| `reuse/code/services/auth|privacy/` | Auth token handling, encryption/pseudonymisation |
| `reuse/code/states/api/` | Signal-based state stores extending `BaseState` |
| `reuse/code/pipes/` | `can*` access-control pipes driving button visibility |
| `reuse/code/dialogs/`, `components/`, `interfaces/`, `constants/`, `utils/` | Shared UI + types |
| `wc-prescription-create|details|list/` | The three shipped web components |
| `wrappers/` | MAGS wrapper components (`mags-prescription-details|list`) |
| `showcase/`, `contrib/` | Demo/host harnesses |

**Layering rule:** component → feature service → `states/api/*.state.ts` → `services/api/*.service.ts` → `reuse/code/openapi`.
Never call the generated OpenAPI services directly from a component.

## 2. State layer

- States extend `BaseState<T>` (`reuse/code/states/helpers/base.state.ts`) and expose a
  `state()` signal of `DataState<T>` = `{ status, data?, params?, error? }` with
  `LoadingStatus` INITIAL/LOADING/SUCCESS/UPDATING/ERROR.
- Load with `this.load(source$)`; reset with `reset()`.
- After a mutation, refresh by piping the reload:
  ```ts
  return this.prescriptionService
    .assignCaregivers(prescriptionId, referralTaskId, caregivers, generatedUUID)
    .pipe(tap(() => this.loadPrescription(prescriptionId)));
  ```
- Components combine several states with `combineSignalDataState({...})` into a single
  `viewState$: Signal<DataState<ViewState>>`.

## 3. API service layer + OpenAPI regeneration

`reuse/code/services/api/*.service.ts` only map friendly arguments onto the generated
client. The contract lives in `api-contract/openapi.yaml`; regenerate with
`npm run generate-api` (or `generate-api:fromTools` / `generate-api:local`).
Regenerate rather than patching files under `reuse/code/openapi/`.

## 4. Idempotency key (`generatedUUID`) — easy to get wrong

Every mutating endpoint takes a request/idempotency UUID as its **last** argument.
In the details component it is a shared signal on `PrescriptionDetailsSecondaryService`
(`readonly generatedUUID: WritableSignal<string> = signal('')`):

- seeded once in `PrescriptionDetailsWebComponent.ngOnInit()` with `uuidv4()`;
- read when building the call (`this.generatedUUID()`);
- **rotated with `this.generatedUUID.set(uuidv4())` after the call completes — in both
  the `next` and the `error` handler** — otherwise the next action reuses a key the
  backend already consumed.

Flows that own their key locally (e.g. `openAutoAssign`) generate `const uuid = uuidv4()`
per action instead. When adding a new mutating action, pick one of these two patterns and
make sure the key is never reused.

## 5. Web component shell conventions

Top-level components (`uhmep-prescription-create|details|list`):

```ts
@Component({
  selector: 'uhmep-prescription-details',
  encapsulation: ViewEncapsulation.ShadowDom,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: ALERT_TARGET, useFactory: () => `${ERROR_PRESCRIPTION_DETAILS}-${crypto.randomUUID()}` }],
})
```

- Inputs form the public custom-element API: `lang`, `prescriptionId`, `patientSsin`,
  `intent`, and `services` (a `DetailsServices` with `getAccessToken` / `getIdToken`)
  which is forwarded to `AuthService.init()` in `ngOnChanges`.
- Outputs are host callbacks: `clickPrint`, `clickDownload`, `clickDuplicate`,
  `clickExtend`, `proposalApproved`, `wcDetailsEvent`.
- Input changes are handled in `ngOnChanges` guarded per key (`if (changes['lang']) …`).
- Bundles are produced with `ng build <project>` + `vite build -c <pkg>/vite.config.mjs`.

## 6. Asking the host for data

Use the promise-over-event pattern rather than an HTTP call:

```ts
private dispatchToHost<T>(actionType: WcDetailsEvent['type']): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    this.handleAutoAssign.emit({ type: actionType, payload: { resolve, reject } } as WcDetailsEvent);
  });
}
```

Add new event kinds to the `WcDetailsEvent` union in
`reuse/code/interfaces/events.interface.ts`, and always handle rejection
(`normalizePromiseRejectReason` + `alertService.showGeneralError(..., { retry: false })`).

## 7. Feature "secondary service" pattern

`PrescriptionDetailsSecondaryService` is the feature-scoped hub: shared writable signals
(`loading`, `currentLang`, `generatedUUID`, `intent`, `pssStatus`), `getX()` selectors over
the states, dialog openers (`openApproveProposalDialog`, `openRejectAssignationDialog`, …)
and output emitters. Child components inject it and alias its signals
(`readonly loading = this._service.loading`) instead of duplicating state.

## 8. Errors and notifications

- Transient feedback → `ToastService.show('<prefix>.assignPerformer.meSuccess')` /
  `showSomethingWentWrong()`, where `<prefix>` is `prescription` or `proposal`
  (`isPrescription(intent)`).
- Inline errors → `AlertService` with a per-instance `ALERT_TARGET` token:
  `setTarget()` at construction, `setActive()` in `ngOnChanges`/after dialogs,
  `clear()`/`remove()`+`resetActive()` in `ngOnDestroy`.

## 9. Access-control pipes and templates

Button visibility is decided by pure pipes, never by inline boolean soup:
`canSelfAssign`, `canAssignCaregiver`, `canAutoAssignCaregivers`,
`canCancelPrescriptionOrProposal`, `canExtendPrescription`, `canDuplicatePrescription`,
`canPrintPrescription`, `canStart|Finish|Interrupt|RestartTreatment`.

Templates use Angular 20 control flow, registered SVG icons and `data-cy` hooks:

```html
@if (prescription | canSelfAssign: currentUser) {
  <button mat-menu-item type="button" data-cy="prescription-self-assign-button"
          (click)="onSelfAssign(prescription, currentUser)">
    {{ 'prescription.actions.selfAssign' | translate }}
  </button>
}
```

Icons must be registered in `IconRegistryService.init(...)` before use.

## 10. i18n

Use `Lang` from `reuse/code/constants/languages.ts` (`{ short: 'fr', full: 'fr-BE' }`);
default is `fr-BE`. Language changes go through a `BehaviorSubject` → `translate.use(lang)`
→ `DateAdapter.setLocale(lang)` → `EvfTranslateService.setCurrentLang(formatToEvfLangCode(lang))`,
with `handleMissingTranslationFile` as fallback. Keys live in
`reuse/assets/i18n-common/{fr_BE,nl_BE}.json`; validate with `npm run lint:translate:reuse:uhmep`.

## 11. Build / test / lint commands

```bash
npm run build:wc:details          # ng build + vite bundle for one component
npm run serve:wc:details          # local dev server
npm run test:wc:details           # jest for one package (details|create|list|reuse, mags:*)
npx ng test wc-prescription-details --test-path-pattern="my.component.spec"   # single spec
npx eslint <changed files>        # or: npm run lint
```

Jest is configured per package (`<pkg>/jest.config.ts` extending `jest.base.config.ts`),
with `@reuse/*` mapped to `reuse/*`. Run jest from the repo root so `<rootDir>` resolves.

### Test conventions worth respecting

- Mock the feature service as a plain object with real `signal()`s for its signal members.
- Signals declared at module scope leak between tests — reset them in `afterEach`
  (alongside `jest.clearAllMocks()`), and assert exact values instead of weakening to
  `expect.any(String)`.
- `jest.mock('uuid', () => ({ v4: jest.fn(() => 'mocked-uuid') }))` makes UUID assertions
  deterministic; remember it applies to the whole file.
- This is a Jest project: never import `jasmine.*` helpers.

