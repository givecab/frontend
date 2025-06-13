"use client"
import { useAuth } from "@/contexts/auth-context"
import { User, Shield, Clock, TestTube, Users, TrendingUp, Calendar, CheckCircle } from "lucide-react"

const HomePage = () => {
  const { user } = useAuth()

  const getActivePermissions = () => {
    if (!user || !user.temp_permissions) return []
    const now = new Date()
    return user.temp_permissions.filter((perm) => new Date(perm.expires_at) > now)
  }

  // Datos simulados que luego vendrán de la API
  const stats = {
    analysisToday: 127,
    patientsToday: 89,
    pendingResults: 23,
    completedAnalysis: 1456,
    monthlyGrowth: 12.5,
    averageProcessingTime: 45, // minutos
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Welcome Section */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {user?.photo ? (
              <img
                src={user.photo || "/placeholder.svg"}
                alt={`${user.username} profile`}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#204983] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">¡Bienvenido, {user?.first_name || user?.username}!</h1>
          </div>
        </div>
      </div>

      {/* Permissions Section */}
      {getActivePermissions().length > 0 && (
        <div className="bg-green-50/95 backdrop-blur-sm border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Permisos Temporales Activos</h3>
          </div>
          <div className="space-y-2">
            {getActivePermissions().map((perm, index) => (
              <div key={index} className="flex items-center justify-between bg-white/95 backdrop-blur-sm rounded p-2">
                <span className="text-sm font-medium text-green-800">{perm.name}</span>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <Clock className="w-3 h-3" />
                  <span>Expira: {new Date(perm.expires_at).toLocaleString("es-ES")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Análisis de Hoy */}
        <div className="bg-blue-50/80 backdrop-blur-sm p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-blue-500 font-medium">HOY</span>
          </div>
          <h3 className="text-2xl font-bold text-blue-800 mb-1">{stats.analysisToday}</h3>
          <p className="text-blue-600 text-sm">Análisis realizados</p>
        </div>

        {/* Pacientes de Hoy */}
        <div className="bg-green-50/80 backdrop-blur-sm p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-green-500 font-medium">HOY</span>
          </div>
          <h3 className="text-2xl font-bold text-green-800 mb-1">{stats.patientsToday}</h3>
          <p className="text-green-600 text-sm">Pacientes atendidos</p>
        </div>

        {/* Resultados Pendientes */}
        <div className="bg-orange-50/80 backdrop-blur-sm p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-orange-500 font-medium">PENDIENTE</span>
          </div>
          <h3 className="text-2xl font-bold text-orange-800 mb-1">{stats.pendingResults}</h3>
          <p className="text-orange-600 text-sm">Resultados por validar</p>
        </div>

        {/* Análisis Completados (Mes) */}
        <div className="bg-purple-50/80 backdrop-blur-sm p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-purple-500 font-medium">ESTE MES</span>
          </div>
          <h3 className="text-2xl font-bold text-purple-800 mb-1">{stats.completedAnalysis.toLocaleString()}</h3>
          <p className="text-purple-600 text-sm">Análisis completados</p>
        </div>

        {/* Crecimiento Mensual */}
        <div className="bg-emerald-50/80 backdrop-blur-sm p-6 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs text-emerald-500 font-medium">CRECIMIENTO</span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-800 mb-1">+{stats.monthlyGrowth}%</h3>
          <p className="text-emerald-600 text-sm">vs. mes anterior</p>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-indigo-50/80 backdrop-blur-sm p-6 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs text-indigo-500 font-medium">PROMEDIO</span>
          </div>
          <h3 className="text-2xl font-bold text-indigo-800 mb-1">{stats.averageProcessingTime} min</h3>
          <p className="text-indigo-600 text-sm">Tiempo de procesamiento</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
