/**
 * ExtractedFieldsTable.jsx
 * -------------------------
 * Two-column responsive grid of dynamically extracted fields.
 *
 * Props
 * -----
 * fields        : object    — full extraction dict from the API
 * missingFields : string[]  — keys of missing mandatory fields (highlighted red)
 */

import { XCircle, CheckCircle2, MinusCircle } from 'lucide-react'

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') {
    const lc = value.trim().toLowerCase()
    return !value.trim() || ['null', 'none', 'unknown', 'n/a', 'na'].includes(lc)
  }
  if (Array.isArray(value)) return value.length === 0
  return false
}

function formatLabel(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatValue(key, value) {
  if (isEmpty(value)) return null

  // Currency for damage/cost fields
  if (key.includes('damage') || key.includes('cost') || key.includes('damages')) {
    const n = parseFloat(String(value).replace(/[,$€£¥]/g, ''))
    if (!isNaN(n)) {
      return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
    }
  }

  // Array → comma list
  if (Array.isArray(value)) return value.join(', ')

  return String(value)
}

/* ─── Single field card ────────────────────────────────────────────────── */

function FieldCard({ label, fieldKey, value, isMissing }) {
  const formatted = formatValue(fieldKey, value)
  const empty     = formatted === null

  const containerClass = isMissing
    ? 'bg-red-950/30 border-red-500/25 ring-1 ring-red-500/10'
    : 'bg-white/[0.025] border-white/[0.06]'

  const isFullWidth = fieldKey.includes('description') || fieldKey.includes('info')

  return (
    <div className={`rounded-xl border px-4 py-3.5 flex flex-col gap-1 transition-colors ${containerClass} ${isFullWidth ? 'col-span-full' : ''}`}>
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>

        {/* Status icon */}
        {isMissing ? (
          <XCircle size={14} className="text-red-500 shrink-0" />
        ) : !empty ? (
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
        ) : (
          <MinusCircle size={13} className="text-slate-700 shrink-0" />
        )}
      </div>

      {/* Value */}
      {empty ? (
        <p className="text-xs italic text-slate-600">Not found</p>
      ) : (
        <p
          className={`
            text-sm font-medium leading-snug break-words
            ${isMissing ? 'text-red-300' : 'text-white'}
            ${isFullWidth ? 'text-xs leading-relaxed font-normal text-slate-300' : ''}
            {(fieldKey.includes('damage') || fieldKey.includes('cost')) && !isMissing ? 'text-emerald-300 font-bold text-base' : ''}
          `}
        >
          {formatted}
        </p>
      )}
    </div>
  )
}

/* ─── Main component ───────────────────────────────────────────────────── */

export default function ExtractedFieldsTable({ fields = {}, missingFields = [] }) {
  const missingSet = new Set(missingFields)
  
  // Combine keys from both extracted fields and missing fields
  const allKeys = Array.from(new Set([...Object.keys(fields), ...missingFields]))

  // Sort: missing first, then alphabetical (ignoring 'description' which we handle in CSS full-width)
  const sortedKeys = allKeys.sort((a, b) => {
    const aMissing = missingSet.has(a) ? 0 : 1
    const bMissing = missingSet.has(b) ? 0 : 1
    if (aMissing !== bMissing) return aMissing - bMissing
    
    // Push descriptions to the bottom
    const aDesc = a.includes('description') ? 1 : 0
    const bDesc = b.includes('description') ? 1 : 0
    if (aDesc !== bDesc) return aDesc - bDesc

    return a.localeCompare(b)
  })

  return (
    <div className="space-y-3">
      {/* Grid fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedKeys.map((key) => (
          <FieldCard
            key={key}
            fieldKey={key}
            label={formatLabel(key)}
            value={fields[key]}
            isMissing={missingSet.has(key)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <CheckCircle2 size={11} className="text-emerald-600" /> Extracted
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <XCircle size={11} className="text-red-600" /> Missing (Mandatory)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <MinusCircle size={11} className="text-slate-700" /> Empty
        </span>
      </div>
    </div>
  )
}
