/**
 * ClaimsProcessor.jsx
 * --------------------
 * Main claims processing page.
 *
 * State machine
 * -------------
 *  idle      → user drops PDF or clicks test
 *  loading   → API in flight  → show LoadingSpinner (replaces buttons)
 *  results   → success        → show ResultsPanel + "Process Another" button
 *  error     → API failure    → show red error card + retry controls
 */

import { useState, useCallback } from 'react'
import { UploadCloud, FlaskConical, RotateCcw, AlertCircle } from 'lucide-react'
import { processClaim, testClaim }  from '../api'
import DropZone      from '../components/DropZone'
import ResultsPanel  from '../components/ResultsPanel'
import LoadingSpinner from '../components/LoadingSpinner'

/* ═══════════════════════════════════════════════════════════════════════ */

export default function ClaimsProcessor() {
  const [file,            setFile]            = useState(null)
  const [isLoading,       setIsLoading]       = useState(false)
  const [loadingScenario, setLoadingScenario] = useState(null)
  const [results,         setResults]         = useState(null)
  const [error,           setError]           = useState('')

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleFileSelect = useCallback((f) => {
    setFile(f)
    setError('')
    // Clear previous results when a new file is chosen
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Claims Processor
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm max-w-xl">
          Upload any claim document — insurance, medical, legal, police report, or property damage. 
          The AI extracts structured fields, detects missing data, and routes the claim — in seconds.
        </p>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">

        {/* ── LEFT PANEL: upload + controls ──────────────────────────────── */}
        <div className="space-y-4">

          {/* Upload card */}
          <div className="glass-card p-6 space-y-5">
            <p className="section-title">Upload Document</p>

            <DropZone
              onFileSelect={handleFileSelect}
              disabled={isLoading}
            />

            {/* ── Action buttons / loading state ─────────────────────────── */}
            {isLoading && !loadingScenario ? (
              /* Full-width loading pill while API in flight */
              <div className="flex items-center justify-center gap-3 py-3
                              rounded-xl bg-white/5 border border-white/10">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(59,130,246,0.2)" strokeWidth="3" />
                  <path d="M12 2 A10 10 0 0 1 22 12"
                        stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium text-slate-400">
                  Processing with LLaMA 3.3-70b…
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* Process PDF button */}
                <button
                  id="btn-process-pdf"
                  onClick={() => submit('process')}
                  disabled={!file || isLoading}
                  className="btn-primary justify-center w-full"
                >
                  <UploadCloud size={17} />
                  Process PDF
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-slate-500 font-semibold px-2">Test Scenarios</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Test scenarios grid */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => submit('test', 'fast_track')}
                    disabled={isLoading}
                    className="btn-secondary justify-center text-[11px] font-medium py-2 px-1 w-full border border-transparent hover:border-green-500/30"
                  >
                    {loadingScenario === 'fast_track' ? (
                      <svg className="animate-spin w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.2" strokeWidth="3" /><path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    ) : '🟢 Fast-track Test'}
                  </button>
                  <button
                    onClick={() => submit('test', 'specialist')}
                    disabled={isLoading}
                    className="btn-secondary justify-center text-[11px] font-medium py-2 px-1 w-full border border-transparent hover:border-blue-500/30"
                  >
                    {loadingScenario === 'specialist' ? (
                      <svg className="animate-spin w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.2" strokeWidth="3" /><path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    ) : '🔵 Specialist Test'}
                  </button>
                  <button
                    onClick={() => submit('test', 'investigation')}
                    disabled={isLoading}
                    className="btn-secondary justify-center text-[11px] font-medium py-2 px-1 w-full border border-transparent hover:border-red-500/30"
                  >
                    {loadingScenario === 'investigation' ? (
                      <svg className="animate-spin w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.2" strokeWidth="3" /><path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    ) : '🔴 Investigation Test'}
                  </button>
                  <button
                    onClick={() => submit('test', 'manual_review')}
                    disabled={isLoading}
                    className="btn-secondary justify-center text-[11px] font-medium py-2 px-1 w-full border border-transparent hover:border-yellow-500/30"
                  >
                    {loadingScenario === 'manual_review' ? (
                      <svg className="animate-spin w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.2" strokeWidth="3" /><path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    ) : '🟡 Manual Review Test'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* How it works card */}
          <div className="glass-card p-5 space-y-3">
            <p className="section-title">How It Works</p>
            {[
              ['1', 'PDF text extracted via pdfplumber'],
              ['2', 'Groq LLaMA 3.3-70b extracts 12 structured fields'],
              ['3', 'Mandatory fields checked for completeness'],
              ['4', 'Deterministic rules assign a routing decision'],
              ['5', 'Result persisted to SQLite claims history'],
            ].map(([n, text]) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent
                                 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Routing rules quick reference */}
          <div className="glass-card p-5 space-y-3">
            <p className="section-title">Routing Rules</p>
            {[
              ['🔴', 'Investigation Flag', 'Fraud keyword in description'],
              ['🟡', 'Manual Review',      'Any mandatory field missing'],
              ['🔵', 'Specialist Queue',   'Claim type = injury'],
              ['🟢', 'Fast-track',         'Damage < $25,000'],
              ['⚪', 'Standard Review',    'All other claims'],
            ].map(([emoji, route, rule]) => (
              <div key={route} className="flex items-start gap-2.5">
                <span className="text-sm shrink-0 mt-0.5">{emoji}</span>
                <div>
                  <span className="text-xs font-semibold text-slate-300">{route}</span>
                  <span className="text-xs text-slate-600 ml-1.5">— {rule}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: loading / error / results ──────────────────────── */}
        <div className="min-h-[400px]">

          {/* Loading spinner — full panel */}
          {isLoading && <LoadingSpinner />}

          {/* Error card */}
          {!isLoading && error && (
            <div className="glass-card p-6 border-red-500/20 bg-red-950/20
                            animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-900/50 border border-red-500/30
                                flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-300 mb-1">Processing Failed</p>
                  <p className="text-sm text-red-400/80 leading-relaxed">{error}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 text-xs text-slate-400
                                 hover:text-white transition-colors"
                    >
                      <RotateCcw size={13} />
                      Try again
                    </button>
                    <span className="text-slate-700">·</span>
                    <button
                      onClick={() => submit('test', 'fast_track')}
                      className="flex items-center gap-1.5 text-xs text-slate-400
                                 hover:text-white transition-colors"
                    >
                      <FlaskConical size={13} />
                      Run fast-track test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results panel */}
          {!isLoading && results && (
            <div>
              {/* "Process Another" bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-300">
                  Claim processed successfully
                </p>
                <button
                  onClick={reset}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <RotateCcw size={13} />
                  Process Another
                </button>
              </div>
              <ResultsPanel results={results} />
            </div>
          )}

          {/* Empty state — no results, no error, not loading */}
          {!isLoading && !results && !error && (
            <div className="glass-card p-10 flex flex-col items-center justify-center
                            text-center gap-5 min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <UploadCloud size={28} className="text-slate-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-500 text-base">
                  Awaiting a claim document
                </p>
                <p className="text-sm text-slate-700 mt-1.5 max-w-xs">
                  Drop a PDF on the left, or click a{' '}
                  <span className="text-accent-light font-medium">Test Scenario</span>
                  {' '}to see a live demo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
