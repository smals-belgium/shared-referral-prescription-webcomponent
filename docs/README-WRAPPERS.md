# Web Component Wrappers

When integrating web components into a host application using the `shared-myhealth-wc-integration` package,
a wrapper is needed to bridge the gap between the host application's specific inputs and outputs and the interfaces expected by the web components.
This allows seamless integration without modifying the components themselves.

## Input/output contract

Web Components are designed to take input values and provide output events as feedback to the parent container.

1. Here are the detailed input data structures expected by the Web Components :

| List prescriptions              | Allowed values                                   | Mandatory | Default | Description                                                                        |
| ------------------------------- | ------------------------------------------------ | :-------: | ------- | ---------------------------------------------------------------------------------- |
| **userLanguage**: string        | 'fr' / 'nl'                                      |    ❎     | 'nl'    | The lang parameter can be used to control the rendering language of the component. |
| **configName**: string          | Any valid ConfigName                             |    ❎     | N/A     | The configName is used to set the profile for the target environment.              |
| **services**: ComponentServices | See the [data structure table](#data-structures) |    ✅     | N/A     | Provide methods to retrieve the access or id tokens.                               |

| Prescription details            | Allowed values                                   | Mandatory | Default | Description                                                                         |
| ------------------------------- | ------------------------------------------------ | :-------: | ------- | ----------------------------------------------------------------------------------- |
| **userLanguage**: string        | 'fr' / 'nl'                                      |    ❎     | 'nl'    | The lang parameter can be used to control the rendering language of the component.  |
| **configName**: string          | Any valid ConfigName                             |    ❎     | N/A     | The configName is used to set the profile for the target environment.               |
| **services**: ComponentServices | See the [data structure table](#data-structures) |    ✅     | N/A     | Provide methods to retrieve the access or id tokens.                                |
| **prescriptionId**: string      | Any valid prescription/proposal identifier       |    ✅     | N/A     | The prescription/proposal identifier for which the details should be displayed.     |
| **intent**: string              | order / proposal                                 |    ✅     | 'order' | Indicates the nature of the loaded resource, either a proposals or a prescriptions. |

```typescript
/** The possible configuration values are:
 *     dev: development environment
 *     int: integration environment
 *     acc: acceptance environment
 *     prod: production environment
 *     demo: demo mode (no auth / backend)
 */

declare const ConfigName: {
  readonly DEV: 'dev';
  readonly INT: 'int';
  readonly ACC: 'acc';
  readonly PROD: 'prod';
  readonly DEMO: 'demo';
};

/**
 * The services allowing the retrieval of the access and id tokens.
 * getAccessToken (required) : the method expects to retrieve the access token related to specified audience.
 * getIdToken (required) : the method expects to retrieve the id token related to the current user.
 */
interface ComponentServices {
  getAccessToken: (audience: string) => Promise<string | null>;
  getIdToken: () => IdToken;
}
```

2. Here are the output data structures emitted by the Web Components :

| List prescriptions               | Prescription details            |
| -------------------------------- | ------------------------------- |
| **open** : OpenEventDetail       | **print**: PrintEventDetail     |
| **refresh** : RefreshEventDetail | **refresh**: RefreshEventDetail |

```typescript
interface PrintEventDetail {
  title: string;
  content: string;
  mimeType: PrintMimeType;
  orientation: PrintOrientation;
}

interface OpenEventDetail {
  componentTag: string;
  props: {
    prescriptionId: string;
    intent: 'order' | 'proposal';
    lang: Language;
  };
}

interface RefreshEventDetail {
  status: 'request' | 'success' | 'fail';
}
```
