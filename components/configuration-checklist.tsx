"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface ConfigurationChecklistProps {
  checkStatuses: Record<string, "checking" | "configured" | "not-configured">
  onValidate: (itemKey: string) => void
  onSetup: (itemKey: string) => void
}

const configItems = [
  {
    key: "userGroup",
    label: "User & Group Setup",
    description: "oracle:dba",
    path: "User account and group configuration",
  },
  {
    key: "ulimit",
    label: "Ulimit Configuration",
    description: "/etc/security/limits.conf",
    path: "Resource limits for user sessions",
  },
  {
    key: "securityLimits",
    label: "Security Limits",
    description: "/etc/security/limits.d/",
    path: "Additional security limit configurations",
  },
  {
    key: "sysctl",
    label: "Sysctl Configuration",
    description: "/etc/sysctl.conf",
    path: "Kernel parameter tuning",
  },
  {
    key: "jvm",
    label: "JVM Installation",
    description: "Java 11+",
    path: "Java Virtual Machine setup",
  },
  {
    key: "threadPool",
    label: "Thread Pool Settings",
    description: "Thread configuration",
    path: "Thread pool optimization",
  },
  {
    key: "garbageCollector",
    label: "Garbage Collector Config",
    description: "GC tuning",
    path: "Garbage collector configuration",
  },
]

export default function ConfigurationChecklist({ checkStatuses, onValidate, onSetup }: ConfigurationChecklistProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "configured":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "not-configured":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "checking":
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "configured":
        return "Configured"
      case "not-configured":
        return "Not Configured"
      case "checking":
        return "Checking..."
      default:
        return "Unknown"
    }
  }

  return (
    <Card className="p-6 bg-card border border-border">
      <h2 className="text-xl font-semibold mb-4">Configuration Checklist</h2>

      <div className="space-y-3">
        {configItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 bg-foreground/5 border border-border rounded-lg hover:bg-foreground/10 transition-colors"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="mt-1">{getStatusIcon(checkStatuses[item.key])}</div>
              <div className="flex-1">
                <h3 className="font-medium">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.path}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <div className="text-right min-w-fit">
                <p className="text-xs font-medium text-muted-foreground">{getStatusText(checkStatuses[item.key])}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onValidate(item.key)}
                  disabled={checkStatuses[item.key] === "checking"}
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Validate
                </Button>

                {checkStatuses[item.key] === "not-configured" && (
                  <Button
                    onClick={() => onSetup(item.key)}
                    className="text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Setup Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
