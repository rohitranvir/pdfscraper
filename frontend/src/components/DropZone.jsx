/**
 * DropZone.jsx
 * ------------
 * Drag-and-drop PDF upload zone with three visual states:
 *   idle        — neutral dashed border, upload icon
 *   drag-over   — blue glow border, scale up
 *   selected    — green border, filename + size + remove button
 *
 * Props
 * -----
 * onFileSelect : (file: File) => void   — called when a valid PDF is chosen
 * disabled     : bool                   — lock the zone during processing
 */

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'

const ACCEPTED_TYPES = new Set(['application/pdf'])

function isValidPdf(file) {
  return (
    ACCEPTED_TYPES.has(file?.type) ||
    file?.name?.toLowerCase().endsWith('.pdf')
  )
}

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function DropZone({ onFileSelect, disabled = false }) {
  const inputRef = useRef(null)
  const [dragging,  setDragging]  = useState(false)
  const [selected,  setSelected]  = useState(null)   // File | null
  const [error,     setError]     = useState('')

  /* ── File acceptance logic ─────────────────────────────────────────── */
  const acceptFile = useCallback((file) => {
    if (!file) return
    if (!isValidPdf(file)) {
      setError(`"${file.name}" is not a PDF. Only .pdf files are accepted.`)
      return
    }
    setError('')
    setSelected(file)
    onFileSelect(file)
  }, [onFileSelect])

  /* ── Drag handlers ─────────────────────────────────────────────────── */
  const onDragOver  = (e) => { e.preventDefault(); if (!disabled) setDragging(true)  }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    acceptFile(e.dataTransfer.files?.[0])
  }

  /* ── Input change handler ──────────────────────────────────────────── */
  const onInputChange = (e) => {
    acceptFile(e.target.files?.[0])
    e.target.value = ''   // allow re-selecting same file
  }

  /* ── Clear ──────────────────────────────────────────────────────────── */
  const clear = (e) => {
    e.stopPropagation()
    setSelected(null)
    setError('')
    onFileSelect(null)
  }

  /* ── Click to open picker ──────────────────────────────────────────── */
  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SELECTED STATE — green border, filename + size + remove
  ═══════════════════════════════════════════════════════════════════════ */
  if (selected) {
    return (
      <div
        className={`
          relative rounded-2xl border-2 border-emerald-500/50
          bg-emerald-900/10 px-5 py-4
          flex items-center gap-4
          transition-all duration-200
          ${disabled ? 'opacity-60' : ''}
        `}
      >
        {/* PDF icon */}
        <div className="w-12 h-12 rounded-xl bg-emerald-900/40 border border-emerald-500/30
                        flex items-center justify-center shrink-0">
          <FileText size={22} className="text-emerald-400" />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate" title={selected.name}>
            {selected.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatBytes(selected.size)} &bull; PDF document
          </p>
        </div>

        {/* Remove button */}
        {!disabled && (
          <button
            onClick={clear}
            aria-label="Remove selected file"
            className="p-2 rounded-lg text-slate-500 hover:text-red-400
                       hover:bg-red-900/20 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        )}

        {/* Top-right confirmed badge */}
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px]
                         font-bold text-emerald-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Ready
        </span>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════════════
     IDLE / DRAG-OVER STATE
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drop PDF here or click to browse"
        onClick={openPicker}
        onKeyDown={(e) => e.key === 'Enter' && openPicker()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center gap-4
          px-8 py-12 cursor-pointer select-none
          transition-all duration-200 outline-none
          focus-visible:ring-2 focus-visible:ring-accent

          ${dragging
            ? 'border-blue-400/70 bg-blue-900/15 scale-[1.015] shadow-glow'
            : 'border-white/10 hover:border-accent/40 hover:bg-white/[0.02]'}
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
        style={dragging ? { boxShadow: '0 0 0 4px rgba(59,130,246,0.18), 0 0 32px rgba(59,130,246,0.15)' } : {}}
      >
        {/* Upload icon */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center
          transition-all duration-200
          ${dragging ? 'bg-blue-900/40 scale-110' : 'bg-white/5'}
        `}>
          <UploadCloud
            size={30}
            className={`transition-colors duration-200 ${dragging ? 'text-blue-400' : 'text-slate-600'}`}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <p className={`font-semibold text-base transition-colors ${dragging ? 'text-blue-300' : 'text-slate-300'}`}>
            {dragging ? 'Release to upload' : 'Drag & drop your PDF here'}
          </p>
          <p className="text-sm text-slate-500">
            or{' '}
            <span className="text-accent-light underline underline-offset-2">
              click to browse
            </span>
          </p>
          <p className="text-xs text-slate-700 pt-1">
            FNOL &bull; Insurance Claims &bull; Policy Documents
          </p>
        </div>

        {/* Drag-over overlay ripple */}
        {dragging && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none
                          border-2 border-blue-400/30 animate-pulse" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2.5 flex items-start gap-2 text-sm text-red-400">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  )
}
