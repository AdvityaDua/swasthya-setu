import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage, LoginPage, RegisterPage } from './pages/Home'
import RequireAuthAsPatient from './components/RequireAuthAsPatient'
import { Dashboard, MyTests, TestDetail, Referrals, Profile } from './pages/Patient'
import PatientDashboardLayout from './components/layout/PatientDashboardLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route element={<RequireAuthAsPatient />}>
          <Route path='/patient' element={<PatientDashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path='tests' element={<MyTests />} />
            <Route path='tests/:test_id' element={<TestDetail />} />
            <Route path='referrals' element={<Referrals />} />
            <Route path='profile' element={<Profile />} />
          </Route>
        </Route>  
      </Routes>
    </BrowserRouter>
  )
}

export default App