/**
 * StatusBadge.jsx
 * ---------------
 * Large, icon-annotated route badge with pulse animation for Investigation Flag.
 *
 * Props
 * -----
 * route  : string  — one of the five routing constants
 * large  : bool    — render in hero/large size (default true)
 */

import { ShieldAlert, Zap, ClipboardList, UserCog, CheckCircle2 } from 'lucide-react'

const CONFIG = {
  'Fast-track': {
    icon:       Zap,
    bg:         'bg-emerald-900/50',
    border:     'border-emerald-500/40',
    text:       'text-emerald-300',
    dot:        'bg-emerald-400',
    iconColor:  'text-emerald-400',
    ringColor:  'ring-emerald-500/30',
    glow:       'shadow-emerald-900/60',
    pulse:      false,
  },
  'Investigation Flag': {
    icon:       ShieldAlert,
    bg:         'bg-red-900/50',
    border:     'border-red-500/40',
    text:       'text-red-300',
    dot:        'bg-red-400',
    iconColor:  'text-red-400',
    ringColor:  'ring-red-500/30',
    glow:       'shadow-red-900/60',
    pulse:      true,   // ← unique pulse for fraud/investigation
  },
  'Manual Review': {
    icon:       ClipboardList,
    bg:         'bg-amber-900/50',
    border:     'border-amber-500/40',
    text:       'text-amber-300',
    dot:        'bg-amber-400',
    iconColor:  'text-amber-400',
    ringColor:  'ring-amber-500/30',
    glow:       'shadow-amber-900/60',
    pulse:      false,
  },
  'Specialist Queue': {
    icon:       UserCog,
    bg:         'bg-blue-900/50',
    border:     'border-blue-500/40',
    text:       'text-blue-300',
    dot:        'bg-blue-400',
    iconColor:  'text-blue-400',
    ringColor:  'ring-blue-500/30',
    glow:       'shadow-blue-900/60',
    pulse:      false,
  },
  'Standard Review': {
    icon:       CheckCircle2,
    bg:         'bg-slate-800/60',
    border:     'border-slate-500/30',
    text:       'text-slate-300',
    dot:        'bg-slate-400',
    iconColor:  'text-slate-400',
    ringColor:  'ring-slate-500/20',
    glow:       'shadow-slate-900/60',
    pulse:      false,
  },
}

const FALLBACK = CONFIG['Standard Review']

export default function StatusBadge({ route, large = true }) {
  const cfg = CONFIG[route] ?? FALLBACK
  const Icon = cfg.icon

  /* ── Small pill variant (used in table rows) ──────────────────────── */
  if (!large) {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5
          text-xs font-semibold px-2.5 py-0.5 rounded-full
          ring-1 ${cfg.bg} ${cfg.text} ${cfg.ringColor}
        `}
      >
        <span className="relative flex items-center">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.pulse && (
            <span className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${cfg.dot} animate-ping opacity-70`} />
          )}
        </span>
        {route}
      </span>
    )
  }

  /* ── Large hero variant ─────────────────────────────────────────────── */
  return (
    <div
      className={`
        relative inline-flex flex-col items-center gap-3 w-full
        rounded-2xl border px-6 py-8
        shadow-xl ${cfg.bg} ${cfg.border} ${cfg.glow}
        ring-1 ${cfg.ringColor}
        transition-all duration-300
      `}
    >
      {/* Pulse ring for Investigation Flag */}
      {cfg.pulse && (
        <span
          className={`
            absolute inset-0 rounded-2xl
            ring-2 ring-red-500/40 animate-ping opacity-30
            pointer-events-none
          `}
        />
      )}

      {/* Icon circle */}
      <div
        className={`
          relative w-16 h-16 rounded-2xl flex items-center justify-center
          ${cfg.bg} border ${cfg.border}
          shadow-inner
        `}
      >
        <Icon size={30} className={cfg.iconColor} strokeWidth={1.75} />
        {cfg.pulse && (
          <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${cfg.dot} border-2 border-slate-900 animate-pulse`} />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1">
          Recommended Route
        </p>
        <p className={`text-2xl font-bold tracking-tight ${cfg.text}`}>
          {route}
        </p>
      </div>
    </div>
  )
}
