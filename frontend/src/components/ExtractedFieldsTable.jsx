/**
 * ExtractedFieldsTable.jsx
 * -------------------------
 * Renders all extracted claim fields in a clean two-column table.
 * Mandatory fields are marked with a ✓/✗ indicator.
 * Optional absent fields are shown as a muted dash.
 */

import { CheckCircle, XCircle } from 'lucide-react'

const MANDATORY = new Set([
  'claim_number',
  'claimant_name',
  'policy_number',
  'incident_date',
  'incident_description',
  'claim_type',
  'estimated_damage',
])

const FIELD_LABELS = {
  claim_number:          'Claim Number',
  claimant_name:         'Claimant Name',
  policy_number:         'Policy Number',
  incident_date:         'Incident Date',
  incident_description:  'Description',
  claim_type:            'Claim Type',
  estimated_damage:      'Estimated Damage',
  contact_phone:         'Phone',
  contact_email:         'Email',
  witness_info:          'Witness Info',
  police_report_number:  'Police Report #',
  supporting_docs:       'Supporting Docs',
}

function isMissing(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === '' || ['null','none','unknown','n/a'].includes(value.trim().toLowerCase())
  if (Array.isArray(value)) return value.length === 0
  return false
}

function formatValue(key, value) {
  if (isMissing(value)) return null
  if (key === 'estimated_damage') {
    const num = parseFloat(value)
    return isNaN(num) ? String(value) : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function ExtractedFieldsTable({ fields = {}, missingFields = [] }) {
  const missingSet = new Set(missingFields)

  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.03] border-b border-white/5">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-2/5">
              Field
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Value
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
              OK
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(FIELD_LABELS).map(([key, label], i) => {
            const raw      = fields[key]
            const missing  = missingSet.has(key) || isMissing(raw)
            const mandatory = MANDATORY.has(key)
            const formatted = formatValue(key, raw)

            return (
              <tr
                key={key}
                className={`
                  border-b border-white/[0.04] transition-colors
                  ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}
                  hover:bg-white/[0.035]
                `}
              >
                {/* Label */}
                <td className="px-4 py-3 font-medium text-slate-400 whitespace-nowrap">
                  {label}
                  {mandatory && (
                    <span className="ml-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                      req
                    </span>
                  )}
                </td>

                {/* Value */}
                <td className="px-4 py-3 max-w-xs">
                  {formatted ? (
                    <span
                      className={`
                        break-words
                        ${key === 'incident_description'
                          ? 'text-slate-300 text-xs leading-relaxed'
                          : 'text-white font-medium'}
                      `}
                    >
                      {formatted}
                    </span>
                  ) : (
                    <span className="text-slate-600 italic text-xs">—</span>
                  )}
                </td>

                {/* Status icon */}
                <td className="px-4 py-3 text-right">
                  {mandatory ? (
                    missing
                      ? <XCircle size={16} className="text-red-500 inline" />
                      : <CheckCircle size={16} className="text-emerald-500 inline" />
                  ) : (
                    <span className="text-slate-700 text-xs">opt</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
