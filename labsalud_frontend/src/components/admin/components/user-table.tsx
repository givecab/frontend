"use client"

import type { User } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Trash, Shield, UserPlus, UserMinus, Clock, AlertCircle } from "lucide-react"

interface UserTableProps {
  users: User[]
  onSelectUser: (user: User, action: string) => void
  canEdit: boolean
  canDelete: boolean
  canAssignRole: boolean
  canRemoveRole: boolean
  canManageTempPermissions: boolean
}

export function UserTable({
  users,
  onSelectUser,
  canEdit,
  canDelete,
  canAssignRole,
  canRemoveRole,
  canManageTempPermissions,
}: UserTableProps) {
  const getInitials = (firstName: string, lastName: string, username: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return username.substring(0, 2).toUpperCase()
  }

  const getRoleColor = (roleName: string): "default" | "secondary" | "destructive" | "outline" => {
    const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Administrador: "destructive",
      Bioquimica: "default",
      Tecnica: "secondary",
      Secretaria: "outline",
    }
    return roleColors[roleName] || "secondary"
  }

  const hasTemporaryPermissions = (user: User) => {
    return user.permissions?.some((p) => p.temporary) || false
  }

  const getActiveRoles = (user: User) => {
    return user.groups || user.roles || []
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay usuarios disponibles</h3>
          <p className="text-sm">No se encontraron usuarios que coincidan con tu búsqueda.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold text-gray-900">Usuario</TableHead>
              <TableHead className="font-semibold text-gray-900">Email</TableHead>
              <TableHead className="font-semibold text-gray-900">Roles</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {users.map((user) => {
              const activeRoles = getActiveRoles(user)
              const hasTemp = hasTemporaryPermissions(user)

              return (
                <TableRow key={user.id} className="bg-white hover:bg-gray-50/50 border-gray-200">
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback className="bg-[#204983] text-white text-xs">
                          {getInitials(user.first_name, user.last_name, user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">
                          {`${user.first_name} ${user.last_name}`.trim() || user.username}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="bg-white">
                    <div className="max-w-[200px] truncate">{user.email}</div>
                  </TableCell>

                  <TableCell className="bg-white">
                    <div className="flex flex-wrap gap-1">
                      {user.is_superuser && (
                        <Badge variant="destructive" className="text-xs">
                          Super
                        </Badge>
                      )}
                      {user.is_staff && (
                        <Badge variant="outline" className="text-xs">
                          Staff
                        </Badge>
                      )}
                      {hasTemp && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Temp
                        </Badge>
                      )}
                      {activeRoles.length > 0 ? (
                        activeRoles.slice(0, 2).map((role) => (
                          <Badge key={role.id} variant={getRoleColor(role.name)} className="text-xs">
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Sin rol
                        </Badge>
                      )}
                      {activeRoles.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{activeRoles.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right bg-white">
                    <div className="flex justify-end space-x-2">
                      {/* Editar usuario */}
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => onSelectUser(user, "edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Permisos temporales */}
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
                      {canRemoveRole && activeRoles.length > 0 && user.is_active && (
                        <Button variant="outline" size="sm" onClick={() => onSelectUser(user, "removeRole")}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Eliminar usuario */}
                      {canDelete && (
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
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
