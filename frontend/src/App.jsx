import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ClaimsProcessor from './pages/ClaimsProcessor'
import ClaimsHistory from './pages/ClaimsHistory'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClaimsProcessor />} />
        <Route path="/history" element={<ClaimsHistory />} />
      </Routes>
    </BrowserRouter>
  )
}
