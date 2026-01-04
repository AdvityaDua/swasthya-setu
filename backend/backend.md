# Swasthya-Setu Backend Documentation

## Overview

Swasthya-Setu is a role-based, AI-assisted healthcare backend built using Django and Django REST Framework. The system safely integrates AI-powered diagnostics with human medical oversight, where AI assists in diagnosis but final medical decisions are always made by doctors.

## Authentication

Authentication is JWT-based using the following header format:

```
Authorization: Bearer <access_token>
```

All APIs are protected using role-based access control.

## User Roles

### 1. Patient
- View diagnostic tests and reports
- View AI results and doctor decisions
- Track medical history

### 2. Practitioner
- Search patients using phone or ABHA ID
- Create diagnostic tests
- Upload medical images
- Add clinical context (symptoms, vitals)
- Run AI models
- Refer cases to doctors

### 3. Doctor
- View assigned referrals
- Review AI results
- Confirm or override AI decisions
- Add medical notes
- Close referrals

## Core Entities

**DiagnosticTest**: Represents a diagnostic procedure (TB, Breast Cancer, etc.)

**AIInferenceResult**: Stores AI model output (risk level, score, confidence)

**Referral**: Escalation from practitioner to doctor

**DoctorReview**: Doctor's final medical decision on AI output

---

## API Reference

### Core Auth APIs

#### Register User
**POST** `/api/core/register/`

Request:
```json
{
  "full_name": "John Doe",
  "phone": "9999999999",
  "email": "john@test.com",
  "role": "PATIENT",
  "abha_id": "ABHA12345",
  "password": "password123"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "name": "John Doe",
  "role": "PATIENT",
  "email": "john@test.com"
}
```

#### Login
**POST** `/api/core/login/`

Request:
```json
{
  "phone": "9999999999",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "access": "<jwt_access_token>",
  "user": {
    "full_name": "John Doe",
    "role": "PATIENT"
  }
}
```

---

### Patient APIs

#### View Profile
**GET** `/api/patient/profile/`

Response:
```json
{
  "name": "John Doe",
  "phone": "9999999999",
  "email": "john@test.com",
  "role": "PATIENT"
}
```

#### View All Tests
**GET** `/api/patient/tests/`

Response:
```json
[
  {
    "id": "test_uuid",
    "test_type": "TB",
    "status": "AI_DONE",
    "risk_level": "HIGH"
  }
]
```

#### View Test Detail
**GET** `/api/patient/tests/<test_id>/`

Response:
```json
{
  "test_type": "TB",
  "ai_result": {
    "risk_level": "HIGH",
    "risk_score": 0.85,
    "confidence": 0.92
  }
}
```

#### View Referrals
**GET** `/api/patient/referrals/`

---

### Practitioner APIs

#### Search Patient
**GET** `/api/practitioner/patient-search/?phone=9999999999`

Response:
```json
[
  {
    "patient_id": "uuid",
    "name": "John Doe",
    "phone": "9999999999"
  }
]
```

#### Create Diagnostic Test
**POST** `/api/practitioner/tests/create/`

Request:
```json
{
  "patient": "patient_profile_id",
  "test_type": "TB"
}
```

Response:
```json
{
  "test_id": "uuid",
  "message": "Test created successfully"
}
```

#### Upload Diagnostic Image
**POST** `/api/practitioner/tests/<test_id>/upload/`

Form Data:
```
image: <image_file>
```

Response:
```json
{
  "message": "Image uploaded successfully"
}
```

#### Add Clinical Context
**POST** `/api/practitioner/tests/<test_id>/context/`

Request:
```json
{
  "symptoms": {
    "cough": true,
    "fever": true
  },
  "vitals": {
    "bp": "120/80"
  }
}
```

Response:
```json
{
  "message": "Clinical context added"
}
```

#### Run AI Inference
**POST** `/api/practitioner/tests/<test_id>/run-ai/`

Response:
```json
{
  "risk_level": "HIGH",
  "risk_score": 0.85,
  "confidence": 0.92
}
```

#### Refer to Doctor
**POST** `/api/practitioner/tests/<test_id>/refer/`

Request:
```json
{
  "referred_to": "doctor_profile_id",
  "urgency": "HIGH",
  "reason": "High TB probability"
}
```

Response:
```json
{
  "message": "Referral created"
}
```

*Note: Referral status defaults to PENDING.*

---

### Doctor APIs

#### View Assigned Referrals
**GET** `/api/doctor/referrals/`

Response:
```json
[
  {
    "id": 1,
    "patient_name": "John Doe",
    "test_type": "TB",
    "urgency": "HIGH",
    "status": "PENDING"
  }
]
```

#### View Case Details
**GET** `/api/doctor/cases/<test_id>/`

Response:
```json
{
  "test_type": "TB",
  "patient_name": "John Doe",
  "ai_result": {
    "risk_level": "HIGH",
    "risk_score": 0.85,
    "confidence": 0.92
  }
}
```

#### Review AI Result
**POST** `/api/doctor/referrals/<referral_id>/review/`

Request:
```json
{
  "decision": "CONFIRM",
  "notes": "AI result confirmed"
}
```

Response:
```json
{
  "message": "Review submitted"
}
```

*Note: Referral status becomes REVIEWED.*

#### Close Referral
**POST** `/api/doctor/referrals/<referral_id>/close/`

Response:
```json
{
  "message": "Referral closed"
}
```

*Note: Referral status becomes CLOSED.*

---

## Testing

The system includes comprehensive testing:
- Unit tests for individual apps
- API tests for each role
- Cross-app integration tests
- Full end-to-end system test

If all tests pass, the backend is system-correct.

## Design Principles

- AI assists, never decides
- Doctor is the final authority
- All actions are auditable
- Clear separation of concerns
- Production-grade backend architecture

## Tech Stack

- Django
- Django REST Framework
- SimpleJWT
- PostgreSQL
- Pillow (image handling)

## Status

Backend is complete, tested, and production-ready.