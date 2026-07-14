import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Admin from './Admin.tsx' // ملف لوحة التحكم الجديد
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} /> {/* واجهة الزبائن */}
        <Route path="/iamnoor98naem" element={<Admin />} /> {/* لوحة التحكم */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)