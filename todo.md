# Project TODO List

> **Generated from PRD & Design Document Analysis**
> This TODO list identifies gaps between the current implementation and the requirements specified in `prd.md` and `design.md`.

---

## Phase 1: Core Foundations

### 1.1 User Registration & Profile Setup

- [x] Add PatientProfile fields (date_of_birth, blood_group, known_allergies, chronic_conditions) to registration flow
- [x] Create PractitionerProfile during registration when role=PRACTITIONER
- [x] Create DoctorProfile during registration when role=DOCTOR
- [x] Add role-specific profile creation serializers in backend
- [x] Implement multi-step registration form for role-specific data collection
- [x] Add preferred language selection field to User model
- [x] Add preferred language dropdown to registration form

### 1.2 Authentication Enhancements

- [x] Fix login redirect logic to properly route DOCTOR role to /doctor dashboard
- [x] Persist user state to call refresh token API for session recovery on page refresh
- [x] Add loading state handling during authentication check on protected routes

### 1.3 Backend Model Completions

- [x] Add `preferred_language` field to User model (choices: en, hi, ta, te, bn, mr, gu, kn, ml, pa, or)
- [x] Add `past_surgeries` field to PatientProfile model (per PRD 5.1.1)
- [x] Add `current_medications` field to PatientProfile model (per PRD 5.1.1)
- [x] Add `lifestyle_indicators` field to PatientProfile model (per PRD 5.1.1)
- [x] Add `availability_timings` JSONField to DoctorProfile model (per PRD 5.1.3)
- [x] Add `latitude` and `longitude` DecimalFields to PractitionerProfile model
- [x] Add `services_offered` JSONField to PractitionerProfile model (list of test types)
- [x] Create ConsultationRequest model with: patient, doctor, status, requested_at, scheduled_time, meet_link, calendar_event_id
- [x] Add migration for new model fields

---

## Phase 2: Feature Development

### 2.1 Patient Features

#### Patient Profile Management

- [x] Create patient profile edit page UI at `/patient/profile/edit`
- [x] Add form fields for: date_of_birth, blood_group, emergency_contact, address
- [x] Add health history section: known_allergies, chronic_conditions, current_medications, past_surgeries, lifestyle_indicators
- [x] Create PATCH `/patient/me/` endpoint for profile updates
- [x] Add validation for health-related fields in PatientProfile serializer (incl. JSON schemas for past_surgeries, current_medications, lifestyle_indicators)
- [x] Extend GET `/patient/me/` to return all profile fields; render in Profile page with Edit button

#### Patient Health History

- [x] Create medical history JSONField on PatientProfile (conditions + surgeries)
- [x] Create medical history endpoint GET `/patient/medical-history/` returning structured JSON
- [x] Create medical history update endpoint PATCH `/patient/medical-history/`
- [x] Build Medical History management UI page at `/patient/medical-history` with sidebar menu item
- [x] Add ability to mark conditions as ACTIVE or RESOLVED

#### Patient Test Detail Enhancements

- [x] Display referral information in TestDetail.jsx when referral exists
- [x] Display doctor review decision and notes when available
- [x] Add "Download Report" button when DiagnosticReport exists
- [x] Connect download button to GET `/patient/reports/:test_id/` endpoint
- [x] Display AI heatmap image in test detail view
- [x] Add disclaimer text below AI results per design doc

#### Patient Appointments UI

- [x] Create Appointments page at `/patient/appointments`
- [x] Add Appointments link to PatientDashboardLayout menu
- [x] Build appointment list table with status badges
- [x] Create appointment booking form with date/time picker
- [x] Add practitioner/center selection for diagnostic appointments (doctor consultations use ConsultationRequest; see Doctor Discovery and Consultation Features)
- [x] Connect to existing `/patient/appointments/` and `/patient/appointments/book/` endpoints
- [x] Add location map view to show diagnostic center coordinates with Google Maps embed
- [x] Add view location button in appointments table for each booked appointment
- [x] Remove ONLINE mode since all diagnostic appointments are in-person

#### Doctor Discovery (PRD 5.1.3)

- [x] Create backend endpoint GET `/patient/doctors/` to list doctors with filters
- [x] Add DoctorListSerializer with specialization, hospital, availability fields
- [x] Create Doctor Discovery page UI at `/patient/doctors`
- [x] Add search/filter by specialization
- [x] Display doctor availability timings
- [x] Add "Request Consultation" button per doctor
- [x] Create POST `/patient/consultations/request/` endpoint to send consultation requests
- [x] Add Doctors link to PatientDashboardLayout menu
- [x] Add routing for `/patient/doctors` page

#### Practitioner Discovery with Map (PRD 5.1.3)

- [x] Create backend endpoint GET `/patient/practitioners/` to list practitioners with location data
- [x] Add PractitionerListSerializer with center_name, location, coordinates, services fields
- [x] Create Practitioner Discovery page UI at `/patient/practitioners`
- [x] Add Practitioners link to PatientDashboardLayout menu
- [x] Install react-leaflet and leaflet packages (if not already installed) - Using react-map-gl + mapbox instead
- [x] Create map view component showing practitioner locations as markers
- [x] Display practitioner info popup on marker click (name, center, services)
- [x] Add list view toggle alongside map view
- [x] Add search by location/area functionality
- [x] Add filter by test types offered (TB, Breast Cancer, Diabetic)
- [x] Show distance from patient location (if geolocation permission granted)
- [x] Add "Get Directions" button linking to Google Maps directions
- [x] Add routing for `/patient/practitioners` page

#### Consultation Features (PRD 5.1.4) - Google Calendar + Meet Integration

- [x] Create ConsultationRequest model in backend with fields: patient, doctor, status, scheduled_time, meet_link (done in 1.3; includes requested_at, calendar_event_id)
- [x] Set up Google Cloud project and enable Google Calendar API
- [x] Install google-api-python-client and google-auth packages in backend
- [x] Create backend service `backend/core/services/google_calendar.py` for Calendar API integration
- [x] Implement function to create Google Calendar event with Google Meet link
- [x] Implement function to add patient and doctor as event participants
- [x] Create endpoint POST `/patient/consultations/request/` to request consultation
- [x] Create endpoint POST `/doctor/consultations/:id/schedule/` for doctor to confirm and schedule
- [x] Store Google Meet link in ConsultationRequest model after scheduling
- [x] Create endpoint GET `/patient/consultations/` to list patient's consultations with meet links
- [x] Create endpoint GET `/doctor/consultations/` to list doctor's consultations
- [x] Add consultation request UI on doctor discovery page (via RequestConsultation button in Doctors.jsx)
- [x] Add "Join Meeting" button in patient consultation list (opens Google Meet link)
- [x] Add consultation management UI in doctor dashboard
- [x] Add consultation status tracking in patient dashboard
- [x] Add RTK Query endpoints for patient consultations (getPatientConsultations, cancelConsultation)
- [x] Add RTK Query endpoints for doctor consultations (getDoctorConsultations, scheduleConsultation, rejectConsultation, rescheduleConsultation)
- [x] Create patient consultations UI page at `/patient/consultations` with list, filter, and actions
- [x] Create doctor consultations UI page at `/doctor/consultations` with schedule/reject/reschedule dialogs
- [x] Add Consultations route to App.jsx for both patient and doctor
- [x] Add Consultations menu item to PatientDashboardLayout
- [x] Add Consultations menu item to DoctorDashboardLayout
- [x] Create Dialog component for modal dialogs

### 2.2 Practitioner Features

#### Test Workflow Page

- [x] Create TestWorkflow.jsx page at `/practitioner/tests/:test_id/workflow`
- [x] Add route for TestWorkflow in App.jsx
- [x] Build Step 1: Image Upload form with file input for DICOM/PNG/JPG
- [x] Connect upload form to existing `/practitioner/tests/:id/upload/` endpoint
- [x] Build Step 2: Clinical Context form with symptoms JSON input
- [x] Add vitals input fields (BP, temperature, heart rate, etc.)
- [x] Connect clinical context form to `/practitioner/tests/:id/context/` endpoint
- [x] Build Step 3: Run AI button with loading state
- [x] Display AI results (risk_level, risk_score, confidence, heatmap) after inference
- [x] Build Step 4: Refer to Doctor form with doctor selection dropdown
- [x] Add urgency selection (ROUTINE/HIGH) and reason textarea
- [x] Connect referral form to `/practitioner/tests/:id/refer/` endpoint
- [x] Add workflow progress indicator showing current step

#### Active Tests Management

- [x] Create ActiveTests.jsx page at `/practitioner/active-tests`
- [x] Add route for ActiveTests in App.jsx
- [x] Create backend endpoint GET `/practitioner/tests/active/` returning practitioner's tests
- [x] Display tests in table with status, patient name, test type, date
- [x] Add "Continue Workflow" button linking to TestWorkflow page
- [x] Add status filter (UPLOADED, AI_DONE, REFERRED, CLOSED)

#### Practitioner Profile & Location

- [x] Add `latitude` and `longitude` fields to PractitionerProfile model
- [x] Add migration for location coordinate fields
- [x] Create PractitionerProfile.jsx page at `/practitioner/profile`
- [x] Add route for profile in App.jsx
- [x] Create backend endpoint GET `/practitioner/me/` for profile data
- [x] Display: designation, diagnostic_center_name, center_location, experience_years
- [x] Add profile edit functionality
- [x] Add location picker map component (Mapbox; search + click to set location)
- [x] Allow practitioner to pin clinic/center location on map
- [x] Save latitude/longitude coordinates on profile update
- [x] Create PATCH `/practitioner/me/` endpoint for profile updates including location
- [x] Create Django management command to seed practitioner data in database

#### Doctor Selection for Referral

- [x] Create backend endpoint GET `/practitioner/doctors/` to list doctors
- [x] Filter doctors by specialization relevant to test type
- [x] Populate doctor dropdown in referral form with API data

### 2.3 Doctor Features

#### Doctor Dashboard Layout

- [x] Create DoctorDashboardLayout.jsx in components/layout/
- [x] Add menu items: Dashboard, Pending Referrals, Reviewed Cases, Profile
- [x] Add RequireAuthAsDoctor.jsx route guard component
- [x] Add doctor routes to App.jsx under RequireAuthAsDoctor

#### Doctor Dashboard Page

- [x] Create Doctor/Dashboard.jsx page
- [x] Display summary: pending referrals count, reviewed today count
- [x] Add quick links to pending referrals
- [x] Include ethical AI disclaimer per design doc

#### Pending Referrals Page

- [x] Create Doctor/PendingReferrals.jsx page
- [x] Fetch data from GET `/doctor/referrals/` endpoint
- [x] Display table: patient name, test type, urgency, date
- [x] Add "Review Case" button linking to case detail

#### Case Detail & Review Page

- [x] Create Doctor/CaseDetail.jsx page at `/doctor/cases/:test_id`
- [x] Fetch case data from GET `/doctor/cases/:test_id/` endpoint
- [x] Display patient information and test details
- [x] Display AI inference results: risk_level, risk_score, confidence
- [x] Display heatmap image for explainability
- [x] Display patient health history context
- [x] Create review submission form with decision dropdown (CONFIRM, OVERRIDE, MORE_TESTS)
- [x] Add notes textarea for doctor comments
- [x] Connect form to POST `/doctor/referrals/:id/review/` endpoint
- [x] Add "Close Case" button connecting to POST `/doctor/referrals/:id/close/`

#### Doctor Profile

- [x] Create Doctor/Profile.jsx page
- [x] Create backend endpoint GET `/doctor/me/` for doctor profile
- [x] Display: specialization, hospital_name, registration_number, experience
- [x] Add teleconsult availability toggle

#### Doctor Consultation Management (Google Calendar + Meet)

- [x] Create Doctor/Consultations.jsx page at `/doctor/consultations`
- [x] Add Consultations link to DoctorDashboardLayout menu
- [x] Display pending consultation requests from patients
- [x] Create scheduling form with date/time picker
- [x] On schedule confirmation, call Google Calendar API to create event
- [x] Auto-add patient email and doctor email as participants
- [x] Display scheduled consultations with Google Meet join links
- [x] Add "Start Meeting" button to open Google Meet
- [x] Show consultation history with completed/cancelled status

#### Reviewed Cases History

- [x] Create Doctor/ReviewedCases.jsx page
- [x] Create backend endpoint GET `/doctor/reviewed/` for reviewed referrals
- [x] Display historical cases with review decisions

### 2.4 AI & Intelligence Layer

#### TB Model Integration

- [ ] Implement TB model inference in backend/ai/tb/ directory
- [ ] Create TBModel class similar to BreastCancerModel
- [ ] Create TB inference function with GradCAM support
- [ ] Add TB case handling in run_ai_and_generate_report service
- [ ] Route test_type="TB" to appropriate AI model

#### Clinical Context in AI Inference

- [x] Modify run_ai_and_generate_report to accept clinical context
- [x] Include patient health history in AI analysis context
- [x] Populate auto_history_snapshot from PatientProfile in ClinicalContext creation
- [x] Include context summary in generated PDF report

#### Pneumonia Model Integration

- [x] Implement Pneumonia model inference in `backend/ai/pneumonia/`
- [x] Update AI Service to handle Pneumonia test type
- [x] Display Pneumonia-specific labels in UI

#### Diabetic Model Integration

- [ ] Wire existing diabetic.pkl model to inference pipeline
- [ ] Add DIABETIC to TEST_TYPE_CHOICES in DiagnosticTest model
- [ ] Create diabetic inference function
- [ ] Add diabetic test type option in CreateTest.jsx

#### Report Enhancements

- [x] Add doctor review section placeholder for post-review reports
- [x] Improve PDF styling and layout
- [x] Add multi-lingual report selection (dropdown) in Patient UI

#### AI Results & UI Refinements

- [x] Add `prediction_label` to `AIInferenceResult` model
- [x] Update serializers and views to return absolute media URLs
- [x] Fix image cropping and visibility in Practitioner and Doctor UI
- [x] Display specific diagnosis label (e.g., "Pneumonia suspected") in AI results

#### Multilingual Report Generation - Bhashini API Integration

- [ ] Register for Bhashini API access at bhashini.gov.in
- [ ] Create backend service `backend/ai/bhashini_service.py` for Bhashini API integration
- [ ] Implement translation function for text content using Bhashini NMT (Neural Machine Translation)
- [ ] Add supported languages list: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia
- [ ] Create function to translate report sections (summary, risk level explanation, recommendations)
- [ ] Modify `generate_report()` to accept target_language parameter
- [ ] Translate AI insights section to patient's preferred language
- [ ] Translate disclaimer and instructions to patient's preferred language
- [ ] Keep medical terms in English with translated explanations
- [ ] Create endpoint GET `/patient/reports/:test_id/?lang=hi` to download report in specific language
- [ ] Add language selection dropdown in patient test detail before report download
- [ ] Cache translated content to reduce API calls for repeated downloads
- [ ] Handle Bhashini API errors gracefully with fallback to English

---

## Phase 3: Integration & Validation

### 3.1 API Slice Completions

- [x] Add `getPatientMedicalHistory` query to patientApiSlice
- [x] Add `updatePatientProfile` mutation to patientApiSlice
- [x] Add `getPatientDoctors` query to patientApiSlice
- [x] Add `getPatientPractitioners` query to patientApiSlice (with location data)
- [x] Add `requestConsultation` mutation to patientApiSlice
- [x] Add `getPatientConsultations` query to patientApiSlice
- [x] Add `getDoctorList` query to practitionerApiSlice
- [x] Add `updatePractitionerProfile` mutation to practitionerApiSlice (with location)
- [x] Create doctorApiSlice.js with all doctor endpoints
- [x] Add `getDoctorReferrals` query to doctorApiSlice
- [x] Add `getDoctorCaseDetail` query to doctorApiSlice
- [x] Add `submitDoctorReview` mutation to doctorApiSlice
- [x] Add `closeDoctorReferral` mutation to doctorApiSlice
- [x] Add `getDoctorConsultationRequests` query to doctorApiSlice
- [x] Add `scheduleConsultation` mutation to doctorApiSlice
- [x] Add `getDoctorConsultations` query to doctorApiSlice

### 3.2 Form Validations

- [ ] Add phone number format validation (10 digits) in registration
- [ ] Add ABHA ID format validation (xxxx-xxxx-xxxx-xxxx pattern)
- [ ] Add password strength validation in registration
- [ ] Add file type validation for diagnostic image uploads (DICOM, PNG, JPG)
- [ ] Add file size limit validation for uploads
- [ ] Add required field validation for clinical context form

### 3.3 Error Handling

- [ ] Add global error boundary component in React
- [ ] Implement consistent error message display across all forms
- [ ] Add network error retry logic for API calls
- [ ] Handle 403 Forbidden errors with appropriate user feedback
- [ ] Add empty state handling for all list views

### 3.4 Backend Validations

- [ ] Add test ownership validation in practitioner views
- [ ] Add referral status validation before review submission
- [ ] Add file extension validation in DiagnosticImageUploadSerializer
- [ ] Validate test status transitions (UPLOADED -> AI_DONE -> REFERRED -> CLOSED)

---

## Phase 4: UX, Safety & Polish

### 4.1 AI Transparency (Design Doc Section 9)

- [ ] Add "AI is assistive" disclaimer badge on all AI result displays
- [ ] Add "Doctor review required" notice before showing AI results to patients
- [ ] Add confidence interpretation helper text (e.g., "High confidence" explanation)
- [ ] Ensure AI results are never shown without doctor oversight disclaimer

### 4.2 Patient Data Privacy

- [ ] Implement audit logging for all data access
- [ ] Add request logging middleware for sensitive endpoints
- [ ] Ensure patients can only access their own data (verify all patient views)
- [ ] Add data access audit trail model

### 4.3 UI/UX Improvements

- [ ] Add loading skeletons for all data-fetching components
- [ ] Implement optimistic updates for form submissions
- [ ] Add success toast notifications for completed actions
- [ ] Add confirmation dialogs for destructive actions
- [ ] Ensure mobile responsiveness on all pages
- [ ] Add breadcrumb navigation in dashboard pages

### 4.4 Accessibility (Design Doc Section 10)

- [ ] Add aria-labels to all interactive elements
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Add keyboard navigation support for all forms
- [ ] Add focus indicators for interactive elements
- [ ] Test with screen reader compatibility

### 4.5 Empty States & Edge Cases

- [ ] Design empty state for "No tests found" in patient tests
- [ ] Design empty state for "No referrals" in patient referrals
- [ ] Design empty state for "No pending referrals" in doctor dashboard
- [ ] Handle case when AI inference fails
- [ ] Handle case when report generation fails

---

## Phase 5: Documentation & Final Review

### 5.1 API Documentation

- [ ] Document all patient API endpoints with request/response examples
- [ ] Document all practitioner API endpoints
- [ ] Document all doctor API endpoints
- [ ] Document authentication flow and token refresh mechanism
- [ ] Add API error code reference

### 5.2 Deployment Preparation

- [ ] Configure production environment variables
- [ ] Set up CORS for production frontend domain
- [ ] Configure secure cookie settings for production
- [ ] Set up static file serving for uploaded images and reports
- [ ] Configure database connection for production

### 5.3 Testing

- [ ] Write unit tests for AI inference functions
- [ ] Write integration tests for authentication flow
- [ ] Write tests for practitioner test creation workflow
- [ ] Write tests for doctor review workflow
- [ ] Add frontend component tests for critical flows

### 5.4 Code Quality

- [ ] Remove console.log statements from production code
- [ ] Fix linting errors across frontend codebase
- [ ] Add TypeScript types for API responses (optional enhancement)
- [ ] Review and remove unused imports and components

---

## Notes

- All tasks are derived from gaps between current implementation and PRD/Design Document requirements
- Tasks are ordered for logical dependency resolution
- Doctor frontend is entirely missing and should be prioritized after practitioner workflow completion
- AI models for TB and Diabetic screening exist but are not integrated into the inference pipeline

## Implementation Decisions

| Feature                   | Technology Choice                 | Notes                                                        |
| ------------------------- | --------------------------------- | ------------------------------------------------------------ |
| **Multilingual Reports**  | Bhashini API                      | Government of India translation service for Indian languages |
| **Video Consultations**   | Google Calendar API + Google Meet | Schedule meetings and auto-generate Meet links               |
| **Map Integration**       | Leaflet + OpenStreetMap           | Free, open-source mapping solution                           |
| **Insurance Integration** | Future Scope                      | No billing fields required for v1                            |

### 5.5 Optional / Low Priority Features

- [ ] Implement System Email Notification for consultation invites (fallback for Service Account limitation)

## External API Setup Required

1. **Bhashini API**: Register at bhashini.gov.in for API key
2. **Google Cloud**: Create project, enable Calendar API, set up OAuth credentials
3. **OpenStreetMap**: No API key required (free tile server usage)
