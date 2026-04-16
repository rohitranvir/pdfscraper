/**
 * ClaimsHistory.jsx
 * -----------------
 * Fetches and displays the last 20 processed claims from the backend.
 *
 * Shows a sortable table with:
 *   id, filename, route badge, missing-fields count, damage, claim type, timestamp
 */

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, History, FileText, AlertCircle } from 'lucide-react'
import { getHistory } from '../api'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
        <History size={26} className="text-slate-600" />
      </div>
      <div>
        <p className="font-semibold text-slate-400">No claims processed yet</p>
        <p className="text-xs text-slate-600 mt-1">
          Process a PDF on the Claims Processor page to see history here.
        </p>
      </div>
    </div>
  )
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 p-5 rounded-xl bg-red-900/15 border border-red-500/20">
      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-red-300 mb-1">Failed to load history</p>
        <p className="text-xs text-red-400/80">{message}</p>
        <button
          onClick={onRetry}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    </div>
  )
}

function formatDamage(value) {
  if (value === null || value === undefined) return '—'
  const n = parseFloat(value)
  return isNaN(n) ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function formatDate(iso) {
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

export default function ClaimsHistory() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getHistory()
      setRecords(data)
    } catch (err) {
      setError(err.message || 'Could not fetch history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Claims History</h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Last 20 claims processed by the agent, newest first.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary"
          aria-label="Refresh history"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Records',     value: records.length },
            { label: 'Fast-tracked',      value: records.filter(r => r.recommended_route === 'Fast-track').length },
            { label: 'Flagged',           value: records.filter(r => r.recommended_route === 'Investigation Flag').length },
            { label: 'Missing Fields',    value: records.filter(r => r.missing_fields_count > 0).length },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card px-4 py-3">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {loading && (
          <LoadingSpinner label="Loading history…" />
        )}

        {!loading && error && (
          <div className="p-6">
            <ErrorBlock message={error} onRetry={load} />
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <EmptyState />
        )}

        {!loading && !error && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5 text-left">
                  {['#', 'Filename', 'Route', 'Missing', 'Damage', 'Type', 'Processed At'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className={`
                      border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors
                      ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}
                    `}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {rec.id}
                    </td>

                    {/* Filename */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={13} className="text-slate-600 shrink-0" />
                        <span className="text-slate-300 text-xs truncate" title={rec.filename}>
                          {rec.filename ?? '—'}
                        </span>
                      </div>
                    </td>

                    {/* Route badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge route={rec.recommended_route} size="sm" />
                    </td>

                    {/* Missing fields count */}
                    <td className="px-4 py-3 text-center">
                      {rec.missing_fields_count > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full
                                         bg-red-900/40 text-red-300 text-xs font-bold">
                          {rec.missing_fields_count}
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-base">✓</span>
                      )}
                    </td>

                    {/* Damage */}
                    <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                      {formatDamage(rec.estimated_damage)}
                    </td>

                    {/* Claim type */}
                    <td className="px-4 py-3">
                      {rec.claim_type ? (
                        <span className="text-xs font-medium text-slate-400 capitalize">
                          {rec.claim_type}
                        </span>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(rec.processed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
