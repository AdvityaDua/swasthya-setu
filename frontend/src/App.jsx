import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage, LoginPage, RegisterPage } from "./pages/Home";
import RequireAuthAsPatient from "./components/RequireAuthAsPatient";
import RequireAuthAsPractitioner from "./components/RequireAuthAsPractitioner";
import RequireAuthAsDoctor from "./components/RequireAuthAsDoctor";
import { Dashboard, MyTests, TestDetail, Referrals, Profile, ProfileEdit, MedicalHistory, Appointments, Practitioners, Doctors, Consultations } from "./pages/Patient";
import { Dashboard as PractitionerDashboard, PatientLookup, CreateTest, Profile as PractitionerProfile, TestWorkflow, ActiveTests } from "./pages/Practitioner";
import PatientDashboardLayout from "./components/layout/PatientDashboardLayout";
import PractitionerDashboardLayout from "./components/layout/PractitionerDashboardLayout";
import DoctorDashboardLayout from "./components/layout/DoctorDashboardLayout";
import DoctorConsultations from "./pages/Doctor/Consultations";
import AuthRestore from "./components/AuthRestore";

function App() {
  return (
    <BrowserRouter>
      <AuthRestore>
      <Routes>
        <Route path='' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route element={<RequireAuthAsPatient />}>
          <Route path='/patient' element={<PatientDashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path='tests' element={<MyTests />} />
            <Route path='tests/:test_id' element={<TestDetail />} />
            <Route path='appointments' element={<Appointments />} />
            <Route path='practitioners' element={<Practitioners />} />
            <Route path='doctors' element={<Doctors />} />
            <Route path='consultations' element={<Consultations />} />
            <Route path='referrals' element={<Referrals />} />
            <Route path='profile' element={<Profile />} />
            <Route path='medical-history' element={<MedicalHistory />} />
            <Route path='profile/edit' element={<ProfileEdit />} />
          </Route>
        </Route>  
        <Route element={<RequireAuthAsPractitioner />}>
          <Route path='/practitioner' element={<PractitionerDashboardLayout />}>
            <Route index element={<PractitionerDashboard />} />
            <Route path='patient-lookup' element={<PatientLookup />} />
            <Route path='create-test' element={<CreateTest />} />
            <Route path='active-tests' element={<ActiveTests />} />
            <Route path='tests/:test_id/workflow' element={<TestWorkflow />} />
            <Route path='profile' element={<PractitionerProfile />} />
          </Route>
        </Route>
        <Route element={<RequireAuthAsDoctor />}>
          <Route path="/doctor" element={<DoctorDashboardLayout />}>
            <Route path='consultations' element={<DoctorConsultations />} />
          </Route>
        </Route>
      </Routes>
      </AuthRestore>
    </BrowserRouter>
  )
}

export default App