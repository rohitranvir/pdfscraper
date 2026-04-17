/**
 * ClaimsProcessor.jsx — Ethereal Analyst design
 *
 * State machine (UNCHANGED)
 * --------------------------
 *  idle      → user drops PDF or clicks test scenario
 *  loading   → API in flight  → show LoadingSpinner
 *  results   → success        → show ResultsPanel
 *  error     → API failure    → show error card + retry controls
 */

import { useState, useCallback } from 'react'
import { processClaim, testClaim } from '../api'
import DropZone       from '../components/DropZone'
import ResultsPanel   from '../components/ResultsPanel'
import LoadingSpinner from '../components/LoadingSpinner'

/* ═══════════════════════════════════════════════════════════════════════ */

export default function ClaimsProcessor() {
  const [file,            setFile]            = useState(null)
  const [isLoading,       setIsLoading]       = useState(false)
  const [loadingScenario, setLoadingScenario] = useState(null)
  const [results,         setResults]         = useState(null)
  const [error,           setError]           = useState('')

  /* ── Handlers (UNCHANGED) ────────────────────────────────────────────── */
  const handleFileSelect = useCallback((f) => {
    setFile(f)
    setError('')
    if (f) setResults(null)
  }, [])

  const reset = useCallback(() => {
    setFile(null)
    setResults(null)
    setError('')
    setIsLoading(false)
    setLoadingScenario(null)
  }, [])

  const submit = useCallback(async (mode, scenario = null) => {
    setIsLoading(true)
    if (mode === 'test') setLoadingScenario(scenario)
    setError('')
    setResults(null)

    try {
      let data
      if (mode === 'test') {
        data = await testClaim(scenario)
      } else {
        const formData = new FormData()
        formData.append('file', file)
        data = await processClaim(formData)
      }
      setResults(data)
    } catch (err) {
      setError(
        err.message ||
        'Processing failed. Make sure the backend is running on port 8000.'
      )
    } finally {
      setIsLoading(false)
      setLoadingScenario(null)
    }
  }, [file])

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen bg-[#050816] overflow-x-hidden">

      {/* ── Background glow blobs ─────────────────────────────────────── */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_24px_48px_rgba(189,157,255,0.06)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
            <span className="font-extrabold text-lg font-jakarta glow-text-purple">
              Claims Intel
            </span>
          </div>

          {/* Center nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {['Dashboard', 'Analytics', 'History'].map((link) => (
              <button
                key={link}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  link === 'Dashboard'
                    ? 'text-primary border-b-2 border-primary/60 rounded-none pb-[calc(0.5rem-2px)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <button
              onClick={() => submit('process')}
              disabled={!file || isLoading}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              Process Claim
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* ── LEFT PANEL (5 cols) ──────────────────────────────────── */}
          <div className="xl:col-span-5 space-y-6">

            {/* Heading */}
            <div>
              <h1 className="font-extrabold text-5xl font-jakarta leading-tight text-on-surface">
                Claims <span className="glow-text-purple">Processor</span>
              </h1>
              <p className="text-on-surface-variant mt-3 text-sm leading-relaxed max-w-md">
                Upload any claim document — insurance, medical, legal, police report,
                or property damage. AI extracts, validates, and routes in seconds.
              </p>
            </div>

            {/* DropZone */}
            <DropZone onFileSelect={handleFileSelect} disabled={isLoading} />

            {/* Process PDF button (mobile-visible, full width) */}
            <button
              id="btn-process-pdf"
              onClick={() => submit('process')}
              disabled={!file || isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-base hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading && !loadingScenario ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                  Processing with LLaMA 3.3-70b…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  Process PDF
                </>
              )}
            </button>

            {/* Quick Demo Scenarios */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Quick Demo Scenarios
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Button 1: Auto Accident */}
                <button
                  onClick={() => submit('test', 'fast_track')}
                  disabled={isLoading}
                  className="glass-panel rounded-2xl p-4 flex flex-col items-start gap-2 border border-white/[0.06] hover:bg-secondary/10 hover:border-secondary/40 transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingScenario === 'fast_track' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin text-secondary" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                  )}
                  <span className="text-sm font-semibold text-on-surface leading-snug">Auto Accident</span>
                </button>

                {/* Button 2: Medical Bill */}
                <button
                  onClick={() => submit('test', 'specialist')}
                  disabled={isLoading}
                  className="glass-panel rounded-2xl p-4 flex flex-col items-start gap-2 border border-white/[0.06] hover:bg-tertiary/10 hover:border-tertiary/40 transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingScenario === 'specialist' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin text-tertiary" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                  )}
                  <span className="text-sm font-semibold text-on-surface leading-snug">Medical Bill</span>
                </button>

                {/* Button 3: Property Damage */}
                <button
                  onClick={() => submit('test', 'manual_review')}
                  disabled={isLoading}
                  className="glass-panel rounded-2xl p-4 flex flex-col items-start gap-2 border border-white/[0.06] hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingScenario === 'manual_review' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin text-primary" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
                  )}
                  <span className="text-sm font-semibold text-on-surface leading-snug">Property Damage</span>
                </button>

                {/* Button 4: Policy Fraud */}
                <button
                  onClick={() => submit('test', 'investigation')}
                  disabled={isLoading}
                  className="glass-panel rounded-2xl p-4 flex flex-col items-start gap-2 border border-white/[0.06] hover:bg-error/10 hover:border-error/40 transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingScenario === 'investigation' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin text-error" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
                  )}
                  <span className="text-sm font-semibold text-on-surface leading-snug">Policy Fraud</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL (7 cols) ─────────────────────────────────── */}
          <div className="xl:col-span-7 min-h-[400px]">

            {/* Loading */}
            {isLoading && <LoadingSpinner />}

            {/* Error card */}
            {!isLoading && error && (
              <div className="rounded-3xl p-6 glass-panel border border-error/20 bg-error/5 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-error mb-1">Processing Failed</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{error}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">refresh</span>
                        Try again
                      </button>
                      <span className="text-outline-variant">·</span>
                      <button
                        onClick={() => submit('test', 'fast_track')}
                        className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">science</span>
                        Run fast-track test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!isLoading && results && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Claim processed successfully
                  </p>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-on-surface-variant glass-panel px-3 py-1.5 rounded-xl hover:bg-white/[0.05] transition-all"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Process Another
                  </button>
                </div>
                <ResultsPanel results={results} />
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !results && !error && (
              <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[420px] relative">
                {/* Animated gradient blob */}
                <div className="absolute w-72 h-72 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(189,157,255,0.15) 0%, rgba(119,153,255,0.08) 50%, transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'pulse 4s ease-in-out infinite',
                  }}
                />
                {/* Icon */}
                <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/60" style={{ fontVariationSettings: "'FILL' 1" }}>
                    cloud_upload
                  </span>
                </div>
                {/* Text */}
                <div>
                  <p className="font-bold text-2xl font-jakarta text-on-surface">Awaiting Document</p>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-xs leading-relaxed">
                    Drop a PDF on the left, or click a{' '}
                    <span className="text-primary font-medium">Demo Scenario</span>
                    {' '}to see a live AI analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
