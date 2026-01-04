import React from 'react'
import { Button } from '@/components/ui/button'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='' element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App