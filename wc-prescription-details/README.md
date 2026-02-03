# UHMEP Prescription Details Web Component

## Context

The medical industry is characterized by continuous innovation and rapid transformation, driven by technological
progress and evolving healthcare standards.

To keep pace with these changes, stakeholders such as hospitals, clinics, and laboratories must continuously adopt new
technologies and modernize their digital tools.

Within this context, the UHMEP ecosystem provides reusable frontend components to ensure consistency, reliability, and
interoperability across applications.

Medical software must therefore meet several critical requirements:

- **Regulatory Compliance**: Ensure alignment with current healthcare regulations and standards.
- **Data Security**: Protect sensitive patient and medical information.
- **Seamless Integration**: Enable interoperability with existing healthcare systems and services.
- **Accessibility and Usability**: Provide intuitive, user-friendly interfaces tailored to healthcare professionals.

This web component addresses these requirements by offering a standardized solution for displaying detailed information about a medical
prescription that can be easily shared and integrated by various healthcare partners.

---

## Main Documentation

For a complete overview of the project, architecture, and development guidelines, please refer to the main repository
documentation:

[Shared Referral & Prescription Web Components – Main README](https://github.com/smals-belgium/shared-referral-prescription-webcomponent/blob/master/README.md)

---

## Package

**Name**: `@smals-belgium-shared/uhmep-prescription-details`  
**Type**: Web Component  
**Technology**: Angular  
**License**: MIT

---

## Usage

Install the package from npm:

```bash
npm install @smals-belgium-shared/uhmep-prescription-details
```

Import the web component in your application entry point:
```javascript
import '@smals-belgium-shared/uhmep-prescription-details';
```


Use the custom element in your HTML:
```html
<nihdi-referral-prescription-details></nihdi-referral-prescription-details>
```

Ensure the bundle is loaded only once in the application lifecycle.

## Framework Compatibility

This component is implemented as a standard Web Component and can be integrated into:

* Angular applications

* React applications

* Vue applications

* Vanilla JavaScript or HTML projects

No framework-specific wrappers are required.

## Build Output

The packaged web component is exposed via the following entry file:

```bash
build/wc-prescription-details.js
```

This file is responsible for registering the custom element in the browser.

## Issues & Support

For bug reports, questions, or feature requests, please open an issue on GitHub:

https://github.com/smals-belgium/shared-referral-prescription-webcomponent/issues

## License

MIT © UHMEP Team
