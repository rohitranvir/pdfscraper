/**
 * DropZone.jsx — Ethereal Analyst design
 * Drag-and-drop PDF upload zone.
 * Props: onFileSelect, disabled
 */

import { useRef, useState, useCallback } from 'react'

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
  const [selected,  setSelected]  = useState(null)
  const [error,     setError]     = useState('')

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

  const onDragOver  = (e) => { e.preventDefault(); if (!disabled) setDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    acceptFile(e.dataTransfer.files?.[0])
  }

  const onInputChange = (e) => {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  const clear = (e) => {
    e.stopPropagation()
    setSelected(null)
    setError('')
    onFileSelect(null)
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div>
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

      {selected ? (
        <div className={`relative rounded-3xl border-2 border-emerald-400/60 bg-emerald-900/10 px-5 py-4 flex items-center gap-4 transition-all duration-300 ${disabled ? 'opacity-60' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">description</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface text-sm truncate" title={selected.name}>{selected.name}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{formatBytes(selected.size)} · PDF document</p>
          </div>
          {!disabled && (
            <button onClick={clear} aria-label="Remove selected file" className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all shrink-0">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>
        </div>
      ) : (
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
              group relative dashed-gradient-border
              h-80 flex flex-col items-center justify-center gap-5
              cursor-pointer select-none
              transition-all duration-300 outline-none
              ${dragging ? 'bg-primary/5 scale-[1.01]' : 'hover:bg-primary/[0.02]'}
              ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
            `}
          >
            {/* background glow blob */}
            <div className="absolute -z-10 w-48 h-48 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />

            {/* Upload icon */}
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center
              bg-primary/10 transition-all duration-500
              ${dragging ? 'bg-primary/20 scale-110' : 'group-hover:scale-110 group-hover:bg-primary/15'}
            `}>
              <span
                className={`material-symbols-outlined text-5xl transition-colors duration-300 ${dragging ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
              >
                upload_file
              </span>
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <p className={`font-semibold text-xl transition-colors ${dragging ? 'text-primary' : 'text-on-surface'}`}>
                {dragging ? 'Release to upload' : 'Drag documents here'}
              </p>
              <p className="text-sm text-on-surface-variant">
                PDF, JPG or PNG (Max 50MB)
              </p>
              {!dragging && (
                <p className="text-xs text-on-surface-variant/50 pt-1">
                  or <span className="text-primary underline underline-offset-2">click to browse</span>
                </p>
              )}
            </div>

            {/* Drag-over ripple overlay */}
            {dragging && (
              <div className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-primary/30 animate-pulse" />
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2.5 flex items-start gap-2 text-sm text-error">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
