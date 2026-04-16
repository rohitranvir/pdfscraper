/**
 * StatusBadge.jsx
 * ---------------
 * Color-coded pill badge that visualises the recommended route.
 *
 * Route → color mapping
 * ---------------------
 * Fast-track         → emerald
 * Manual Review      → amber
 * Specialist Queue   → blue
 * Investigation Flag → red
 * Standard Review    → violet
 */

const ROUTE_CONFIG = {
  'Fast-track': {
    bg:   'bg-emerald-900/40',
    text: 'text-emerald-300',
    ring: 'ring-emerald-500/40',
    dot:  'bg-emerald-400',
    label: 'Fast-track',
  },
  'Manual Review': {
    bg:   'bg-amber-900/40',
    text: 'text-amber-300',
    ring: 'ring-amber-500/40',
    dot:  'bg-amber-400',
    label: 'Manual Review',
  },
  'Specialist Queue': {
    bg:   'bg-blue-900/40',
    text: 'text-blue-300',
    ring: 'ring-blue-500/40',
    dot:  'bg-blue-400',
    label: 'Specialist Queue',
  },
  'Investigation Flag': {
    bg:   'bg-red-900/40',
    text: 'text-red-300',
    ring: 'ring-red-500/40',
    dot:  'bg-red-400',
    label: 'Investigation Flag',
  },
  'Standard Review': {
    bg:   'bg-violet-900/40',
    text: 'text-violet-300',
    ring: 'ring-violet-500/40',
    dot:  'bg-violet-400',
    label: 'Standard Review',
  },
}

const DEFAULT_CONFIG = {
  bg:   'bg-slate-800/50',
  text: 'text-slate-300',
  ring: 'ring-slate-500/30',
  dot:  'bg-slate-400',
  label: 'Unknown',
}

/**
 * @param {{ route: string, size?: 'sm'|'md'|'lg', pulse?: boolean }} props
 */
export default function StatusBadge({ route, size = 'md', pulse = false }) {
  const config = ROUTE_CONFIG[route] ?? DEFAULT_CONFIG

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3.5 py-1   gap-2',
    lg: 'text-base px-4  py-1.5 gap-2.5',
  }[size]

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full ring-1
        ${config.bg} ${config.text} ${config.ring} ${sizeClasses}
      `}
    >
      <span className="relative flex items-center">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {pulse && (
          <span
            className={`absolute inset-0 w-2 h-2 rounded-full ${config.dot} animate-ping opacity-60`}
          />
        )}
      </span>
      {config.label}
    </span>
  )
}
