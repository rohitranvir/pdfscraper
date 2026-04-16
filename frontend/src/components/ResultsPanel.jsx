/**
 * ResultsPanel.jsx
 * ----------------
 * Renders the full pipeline output after a claim is processed.
 *
 * Sections
 * --------
 * 1. Routing Decision card   — large colored badge + reasoning text
 * 2. Missing Fields alert    — red badges or green all-clear
 * 3. Extracted Fields table  — all fields with ✓/✗ indicators
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Brain, FileSearch, AlertTriangle } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ExtractedFieldsTable from './ExtractedFieldsTable'
import MissingFieldsList from './MissingFieldsList'

// Route → gradient for the decision hero card
const ROUTE_GRADIENTS = {
  'Fast-track':        'from-emerald-900/60 to-emerald-800/20 border-emerald-500/25',
  'Manual Review':     'from-amber-900/60   to-amber-800/20   border-amber-500/25',
  'Specialist Queue':  'from-blue-900/60    to-blue-800/20    border-blue-500/25',
  'Investigation Flag':'from-red-900/60     to-red-800/20     border-red-500/25',
  'Standard Review':   'from-violet-900/60  to-violet-800/20  border-violet-500/25',
}

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4
                   hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-accent-light" />
          <span className="font-semibold text-sm text-white">{title}</span>
        </div>
        {open
          ? <ChevronUp size={16} className="text-slate-500" />
          : <ChevronDown size={16} className="text-slate-500" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * @param {{
 *   result: {
 *     extractedFields: object,
 *     missingFields: string[],
 *     recommendedRoute: string,
 *     reasoning: string
 *   }
 * }} props
 */
export default function ResultsPanel({ result }) {
  const { extractedFields, missingFields, recommendedRoute, reasoning } = result
  const gradient = ROUTE_GRADIENTS[recommendedRoute] ?? 'from-slate-800/60 to-slate-700/20 border-slate-500/25'

  return (
    <div className="space-y-4 animate-slide-up">
      {/* ── 1. Routing decision hero ──────────────────────────────────── */}
      <div className={`rounded-2xl border bg-gradient-to-br p-6 ${gradient}`}>
        <p className="section-title mb-3">Recommended Route</p>
        <div className="flex items-start gap-4">
          <StatusBadge route={recommendedRoute} size="lg" pulse />
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Reasoning
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{reasoning}</p>
        </div>
      </div>

      {/* ── 2. Missing fields ─────────────────────────────────────────── */}
      <Section icon={AlertTriangle} title="Missing Fields Validation">
        <MissingFieldsList missingFields={missingFields} />
      </Section>

      {/* ── 3. Extracted fields table ─────────────────────────────────── */}
      <Section icon={FileSearch} title="Extracted Fields" defaultOpen={true}>
        <ExtractedFieldsTable
          fields={extractedFields}
          missingFields={missingFields}
        />
      </Section>

      {/* ── 4. Raw JSON (collapsible) ─────────────────────────────────── */}
      <Section icon={Brain} title="Raw JSON Response" defaultOpen={false}>
        <pre className="text-xs text-slate-400 bg-black/30 rounded-xl p-4 overflow-auto max-h-80
                        border border-white/5 leading-relaxed font-mono">
          {JSON.stringify(result, null, 2)}
        </pre>
      </Section>
    </div>
  )
}
