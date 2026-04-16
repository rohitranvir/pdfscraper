/**
 * ClaimsHistory.jsx
 * -----------------
 * Fetches and tabulates the last 20 processed claims from the backend.
 *
 * Columns: #, Filename, Route (StatusBadge small), Missing Fields,
 *          Estimated Damage, Claim Type, Processed At
 */

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, History, FileText, AlertCircle, Clock } from 'lucide-react'
import { getHistory } from '../api'
import StatusBadge    from '../components/StatusBadge'

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════════ */

function fmtDamage(value) {
  if (value == null) return '—'
  const n = parseFloat(value)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Skeleton rows (shown while fetching)
═══════════════════════════════════════════════════════════════════════ */

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04]">
      {[90, 160, 140, 80, 100, 80, 140].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-3.5 rounded-full"
            style={{
              width: w,
              background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: `shimmer 1.6s infinite ${i * 0.1}s`,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Empty state
═══════════════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <History size={26} className="text-slate-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-500">No claims processed yet</p>
            <p className="text-xs text-slate-700 mt-1.5 max-w-xs">
              Process a PDF on the Claims Processor page — it will appear here automatically.
            </p>
          </div>
        </div>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Stats strip
═══════════════════════════════════════════════════════════════════════ */

function StatsStrip({ records }) {
  const stats = [
    { label: 'Total Processed',   value: records.length },
    { label: 'Fast-tracked',      value: records.filter(r => r.recommended_route === 'Fast-track').length },
    { label: 'Investigation',     value: records.filter(r => r.recommended_route === 'Investigation Flag').length },
    { label: 'Manual Review',     value: records.filter(r => r.recommended_route === 'Manual Review').length },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value }) => (
        <div key={label} className="glass-card px-5 py-4">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════ */

export default function ClaimsHistory() {
  const [records,   setRecords]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getHistory()
      setRecords(data)
    } catch (err) {
      setError(err.message || 'Could not load claims history.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Claims History
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Last 20 claims processed by the agent, newest first.
          </p>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="btn-secondary shrink-0"
          aria-label="Refresh history"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats strip (only when data exists) ─────────────────────────── */}
      {!isLoading && records.length > 0 && (
        <StatsStrip records={records} />
      )}

      {/* ── Error card ──────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="glass-card p-5 mb-6 border-red-500/20 bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300 mb-1">Failed to load history</p>
              <p className="text-xs text-red-400/80">{error}</p>
              <button
                onClick={load}
                className="mt-3 flex items-center gap-1.5 text-xs
                           text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Head */}
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5 text-left">
                {[
                  { label: '#',              cls: 'w-12' },
                  { label: 'Filename',       cls: 'min-w-[160px]' },
                  { label: 'Route',          cls: 'min-w-[160px]' },
                  { label: 'Missing Fields', cls: 'w-28 text-center' },
                  { label: 'Est. Damage',    cls: 'w-32' },
                  { label: 'Type',           cls: 'w-28' },
                  { label: 'Processed At',   cls: 'min-w-[160px]' },
                ].map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {/* Skeleton rows */}
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}

              {/* Empty state */}
              {!isLoading && !error && records.length === 0 && <EmptyState />}

              {/* Data rows */}
              {!isLoading && records.map((rec, i) => (
                <tr
                  key={rec.id}
                  className={`
                    border-b border-white/[0.04]
                    hover:bg-white/[0.03] transition-colors
                    ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}
                  `}
                >
                  {/* # */}
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">
                    {rec.id}
                  </td>

                  {/* Filename */}
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} className="text-slate-600 shrink-0" />
                      <span
                        className="text-slate-300 text-xs truncate"
                        title={rec.filename ?? ''}
                      >
                        {rec.filename ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Route badge */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge route={rec.recommended_route} large={false} />
                  </td>

                  {/* Missing fields count */}
                  <td className="px-4 py-3.5 text-center">
                    {rec.missing_fields_count > 0 ? (
                      <span className="inline-flex items-center justify-center
                                       w-6 h-6 rounded-full text-xs font-bold
                                       bg-red-900/40 text-red-300 ring-1 ring-red-500/25">
                        {rec.missing_fields_count}
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-base leading-none">✓</span>
                    )}
                  </td>

                  {/* Estimated damage */}
                  <td className="px-4 py-3.5 text-slate-300 font-medium whitespace-nowrap text-xs">
                    {fmtDamage(rec.estimated_damage)}
                  </td>

                  {/* Claim type */}
                  <td className="px-4 py-3.5">
                    {rec.claim_type ? (
                      <span className="text-xs font-medium text-slate-400 capitalize">
                        {rec.claim_type}
                      </span>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs whitespace-nowrap">
                      <Clock size={11} className="shrink-0" />
                      {fmtDate(rec.processed_at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
