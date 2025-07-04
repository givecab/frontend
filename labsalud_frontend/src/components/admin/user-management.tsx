"use client"

import type React from "react"
import { useState } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { User, Role, Permission } from "@/types"
import { UserTable } from "./components/user-table"
import { CreateUserDialog } from "./components/create-user-dialog"
import { EditUserDialog } from "./components/edit-user-dialog"
import { TempPermissionDialog } from "./components/temp-permission-dialog"
import { RoleAssignDialog } from "./components/role-assign-dialog"
import { RoleRemoveDialog } from "./components/role-remove-dialog"
import { DeleteUserDialog } from "./components/delete-user-dialog"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"

interface UserManagementProps {
  users: User[]
  roles: Role[]
  permissions: Permission[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  refreshData: () => Promise<void>
}

export function UserManagement({ users, roles, permissions, setUsers, refreshData }: UserManagementProps) {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isTempPermission, setIsTempPermission] = useState(false)
  const [isRoleAssign, setIsRoleAssign] = useState(false)
  const [isRoleRemove, setIsRoleRemove] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permisos actualizados
  const canViewUsers = hasPermission("24") // view_customuser
  const canCreateUser = hasPermission("21") // add_customuser
  const canEditUser = hasPermission("22") // change_customuser
  const canDeleteUser = hasPermission("23") // delete_customuser
  const canAssignRole = hasPermission("34") // assign_role
  const canRemoveRole = hasPermission("35") // remove_role
  const canAssignTempPermission = hasPermission("36") // assign_temp_permission

  const handleSelectUser = (user: User, action: string) => {
    if (!user || !user.id) {
      console.error("Usuario inválido seleccionado:", user)
      return
    }

    setSelectedUser(user)
    switch (action) {
      case "edit":
        if (canEditUser) setIsEditing(true)
        break
      case "tempPermission":
        if (canAssignTempPermission) setIsTempPermission(true)
        break
      case "assignRole":
        if (canAssignRole) setIsRoleAssign(true)
        break
      case "removeRole":
        if (canRemoveRole) setIsRoleRemove(true)
        break
      case "delete":
        if (canDeleteUser) setIsDeleting(true)
        break
    }
  }

  const closeAllDialogs = () => {
    setSelectedUser(null)
    setIsCreating(false)
    setIsEditing(false)
    setIsTempPermission(false)
    setIsRoleAssign(false)
    setIsRoleRemove(false)
    setIsDeleting(false)
  }

  // Validar datos
  const validUsers = Array.isArray(users) ? users.filter((user) => user && user.id) : []
  const validRoles = Array.isArray(roles) ? roles.filter((role) => role && role.id) : []
  const validPermissions = Array.isArray(permissions)
    ? permissions.filter((permission) => permission && permission.id)
    : []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>

        {canCreateUser && (
          <Button className="bg-[#204983]" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {canViewUsers ? (
        <UserTable
          users={validUsers}
          onSelectUser={handleSelectUser}
          canEdit={canEditUser}
          canDelete={canDeleteUser}
          canAssignRole={canAssignRole}
          canRemoveRole={canRemoveRole}
          canManageTempPermissions={canAssignTempPermission}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>No tienes permiso para ver la lista de usuarios.</p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateUserDialog
        open={isCreating}
        onOpenChange={(open) => !open && closeAllDialogs()}
        roles={validRoles}
        setUsers={setUsers}
        apiRequest={apiRequest}
        refreshData={refreshData}
      />

      <EditUserDialog
        open={isEditing}
        onOpenChange={(open) => !open && closeAllDialogs()}
        user={selectedUser}
        roles={validRoles}
        setUsers={setUsers}
        apiRequest={apiRequest}
        refreshData={refreshData}
      />

      <TempPermissionDialog
        open={isTempPermission}
        onOpenChange={(open) => !open && closeAllDialogs()}
        user={selectedUser}
        permissions={validPermissions}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />

      <RoleAssignDialog
        open={isRoleAssign}
        onOpenChange={(open) => !open && closeAllDialogs()}
        user={selectedUser}
        roles={validRoles}
        setUsers={setUsers}
        apiRequest={apiRequest}
        refreshData={refreshData}
      />

      <RoleRemoveDialog
        open={isRoleRemove}
        onOpenChange={(open) => !open && closeAllDialogs()}
        user={selectedUser}
        roles={validRoles}
        setUsers={setUsers}
        apiRequest={apiRequest}
        refreshData={refreshData}
      />

      <DeleteUserDialog
        open={isDeleting}
        onOpenChange={(open) => !open && closeAllDialogs()}
        user={selectedUser}
        setUsers={setUsers}
        apiRequest={apiRequest}
        refreshData={refreshData}
      />
    </div>
  )
}
