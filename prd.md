
# Swasthya Setu – Product Requirements Document (PRD)

## 1. Product Overview
**Swasthya Setu** is a multi-stakeholder, AI-assisted healthcare coordination platform designed to reduce unnecessary hospital load, improve early medical triage, and enable context-aware diagnosis through structured workflows involving Patients, Practitioners, Doctors, and AI.

The platform emphasizes:
- Ethical AI usage
- Doctor-in-the-loop validation
- Context-aware medical insights
- Accessibility via multilingual support

---

## 2. Problem Statement
Indian healthcare systems, especially government hospitals, face:
- Overcrowding due to premature or unnecessary diagnostic escalations
- Lack of structured patient health history
- Fragmented medical records
- Language barriers between patients and medical professionals

Swasthya Setu aims to bridge these gaps by acting as a **digital coordination layer** between patients, diagnostic practitioners, AI systems, and doctors.

---

## 3. Target Users & Roles

### 3.1 Patient (User)
- Data owner
- Receives insights, reports, and feedback
- Requests supervision and consultations

### 3.2 Practitioner
- Diagnostic data creator
- Initiates AI inference
- Refers cases to doctors

### 3.3 Doctor
- Final decision-maker
- Reviews AI outputs
- Provides medical feedback and supervision

### 3.4 AI System
- Assistive analysis engine
- Context-aware inference
- Generates explainable insights (non-authoritative)

---

## 4. Core Product Principles
- **Separation of Responsibilities**
- **AI as Assistive, Not Authoritative**
- **Explainability Over Black-box Outputs**
- **Language & Accessibility First**
- **Medical Ethics Compliance**

---

## 5. Functional Requirements

## 5.1 Patient Features

### 5.1.1 Onboarding & Profile
- User registration and authentication
- Mandatory health history collection:
  - Chronic conditions
  - Past surgeries
  - Current medications
  - Allergies
  - Lifestyle indicators (optional)
- Preferred language selection

### 5.1.2 Medical Records
- View list of tests conducted
- View downloadable PDF reports
- View AI-reviewed summaries
- View referrals provided

### 5.1.3 Discovery
- View doctors with:
  - Specialization
  - Availability timings
- View practitioner locations on maps

### 5.1.4 Consultation
- Request online consultation
- Join doctor-created online meetings

---

## 5.2 Practitioner Features

### 5.2.1 Test Management
- Create new tests for registered patients
- Upload test-related files (reports, scans, readings)

### 5.2.2 AI Interaction
- Trigger AI inference on uploaded files
- View AI-generated insights with patient health context

### 5.2.3 Referral System
- Refer cases to doctors
- View doctor list with:
  - Specializations
  - Expertise areas / AI model prototypes

---

## 5.3 Doctor Features

### 5.3.1 Case Management
- View referred patients
- View affiliated practitioners

### 5.3.2 AI Review
- Review AI-generated reports
- Provide validation or corrective feedback

### 5.3.3 Patient Interaction
- Provide online feedback
- Create and join online consultations with patients

---

## 6. AI & Intelligence Layer

### 6.1 Inputs
- Diagnostic test files
- Patient health history

### 6.2 Outputs
- Structured insights
- Risk indicators
- Contextual explanations (e.g., impact of pre-existing conditions)

### 6.3 Constraints
- AI cannot directly communicate diagnosis to patients
- All AI outputs must be reviewed by doctors

---

## 7. Multilingual Support

### 7.1 Frontend (UI Level)
- Multilingual interface for all roles
- Language switching via i18n / translation services

### 7.2 Backend (Report Level)
- Language adaptation layer for:
  - AI summaries
  - Doctor feedback
- Medical-meaning-preserving translations
- Single canonical internal language for processing

---

## 8. End-to-End User Flow

1. Patient registers → provides health history
2. Practitioner conducts test → uploads data
3. Practitioner triggers AI inference
4. AI analyzes data + history
5. Doctor reviews AI output
6. Doctor provides feedback
7. System adapts report to patient language
8. Patient receives explainable insights

---

## 9. Non-Functional Requirements

- Data privacy & security (HIPAA-like compliance)
- Role-based access control
- Scalability for public hospital usage
- Audit logs for AI decisions

---

## 10. Out of Scope (v1)
- Autonomous AI diagnosis
- Emergency services
- Insurance & billing integration

---

## 11. Success Metrics
- Reduction in unnecessary doctor consultations
- Time saved per diagnosis cycle
- Doctor satisfaction with AI assistance
- Patient comprehension & trust scores

---

## 12. Positioning Statement
**Swasthya Setu is not an AI diagnosis app.  
It is an AI-assisted, doctor-validated, context-aware healthcare coordination platform built for India.**
