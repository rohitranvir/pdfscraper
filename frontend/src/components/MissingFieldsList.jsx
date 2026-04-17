/**
 * MissingFieldsList.jsx — Ethereal Analyst design
 * Shows green all-clear or styled missing field list with Material icons.
 * Props: missingFields (string[])
 */

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function MissingFieldsList({ missingFields = [] }) {

  /* ── All clear ── */
  if (missingFields.length === 0) {
    return (
      <div className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/20">
        <span className="material-symbols-outlined text-2xl text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
        <div>
          <p className="font-semibold text-emerald-300 text-sm">All fields verified</p>
          <p className="text-xs text-emerald-600 mt-0.5">Every required field was successfully extracted from the document.</p>
        </div>
      </div>
    )
  }

  /* ── Missing fields ── */
  return (
    <div className="rounded-2xl bg-surface-container-low border border-white/5 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-2xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
          warning
        </span>
        <p className="font-semibold text-error text-sm">
          {missingFields.length} mandatory field{missingFields.length > 1 ? 's' : ''} missing — routed to Manual Review
        </p>
      </div>

      {/* Field list */}
      <ul className="space-y-2">
        {missingFields.map((field) => (
          <li key={field} className="flex items-start gap-3">
            <span className="material-symbols-outlined text-lg text-error/80 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <div>
              <span className="text-sm font-semibold text-on-surface">{formatLabel(field)}</span>
              <span className="text-xs text-on-surface-variant ml-2">— Required field not found in document</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
