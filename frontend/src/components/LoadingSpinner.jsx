/**
 * LoadingSpinner.jsx
 * ------------------
 * Reusable animated spinner with optional label text.
 */

/**
 * @param {{ label?: string, size?: number }} props
 */
export default function LoadingSpinner({ label = 'Processing…', size = 40 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 animate-fade-in">
      {/* Outer ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="animate-spin"
          style={{ width: size, height: size }}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track */}
          <circle
            cx="20" cy="20" r="17"
            stroke="rgba(59,130,246,0.15)"
            strokeWidth="4"
          />
          {/* Spinner arc */}
          <path
            d="M20 3 A17 17 0 0 1 37 20"
            stroke="url(#spinGrad)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner glow dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      </div>

      {label && (
        <p className="text-sm font-medium text-slate-400 tracking-wide">
          {label}
        </p>
      )}
    </div>
  )
}
