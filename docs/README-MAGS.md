# MAGS Webcomponents wrappers

MAGS is a mobile application platform built on custom standards. To use UHMEP Web Components within MAGS, they must be wrapped in a special web component.
The wrapper acts as a bridge, translating MAGS-specific inputs and outputs to the interfaces expected by UHMEP components.
This allows seamless integration without modifying the components themselves.

To achieve this, first build the webcomponents:

```bash
npm run build
```

Then create the wrapper by running the following command :

```bash
npm run build:wc:mags
```

## Input/output contract

Web Components are designed to take input values and provide output events as feedback to the parent container.

1. Here are the detailed input data structures expected by the Web Components :

| List prescriptions              | Allowed values                                   | Mandatory | Default | Description                                                                        |
| ------------------------------- | ------------------------------------------------ | :-------: | ------- | ---------------------------------------------------------------------------------- |
| **userLanguage**: string        | 'fr' / 'nl'                                      |    ❎     | 'fr'    | The lang parameter can be used to control the rendering language of the component. |
| **configName**: string          | Any valid Environment                            |    ❎     | N/A     | The configName is used to set the profile for the target environment.              |
| **services**: ComponentServices | See the [data structure table](#data-structures) |    ✅     | N/A     | Provide methods to retrieve the access or id tokens.                               |

| Prescription details            | Allowed values                                   | Mandatory | Default | Description                                                                         |
| ------------------------------- | ------------------------------------------------ | :-------: | ------- | ----------------------------------------------------------------------------------- |
| **userLanguage**: string        | 'fr' / 'nl'                                      |    ❎     | 'fr'    | The lang parameter can be used to control the rendering language of the component.  |
| **configName**: string          | Any valid Environment                            |    ❎     | N/A     | The configName is used to set the profile for the target environment.               |
| **prescriptionId**: string      | Any valid prescription/proposal identifier       |    ✅     | N/A     | The prescription/proposal identifier for which the details should be displayed.     |
| **services**: ComponentServices | See the [data structure table](#data-structures) |    ✅     | N/A     | Provide methods to retrieve the access or id tokens.                                |
| **intent**: string              | order / proposal                                 |    ✅     | N/A     | Indicates the nature of the loaded resource, either a proposals or a prescriptions. |

```typescript
enum Environment {
  dev = 'dev',
  demo = 'demo',
  int = 'int',
  acc = 'acc',
  prod = 'prod',
}

/**
 * The services allowing the retrieval of the access and id tokens.
 * getAccessToken (required) : the method expects to retrieve the access token related to specified audience.
 * getIdToken (required) : the method expects to retrieve the id token related to the current user.
 */
interface ComponentServices {
  getAccessToken: (audience: string) => Promise<string | null>;
  getIdToken?: () => IdToken;
}
```

2. Here are the output data structures emitted by the Web Components :

| List prescriptions         | Prescription details |
| -------------------------- | -------------------- |
| **open** : OpenEventDetail | **print**: Base64    |

```typescript
interface OpenEventDetail {
  componentTag: string;
  props: {
    prescriptionId: string;
    intent: 'order' | 'proposal';
    lang: Language;
  };
}
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
