# web-components

## Description

This project contains 3 webcomponents with the following html-tags:

- wc-prescription-details: <nihdi-referral-prescription-details>
- wc-prescription-list: <nihdi-referral-prescription-list>
- wc-prescription-create: <nihdi-referral-prescription-create>

To implement them, just include the js file.

- wc-prescription-details: ./dist/build/wc-prescription-details.js
- wc-prescription-list: ./dist/build/wc-prescription-list.js
- wc-prescription-create: ./dist/build/wc-prescription-create.js

An example can be found in the index.html.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build:wc:details`, `ng build:wc:list` or `ng build:wc:create` to build the wc prescription component. The build artifacts will be stored in the `dist/` directory.
The `dist/build` directory will contain a js and css file needed to implement in your html file in order for the webcomponent to be available.

## Serve

Run `ng serve:wc:details`, `ng serve:wc:list` or `ng serve:wc:create` to serve the wc prescription component. It builds and serves your application, rebuilding on file changes.

## Running server

serve helps you serve a static site. You need to install serve globally. To do this, just run the command `npm install --global serve`.
To view the web components directly in an HTML page, run `serve --listen 4200`. In serve.json, you can find an example for wc-prescription-details that you can adapt to your needs.

## Running unit tests

Run `ng test` to run the Jest tests.

## Visuals

The visual design of the web components, including layouts, color usage, typography, and component states, can be found in Figma.  
The Figma file serves as the design reference and source of truth for UI implementation.

[View designs in Figma](https://www.figma.com/design/eBlfdAk1g07SzNzjd8gado/UHMEP-webapp?t=bU1UJPQM2xoDiIcb-0).

# Update translations

To update translations, add or remove keys from [loco](https://localise.biz/uhmep-drp/uhmep-web-component) and run

```bash
pull:translations:ps
```

# SVG Icons Guide

1. Add a New Icon  
   Add your SVG to MATERIAL_ICONS (reuse folder)

2. Register in Component

```typescript
private readonly iconRegistryService = inject(IconRegistryService);

ngOnInit(): void {
  this.iconRegistryService.init(...
}
```

3. Use in HTML

```html
<mat-icon svgIcon="add" aria-label="Add item"></mat-icon>
```

4. Tips:

- aria-label for meaningful icons; use aria-hidden="true" for decorative ones.
- fill="currentColor" lets the icon inherit text color.

# API Contracts

- **webapi**: https://git.vascloud.be/nihdi/uhmep/healix/api-contract  
  The `webapi` contract is included as a Git submodule.  
  To initiate git submodule run

  ```bash
  git submodule init
  ```

  To update it, run:

  ```bash
  git submodule update --remote
  ```

  Or to initialize and update the submodule

  ```bash
  git submodule update --init --recursive
  ```

  To enter the submodule and switch branches

  ```
  cd api-contract
  git fetch
  git checkout my-branch
  ```

  The API client in `reuse/code/openapi` is generated from `openapi.yaml`.

  Steps to use the api generate
    <!-- - First step: download the jar file: https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/7.14.0/openapi-generator-cli-7.14.0.jar
    - Second step: past the jar file in ./node_modules/@openapitools/openapi-generator-cli/versions/
    - Third step run the following command -->
  - After the initial npm install, run the following command :
    ```bash
    npm run api:client:init
    ```

  To regenerate: `npm run generate-api:local`

## Empty submodules

If git submodules get's removed from the project. Follow these steps.

```bash
# remove the untracked folder
rm -rf api-contract
```

```bash
# remove any stale submodule metadata
rm -rf .git/modules/api-contract
```

```bash
# add the submodule properly
git submodule add ../api-contract.git api-contract
```

# Push to github

- Update the versions in package.json
- Remove the package-lock file
- If you have an .npmrc file update it to use the normal npm registry
  - registry=https://registry.npmjs.org/
- Clear npm
  - npm cache clean --force
  - npm cache verify
  - rm -rf node_modules/
- git add package-lock
- and run run npm i WITHOUT vpn
- Run npm run push:github in a bash terminal.
- After push succeeds remove the package-lock file
- Revert your .npmrc.
- Clear npm
  - npm cache clean --force
  - npm cache verify
  - rm -rf node_modules/
- git add package-lock
- and run run npm i WITHOUT vpn
