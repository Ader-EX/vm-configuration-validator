import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react"
import type { LogEntry } from "@/app/page"

interface ExecutionLogProps {
  logs: LogEntry[]
}

export default function ExecutionLog({ logs }: ExecutionLogProps) {
  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      case "checking":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
      case "info":
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
      default:
        return null
    }
  }

  return (
    <Card className="p-6 bg-card border border-border h-full">
      <h2 className="text-xl font-semibold mb-4">Execution Log</h2>

      <div className="bg-foreground/5 rounded-lg p-4 font-mono text-sm space-y-3 h-96 overflow-y-auto border border-border">
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No logs yet</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-xs">
              <div className="text-muted-foreground whitespace-nowrap">{log.timestamp}</div>
              <div className="flex gap-2 flex-1 min-w-0">
                {getLogIcon(log.type)}
                <div className="text-foreground break-words">{log.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
