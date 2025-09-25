/**
 * Centralized API Configuration for LabSalud Frontend
 * Based on Django REST Framework backend documentation
 */

// Base configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://192.168.1.8:8000",
  API_VERSION: "v1",
  TIMEOUT: 30000,
} as const

export const UI_CONFIG = {
  TOAST_DURATION: 4000, // 4 seconds
} as const

export const TOAST_DURATION = UI_CONFIG.TOAST_DURATION

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "") // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  return `${baseUrl}/api/${API_CONFIG.API_VERSION}${cleanEndpoint}`
}

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  TOKEN: buildApiUrl("/users/token/"),
  TOKEN_REFRESH: buildApiUrl("/users/token/refresh/"),
  TOKEN_VERIFY: buildApiUrl("/users/token/verify/"),
  ME: buildApiUrl("/users/me/"),
  PASSWORD_RESET: buildApiUrl("/users/password-reset/"),
} as const

// User management endpoints
export const USER_ENDPOINTS = {
  USERS: buildApiUrl("/users/users/"),
  USER_DETAIL: (id: number) => buildApiUrl(`/users/users/${id}/`),
  USER_ASSIGN_ROLE: (id: number) => buildApiUrl(`/users/users/${id}/assign-role/`),
  USER_REMOVE_ROLE: (id: number) => buildApiUrl(`/users/users/${id}/remove-role/`),
  USER_ASSIGN_TEMP_PERMISSION: (id: number) => buildApiUrl(`/users/users/${id}/assign-temp-permission/`),
  USER_MISSING_PERMISSIONS: (id: number) => buildApiUrl(`/users/users/${id}/missing-permissions/`),
  ROLES: buildApiUrl("/users/roles/"),
  ROLE_DETAIL: (id: number) => buildApiUrl(`/users/roles/${id}/`),
  PERMISSIONS: buildApiUrl("/users/permissions/"),
  PERMISSION_DETAIL: (id: number) => buildApiUrl(`/users/permissions/${id}/`),
} as const

// Patient management endpoints
export const PATIENT_ENDPOINTS = {
  PATIENTS: buildApiUrl("/patients/"),
  PATIENT_DETAIL: (id: number) => buildApiUrl(`/patients/${id}/`),
  ACTIVE_PATIENTS: buildApiUrl("/patients/active/"),
  PATIENT_HISTORY: (id: number) => buildApiUrl(`/patients/${id}/history/`),
} as const

// Laboratory analysis endpoints
export const ANALYSIS_ENDPOINTS = {
  // Panels
  PANELS: buildApiUrl("/analysis/panels/"),
  PANEL_DETAIL: (id: number) => buildApiUrl(`/analysis/panels/${id}/`),
  PANEL_ANALYSES: (id: number) => buildApiUrl(`/analysis/panels/${id}/analyses/`),

  // Analyses
  ANALYSES: buildApiUrl("/analysis/analyses/"),
  ANALYSIS_DETAIL: (id: number) => buildApiUrl(`/analysis/analyses/${id}/`),

  // Doctors
  MEDICOS: buildApiUrl("/analysis/medicos/"),
  MEDICO_DETAIL: (id: number) => buildApiUrl(`/analysis/medicos/${id}/`),
  MEDICOS_ACTIVE: buildApiUrl("/analysis/medicos/active/"),

  // Insurance (OOSS)
  OOSS: buildApiUrl("/analysis/ooss/"),
  OOSS_DETAIL: (id: number) => buildApiUrl(`/analysis/ooss/${id}/`),
  OOSS_ACTIVE: buildApiUrl("/analysis/ooss/?is_active=true"),

  // Protocols
  PROTOCOLS: buildApiUrl("/analysis/protocols/"),
  PROTOCOL_DETAIL: (id: number) => buildApiUrl(`/analysis/protocols/${id}/`),
  PROTOCOL_HISTORY: (id: number) => buildApiUrl(`/analysis/protocols/${id}/history/`),

  // Protocol Analyses
  PROTOCOL_ANALYSES: buildApiUrl("/analysis/protocol-analyses/"),
  PROTOCOL_ANALYSIS_DETAIL: (id: number) => buildApiUrl(`/analysis/protocol-analyses/${id}/`),

  // Results
  RESULTS: buildApiUrl("/analysis/results/"),
  RESULT_DETAIL: (id: number) => buildApiUrl(`/analysis/results/${id}/`),
} as const

// Core endpoints
export const CORE_ENDPOINTS = {
  API_ROOT: `${API_CONFIG.BASE_URL}/api/`,
  HEALTH: `${API_CONFIG.BASE_URL}/health/`,
} as const

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const

// Common headers
export const getAuthHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
})

export const getMultipartHeaders = (token?: string) => ({
  ...(token && { Authorization: `Bearer ${token}` }),
  // Don't set Content-Type for multipart, let browser set it with boundary
})

// API Response types
export interface ApiResponse<T = any> {
  data: T
  status: number
  message?: string
}

export interface PaginatedResponse<T = any> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Error types
export interface ApiError {
  message: string
  status: number
  details?: Record<string, string[]>
}

// Common query parameters
export interface PaginationParams {
  limit?: number
  offset?: number
}

export interface SearchParams extends PaginationParams {
  search?: string
}

// Patient specific filters
export interface PatientFilters extends SearchParams {
  dni?: string
  gender?: "M" | "F"
  city?: string
  province?: string
  country?: string
}

// Protocol specific filters
export interface ProtocolFilters extends SearchParams {
  state?: "pending" | "in_progress" | "completed" | "cancelled"
  paid?: boolean
  patient?: number
  medico?: number
  ooss?: number
}

// Export all endpoints in a single object for easy access
export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USERS: USER_ENDPOINTS,
  PATIENTS: PATIENT_ENDPOINTS,
  ANALYSIS: ANALYSIS_ENDPOINTS,
  CORE: CORE_ENDPOINTS,
} as const

export default API_ENDPOINTS
