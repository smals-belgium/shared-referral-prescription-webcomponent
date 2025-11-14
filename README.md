# UHMEP Web Components

## 📘 Context

The medical industry is characterized by continuous innovation and rapid transformation, driven by technological
progress and evolving healthcare standards.

To keep pace with these changes, stakeholders such as hospitals, clinics, and laboratories must constantly adopt new
technologies and update their practices accordingly.

As a result, medical software must meet several critical requirements:

- **Regulatory Compliance**: Ensure consistent alignment with current healthcare regulations and standards.

- **Data Security**: Implement strong security measures to safeguard sensitive patient information.

- **Seamless Integration**: Offer flexible and interoperable interfaces to ensure compatibility with other healthcare
  systems and support efficient data exchange.

- **Accessibility and Usability**: Provide an intuitive, user-friendly interface tailored to the needs of healthcare
  professionals.

To address these legal and technical challenges, web component technology has been selected. This approach enables the
development and delivery of a centralized, reusable set of features that can be easily shared and integrated by various
healthcare partners.

⚠️ Please note: The Web Components are still under active development and may undergo changes. We will provide advance
notifications to help you prepare for any upcoming updates. This documentation will be updated accordingly to reflect
those changes. ⚠️

## ✅ Prerequisite

Before you start using the Web Components, you must first complete the onboarding process with eHealth. The Web
Components require a valid access token issued specifically for your personal **public Client ID**.

In addition, the components rely on token exchange operations to function properly. As such, this part of the onboarding
process is mandatory and **must** also be completed.

## 🧩 Available Web Component

Three Web Components are available :

1. **Create prescription** : this Web Component allows the creation of referral prescription as a healthcare
   professional and for a specific patient.
2. **Details of a prescription** : this Web Component is presenting the details of a referral prescription for a
   specific patient.
3. **List of prescriptions** : this Web Component is presenting the available prescriptions for a specific patient in a
   paginated list.

⚠️ In the last release, the URL's of the list and create web components have been aligned to be corherent ⚠️

|      Component       | Component name                      |                                                                 Acceptance URL                                                                 |
|:--------------------:|-------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------:|
| Create prescription  | nihdi-referral-prescription-create  |  [wc-create-prescription](https://wwwacc.referral-prescription.ehealth.fgov.be/web-components/prescription-create/wc-prescription-create.js)   |
| Prescription details | nihdi-referral-prescription-details | [wc-prescription-details](https://wwwacc.referral-prescription.ehealth.fgov.be/web-components/prescription-details/wc-prescription-details.js) |
|  List prescriptions  | nihdi-referral-prescription-list    |    [wc-list-prescriptions](https://wwwacc.referral-prescription.ehealth.fgov.be/web-components/prescription-list/wc-prescription-list.js)    |

### Input/output contract

Web Components are designed to take input values and provide output events as feedback to the parent container.

1. Here are the detailed input data structures expected by the Web Components :
   
   | Create prescription                                 | List prescriptions               | Prescription details                 |
   |-----------------------------------------------------|----------------------------------|--------------------------------------|
   | **lang**: 'fr-BE'/nl-BE                             | **lang**: 'fr-BE'/nl-BE          | **lang** : 'fr-BE'/nl-BE             |
   | **patientSsin?**: string                            | **patientSsin?**: string         | **patientSsin?**: string             |
   | **initialValues?**: CreatePrescriptionInitialValues | **requesterSsin?**: string       | **prescriptionId!**: string          |
   | **services!**: ComponentServices                    | **services!**: ComponentServices | **services!**: ComponentServices     |
   |                                                     | **performerSsin?**: string       | **intent!**: string                  |
   |                                                     | **intent!**: string              | **initialPrescriptionType?**: string |

   #### Data structures
   ```typescript
   interface CreatePrescriptionInitialValues {
       intent: string;
       initialPrescriptionType?: string;
       initialPrescription?: ReadPrescription;
       initialModelId?: string;
       extend?: boolean;
   }
   
   interface ComponentServices {
       getAccessToken: (audience: string) => Promise<string | null>,
       getIdToken?: () => IdToken
   }
   
   interface IdToken {
       UserProfile: UserProfile
   }
   
   type Professional = {
       [key in keyof LowercaseDiscipline]?: {
           recognised: boolean
           nihii11: string
       }
   }
   
   interface Personal {
       lastName: string
       firstName: string
       ssin: string
   }
   
   type UserProfile = Personal & Professional;
   ```
   
   To create a prescription, it is necessary to provide the _initialPrescriptionType_ parameters in the _CreatePrescriptionInitialValues_.
   One of the following values can be provided with the intent value _**order**_ :
   * ASSISTING_WITH_PERSONAL_HYGIENE
   * BLEEDING
   * CHRONIC_PERITONEAL_DIALYSIS
   * DIABETIC_EDUCATION_FOR_PATIENTS_WITH_CARE_PATH
   * DIABETIC_EDUCATION_FOR_PATIENTS_WITH_MODEL_OF_CARE
   * DIABETIC_EDUCATION_FOR_PATIENTS_WITHOUT_CARE_PATH
   * DIABETIC_EDUCATION_VIA_CONVENTION_CENTER
   * GLYCEMIC_TEST
   * MEDICATION_PREPARATION_PSYCHIATRIC_PATIENT
   * PARAMETERS
   * SAMPLING
   * GENERIC

   The following value can be provided along with the _**proposal**_ intent :
   * ANNEX_81

2. Here are the output data structures emitted by the Web Components :
   
   | Create prescription            | List prescriptions                                     | Prescription details                           |
   |--------------------------------|--------------------------------------------------------|------------------------------------------------|
   | **prescriptionsCreated**: void | **clickOpenPrescriptionDetails** : PrescriptionSummary | **clickDuplicate**: ReadPrescription           |
   | **clickCancel**: void          | **clickOpenModelDetails** : PrescriptionModel          | **clickExtend**: ReadPrescription              |
   | **modelCreated**: void         |                                                        | **proposalApproved**: {prescriptionId: string} |
   |                                |                                                        | **proposalRejected**: boolean                  |
   
   #### Data structures
   ```typescript
   interface PrescriptionSummary {
       id: string;
       templateCode: string;
       authoredOn: string;
       requester?: Professional;
       careGivers?: Professional[];
       status?: Status;
       assigned: boolean;
       period: { start: string; end: string; };
   }
   
   interface PrescriptionModel {
       id: number;
       creationDate: string;
       nihii_11: string;
       label: string;
       modelData: Record<string, any>;
       templateVersionId: number;
       templateId: number;
       templateCode: string;
   }
   
   interface ReadPrescription {
       id: string;
       patientIdentifier: string;
       templateCode: string;
       authoredOn: string;
       requester?: Professional;
       status?: Status;
       period: { start: string; end: string; };
       referralTask: ReferralTask;
       performerTasks: PerformerTask[];
       organizationTasks: OrganizationTask[];
       responses: Record<string, any>;
       intent?: string;
       pseudonymizedKey?: string;
       shortCode?: string;
       note?: string;
   }
   ```

## Showcase

Sample code examples are provided to help you get started with integrating the Web Components. These examples
demonstrate how to set up the components using a basic (vanilla) stack of HTML, CSS, and JavaScript, serving as a
foundation you can adapt to your own project or framework.

You can check how each web component is setup by going to :

- the create-prescription showcase [here](showcase/create/index.html)
- the list-prescriptions showcase [here](showcase/list/index.html)
- the prescription-details showcase [here](showcase/details/index.html)

### Authentication

Use your preferred authentication library to perform the authentication process via I.AM Connect from eHealth. In the
showcase, we have made the choice to use the [Keycloak javascript library](https://www.npmjs.com/package/keycloak-js) (
version 26+ is mandatory for compatibility reason with I.AM Connect).

In the showcase, the library is initialized via the following instruction

```HTML
<!-- Referencing the script -->
<html>
<head>
    <script src="../lib/keycloak.js"></script>
</head>
<body>
<script>
    // Setting the environment dynamically
    const keycloak = getKeycloakConfigurationForEnv();
    // Initialization of the authentication library
    keycloak.init({onLoad: 'login-required', checkLoginIframe: false})
            .then(function (authenticated) {
                // User is successfuly authenticated
            })

    /**
     * Returns a new Keycloak configuration object for the current environment.
     *
     * This function creates and returns an instance of the Keycloak client
     * configured with the predefined parameters such as the Keycloak server URL,
     * realm, and client ID. This setup is typically used to initialize the Keycloak
     * JavaScript adapter in frontend applications.
     *
     * @function
     * @returns {Keycloak} A Keycloak instance configured with:
     *  - `url`: "https://authentication/server/auth/endpoint"
     *  - `realm`: "myRealm"
     *  - `clientId`: "myClientId"
     *
     */
    function getKeycloakConfigurationForEnv() {
        return new Keycloak({
            url: `https://api-acpt.ehealth.fgov.be/auth`,
            realm: `healthcare`,
            clientId: `nihdi-uhmep-hcp`
        });
    }
</script>
</body>
</html>


```

### Reference the Web Component resources

To continue configuring the Web Components, it is necessary to add the references to the Web Component specific
resources. Web Components resources are composed of CSS and Javascript files (for clarity, only the additional resources
are shown in the following sample code) :

```html

<html>
<head>
    <script src="../lib/keycloak.js"></script>
    <link rel="stylesheet"
          href="https://wwwacc.referral-prescription.ehealth.fgov.be/web-components/create-prescription/wc-create-prescription.css">
</head>
<body>
...

<!-- Web component script at the end -->
<script src="https://wwwacc.referral-prescription.ehealth.fgov.be/web-components/create-prescription/wc-create-prescription.js"
        type="module"></script>
</body>
</html>
```

### Web Component creation

```html

<html>
<head>
    ...
</head>
<body>
<script>
    ...
    keycloak.init({onLoad: 'login-required', checkLoginIframe: false})
            .then(function (authenticated) {
                // Creation of the custom element
                const create = document.createElement('nihdi-referral-prescription-create');
            ...
            })

</script>
</body>
</html>
```

### Inputs and outputs

```html

<html>
<head>
    ...
</head>
<body>
<script>
    ...
    keycloak.init({onLoad: 'login-required', checkLoginIframe: false})
            .then(function (authenticated) {
                // Creation of the custom element
                const create = document.createElement('nihdi-referral-prescription-create');
            ...
                // Input injecting the initial values
                create.initialValues = {
                    'intent': 'order',
                    'initialPrescriptionType': 'ASSISTING_WITH_PERSONAL_HYGIENE'
                };
                // Input for the language
                create.lang = navigator.language.includes('nl') || navigator.language.includes('fr') ? navigator.language : 'fr-BE';
                // Callback method to get a token from the authentication library
                const exchangedToken = async (audience) => await exchangeToken(keycloak.token, keycloak.clientId, audience)
                create.services = {
                    'getAccessToken': (audience) => {
                        if (audience) {
                            return Promise.resolve(exchangedToken(audience))
                        } else {
                            return Promise.resolve(keycloak.token);
                        }
                    }
                };
                // Listener function to get feedback from the Web Component after the prescription has been successfully created
                create.addEventListener('prescriptionsCreated', () => {
                    // Simply logging but more advanced logic can be added
                    console.log('Prescriptions successfully created');
                });
            })

</script>
</body>
</html>
```

## Compatibility

The Web Components have been developed based on the Angular framework so the compatibility is in line with
the [Angular browser support](https://angular.dev/reference/versions#browser-support), which is the two latest versions
of the navigators. The current version of Angular that is used is 19.

## 🚀 Getting started

```
cd existing_repo
git remote add origin https://github.com/smals-belgium/shared-referral-prescription-webcomponent.git
git branch -M master
git push -uf origin master
```

## Visuals

Hereafter, you can get an overview of the web components, once they have been integrated to a web application.

| Listing                                             | Creation                                            | Detail                                              |
|-----------------------------------------------------|-----------------------------------------------------|-----------------------------------------------------|
| ![Alt text](https://raw.githubusercontent.com/smals-belgium/shared-referral-prescription-webcomponent/refs/heads/master/showcase/list/list.gif) | ![Alt text](https://raw.githubusercontent.com/smals-belgium/shared-referral-prescription-webcomponent/refs/heads/master/showcase/create/create.gif) | ![Alt text](https://raw.githubusercontent.com/smals-belgium/shared-referral-prescription-webcomponent/refs/heads/master/showcase/details/detail.gif) |

# 🤜🤛 Contributing

Web Component are available for the community and can be improved collaboratively.

## Good practices

**Angular Coding Standards:**

1. Naming Conventions:
    - Use kebab-case for file and folder names (all lowercase with hyphens between words).
    - Use PascalCase for class, interface, and component names.
    - Use camelCase for variable and property names.
2. Code Organization:
    - Separate files by functionality, using folders for components, services, models, etc.
    - Divide files into small coherent pieces to facilitate maintenance.
3. Indentation and Spacing:
    - Use 2 or 4 spaces for each level of indentation.
    - Use blank lines to separate logical blocks of code.
4. HTML Templates:
    - Use kebab-case for attributes in HTML templates.
    - Avoid putting too much complex logic in templates; favor TypeScript code for processing.
5. Dependency Management:
    - Use npm package management system to handle dependencies.
    - Regularly check for updates to dependencies to include bug fixes and new features.
6. ESLint and TSLint Usage:
    - Configure tools like ESLint to ensure code consistency and quality by following specified coding rules.

---
**General rules:**

- The source of data should be an authentic source. The data cannot be imported from an internal service from the
  integrator
- The standard format to exchange data is JSON
- No clear-text data (ie. NRN) can be transmitted toward the backend without being pseudonymized
- Unit testing via Jest - 80% of coverage
- https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit
- Only the front end can be changed (no Backend, no EVF change)

## Support

If you need support, contact us via integration-support@ehealth.fgov.be

## Roadmap

The project is still in a development phase.
