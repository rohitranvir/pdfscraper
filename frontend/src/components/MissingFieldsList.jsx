/**
 * MissingFieldsList.jsx
 * ----------------------
 * Renders an alert-style block listing each missing mandatory field as a
 * red pill badge.  Shows a success message when all fields are present.
 */

import { AlertTriangle, CheckCircle } from 'lucide-react'

const FIELD_LABELS = {
  claim_number:         'Claim Number',
  claimant_name:        'Claimant Name',
  policy_number:        'Policy Number',
  incident_date:        'Incident Date',
  incident_description: 'Description',
  claim_type:           'Claim Type',
  estimated_damage:     'Estimated Damage',
}

/**
 * @param {{ missingFields: string[] }} props
 */
export default function MissingFieldsList({ missingFields = [] }) {
  if (missingFields.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-900/20 border border-emerald-500/20">
        <CheckCircle size={18} className="text-emerald-400 shrink-0" />
        <p className="text-sm font-medium text-emerald-300">
          All mandatory fields were successfully extracted.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-red-900/15 border border-red-500/20 p-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-red-300">
          {missingFields.length} mandatory field{missingFields.length > 1 ? 's' : ''} could not be extracted:
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {missingFields.map((field) => (
          <span
            key={field}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full
                       bg-red-900/40 text-red-300 ring-1 ring-red-500/30"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {FIELD_LABELS[field] ?? field}
          </span>
        ))}
      </div>
    </div>
  )
}
