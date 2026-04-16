/**
 * ExtractedFieldsTable.jsx
 * -------------------------
 * Two-column responsive grid of extracted insurance claim fields.
 *
 * Props
 * -----
 * fields        : object    — full extraction dict from the API
 * missingFields : string[]  — keys of missing mandatory fields (highlighted red)
 */

import { XCircle, CheckCircle2, MinusCircle } from 'lucide-react'

const MANDATORY = new Set([
  'claim_number',
  'claimant_name',
  'policy_number',
  'incident_date',
  'incident_description',
  'claim_type',
  'estimated_damage',
])

const FIELD_META = [
  { key: 'claim_number',         label: 'Claim Number' },
  { key: 'claimant_name',        label: 'Claimant Name' },
  { key: 'policy_number',        label: 'Policy Number' },
  { key: 'incident_date',        label: 'Incident Date' },
  { key: 'claim_type',           label: 'Claim Type' },
  { key: 'estimated_damage',     label: 'Estimated Damage' },
  { key: 'incident_description', label: 'Description' },
  { key: 'contact_phone',        label: 'Phone' },
  { key: 'contact_email',        label: 'Email' },
  { key: 'police_report_number', label: 'Police Report #' },
  { key: 'witness_info',         label: 'Witness Info' },
  { key: 'supporting_docs',      label: 'Supporting Docs' },
]

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

function formatValue(key, value) {
  if (isEmpty(value)) return null

  // Currency for damage
  if (key === 'estimated_damage') {
    const n = parseFloat(String(value).replace(/[,$€£¥]/g, ''))
    if (!isNaN(n)) {
      return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
    }
  }

  // Array → comma list
  if (Array.isArray(value)) return value.join(', ')

  // Capitalize claim type
  if (key === 'claim_type') {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1)
  }

  return String(value)
}

/* ─── Single field card ────────────────────────────────────────────────── */

function FieldCard({ label, fieldKey, value, isMissing, isMandatory }) {
  const formatted = formatValue(fieldKey, value)
  const empty     = formatted === null

  const containerClass = isMissing
    ? 'bg-red-950/30 border-red-500/25 ring-1 ring-red-500/10'
    : 'bg-white/[0.025] border-white/[0.06]'

  return (
    <div className={`rounded-xl border px-4 py-3.5 flex flex-col gap-1 transition-colors ${containerClass}`}>
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {label}
          {isMandatory && (
            <span className={`ml-1.5 ${isMissing ? 'text-red-600' : 'text-slate-700'}`}>*</span>
          )}
        </span>

        {/* Status icon — only for mandatory fields */}
        {isMandatory && (
          isMissing
            ? <XCircle size={14} className="text-red-500 shrink-0" />
            : <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
        )}
        {!isMandatory && empty && (
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
            ${fieldKey === 'incident_description' ? 'text-xs leading-relaxed font-normal text-slate-300' : ''}
            ${fieldKey === 'estimated_damage' && !isMissing ? 'text-emerald-300 font-bold text-base' : ''}
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

  // Put missing fields first, then mandatory, then optional
  const sorted = [...FIELD_META].sort((a, b) => {
    const aMissing = missingSet.has(a.key) ? 0 : 1
    const bMissing = missingSet.has(b.key) ? 0 : 1
    if (aMissing !== bMissing) return aMissing - bMissing
    const aMand = MANDATORY.has(a.key) ? 0 : 1
    const bMand = MANDATORY.has(b.key) ? 0 : 1
    return aMand - bMand
  })

  // Description spans full width — pull it out
  const descIndex  = sorted.findIndex(f => f.key === 'incident_description')
  const descItem   = descIndex > -1 ? sorted.splice(descIndex, 1)[0] : null

  return (
    <div className="space-y-3">
      {/* Grid fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(({ key, label }) => (
          <FieldCard
            key={key}
            fieldKey={key}
            label={label}
            value={fields[key]}
            isMissing={missingSet.has(key)}
            isMandatory={MANDATORY.has(key)}
          />
        ))}
      </div>

      {/* Description — full width */}
      {descItem && (
        <FieldCard
          key="incident_description"
          fieldKey="incident_description"
          label={descItem.label}
          value={fields['incident_description']}
          isMissing={missingSet.has('incident_description')}
          isMandatory={true}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <CheckCircle2 size={11} className="text-emerald-600" /> Mandatory extracted
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <XCircle size={11} className="text-red-600" /> Mandatory missing
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <MinusCircle size={11} className="text-slate-700" /> Optional absent
        </span>
      </div>
    </div>
  )
}
