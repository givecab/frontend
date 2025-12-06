import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"
import type { HistoryEntry } from "@/types"

interface HistoryListProps {
  history: HistoryEntry[]
  emptyMessage?: string
}

const getActionBorderColor = (action: string): string => {
  const lowerAction = action.toLowerCase()

  if (lowerAction.includes("crear") || lowerAction.includes("create") || lowerAction.includes("creacion")) {
    return "border-l-green-500 dark:border-l-green-600"
  }

  if (
    lowerAction.includes("actualizacion") ||
    lowerAction.includes("modificar") ||
    lowerAction.includes("update") ||
    lowerAction.includes("edit")
  ) {
    return "border-l-yellow-500 dark:border-l-yellow-600"
  }

  if (lowerAction.includes("eliminacion") || lowerAction.includes("delete") || lowerAction.includes("borrar")) {
    return "border-l-red-500 dark:border-l-red-600"
  }

  return "border-l-gray-400 dark:border-l-gray-600"
}

const getActionBadgeVariant = (action: string): string => {
  const lowerAction = action.toLowerCase()

  if (lowerAction.includes("crear") || lowerAction.includes("create") || lowerAction.includes("creacion")) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  if (
    lowerAction.includes("actualizacion") ||
    lowerAction.includes("modificar") ||
    lowerAction.includes("update") ||
    lowerAction.includes("edit")
  ) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  }

  if (lowerAction.includes("eliminacion") || lowerAction.includes("delete") || lowerAction.includes("borrar")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

export function HistoryList({ history, emptyMessage = "No hay historial disponible" }: HistoryListProps) {
  if (!history || history.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {history.map((entry, index) => {
        const user = entry.user || { username: "Sistema", photo: null }

        return (
          <Card key={index} className={`border-l-4 ${getActionBorderColor(entry.action || "")}`}>
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                  <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />
                  <AvatarFallback>
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-wrap">
                      <span className="font-medium truncate text-xs sm:text-sm">{user.username}</span>
                      {entry.version && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0">
                          v{entry.version}
                        </Badge>
                      )}
                      {entry.action && (
                        <Badge
                          className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 ${getActionBadgeVariant(entry.action)}`}
                        >
                          {entry.action}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {new Date(entry.date).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>

                  {entry.changes && entry.changes.length > 0 && (
                    <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                      {entry.changes.map((change, idx) => (
                        <div key={idx} className="leading-snug break-words">
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
      })}
    </div>
  )
}
