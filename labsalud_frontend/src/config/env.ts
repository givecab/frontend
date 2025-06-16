// Configuración de variables de entorno con validación y valores por defecto

interface EnvConfig {
  // API Configuration
  API_BASE_URL: string
  API_TIMEOUT: number

  // Authentication Endpoints
  AUTH_LOGIN_ENDPOINT: string
  AUTH_REFRESH_ENDPOINT: string
  AUTH_LOGOUT_ENDPOINT: string

  // User Management Endpoints
  USERS_ENDPOINT: string
  ROLES_ENDPOINT: string
  PERMISSIONS_ENDPOINT: string

  // Patient Management Endpoints
  PATIENTS_ENDPOINT: string
  PATIENTS_ACTIVE_ENDPOINT: string

  // Session Configuration
  SESSION_IDLE_TIME: number
  SESSION_WARNING_TIME: number

  // Application Configuration
  APP_NAME: string
  APP_VERSION: string

  // Development Configuration
  DEBUG_MODE: boolean
  LOG_LEVEL: "error" | "warn" | "info" | "debug"

  // UI Configuration
  TOAST_POSITION: string
  TOAST_DURATION: number

  // File Upload Configuration
  MAX_FILE_SIZE: number
  ALLOWED_FILE_TYPES: string[]

  // Pagination Configuration
  DEFAULT_PAGE_SIZE: number
  MAX_PAGE_SIZE: number
}

// Función para obtener variable de entorno con valor por defecto
const getEnvVar = (key: string, defaultValue = ""): string => {
  return import.meta.env[key] || defaultValue
}

// Función para obtener variable de entorno como número
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key]
  return value ? Number(value) : defaultValue
}

// Función para obtener variable de entorno como boolean
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key]
  return value ? value.toLowerCase() === "true" : defaultValue
}

// Función para obtener array de strings
const getEnvArray = (key: string, defaultValue: string[]): string[] => {
  const value = import.meta.env[key]
  return value ? value.split(",").map((item: string) => item.trim()) : defaultValue
}

// Configuración exportada
export const env: EnvConfig = {
  // API Configuration
  API_BASE_URL: getEnvVar("VITE_API_BASE_URL", "http://190.231.77.155:8000"),
  API_TIMEOUT: getEnvNumber("VITE_API_TIMEOUT", 10000),

  // Authentication Endpoints
  AUTH_LOGIN_ENDPOINT: getEnvVar("VITE_AUTH_LOGIN_ENDPOINT", "/api/token/"),
  AUTH_REFRESH_ENDPOINT: getEnvVar("VITE_AUTH_REFRESH_ENDPOINT", "/api/token/refresh/"),
  AUTH_LOGOUT_ENDPOINT: getEnvVar("VITE_AUTH_LOGOUT_ENDPOINT", "/api/auth/logout/"),

  // User Management Endpoints
  USERS_ENDPOINT: getEnvVar("VITE_USERS_ENDPOINT", "/api/users/"),
  ROLES_ENDPOINT: getEnvVar("VITE_ROLES_ENDPOINT", "/api/roles/"),
  PERMISSIONS_ENDPOINT: getEnvVar("VITE_PERMISSIONS_ENDPOINT", "/api/permissions/"),

  // Patient Management Endpoints
  PATIENTS_ENDPOINT: getEnvVar("VITE_PATIENTS_ENDPOINT", "/api/patients/"),
  PATIENTS_ACTIVE_ENDPOINT: getEnvVar("VITE_PATIENTS_ACTIVE_ENDPOINT", "/api/patients/active/"),

  // Session Configuration
  SESSION_IDLE_TIME: getEnvNumber("VITE_SESSION_IDLE_TIME", 5 * 60 * 1000), // 5 minutos
  SESSION_WARNING_TIME: getEnvNumber("VITE_SESSION_WARNING_TIME", 30 * 1000), // 30 segundos

  // Application Configuration
  APP_NAME: getEnvVar("VITE_APP_NAME", "Sistema de Laboratorio"),
  APP_VERSION: getEnvVar("VITE_APP_VERSION", "1.0.0"),

  // Development Configuration
  DEBUG_MODE: getEnvBoolean("VITE_DEBUG_MODE", false),
  LOG_LEVEL: getEnvVar("VITE_LOG_LEVEL", "error") as "error" | "warn" | "info" | "debug",

  // UI Configuration
  TOAST_POSITION: getEnvVar("VITE_TOAST_POSITION", "bottom-right"),
  TOAST_DURATION: getEnvNumber("VITE_TOAST_DURATION", 5000),

  // File Upload Configuration
  MAX_FILE_SIZE: getEnvNumber("VITE_MAX_FILE_SIZE", 5 * 1024 * 1024), // 5MB
  ALLOWED_FILE_TYPES: getEnvArray("VITE_ALLOWED_FILE_TYPES", ["jpg", "jpeg", "png", "pdf"]),

  // Pagination Configuration
  DEFAULT_PAGE_SIZE: getEnvNumber("VITE_DEFAULT_PAGE_SIZE", 10),
  MAX_PAGE_SIZE: getEnvNumber("VITE_MAX_PAGE_SIZE", 100),
}

// Función para validar configuración crítica
export const validateEnv = (): void => {
  const requiredVars = ["API_BASE_URL", "AUTH_LOGIN_ENDPOINT", "AUTH_REFRESH_ENDPOINT"]

  const missingVars = requiredVars.filter((varName) => {
    const value = env[varName as keyof EnvConfig]
    return !value || (typeof value === "string" && value.trim() === "")
  })

  if (missingVars.length > 0) {
    console.error("Variables de entorno faltantes o vacías:", missingVars)
    throw new Error(`Variables de entorno requeridas faltantes: ${missingVars.join(", ")}`)
  }

  if (env.DEBUG_MODE) {
    console.log("Configuración de entorno cargada:", env)
  }
}

// Validar al importar el módulo
validateEnv()
