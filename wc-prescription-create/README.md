# UHMEP Prescription Create Web Component

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

This web component addresses these requirements by offering a standardized solution for creating medical prescriptions that can be easily shared and integrated by various
healthcare partners.

---

## Package

**Name**: `@smals-belgium-shared/uhmep-prescription-create`  
**Type**: Web Component  
**Technology**: Angular  
**License**: MIT

---

## Usage

Install the package from npm:

```bash
npm install @smals-belgium-shared/uhmep-prescription-create
```

Import the web component in your application entry point:
```javascript
import '@smals-belgium-shared/uhmep-prescription-create';
```


Use the custom element in your HTML:
```html
<wc-prescription-create></wc-prescription-create>
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
build/wc-prescription-create.js
```

This file is responsible for registering the custom element in the browser.

## Issues & Support

For bug reports, questions, or feature requests, please open an issue on GitHub:

https://github.com/smals-belgium/shared-referral-prescription-webcomponent/issues

## License

MIT © UHMEP Team
