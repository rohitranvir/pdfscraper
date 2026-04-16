import axios from 'axios'

// Base URL — falls back to Vite proxy (/api) in dev when env var is absent
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // 60 s — LLM calls can be slow on first request
  headers: { Accept: 'application/json' },
})

// ─── Response interceptor: normalise errors ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail =
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred.'
    return Promise.reject(new Error(detail))
  },
)

// ─── API functions ─────────────────────────────────────────────────────────

/**
 * POST /api/claims/process
 * Send a PDF file for full extraction → validation → routing.
 * @param {FormData} formData - Must contain a "file" field with the PDF blob.
 * @returns {Promise<ClaimResponse>}
 */
export async function processClaim(formData) {
  const { data } = await api.post('/api/claims/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * POST /api/claims/test
 * Run the full pipeline on the hardcoded FNOL sample (no file needed).
 * @returns {Promise<ClaimResponse>}
 */
export async function testClaim() {
  const { data } = await api.post('/api/claims/test')
  return data
}

/**
 * GET /api/claims/history
 * Fetch the last 20 processed claims from SQLite.
 * @returns {Promise<HistoryRecord[]>}
 */
export async function getHistory() {
  const { data } = await api.get('/api/claims/history')
  return data
}

export default api
