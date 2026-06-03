# Changelog

All notable changes to this project will be documented in this file.

## [1.1.3] - 04/Jun/26

- UHMEP-2958: Feature - Wrapper documentation for wrapper components (README-WRAPPERS.md)
- UHMEP-2958: Improvement - Updated API contract definitions
- UHMEP-2958: Improvement - Updated npm dependencies
- UHMEP-2958: Bugfix - Fix compatibility issues in wrapper components

---

## [1.1.2] - 22/Apr/26

- UHMEP-2861: Bugfix - Privacy log for removing HCP assignation now includes HCP SSIN
- UHMEP-2872: Bugfix - Fixed patient duplication issue
- UHMEP-2786: Improvement - Infoboxes are displayed again when consulting a prescription in the web app

---

## [1.1.1] - 03/Apr/26

- UHMEP-2781: Feature - Session inactivity timeout (automatic disconnection on inactivity)
- UHMEP-2821: Bugfix - Extension button displayed for templates without validity end date
- UHMEP-2843: Bugfix - Cancel Prescription button hidden for non-cancelable prescription task states
- UHMEP-2851: Bugfix - Removed table footer item counter for cleaner UI

---

## [1.1.0] - 03/Apr/26

- UHMEP-2710: Feature - Patient SSIN mutation support (consult old or new SSIN)
- UHMEP-2711: Feature - Subscribe to patient mutations on creation when patient unknown
- UHMEP-2729: Feature - Allow caregivers to start a new execution period after completion/interruption/cancellation
- UHMEP-2627: Improvement - Pre-commit hook to enforce frontend code formatting
- UHMEP-2681: Improvement - Lazy loading for professionals list (avoid loading hundreds at once)
- UHMEP-2696: Improvement - Create indexes on Prescription, Proposal and ActivityRequest tables
- UHMEP-2642: Improvement - Migrated to pseudo lib frontend version 1.1.2
- UHMEP-2680: Improvement - Removed HTTP cache usage from web components
- UHMEP-2725: Improvement - Disable radio/physio prescriptions via feature flags
- UHMEP-2690: Improvement - Adapted logic for treatment validity end date on year boundary (nursing templates)
- UHMEP-2691: Improvement - TreatmentValidityEndDate logic adapted for three templates
- UHMEP-2619: Bugfix - Missing prefilled fields when extending/duplicating prescriptions for specific templates
- UHMEP-2701: Bugfix - Dropdown list shrinking after page scroll in Prescription Creation Form
- UHMEP-2702: Bugfix - Extend a prescription - field display issues
- UHMEP-2712: Bugfix - Number of sessions not updated on frequency change for specific templates
- UHMEP-2794: Bugfix - Validity end date incorrectly displayed for most prescription templates
- UHMEP-2654: Bugfix - Prescription creation: wrong calendar background color in date picker on hover/focus
- UHMEP-2707: Bugfix - Execution dialog: date picker icon overflowing input boundary
- UHMEP-2767: Bugfix - Closure dialog: date picker icon overflowing input boundary
- UHMEP-2721: Bugfix - Expand/Collapse icon cropped when multiple prescriptions are collapsed
- UHMEP-2709: Bugfix - Bleeding: bloodQuantity placeholder truncated in Dutch
- UHMEP-2684: Bugfix - Unable to reassign prescription after rejecting assignment
- UHMEP-2655: Bugfix - Wrong text translation fixes
- UHMEP-2694: Bugfix - Added missing translation for DIABETIC_EDUCATION_FOR_PATIENTS_WITH_CARE_PATH
- UHMEP-2704: Bugfix - Fixed wrong translations for proposal
- UHMEP-2706: Bugfix - Added intent check on proposal assignation modal + 3 translation keys
- UHMEP-2738: Bugfix - Missing translation - Back button
- UHMEP-2740: Bugfix - Missing translation when consulting prescription
- UHMEP-2736: Bugfix - Missing translations on prescription list component
- UHMEP-2735: Bugfix - Annex 81 print layout displays selected values correctly
- UHMEP-2775: Bugfix - Other template type correctly displayed in detail/PDF
- UHMEP-2500: Improvement - Improved dialog checkbox list & confirmation behavior
- UHMEP-2545: Improvement - Removed pop-up when saving prescription as model
- UHMEP-2719: Improvement - Align Frequency and length of treatment with design
- UHMEP-2792: Bugfix - Require medical reason when frequency >= 2 times per day
- UHMEP-2743: Improvement - Replace "Cancel" button with "Classified without consequence"
- UHMEP-2747: Bugfix - Dropdown 'items per page' showing on proposition page
- UHMEP-2810: Bugfix - Fix `ng serve` for web-components
- UHMEP-2500: Improvement - Dialog checkbox list and confirmation behavior
- UHMEP-2688: Improvement - Print layout alignment
- UHMEP-2787: Improvement - Resize textarea/select/infobox element in creation form
