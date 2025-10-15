# web-components

## Description

This project contains 3 webcomponents with the following html-tags:
- wc-prescription-details: <nihdi-referral-prescription-details>
- wc-list-prescriptions: <nihdi-referral-prescription-list>
- wc-prescription-create: <nihdi-referral-prescription-create>

To implement them, just include the js and css file. 
- wc-prescription-details: ./dist/build/wc-prescription-details.js and ./dist/build/wc-prescription-details.css
- wc-prescription-list: ./dist/build/wc-list-prescriptions.js and ./dist/build/wc-list-prescriptions.js
- wc-prescription-create: ./dist/build/wc-create-prescription.js and ./dist/build/wc-create-prescription.js

An example can be found in the index.html.

## Development server

- Run `ng serve:wc:details` for a dev server. Navigate to `http://localhost:4200/`. The wc prescription details component will automatically reload if you change any of the source files.
- Run `ng serve:wc:list` for a dev server. Navigate to `http://localhost:4200/`. The wc prescription list component will automatically reload if you change any of the source files.
- Run `ng serve:wc:create` for a dev server. Navigate to `http://localhost:4200/`. The wc prescription create component will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build:wc:details`, `ng build:wc:list` or `ng build:wc:create` to build the wc prescription component. The build artifacts will be stored in the `dist/` directory.
The `dist/build` directory will contain a js and css file needed to implement in your html file in order for the webcomponent to be available.

## Running server

serve helps you serve a static site. You need to install serve globally. To do this, just run the command `npm install --global serve`.
If you want to run a webcomponent from the index.html page you can run `serve --listen 4200` to run de index.html example page.
If you want to connect all webcomponents to the webapp you need to build all components and then run `serve --cors` to listen on localhost:3000.

## Running unit tests

`ng test` is not implemented yet implemented.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.

## Overridable styling options

### Slots

* radiation: Icon indicating the level of radiation exposure associated with the suggested radiology solution.

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
    - First step: download the jar file: https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/7.14.0/openapi-generator-cli-7.14.0.jar
    - Second step: past the jar file in ./node_modules/@openapitools/openapi-generator-cli/versions/
    - Third step run the following command

  To regenerate: `npm run generate-api:local`
