// ============================================================================
// TIPOS CENTRALIZADOS - SISTEMA DE LABORATORIO
// ============================================================================

// Tipos base del sistema
export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
  created_by: UserReference
  updated_by: UserReference[]
}

// Referencia de usuario para auditoría
export interface UserReference {
  id: number
  username: string
  photo: string
}

// ============================================================================
// USUARIOS Y AUTENTICACIÓN
// ============================================================================

export interface Permission {
  id: number
  codename: string
  name: string
  temporary: boolean
  expires_at: string | null // UTC string si temporary es true
}

export interface Group {
  id: number
  name: string
}

export interface Role extends Group {} // Alias para compatibilidad

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  photo: string
  groups: Group[]
  permissions: Permission[]
  // Propiedades adicionales para contexto de auth
  roles?: Role[] // Alias de groups para compatibilidad
  is_active?: boolean
  is_staff?: boolean
  is_superuser?: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  isLoading: boolean
  isInitialized: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string | number) => boolean
  isInGroup: (groupName: string) => boolean
  refreshUser: () => Promise<void>
}

// ============================================================================
// PACIENTES
// ============================================================================

export interface Patient extends BaseEntity {
  first_name: string
  last_name: string
  dni: string
  birth_date: string
  gender: "M" | "F"
  phone_mobile: string
  phone_landline: string
  email: string
  country: string
  province: string
  city: string
  address: string
}

export interface PatientFormData {
  first_name: string
  last_name: string
  dni: string
  birth_date: string
  gender: string
  phone_mobile: string
  phone_landline: string
  email: string
  country: string
  province: string
  city: string
  address: string
}

// ============================================================================
// ANÁLISIS Y CONFIGURACIÓN
// ============================================================================

export interface Medico extends BaseEntity {
  first_name: string
  last_name: string
  license: string
}

export interface ObraSocial extends BaseEntity {
  name: string
}

export interface AnalysisPanel extends BaseEntity {
  code: string | null
  name: string
  bio_unit: string
  is_urgent: boolean
}

export interface Analysis extends BaseEntity {
  code: number
  name: string
  panel: number
  formula: string
  measure_unit: string
}

// ============================================================================
// PROTOCOLOS Y ANÁLISIS DE PROTOCOLO
// ============================================================================

export interface Protocol extends BaseEntity {
  patient: number
  ooss: number
  medico: number
  contact_method?: "email" | "whatsapp" | "call"
  state?: "carga_pendiente" | "carga_completa" | "validacion_pendiente" | "finalizado"
  paid?: boolean
  is_active?: boolean
  protocol_analyses?: ProtocolAnalysis[]
}

export interface ProtocolAnalysis extends BaseEntity {
  protocol: number
  analysis: number
  is_active?: boolean
}

export interface ProtocolResult extends BaseEntity {
  protocol_analysis: number
  value: string
  reference_value?: string
  is_normal?: boolean
  observations?: string
}

// ============================================================================
// API Y RESPUESTAS
// ============================================================================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  errors?: FormErrors
  detail?: string
}

export interface FormErrors {
  [key: string]: string
}

// ============================================================================
// FORMULARIOS Y VALIDACIONES
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  message: string
}

export type ValidationState<T> = {
  [K in keyof T]: ValidationResult
}

// ============================================================================
// COMPONENTES UI
// ============================================================================

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface LoadingState {
  isLoading: boolean
  error?: string
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

export interface AppConfig {
  API_BASE_URL: string
  TOAST_DURATION: number
  IDLE_TIMEOUT: number
  WARNING_TIMEOUT: number
}

// ============================================================================
// TIPOS LEGACY PARA COMPATIBILIDAD
// ============================================================================

// Panel es alias de AnalysisPanel para compatibilidad
export type Panel = AnalysisPanel

// AnalysisItem es alias de Analysis para compatibilidad
export type AnalysisItem = Analysis
