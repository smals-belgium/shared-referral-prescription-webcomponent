# Changelog

All notable changes to the wrapper components in this project will be documented in this file.

## [2.1.0] - 03/Sep/26

### Improvements

- Language mapping - `userLanguage` now maps `de` and `en` to the German (`de-BE`) and English (`en-GB`) translations of the underlying Web Components, instead of falling back to Dutch. Unknown values still fall back to `nl-BE`.
- Version alignment - The wrapper packages follow the versioning of the Web Components they embed.

---

## [1.2.0] - 10/Jun/26

### Bugfixes

- Fix for selecting a radio button to assign action a caregiver
- Fix for Android to unblock the amount of items in the list of assignees

---

## [1.1.3] - 04/Jun/26

### Features

- Upgrade `shared-myhealth-wc-integration` to 5.0.7

### Improvements

- Add pull-to-refresh support
- Set `permissionForMandateAccess` to []

### Documentation

- Add README-WRAPPERS.md; document custom events and public properties
- Make docs more general for portal usage

### Bugfixes

- Fix "open" event registration / ensure UI affordance dispatches the event
- Fallback language mapping: map EN/DE to NL when only NL and FR languages are available
- Fix intermittent icon resolution error: "Unable to find icon ':warning'"

---
