/**
 * ExtractedFieldsTable.jsx — Ethereal Analyst design
 * Dynamically renders whatever keys are in extractedFields dict.
 * Props: fields (dict from API response)
 */

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(val) {
  if (val === null || val === undefined || val === '') return '—'
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  return String(val)
}

function isCurrencyField(key) {
  return ['estimated_damage', 'estimated_cost', 'claimed_damages', 'estimated_repair_cost'].includes(key)
}

function formatCurrency(val) {
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return val
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}

export default function ExtractedFieldsTable({ fields }) {
  if (!fields || Object.keys(fields).length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-on-surface-variant text-sm">
        No fields were extracted.
      </div>
    )
  }

  const entries = Object.entries(fields)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {entries.map(([key, val]) => {
        const isMoney = isCurrencyField(key)
        const displayValue = isMoney ? formatCurrency(val) : formatValue(val)

        return (
          <div
            key={key}
            className="glass-panel rounded-2xl p-4 flex flex-col gap-1.5 transition-all duration-200 hover:bg-white/[0.04]"
          >
            <p className="text-xs uppercase tracking-widest font-medium text-on-surface-variant">
              {formatLabel(key)}
            </p>
            <p className={`text-base font-semibold leading-snug break-words ${isMoney ? 'text-primary' : 'text-on-surface'}`}>
              {displayValue}
            </p>
          </div>
        )
      })}
    </div>
  )
}
