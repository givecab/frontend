/**
 * Formatea una fecha en formato legible en español
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  return date.toLocaleDateString("es-ES", options)
}

/**
 * Formatea una fecha y hora en formato legible en español
 */
export function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }

  return date.toLocaleDateString("es-ES", options)
}

/**
 * Obtiene los nombres de los meses en español
 */
export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

/**
 * Obtiene los nombres de los días de la semana en español
 */
export const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
