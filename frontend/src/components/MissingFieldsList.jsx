/**
 * MissingFieldsList.jsx
 * ----------------------
 * Shows a green all-clear when no fields are missing, or a red warning
 * block with individual field pills when some are missing.
 *
 * Props
 * -----
 * missingFields : string[]  — names of missing mandatory fields
 */

import { CheckCircle2, AlertTriangle } from 'lucide-react'

const LABELS = {
  claim_number:          'Claim Number',
  claimant_name:         'Claimant Name',
  policy_number:         'Policy Number',
  incident_date:         'Incident Date',
  incident_description:  'Incident Description',
  claim_type:            'Claim Type',
  estimated_damage:      'Estimated Damage',
}

export default function MissingFieldsList({ missingFields = [] }) {

  /* ── All clear ──────────────────────────────────────────────────────── */
  if (missingFields.length === 0) {
    return (
      <div className="flex items-center gap-3.5 px-5 py-4 rounded-xl
                      bg-emerald-900/25 border border-emerald-500/25">
        <div className="w-9 h-9 rounded-xl bg-emerald-900/50 border border-emerald-500/30
                        flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-300 text-sm">
            All mandatory fields present
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Every required field was successfully extracted from the document.
          </p>
        </div>
      </div>
    )
  }

  /* ── Missing fields ─────────────────────────────────────────────────── */
  return (
    <div className="rounded-xl bg-red-950/30 border border-red-500/25 p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-900/50 border border-red-500/30
                        flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-red-300 text-sm">
            {missingFields.length} mandatory field{missingFields.length > 1 ? 's' : ''} missing
          </p>
          <p className="text-xs text-red-500/80 mt-0.5">
            This claim has been routed to Manual Review until these fields are supplied.
          </p>
        </div>
      </div>

      {/* Pill list */}
      <div className="flex flex-wrap gap-2">
        {missingFields.map((field) => (
          <span
            key={field}
            className="
              inline-flex items-center gap-1.5
              text-xs font-semibold px-3 py-1.5 rounded-full
              bg-red-900/40 text-red-300
              ring-1 ring-red-500/30
            "
          >
            {/* Pulsing dot */}
            <span className="relative flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping opacity-60" />
            </span>
            {LABELS[field] ?? field}
          </span>
        ))}
      </div>
    </div>
  )
}
