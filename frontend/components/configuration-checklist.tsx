import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react"

import toast from "react-hot-toast"
import { sshService } from "@/services/ssh-services"


interface ConfigurationChecklistProps {
  serverId: number
  serverName?: string
}

const configItems = [
  {
    key: "userGroup",
    label: "User & Group Setup",
    description: "oracle:dba",
    path: "User account and group configuration",
    canSetup: true,
  },
  {
    key: "ulimit",
    label: "Ulimit Configuration",
    description: "/etc/security/limits.conf",
    path: "Resource limits for user sessions",
    canSetup: true,
  },
  {
    key: "securityLimits",
    label: "Security Limits",
    description: "/etc/security/limits.d/",
    path: "Additional security limit configurations",
    canSetup: false,
  },
  {
    key: "sysctl",
    label: "Sysctl Configuration",
    description: "/etc/sysctl.conf",
    path: "Kernel parameter tuning",
    canSetup: true,
  },
  {
    key: "jvm",
    label: "JVM Installation",
    description: "Java 11+",
    path: "Java Virtual Machine setup",
    canSetup: false,
  },
  {
    key: "threadPool",
    label: "Thread Pool Settings",
    description: "Thread configuration",
    path: "Thread pool optimization",
    canSetup: false,
  },
  {
    key: "garbageCollector",
    label: "Garbage Collector Config",
    description: "GC tuning",
    path: "Garbage collector configuration",
    canSetup: false,
  },
]

type CheckStatus = "idle" | "checking" | "pass" | "fail" | "error"

export default function ConfigurationChecklist({ serverId, serverName }: ConfigurationChecklistProps) {
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>(
    Object.fromEntries(configItems.map((item) => [item.key, "idle"]))
  )
  const [validationDetails, setValidationDetails] = useState<Record<string, any>>({})
  const [isValidatingAll, setIsValidatingAll] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState<Record<string, boolean>>({})


  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "fail":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "checking":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusText = (status: CheckStatus) => {
    switch (status) {
      case "pass":
        return "Configured"
      case "fail":
        return "Not Configured"
      case "error":
        return "Error"
      case "checking":
        return "Checking..."
      default:
        return "Not Checked"
    }
  }

  const validateAll = async () => {
    setIsValidatingAll(true)
    
    const checkingStatuses = Object.fromEntries(
      configItems.map((item) => [item.key, "checking"])
    )
    setCheckStatuses(checkingStatuses)

    try {
      const result = await sshService.validateAllPrerequisites(serverId)
      
      // Update statuses based on results
      const newStatuses: Record<string, CheckStatus> = {}
      const newDetails: Record<string, any> = {}
      
      result.validations.forEach((validation) => {
        newStatuses[validation.key] = validation.status
        newDetails[validation.key] = validation
      })
      
      setCheckStatuses(newStatuses)
      setValidationDetails(newDetails)
      
      toast.success(
     `Overall status: ${result.overallStatus.toUpperCase()}`,
      )
    } catch (error: any) {
      toast.error(error.message)
      
      // Reset to idle on error
      const idleStatuses = Object.fromEntries(
        configItems.map((item) => [item.key, "idle"])
      )
      setCheckStatuses(idleStatuses)
    } finally {
      setIsValidatingAll(false)
    }
  }

  const validateSingle = async (itemKey: string) => {
    setCheckStatuses((prev) => ({ ...prev, [itemKey]: "checking" }))

    try {
      const result = await sshService.validateAllPrerequisites(serverId)
      const validation = result.validations.find((v) => v.key === itemKey)
      
      if (validation) {
        setCheckStatuses((prev) => ({ ...prev, [itemKey]: validation.status }))
        setValidationDetails((prev) => ({ ...prev, [itemKey]: validation }))
        
        toast.success(
          
 validation.message,
          )
      }
    } catch (error: any) {
      setCheckStatuses((prev) => ({ ...prev, [itemKey]: "error" }))
      toast.error(
         error.message,
        )
    }
  }

  const setupItem = async (itemKey: string) => {
    setIsSettingUp((prev) => ({ ...prev, [itemKey]: true }))

    try {
      let result: any

      switch (itemKey) {
        case "userGroup":
          result = await sshService.setupUserGroup(serverId)
          break
        case "ulimit":
          result = await sshService.setupUlimit(serverId)
          break
        case "sysctl":
          result = await sshService.setupSysctl(serverId)
          break
        default:
          throw new Error("Setup not available for this item")
      }

      toast({
        title: "Setup Successful",
        description: `${configItems.find((i) => i.key === itemKey)?.label} has been configured`,
      })

      // Re-validate after setup
      await validateSingle(itemKey)
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSettingUp((prev) => ({ ...prev, [itemKey]: false }))
    }
  }

  const setupAll = async () => {
    setIsValidatingAll(true)
    
    try {
      await sshService.setupAll(serverId)
      
      toast.success("Setup Complete")

      await validateAll()
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsValidatingAll(false)
    }
  }

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex w-full justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Configuration Checklist</h2>
          {serverName && (
            <p className="text-sm text-muted-foreground mt-1">Server: {serverName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={setupAll}
            disabled={isValidatingAll}
            variant="outline"
          >
            {isValidatingAll && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Setup All
          </Button>
          <Button onClick={validateAll} disabled={isValidatingAll}>
            {isValidatingAll && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Validate All
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {configItems.map((item) => {
          const detail = validationDetails[item.key]
          
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-foreground/5 border border-border rounded-lg hover:bg-foreground/10 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="mt-1">{getStatusIcon(checkStatuses[item.key])}</div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {detail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {detail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex md:flex-row flex-col items-center gap-2 ml-4 shrink-0">
                <div className="text-right min-w-fit">
                  <p className="text-xs font-medium text-muted-foreground">
                    {getStatusText(checkStatuses[item.key])}
                  </p>
                </div>

                <div className="flex md:flex-row flex-col gap-2">
                  <Button
                    onClick={() => validateSingle(item.key)}
                    disabled={checkStatuses[item.key] === "checking" || isValidatingAll}
                    size="sm"
                    className="text-xs"
                  >
                    {checkStatuses[item.key] === "checking" && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    Validate
                  </Button>

                  {item.canSetup && (checkStatuses[item.key] === "fail" || checkStatuses[item.key] === "error") && (
                    <Button
                      onClick={() => setupItem(item.key)}
                      disabled={isSettingUp[item.key] || isValidatingAll}
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                    >
                      {isSettingUp[item.key] && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      Setup Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}