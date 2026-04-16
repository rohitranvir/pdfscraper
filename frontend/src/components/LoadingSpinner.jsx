/**
 * LoadingSpinner.jsx
 * ------------------
 * Full-width centered spinner with AI processing message and
 * shimmer skeleton cards that preview the incoming results layout.
 */

/* ── Shimmer skeleton card ──────────────────────────────────────────────── */
function SkeletonCard({ height = 'h-24', wide = false }) {
  return (
    <div
      className={`
        rounded-2xl border border-white/5 overflow-hidden
        ${wide ? 'col-span-full' : ''}
        ${height}
      `}
    >
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s infinite',
        }}
      />
    </div>
  )
}

function SkeletonPill({ width = 'w-24' }) {
  return (
    <div
      className={`h-7 ${width} rounded-full`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s infinite',
      }}
    />
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function LoadingSpinner() {
  return (
    <div className="relative w-full animate-fade-in">

      {/* ── Skeleton background preview ─────────────────────────────────── */}
      <div className="space-y-4 opacity-40 pointer-events-none select-none">

        {/* Routing hero placeholder */}
        <SkeletonCard height="h-40" wide />

        {/* Missing fields placeholder */}
        <SkeletonCard height="h-16" wide />

        {/* Field grid placeholder */}
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" wide />
        </div>

        {/* Pill placeholders (simulates missing field badges) */}
        <div className="flex gap-2 flex-wrap">
          <SkeletonPill width="w-32" />
          <SkeletonPill width="w-24" />
          <SkeletonPill width="w-28" />
        </div>
      </div>

      {/* ── Spinner overlay — absolutely centered ───────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">

        {/* Glass backdrop */}
        <div className="
          flex flex-col items-center gap-5 px-10 py-8 rounded-3xl
          bg-slate-900/80 backdrop-blur-xl
          border border-white/10 shadow-2xl
        ">

          {/* Animated ring */}
          <div className="relative w-14 h-14">
            <svg className="animate-spin w-14 h-14" viewBox="0 0 56 56" fill="none">
              {/* Track */}
              <circle cx="28" cy="28" r="24" stroke="rgba(59,130,246,0.12)" strokeWidth="5" />
              {/* Active arc */}
              <path
                d="M28 4 A24 24 0 0 1 52 28"
                stroke="url(#spinGrad)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Centre glow dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="font-semibold text-white text-base">
              Processing claim with AI…
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Groq LLaMA 3.3-70b is extracting fields — this takes 10–20 s
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {['Parsing PDF', 'Extracting Fields', 'Routing'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                    style={{ animationDelay: `${i * 0.35}s` }}
                  />
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">{step}</span>
                </div>
                {i < 2 && <div className="w-4 h-px bg-white/10" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
