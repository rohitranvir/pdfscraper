/**
 * ResultsPanel.jsx — Ethereal Analyst design
 * Props: results { extractedFields, missingFields, recommendedRoute, reasoning,
 *                  documentType, confidence, completenessScore }
 */

import { useState } from 'react'
import StatusBadge         from './StatusBadge'
import MissingFieldsList   from './MissingFieldsList'
import ExtractedFieldsTable from './ExtractedFieldsTable'

/* ── Raw JSON collapsible section ─────────────────────────────────── */
function RawJsonSection({ results }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(results, null, 2)

  const copy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
            data_object
          </span>
          <span className="text-sm font-semibold text-on-surface">Raw JSON Response</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-1">
            API
          </span>
        </div>
        <span className="material-symbols-outlined text-lg text-on-surface-variant transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* JSON body */}
      {open && (
        <div className="border-t border-white/5">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-2 bg-surface-container-low">
            <span className="text-xs text-on-surface-variant font-mono">application/json</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: copied ? "'FILL' 1" : "'FILL' 0" }}>
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {/* Pre block */}
          <pre className="text-[11px] leading-relaxed font-mono text-on-surface-variant bg-black/30 p-5 overflow-auto max-h-80 border-t border-white/5">
            {json}
          </pre>
        </div>
      )}
    </div>
  )
}

/* ── Route Decision card gradient map ─────────────────────────────── */
function getRouteGradient(route = '') {
  const r = route.toLowerCase()
  if (r.includes('fast'))       return 'from-emerald-900/40 via-surface-container to-surface-container-high'
  if (r.includes('specialist')) return 'from-secondary-dim/20 via-surface-container to-surface-container-high'
  if (r.includes('invest') || r.includes('flag')) return 'from-error/20 via-surface-container to-surface-container-high'
  if (r.includes('manual'))     return 'from-amber-900/30 via-surface-container to-surface-container-high'
  return 'from-primary/20 via-surface-container to-surface-container-high'
}

function formatDocType(raw) {
  if (!raw) return 'Unknown'
  return raw.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function ResultsPanel({ results }) {
  const {
    extractedFields, missingFields, recommendedRoute,
    reasoning, documentType, confidence, completenessScore
  } = results

  const confidenceDot = {
    high:   'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
    medium: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]',
    low:    'bg-error shadow-[0_0_6px_rgba(255,110,132,0.8)]',
  }[confidence?.toLowerCase() || 'low'] || 'bg-outline-variant'

  const completeness = completenessScore || 0
  const completenessColor = completeness === 100
    ? 'bg-emerald-400'
    : completeness > 60
    ? 'bg-yellow-400'
    : 'bg-error'

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── 1. ROUTE DECISION CARD ─────────────────────────────────── */}
      <div className={`relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${getRouteGradient(recommendedRoute)} border border-white/10 glow-shadow-primary overflow-hidden`}>
        {/* Decorative blur blob bottom-right */}
        <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-primary/15 blur-[60px] pointer-events-none" />

        {/* AI PROCESSED badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/20 border border-tertiary-container/40">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">AI Processed</span>
        </div>

        {/* Meta row: doc type + confidence + completeness */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Document type pill */}
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
            {formatDocType(documentType)}
          </span>
          {/* Confidence */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel">
            <span className={`w-2 h-2 rounded-full ${confidenceDot}`} />
            <span className="text-xs font-medium text-on-surface-variant capitalize">{confidence || 'unknown'} confidence</span>
          </div>
        </div>

        {/* Route label + name */}
        <p className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant mb-2">
          Route Decision
        </p>
        <p className="font-extrabold text-3xl sm:text-4xl font-jakarta text-on-surface leading-tight mb-5">
          {recommendedRoute}
        </p>

        {/* Completeness bar */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs text-on-surface-variant shrink-0">Completeness</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${completenessColor}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <span className="text-xs font-bold text-on-surface w-8 text-right shrink-0">{completeness}%</span>
        </div>

        {/* Reasoning */}
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Routing Reasoning</p>
          <p className="text-sm text-on-surface leading-relaxed">{reasoning}</p>
        </div>
      </div>

      {/* ── 2. EXTRACTED ENTITY DATA ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
            data_object
          </span>
          <h2 className="text-sm font-semibold text-on-surface">Extracted Entity Data</h2>
        </div>
        <ExtractedFieldsTable fields={extractedFields} />
      </div>

      {/* ── 3. REQUIRED ACTION (Missing Fields) ───────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <h2 className="text-sm font-semibold text-on-surface">Required Action</h2>
        </div>
        <MissingFieldsList missingFields={missingFields} />
      </div>

      {/* ── 4. REAL-TIME VERIFICATION ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
            analytics
          </span>
          <h2 className="text-sm font-semibold text-on-surface">Real-Time Verification</h2>
        </div>
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-xs text-on-surface-variant text-center">
            {missingFields.length === 0
              ? 'All checks passed — document is complete'
              : `${missingFields.length} field(s) require manual submission`}
          </p>
        </div>
      </div>

      {/* ── 5. RAW JSON RESPONSE (collapsible) ───────────────────── */}
      <RawJsonSection results={results} />

      {/* ── 6. FOOTER ACTIONS ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 transition-all">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Confirm &amp; Dispatch
        </button>
        <button className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3 glass-panel text-on-surface font-medium rounded-xl hover:bg-white/[0.06] transition-all">
          <span className="material-symbols-outlined text-xl">edit</span>
          Manual Override
        </button>
        <button className="flex items-center gap-1.5 px-4 py-3 text-on-surface-variant text-sm rounded-xl hover:text-error transition-all">
          <span className="material-symbols-outlined text-lg">delete</span>
          Discard Analysis
        </button>
      </div>
    </div>
  )
}
