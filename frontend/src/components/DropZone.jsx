/**
 * DropZone.jsx
 * ------------
 * Drag-and-drop PDF upload zone.
 *
 * - Accepts drag-over / drag-leave / drop events
 * - Falls back to a click-to-browse file input
 * - Validates PDF MIME type on drop
 * - Shows selected file info with a remove button
 */

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'

/**
 * @param {{
 *   onFileSelect: (file: File) => void,
 *   selectedFile: File | null,
 *   onClear: () => void,
 *   disabled?: boolean
 * }} props
 */
export default function DropZone({ onFileSelect, selectedFile, onClear, disabled = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState('')

  const validate = useCallback((file) => {
    if (!file) return false
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.')
      return false
    }
    setError('')
    return true
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file && validate(file)) onFileSelect(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file && validate(file)) onFileSelect(file)
    e.target.value = ''
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setError('')
    onClear()
  }

  /* ── Selected state ───────────────────────────────────────────────────── */
  if (selectedFile) {
    return (
      <div className="glass-card glass-card--glow p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center shrink-0">
          <FileText size={22} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{selectedFile.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {(selectedFile.size / 1024).toFixed(1)} KB &bull; PDF
          </p>
        </div>
        {!disabled && (
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
            aria-label="Remove file"
          >
            <X size={18} />
          </button>
        )}
      </div>
    )
  }

  /* ── Drop zone ────────────────────────────────────────────────────────── */
  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload PDF file"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer select-none
          rounded-2xl border-2 border-dashed px-8 py-14
          flex flex-col items-center justify-center gap-4
          transition-all duration-200
          ${dragging
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-white/10 hover:border-accent/40 hover:bg-white/[0.02]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Icon */}
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            transition-colors duration-200
            ${dragging ? 'bg-accent/20' : 'bg-white/5'}
          `}
        >
          <UploadCloud
            size={30}
            className={`transition-colors ${dragging ? 'text-accent' : 'text-slate-500'}`}
          />
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="font-semibold text-white text-base">
            {dragging ? 'Drop your PDF here' : 'Drag & drop your PDF'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            or{' '}
            <span className="text-accent-light underline underline-offset-2 cursor-pointer">
              click to browse
            </span>
          </p>
          <p className="text-xs text-slate-600 mt-2">FNOL · Insurance forms · Claims documents</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
