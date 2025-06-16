"use client"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/components/admin/management-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash, Shield, UserPlus, UserMinus, AlertCircle } from "lucide-react"

interface UserTableProps {
  users: User[]
  onSelectUser: (user: User, action: string) => void
}

export function UserTable({ users, onSelectUser }: UserTableProps) {
  const { hasPermission } = useAuth()

  // Permisos
  const canEditUser = hasPermission("31")
  const canDeleteUser = hasPermission("32")
  const canAssignRole = hasPermission("34")
  const canRemoveRole = hasPermission("35")
  const canManageTempPermissions = hasPermission("36")

  // Filtrar solo usuarios activos
  const filteredUsers = users.filter((user) => user.is_active)

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.groups && user.groups.length > 0
                      ? user.groups.map((group) => group.name).join(", ")
                      : "Sin rol"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Editar usuario */}
                      {canEditUser && (
                        <Button variant="outline" size="sm" onClick={() => onSelectUser(user, "edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Asignar permiso temporal */}
                      {canManageTempPermissions && user.is_active && (
                        <Button variant="outline" size="sm" onClick={() => onSelectUser(user, "tempPermission")}>
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Asignar rol */}
                      {canAssignRole && user.is_active && (
                        <Button variant="outline" size="sm" onClick={() => onSelectUser(user, "assignRole")}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Quitar rol */}
                      {canRemoveRole && user.groups && user.groups.length > 0 && user.is_active && (
                        <Button variant="outline" size="sm" onClick={() => onSelectUser(user, "removeRole")}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Eliminar usuario */}
                      {canDeleteUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 hover:bg-red-50"
                          onClick={() => onSelectUser(user, "delete")}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>No hay usuarios activos disponibles</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
