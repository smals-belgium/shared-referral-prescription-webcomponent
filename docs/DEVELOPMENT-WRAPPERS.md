# web-componentwrappers

## Description

This project contains 2 specific webcomponents with the following html-tags:

- mags-prescription-details: <uhmep-prescription-details>
- mags-prescription-list: <uhmep-prescription-list>

## Build

To implement them, first build the webcomponents:

```bash
npm run build
```

Then create the wrapper by running the following command:

```bash
npm run build:wc:mags
```

Or run builds seperatly:

```bash
npm run build:wc:mags-details
npm run build:wc:mags-list
```

## Serve

Run `ng serve:wc:mags-details` or `ng serve:wc:mags-list` to serve the wc prescription component. It builds and serves your application, rebuilding on file changes.

## Running unit tests

```bash
npm run test:mags:details
npm run test:mags:list
```

## Integration in mags

```typescript
// #compat/uhmep-prescription-details.ts
import { manifest, bootstrap } from '@smals-belgium-shared/uhmep-mags-prescription-details';
import { MyHealthModule } from '@smals-belgium/myhealth-wc-integration';
export default { manifest, bootstrap } as MyHealthModule;
```

```typescript
// #compat/uhmep-prescription-list.ts
import { manifest, bootstrap } from '@smals-belgium-shared/uhmep-mags-prescription-list';
import { MyHealthModule } from '@smals-belgium/myhealth-wc-integration';
export default { manifest, bootstrap } as MyHealthModule;
```

```typescript
// #modules.ts
import uhmepPrescriptionsDetails from './compat/uhmep-prescription-details';
import uhmepPrescriptionsList from './compat/uhmep-prescription-list';

export const module = {
  uhmepPrescriptionsDetails,
  uhmepPrescriptionsList,
};

export const modules: MyHealthModule[] = Object.values(module);
```

```typescript
// #nav-links.model.ts
export const DocumentLinks: NavLink<Family>[] = linkGroup([module.uhmepPrescriptionsList]);
```

Start the MAGS application, click on the menu item and the component should be visible.
