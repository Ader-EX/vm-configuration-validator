import { Card } from "@/components/ui/card"

interface ExecutionLogProps {
  logs: string
}

export default function ExecutionLog({ logs }: ExecutionLogProps) {
  return (
    <Card className="p-6 bg-card border border-border h-full">
      <h2 className="text-xl font-semibold mb-4">Execution Log</h2>
      <div className="bg-foreground/5 rounded-lg p-4 font-mono text-sm  overflow-y-auto border border-border whitespace-pre-wrap">
        {logs || <p className="text-muted-foreground text-center py-8">No logs yet</p>}
      </div>
    </Card>
  )
}