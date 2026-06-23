# Changelog

All notable changes to this project will be documented in this file.

## [1.1.5] - 23/Jun/26

### Bugfixes

- Update missing translation DE and EN
- Dialog styling - Fixed empty white space

## [1.1.4] - 16/Jun/26

### Bugfixes

- Caregiver selection - Clicking the radio button in the caregiver search results now correctly selects the caregiver and enables the "Choose" button
- Caregiver search pagination - Search results in the assign/transfer dialog now correctly load beyond the first 10 entries when scrolling on Android devices

---

## [1.1.3] - 04/Jun/26

### Features

- Wrapper component documentation - Complete documentation for wrapper components

### Improvements

- API contract updates - Updated API contract definitions for better integration
- Dependency updates - Updated npm dependencies to latest stable versions

### Bugfixes

- Wrapper compatibility - Fixed compatibility issues in wrapper components

---

## [1.1.2] - 22/Apr/26

### Improvements

- Infobox visibility - Infoboxes are now properly displayed when consulting prescriptions in the application

### Bugfixes

- Audit logging - Privacy log for HCP assignation removal now includes HCP SSIN for better traceability
- Data integrity - Fixed patient duplication issue that could occur during prescription management

---

## [1.1.1] - 03/Apr/26

### Features

- Session security - Session inactivity timeout with automatic disconnection for improved security and privacy

### Bugfixes

- Template extension - Extension button properly displayed for templates without validity end date
- Workflow accuracy - Cancel Prescription button hidden for prescription states that cannot be cancelled
- User interface - Removed table footer item counter for a cleaner interface

---

## [1.1.0] - 03/Apr/26

### Features

- Patient data flexibility - Support for querying prescriptions by old or new patient SSIN during data migrations
- Patient synchronization - Automatic subscription to patient mutations when patient information is unknown to the system
- Caregiver workflow enhancement - Allow caregivers to start new execution periods after completion, interruption, or cancellation of current period

### Improvements

- Search performance - Lazy loading for professionals list prevents loading hundreds of records at once
- Database optimization - Created indexes on Prescription, Proposal, and ActivityRequest tables for improved query performance
- Library upgrade - Migrated to pseudo lib frontend version 1.1.2
- Cache removal - Removed HTTP cache usage from web components to ensure fresh data
- Feature control - Ability to disable radio/physio prescriptions via feature flags for targeted rollouts
- Calendar logic - Improved treatment validity end date logic for nursing templates on year boundary scenarios
- Calendar logic - Adapted TreatmentValidityEndDate logic for three additional template types
- Dialog enhancements - Enhanced dialog checkbox list display and confirmation behavior for better user experience
- User experience - Removed confirmation pop-up when saving prescription as model for streamlined workflow
- Visual alignment - Improved frequency and treatment length field design
- Terminology update - Replaced "Cancel" button with "Classified without consequence" for regulatory clarity
- Print layout - Enhanced print layout alignment and formatting
- Form usability - Improved resizing capabilities for textarea, select, and infobox elements in creation forms
- Code quality - Pre-commit hook implemented to enforce consistent frontend code formatting

### Bugfixes

- Prescription extension - Fixed missing prefilled fields when extending/duplicating prescriptions for specific templates
- UI rendering - Fixed dropdown list shrinking after page scroll in Prescription Creation Form
- Form display - Fixed field display issues when extending a prescription
- Session frequency - Fixed number of sessions not updating on frequency change for specific templates
- Date display - Fixed validity end date incorrectly displayed for most prescription templates
- Calendar styling - Fixed wrong background color in date picker on hover/focus states
- UI overflow - Fixed execution dialog date picker icon overflowing input boundary
- UI overflow - Fixed closure dialog date picker icon overflowing input boundary
- Icon display - Fixed expand/collapse icon cropping when multiple prescriptions are collapsed in list view
- Placeholder text - Fixed blood quantity placeholder truncation in Dutch language
- Workflow restoration - Fixed inability to reassign prescription after rejecting assignment
- Language corrections - Fixed multiple incorrect text translations throughout the application
- Translation additions - Added missing translation for DIABETIC_EDUCATION_FOR_PATIENTS_WITH_CARE_PATH
- Proposal translations - Fixed incorrect translations for proposal-related text
- Dialog functionality - Added intent check on proposal assignation modal with additional translation keys
- Button translations - Added missing translation for Back button
- Consultation translations - Added missing translation when consulting prescription
- List translations - Added missing translations on prescription list component
- Print layout - Fixed Annex 81 print layout to display selected values correctly
- Template display - Fixed other template type correctly displayed in detail view and PDF output
- Medical validation - Require medical reason when frequency is 2 times or more per day
- UI display - Fixed dropdown 'items per page' showing on proposition page inappropriately
- Development tools - Fixed ng serve command for web-components
