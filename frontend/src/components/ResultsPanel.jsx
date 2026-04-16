/**
 * ResultsPanel.jsx
 * ----------------
 * Renders the complete pipeline output, top-to-bottom:
 *   1. StatusBadge (large, centered)
 *   2. Reasoning card
 *   3. MissingFieldsList
 *   4. ExtractedFieldsTable
 *
 * Props
 * -----
 * results : {
 *   extractedFields  : object
 *   missingFields    : string[]
 *   recommendedRoute : string
 *   reasoning        : string
 * }
 */

import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, FileSearch, AlertTriangle } from 'lucide-react'
import StatusBadge         from './StatusBadge'
import MissingFieldsList   from './MissingFieldsList'
import ExtractedFieldsTable from './ExtractedFieldsTable'

/* ── Collapsible section wrapper ──────────────────────────────────────── */
function Section({ icon: Icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4
                   hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-slate-500" />
          <span className="font-semibold text-sm text-white">{title}</span>
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full
                             bg-red-900/40 text-red-400 ring-1 ring-red-500/30">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp   size={15} className="text-slate-600 shrink-0" />
          : <ChevronDown size={15} className="text-slate-600 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function ResultsPanel({ results }) {
  const { extractedFields, missingFields, recommendedRoute, reasoning, documentType, confidence, completenessScore } = results

  const confidenceColor = {
    high: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    medium: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]',
    low: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  }[confidence?.toLowerCase() || 'low'] || 'bg-slate-500'

  const docTypeLabel = (documentType || 'unknown')
    .split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div
      className="space-y-4"
      style={{ animation: 'slideUp 0.45s ease-out forwards' }}
    >

      {/* ── 0. Meta data row (Document type, Confidence, Completeness) ──── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        
        <div className="flex items-center gap-3">
          {/* Doc type pill */}
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full">
            {docTypeLabel}
          </span>
          {/* Confidence */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
            <span className={`w-2 h-2 rounded-full ${confidenceColor}`}></span>
            <span className="text-xs font-medium text-slate-300 capitalize">{confidence} Confidence</span>
          </div>
        </div>

        {/* Completeness */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">Completeness</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                 className={`h-full rounded-full transition-all duration-1000 ${completenessScore === 100 ? 'bg-emerald-500' : completenessScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                 style={{ width: `${completenessScore || 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white w-8 text-right">{completenessScore || 0}%</span>
          </div>
        </div>
      </div>

      {/* ── 1. Status badge — large, centered ─────────────────────────── */}
      <StatusBadge route={recommendedRoute} large />

      {/* ── 2. Reasoning ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-slate-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Routing Reasoning
          </p>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {reasoning}
        </p>
      </div>

      {/* ── 3. Missing fields ────────────────────────────────────────── */}
      <Section
        icon={AlertTriangle}
        title="Missing Fields"
        badge={missingFields.length > 0 ? missingFields.length : null}
        defaultOpen={true}
      >
        <MissingFieldsList missingFields={missingFields} />
      </Section>

      {/* ── 4. Extracted fields table ─────────────────────────────────── */}
      <Section
        icon={FileSearch}
        title="Extracted Fields"
        defaultOpen={true}
      >
        <ExtractedFieldsTable
          fields={extractedFields}
          missingFields={missingFields}
        />
      </Section>

      {/* ── 5. Raw JSON (collapsed by default) ───────────────────────── */}
      <Section
        icon={Brain}
        title="Raw JSON Response"
        defaultOpen={false}
      >
        <pre className="
          text-[11px] leading-relaxed font-mono
          text-slate-400 bg-black/30 rounded-xl p-4
          overflow-auto max-h-72
          border border-white/5
        ">
          {JSON.stringify(results, null, 2)}
        </pre>
      </Section>
    </div>
  )
}
