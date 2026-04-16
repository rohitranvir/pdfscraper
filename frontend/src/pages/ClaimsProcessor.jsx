/**
 * ClaimsProcessor.jsx
 * --------------------
 * Main page — PDF upload, pipeline controls, and results display.
 *
 * Flow
 * ----
 * 1. User drops/selects a PDF  OR  clicks "Run Test Sample"
 * 2. On submit → POST /api/claims/process (or /test)
 * 3. Loading spinner while awaiting response
 * 4. ResultsPanel renders the ClaimResponse JSON
 */

import { useState, useCallback } from 'react'
import { UploadCloud, FlaskConical, RotateCcw } from 'lucide-react'
import { processClaim, testClaim } from '../api'
import DropZone from '../components/DropZone'
import ResultsPanel from '../components/ResultsPanel'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ClaimsProcessor() {
  const [file,    setFile]    = useState(null)
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const reset = useCallback(() => {
    setFile(null)
    setResult(null)
    setError('')
  }, [])

  const run = useCallback(async (mode) => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let data
      if (mode === 'test') {
        data = await testClaim()
      } else {
        const formData = new FormData()
        formData.append('file', file)
        data = await processClaim(formData)
      }
      setResult(data)
    } catch (err) {
      setError(err.message || 'Processing failed. Check the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [file])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Claims Processor
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Upload an FNOL or insurance PDF — AI extracts fields, detects gaps,
          and routes the claim automatically.
        </p>
      </div>

      {/* ── Two-column layout on large screens ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">

        {/* ── Left: upload panel ──────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-5">
            <p className="section-title">Upload Document</p>

            <DropZone
              onFileSelect={setFile}
              selectedFile={file}
              onClear={reset}
              disabled={loading}
            />

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                id="btn-process"
                onClick={() => run('process')}
                disabled={!file || loading}
                className="btn-primary justify-center w-full"
              >
                <UploadCloud size={17} />
                {loading && file ? 'Processing…' : 'Process PDF'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-slate-600 font-medium">or</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <button
                id="btn-test"
                onClick={() => run('test')}
                disabled={loading}
                className="btn-secondary justify-center w-full"
              >
                <FlaskConical size={16} />
                {loading && !file ? 'Running…' : 'Run Test Sample'}
              </button>
            </div>
          </div>

          {/* How it works card */}
          <div className="glass-card p-5 space-y-3">
            <p className="section-title">How It Works</p>
            {[
              ['1', 'PDF text extracted via pdfplumber'],
              ['2', 'Groq LLaMA 3.3-70b extracts structured fields'],
              ['3', 'Mandatory fields validated for completeness'],
              ['4', 'Deterministic rules assign a claim route'],
            ].map(([n, text]) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: results ──────────────────────────────────────────── */}
        <div>
          {loading && (
            <div className="glass-card p-8">
              <LoadingSpinner label="Extracting fields with LLaMA 3.3-70b…" size={48} />
            </div>
          )}

          {error && !loading && (
            <div className="glass-card p-6 border-red-500/25 bg-red-900/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/40 flex items-center justify-center shrink-0">
                  <span className="text-red-400 text-base">✕</span>
                </div>
                <div>
                  <p className="font-semibold text-red-300 text-sm mb-1">Processing Failed</p>
                  <p className="text-xs text-red-400/80 leading-relaxed">{error}</p>
                  <button
                    onClick={reset}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <RotateCcw size={13} /> Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <ResultsPanel result={result} />
          )}

          {!result && !loading && !error && (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[320px]">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <UploadCloud size={26} className="text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-400">No claim processed yet</p>
                <p className="text-xs text-slate-600 mt-1">
                  Upload a PDF or click "Run Test Sample" to begin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
