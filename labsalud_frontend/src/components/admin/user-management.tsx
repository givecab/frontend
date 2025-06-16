"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { User, Role, Permission } from "@/components/admin/management-page"
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
}

export function UserManagement({ users, roles, permissions, setUsers }: UserManagementProps) {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isTempPermission, setIsTempPermission] = useState(false)
  const [isRoleAssign, setIsRoleAssign] = useState(false)
  const [isRoleRemove, setIsRoleRemove] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permisos
  const canViewUsers = hasPermission("24")
  const canCreateUser = hasPermission("30")

  const handleSelectUser = (user: User, action: string) => {
    setSelectedUser(user)
    switch (action) {
      case "edit":
        setIsEditing(true)
        break
      case "tempPermission":
        setIsTempPermission(true)
        break
      case "assignRole":
        setIsRoleAssign(true)
        break
      case "removeRole":
        setIsRoleRemove(true)
        break
      case "delete":
        setIsDeleting(true)
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
        <UserTable users={users} onSelectUser={handleSelectUser} />
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
        isOpen={isCreating}
        onClose={closeAllDialogs}
        roles={roles}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />

      <EditUserDialog
        isOpen={isEditing}
        onClose={closeAllDialogs}
        user={selectedUser}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />

      <TempPermissionDialog
        isOpen={isTempPermission}
        onClose={closeAllDialogs}
        user={selectedUser}
        permissions={permissions}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />

      <RoleAssignDialog
        isOpen={isRoleAssign}
        onClose={closeAllDialogs}
        user={selectedUser}
        roles={roles}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />

      <RoleRemoveDialog
        isOpen={isRoleRemove}
        onClose={closeAllDialogs}
        user={selectedUser}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />

      <DeleteUserDialog
        isOpen={isDeleting}
        onClose={closeAllDialogs}
        user={selectedUser}
        setUsers={setUsers}
        apiRequest={apiRequest}
      />
    </div>
  )
}
