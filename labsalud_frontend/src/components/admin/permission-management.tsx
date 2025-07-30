"use client"

import { useState, useEffect, useRef } from "react"
import { useApi } from "@/hooks/use-api"
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

  // Cargar lote de permisos, admite búsqueda
  const loadMore = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return
    setLoading(true)
    try {
      const res = await apiRequest(
        `api/permissions/?limit=20&offset=${reset ? 0 : offset}&search=${encodeURIComponent(search)}`
      )
      if (res.ok) {
        const data = await res.json()
        const batch: Permission[] = data.results || []
        setPermissions((prev) => reset ? batch : [...prev, ...batch])
        setOffset((prev) => reset ? batch.length : prev + batch.length)
        setHasMore(!!data.next && batch.length === 20)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  // Inicial/filtro
  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    setPermissions([])
    if (search) setSearching(true)
    loadMore(true).then(() => setSearching(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Scroll infinito
  const onPermsScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
      loadMore()
    }
  }

  // Input de búsqueda
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Lista de Permisos</h2>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar permisos por nombre o codename..."
          value={search}
          onChange={handleSearch}
          className="w-full max-w-md"
        />
      </div>
      <div
        ref={permsContainerRef}
        onScroll={onPermsScroll}
        className="max-h-96 overflow-y-auto border rounded-md p-3 bg-white"
      >
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
                <TableCell colSpan={3} className="text-center">Cargando permisos...</TableCell>
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
  )
}