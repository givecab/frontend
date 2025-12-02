import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"
import type { AuditEntry } from "@/types"

interface AuditCardProps {
  entry: AuditEntry
}

const getActionBorderColor = (action: string): string => {
  const lowerAction = action.toLowerCase()

  if (lowerAction.includes("creacion")) {
    return "border-l-green-500 dark:border-l-green-600"
  }

  if (lowerAction.includes("actualizacion")) {
    return "border-l-yellow-500 dark:border-l-yellow-600"
  }

  if (lowerAction.includes("eliminacion")) {
    return "border-l-red-500 dark:border-l-red-600"
  }

  return "border-l-gray-400 dark:border-l-gray-600"
}

const getActionBadgeVariant = (action: string): string => {
  const lowerAction = action.toLowerCase()

  if (lowerAction.includes("creacion")) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  if (lowerAction.includes("actualizacion")) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  }

  if (lowerAction.includes("eliminacion")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

export function AuditCard({ entry }: AuditCardProps) {
  const user = entry.user || { username: "Sistema", photo: null }

  return (
    <Card className={`border-l-4 ${getActionBorderColor(entry.action || "")}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{user.username}</span>
                {entry.version && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    v{entry.version}
                  </Badge>
                )}
                {entry.action && (
                  <Badge className={`text-xs px-2 py-0.5 ${getActionBadgeVariant(entry.action)}`}>{entry.action}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {new Date(entry.date).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
            </div>

            {entry.model && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {entry.model.display}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{entry.object}</span>
              </div>
            )}

            {entry.changes && entry.changes.length > 0 && (
              <div className="text-sm text-muted-foreground space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                {entry.changes.map((change, idx) => (
                  <div key={idx} className="leading-snug">
                    • {change}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
