// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================

export const formatUtils = {
  // Formatear DNI con puntos
  formatDni: (dni: string): string => {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  },

  // Formatear fecha para input
  formatDateForInput: (dateString: string): string => {
    if (!dateString) return ""

    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      if (parts[0].length === 4) {
        const [year, month, day] = parts
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      } else {
        const [day, month, year] = parts
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }
    }
    return dateString.split("T")[0]
  },

  // Formatear fecha para mostrar
  formatDateForDisplay: (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  },

  // Formatear nombre completo
  formatFullName: (firstName: string, lastName: string): string => {
    return `${firstName || ""} ${lastName || ""}`.trim()
  },

  // Limpiar solo números
  extractNumbers: (value: string): string => {
    return value.replace(/\D/g, "")
  },

  // Capitalizar primera letra
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  // Formatear teléfono
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  },
}
