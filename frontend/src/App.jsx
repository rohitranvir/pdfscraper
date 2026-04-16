import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { FileText, History, Zap } from 'lucide-react'
import ClaimsProcessor from './pages/ClaimsProcessor'
import ClaimsHistory from './pages/ClaimsHistory'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center shadow-glow">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight leading-none block">
              Claims Agent
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
              AI-Powered
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`
            }
          >
            <FileText size={15} />
            Process Claim
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`
            }
          >
            <History size={15} />
            History
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"        element={<ClaimsProcessor />} />
            <Route path="/history" element={<ClaimsHistory />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
