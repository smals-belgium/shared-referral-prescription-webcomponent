# web-components

## Getting started

```
cd existing_repo
git remote add origin https://github.com/smals-belgium/shared-referral-prescription-webcomponent.git
git branch -M master
git push -uf origin master
```

## Name
Digital Referral Prescription - Web components

## Description
The medical industry is renowned for its constant innovation and rapid evolution. This dynamism is often driven by technological advancements and changes in healthcare standards.

To keep pace with these developments, industry stakeholders (hospitals, clinics, laboratories, etc.) must continuously integrate new technologies and adopt new practices.

To meet these constraints, software used in the medical industry must comply with :

- **Regulatory Compliance:** Ensure ongoing compliance with current regulations.

- **Data Security:** Integrate robust security mechanisms to protect patient data.

- **Integration Ease:** Have flexible integration capabilities to work harmoniously with other healthcare systems and facilitate smooth data exchange.

- **Accessibility and Usability:** Be user-friendly for healthcare professionals, with an intuitive user interface.

Web component technology has been chosen to address the legal and technical constraints mentioned above. This solution provides a central way of developing and supplying a reusable set of features to other healthcare partners.

## Prerequisite
Ask user in ACC from eHealth

## Visuals

Here below, the result integrated within the Digital Referal Prescription project
|Listing  | Creation |Detail |
| ------ | ------ |------ |
|![Alt text](https://s4.gifyu.com/images/bL5bI.gif)  | ![Alt text](https://s4.gifyu.com/images/bL5ph.gif)    |![Alt text](https://s4.gifyu.com/images/bL5LM.gif)          |

## Show case
To see a live demo go to:

[Available Soon]

**Tips** you can pass the ssin in param like:

[Available Soon]

## Link to the webComponents



## Installation
For the test ,no installation required, just pull the example index.html and include it within your server.

If you want to use different web component, within the following section

` const create = document.createElement('nihdi-referral-prescription-create');`

**Replace**

` nihdi-referral-prescription-create`

**By one of the following:**

Listing web component
`nihdi-referral-prescription-list`

Details web component
`nihdi-referral-prescription-details`


## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
If you need support, contact us via integration-support@ehealth.fgov.be
## Roadmap
Go live planned in January 2026 

## Good practices

**Java Coding Standards:**
1. Naming Conventions
   - Use PascalCase for class names (first letter of each word capitalized, without spaces or special characters).
   - Use camelCase for variable and method names (first letter in lowercase, with the first letter of each subsequent word capitalized).
   - Constants should be fully capitalized with underscores as word separators.

2. Indentation and Spacing:
   - Use 4 spaces for each level of indentation.
   - Use blank lines to separate logical blocks of code.
   - Use spaces for improved readability, for example, after commas, operators, and around comparison operators.
3. Line Length:
   - Limit code lines to 80-120 characters to ensure readability in environments with limited width.
4. Imports:
   - Organize imports in alphabetical order and separate imports for classes, packages, and static classes.
5. Exception Handling:
   - Avoid using exceptions for flow control. Exceptions should be reserved for exceptional situations.
   - Do not catch exceptions too broadly; prefer specificity in catch blocks.
---
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
- The source of data should be an authentic source. The data cannot be imported from an internal service from the integrator
- The standard format to exchange data is JSON
- No clear-text data (ie. NRN) can be transmitted toward the backend without being pseudonymized
- Unit testing via Jest - 80% of coverage
- https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit
- Only the front end can be changed (no Backend, no EVF change)
