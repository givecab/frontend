"use client"

import { useState, useEffect, useRef } from "react"
import { useApi } from "@/hooks/use-api"
import { AC_ENDPOINTS } from "@/config/api"
import type { Permission } from "@/types"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import type { UIEvent, ChangeEvent } from "react"

interface PermissionManagementProps {
  permission: Permission[]
}

export function PermissionManagement({ permission }: PermissionManagementProps) {
  const { apiRequest } = useApi()

  const [permissions, setPermissions] = useState<Permission[]>(permission)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const permsContainerRef = useRef<HTMLDivElement>(null)

  const loadMore = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return
    setLoading(true)
    try {
      const res = await apiRequest(
        `${AC_ENDPOINTS.PERMISSIONS}?limit=20&offset=${reset ? 0 : offset}&search=${encodeURIComponent(search)}`,
      )
      if (res.ok) {
        const data = await res.json()
        const batch: Permission[] = data.results || []
        setPermissions((prev) => (reset ? batch : [...prev, ...batch]))
        setOffset((prev) => (reset ? batch.length : prev + batch.length))
        setHasMore(!!data.next && batch.length === 20)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    setPermissions([])
    if (search) setSearching(true)
    loadMore(true).then(() => setSearching(false))
  }, [search])

  const onPermsScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
      loadMore()
    }
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div>
      <h2 className="mb-4 text-lg sm:text-xl font-semibold text-gray-800">Lista de Permisos</h2>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar permisos por nombre o codename..."
          value={search}
          onChange={handleSearch}
          className="w-full sm:max-w-md"
        />
      </div>
      <div
        ref={permsContainerRef}
        onScroll={onPermsScroll}
        className="max-h-96 overflow-y-auto border rounded-md p-2 sm:p-3 bg-white"
      >
        <div className="block sm:hidden space-y-3">
          {permissions.map((perm) => (
            <div key={perm.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">ID: {perm.id}</span>
              </div>
              <p className="font-medium text-sm text-gray-900">{perm.name}</p>
              <p className="text-xs text-gray-600 mt-1">{perm.codename}</p>
            </div>
          ))}
          {(loading || searching) && <div className="text-center py-4 text-sm text-gray-500">Cargando permisos...</div>}
          {!hasMore && permissions.length === 0 && !loading && (
            <div className="text-center py-4 flex items-center justify-center text-sm text-gray-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              No hay permisos disponibles.
            </div>
          )}
        </div>

        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Codename</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>{perm.id}</TableCell>
                  <TableCell>{perm.name}</TableCell>
                  <TableCell>{perm.codename}</TableCell>
                </TableRow>
              ))}
              {(loading || searching) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Cargando permisos...
                  </TableCell>
                </TableRow>
              )}
              {!hasMore && permissions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    <AlertCircle className="inline w-6 h-6 mr-2" />
                    No hay permisos disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
