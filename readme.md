# 🏥 Swasthya Setu

**Swasthya Setu** is a multi-stakeholder, AI-assisted healthcare coordination platform designed to reduce unnecessary hospital overload, improve early medical triage, and enable context-aware diagnosis through structured workflows involving **Patients, Practitioners, Doctors, and AI systems**.

The platform follows a **doctor-in-the-loop** approach and prioritizes ethical AI usage, accessibility, and interoperability.

---

## 🚀 Vision & Goals

Swasthya Setu aims to act as a **digital coordination layer** in the Indian healthcare ecosystem by:

- Reducing unnecessary diagnostic escalations
- Enabling early and structured triage
- Maintaining longitudinal patient health context
- Supporting multilingual and low-friction access
- Ensuring AI is assistive, not authoritative

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 6.0 (Django REST Framework)
- **Database**: PostgreSQL
- **AI/ML**: PyTorch, TorchVision, Grad-CAM (Heatmap generation)
- **PDF Generation**: ReportLab
- **Storage**: Cloudflare R2 (S3 compatible)
- **Authentication**: JWT (SimpleJWT)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **State Management**: Redux Toolkit (RTK Query)
- **Maps**: Mapbox GL JS
- **UI Components**: Radix UI, Lucide React

---

## 🧩 Key Features

### 1. AI-Powered Diagnostics
- **Multi-Model Inference**: Support for Pneumonia (X-Ray), Tuberculosis, and other conditions.
- **Explainable AI**: Generates Grad-CAM heatmaps to visualize AI attention areas.
- **Multilingual Reports**: Auto-generated PDF reports in English, Hindi, Tamil, etc., with consistent medical terminology.

### 2. Role-Based Dashboards
- **Patient**: Health profile management, symptom triage, and history snapshot.
- **Practitioner**: Manage diagnostic tests, upload scans, and trigger AI analysis.
- **Doctor**: comprehensive case review, "Doctor-in-the-loop" verification, and referral management.

### 3. Integrated Workflows
- **Referral System**: Seamless transfer of cases from diagnostic centers to specialists.
- **Clinical Context**: Structured capture of symptoms, vitals, and patient history accompanying every scan.
- **Consultation Scheduling**: Google Calendar integration for scheduling video consultations.

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL
- Cloudflare R2 or AWS S3 credentials for media storage

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AdvityaDua/swasthya-setu.git
   cd swasthya-setu/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   Create a `.env` file in the `backend` directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update the following variables in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `R2_ACCESS_ID` & `R2_ACCESS_KEY`: Your Cloudflare R2 credentials.
   - `R2_URL`: Your Cloudflare R2 endpoint.

5. **Run Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the Development Server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

## 👥 User Roles

### 1. Patient
- Create and manage a structured health profile
- Submit symptoms and medical history
- Receive AI-assisted triage recommendations
- Connect with diagnostic practitioners and doctors

### 2. Practitioner (Diagnostic Centers)
- Manage diagnostic center profile
- Receive and process patient referrals
- Upload reports and observations
- Provide structured medical inputs to doctors

### 3. Doctor
- Review AI-assisted case summaries
- Validate or override AI insights
- Provide diagnosis and care recommendations
- Maintain professional oversight

### 4. AI System
- Assist with triage and case summarization
- Analyze structured health data
- Provide explainable recommendations
- Operate strictly within predefined ethical boundaries

---

## 🏗️ System Architecture (High-Level)

- **Frontend**: Web application for patients, practitioners, and doctors
- **Backend**: API-driven services handling workflows and data validation
- **AI Layer**:
  - Triage models
  - NLP-based summarization
  - Explainability layer
- **Data Layer**:
  - Structured medical records
  - Secure storage with role-based access control

---

## 🔐 Security & Compliance

- Role-based access control (RBAC)
- Encrypted data storage and transmission
- Audit logs for AI and human decisions
- No AI-only medical decisions
- Designed with future compliance (HIPAA / NDHM) in mind

---

## 🤝 Contributing

This project is under active development. Contributions are welcome in the form of:
- Feature development
- AI model improvements
- UX and accessibility enhancements
- Security and compliance reviews

Please open an issue or pull request with a clear description of changes.

---

## 📄 License

License details will be added before public release.

---

## 📬 Contact

For collaboration, research, or integration discussions, please reach out to the project maintainers.
