/**
 * LoadingSpinner.jsx — Ethereal Analyst design
 * Dual-ring primary spinner with shimmer placeholder cards behind it.
 */

function SkeletonCard({ height = 'h-24', wide = false }) {
  return (
    <div className={`rounded-2xl border border-white/5 overflow-hidden ${wide ? 'col-span-full' : ''} ${height}`}>
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(90deg, rgba(189,157,255,0.03) 25%, rgba(189,157,255,0.08) 50%, rgba(189,157,255,0.03) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s infinite',
        }}
      />
    </div>
  )
}

export default function LoadingSpinner() {
  return (
    <div className="relative w-full min-h-[400px] animate-fade-in">

      {/* Skeleton background preview */}
      <div className="space-y-4 opacity-30 pointer-events-none select-none">
        <SkeletonCard height="h-44" wide />
        <SkeletonCard height="h-16" wide />
        <div className="grid grid-cols-3 gap-3">
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" wide />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="h-7 w-32 rounded-full" style={{ background: 'rgba(189,157,255,0.06)' }} />
          <div className="h-7 w-24 rounded-full" style={{ background: 'rgba(189,157,255,0.06)' }} />
          <div className="h-7 w-28 rounded-full" style={{ background: 'rgba(189,157,255,0.06)' }} />
        </div>
      </div>

      {/* Spinner overlay — absolutely centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-5 px-10 py-8 rounded-3xl bg-surface-container/90 backdrop-blur-xl border border-white/10 shadow-2xl glow-shadow-primary">

          {/* Dual ring spinner */}
          <div className="relative w-16 h-16">
            {/* Outer static ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            {/* Centre pulse dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="font-semibold text-on-surface text-base font-jakarta">Processing with AI...</p>
            <p className="text-xs text-on-surface-variant mt-1.5">Groq LLaMA 3.3-70b is extracting fields — 10–20s</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {['Parsing PDF', 'Extracting Fields', 'Routing'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.35}s` }}
                  />
                  <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{step}</span>
                </div>
                {i < 2 && <div className="w-4 h-px bg-outline-variant" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
