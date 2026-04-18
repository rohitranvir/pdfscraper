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
 * Run the full pipeline using a built-in sample FNOL document.
 * @param {string} scenario - The scenario id (fast_track, specialist, investigation, manual_review)
 * @returns {Promise<ClaimResponse>}
 */
export async function testClaim(scenario = 'fast_track') {
  const { data } = await api.post(`/api/claims/test?scenario=${scenario}`)
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

/**
 * POST /api/claims/dispatch
 * Submit a claim for fast-track or standard dispatch.
 * @param {string} claimId 
 * @param {string} route 
 * @param {object} extractedFields 
 */
export async function dispatchClaim(claimId, route, extractedFields) {
  try {
    const { data } = await api.post('/api/claims/dispatch', {
      claim_id: String(claimId),
      route,
      extractedFields,
    })
    return data
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/claims/manual-override
 * Flag a claim for manual review.
 * @param {string} claimId 
 * @param {string} reason 
 */
export async function manualOverride(claimId, reason) {
  try {
    const { data } = await api.post('/api/claims/manual-override', {
      claim_id: String(claimId),
      reason,
    })
    return data
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/claims/discard
 * Discard an unprocessed claim analysis.
 * @param {string} claimId 
 */
export async function discardClaim(claimId) {
  try {
    const { data } = await api.post('/api/claims/discard', {
      claim_id: String(claimId),
    })
    return data
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/analytics
 * Fetch global analytics metrics and recent claims.
 */
export async function getAnalytics() {
  try {
    const { data } = await api.get('/api/analytics')
    return data
  } catch (error) {
    throw error
  }
}

export default api
