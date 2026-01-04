import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {HomePage, LoginPage, RegisterPage} from './pages/Home'
import RequireAuthAsPatient from './components/RequireAuthAsPatient'
import {PatientDashboardPage} from './pages/Patient'
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
            <Route index element={<PatientDashboardPage />} />
          </Route>
        </Route>  
      </Routes>
    </BrowserRouter>
  )
}

export default App