import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Loader2, XCircle, WifiOff } from "lucide-react"
import toast from "react-hot-toast"
import { sshService } from "@/services/ssh-services"
import { DialogUserGroup } from "./setup-dialogs/user-group-dialog"
import { DialogULimit } from "./setup-dialogs/ulimit-dialog"

interface ConfigurationChecklistProps {
  serverId: number
  serverName?: string
}

const configItems = [
  {
    key: "user-group",
    label: "User & Group Setup",
    description: "username:group (password)",
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
    key: "security-limit",
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
    canSetup: true,
  },
  {
    key: "thread-pool",
    label: "Thread Pool Settings",
    description: "Thread configuration",
    path: "Thread pool optimization",
    canSetup: false,
  },
  {
    key: "garbage-collector",
    label: "Garbage Collector Config",
    description: "GC tuning",
    path: "Garbage collector configuration",
    canSetup: false,
  },
]

type CheckStatus = "idle" | "checking" | "pass" | "fail" | "error"

export default function ConfigurationChecklist({ serverId, serverName }: ConfigurationChecklistProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>(
    Object.fromEntries(configItems.map((item) => [item.key, "idle"]))
  )
  const [validationDetails, setValidationDetails] = useState<Record<string, any>>({})
  const [isValidatingAll, setIsValidatingAll] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState<Record<string, boolean>>({})
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [ulimitDialogOpen, setUlimitDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"validate" | "setup">("validate")
  const [userConfig, setUserConfig] = useState({
    username: "wmuser",
    group: "wmuser",
    password: ""
  })

  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await sshService.testConnection(serverId)
      if (result.success) {
        setIsConnected(true)
        toast.success("Connection successful! You can now validate configurations.")
      } else {
        setIsConnected(false)
        toast.error(result.message || "Connection failed")
      }
    } catch (error: any) {
      setIsConnected(false)
      toast.error(error.message || "Connection test failed")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "fail":
        return <XCircle className="w-5 h-5 text-red-500" />
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
    if (!isConnected) {
      toast.error("Please test connection first")
      return
    }

    setIsValidatingAll(true)
    
    const checkingStatuses = Object.fromEntries(
      configItems.map((item) => [item.key, "checking"])
    )
    setCheckStatuses(checkingStatuses)

    try {
      const result = await sshService.validateAllPrerequisites(serverId, {
        username: userConfig.username,
        group: userConfig.group
      })
      
      const newStatuses: Record<string, CheckStatus> = {}
      const newDetails: Record<string, any> = {}
      
      result.validations.forEach((validation: any) => {
        newStatuses[validation.key] = validation.status
        newDetails[validation.key] = validation
      })
      
      setCheckStatuses(newStatuses)
      setValidationDetails(newDetails)
      
      toast.success(`Overall status: ${result.overallStatus.toUpperCase()}`)
    } catch (error: any) {
      toast.error(error.message)
      
      const idleStatuses = Object.fromEntries(
        configItems.map((item) => [item.key, "idle"])
      )
      setCheckStatuses(idleStatuses)
    } finally {
      setIsValidatingAll(false)
    }
  }

  const validateSingle = async (itemKey: string) => {
    if (!isConnected) {
      toast.error("Please test connection first")
      return
    }

    // Handle special dialogs
    if (itemKey === "user-group") {
      setDialogMode("validate")
      setUserDialogOpen(true)
      return
    }

    if (itemKey === "ulimit") {
      setDialogMode("validate")
      setUlimitDialogOpen(true)
      return
    }
   
    setCheckStatuses((prev) => ({ ...prev, [itemKey]: "checking" }))

    try {
      // Call the specific validation endpoint
      const result = await sshService.validatePrerequisite(serverId, itemKey, {
        username: userConfig.username,
        group: userConfig.group
      })
      
      // The result now has a single validation object, not an array
      const validation = result.validation
      
      if (validation) {
        setCheckStatuses((prev) => ({ ...prev, [itemKey]: validation.status }))
        setValidationDetails((prev) => ({ ...prev, [itemKey]: validation }))
        
        if (validation.status === "fail") {
          const errorMsg = validation.details?.output || validation.message
          toast.error(`${validation.status.toUpperCase()}: ${errorMsg}`)
        } else if (validation.status === "pass") {
          const successMsg = validation.details?.output || validation.message
          toast.success(successMsg)
        } else {
          toast.error(validation.message)
        }
      }
    } catch (error: any) {
      setCheckStatuses((prev) => ({ ...prev, [itemKey]: "error" }))
      toast.error(error.message)
    }
  }

  const handleUserDialogSubmit = async (data: any, itemKey: string) => {
    if (dialogMode === "validate") {
      setIsSettingUp((prev) => ({ ...prev, "user-group": true }))
      setCheckStatuses((prev) => ({ ...prev, "user-group": "checking" }))
      
      try {
        const result = await sshService.validatePrerequisite(serverId, "user-group", {
          username: data.username,
          group: data.group
        })
        
        const validation = result.validation
        
        if (validation) {
          setCheckStatuses((prev) => ({ ...prev, "user-group": validation.status }))
          setValidationDetails((prev) => ({ ...prev, "user-group": validation }))
          setUserConfig(data)
          
          if (validation.status === "fail") {
            toast.error(`${validation.status.toUpperCase()}: ${validation.details?.output || validation.message}`)
          } else {
            toast.success(validation.details?.output || validation.message)
          }
          setUserDialogOpen(false)
        }
      } catch (error: any) {
        setCheckStatuses((prev) => ({ ...prev, "user-group": "error" }))
        toast.error(error.message)
      } finally {
        setIsSettingUp((prev) => ({ ...prev, "user-group": false }))
      }
    } else {
      setIsSettingUp((prev) => ({ ...prev, "user-group": true }))

      try {
        const result = await sshService.setupUserGroup(serverId, data.username, data.group, data.password)
        if (result.success === false) {
          throw new Error(result.message || "User setup failed")
        }
        
        setUserConfig(data)
        toast.success("User & Group setup completed successfully")
        setUserDialogOpen(false)
        await validateSingle("user-group")
      } catch (error: any) {
        toast.error("Setup Failed: " + error.message)
      } finally {
        setIsSettingUp((prev) => ({ ...prev, "user-group": false }))
      }
    }
  }

  const handleUlimitDialogSubmit = async (data: any, itemKey: string) => {
    if (dialogMode === "validate") {
      setIsSettingUp((prev) => ({ ...prev, ulimit: true }))
      setCheckStatuses((prev) => ({ ...prev, ulimit: "checking" }))
      
      try {
        const result = await sshService.validatePrerequisite(serverId, "ulimit", {
          username: data.username
        })
        
        const validation = result.validation
        
        if (validation) {
          setCheckStatuses((prev) => ({ ...prev, ulimit: validation.status }))
          setValidationDetails((prev) => ({ ...prev, ulimit: validation }))
          
          if (validation.status === "fail") {
            toast.error(`${validation.status.toUpperCase()}: ${validation.details?.output || validation.message}`)
          } else {
            toast.success(validation.details?.output || validation.message)
          }
          setUlimitDialogOpen(false)
        }
      } catch (error: any) {
        setCheckStatuses((prev) => ({ ...prev, ulimit: "error" }))
        toast.error(error.message)
      } finally {
        setIsSettingUp((prev) => ({ ...prev, ulimit: false }))
      }
    } else {
      setIsSettingUp((prev) => ({ ...prev, ulimit: true }))

      try {
        const result = await sshService.setupUlimit(serverId, data.username)
        if (result.success === false) {
          throw new Error(result.message || "Ulimit setup failed")
        }
        
        toast.success("Ulimit setup completed successfully")
        setUlimitDialogOpen(false)
        await validateSingle("ulimit")
      } catch (error: any) {
        toast.error("Setup Failed: " + error.message)
      } finally {
        setIsSettingUp((prev) => ({ ...prev, ulimit: false }))
      }
    }
  }

  const setupItem = async (itemKey: string) => {
    if (!isConnected) {
      toast.error("Please test connection first")
      return
    }

    if (itemKey === "user-group") {
      setDialogMode("setup")
      setUserDialogOpen(true)
      return
    }

    if (itemKey === "ulimit") {
      setDialogMode("setup")
      setUlimitDialogOpen(true)
      return
    }

    setIsSettingUp((prev) => ({ ...prev, [itemKey]: true }))

    try {
      let result: any

      switch (itemKey) {
        case "sysctl":
          result = await sshService.setupSysctl(serverId)
          if (result.success === false) {
            throw new Error(result.message || "Sysctl setup failed")
          }
          toast.success("Sysctl setup completed successfully")
          break
        case "jvm":
          result = await sshService.setupJvm(serverId, { version: 11, osType: "rhel" })
          if (result.success === false) {
            throw new Error(result.message || "JVM setup failed")
          }
          toast.success("JVM setup completed successfully")
          break
        default:
          throw new Error("Setup not available for this item")
      }

      await validateSingle(itemKey)
    } catch (error: any) {
      toast.error("Setup Failed: " + error.message)
    } finally {
      setIsSettingUp((prev) => ({ ...prev, [itemKey]: false }))
    }
  }

  const setupAll = async () => {
    if (!isConnected) {
      toast.error("Please test connection first")
      return
    }

    setIsValidatingAll(true)
    
    try {
      await sshService.setupAll(serverId, {
        username: userConfig.username,
        group: userConfig.group
      })
      
      toast.success("Setup Complete")
      await validateAll()
    } catch (error: any) {
      toast.error("Setup Failed: " + error.message)
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
          {!isConnected ? (
            <Button
              onClick={testConnection}
              disabled={isTestingConnection}
              variant="default"
            >
              {isTestingConnection ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {configItems.map((item) => {
          const detail = validationDetails[item.key]
          
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between p-4 bg-foreground/5 border border-border rounded-lg transition-colors ${
                isConnected ? "hover:bg-foreground/10" : "opacity-60"
              }`}
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
                    disabled={!isConnected || checkStatuses[item.key] === "checking" || isValidatingAll}
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
                      disabled={!isConnected || isSettingUp[item.key] || isValidatingAll}
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
      
      <DialogUserGroup
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSubmit={handleUserDialogSubmit}
        defaultValues={userConfig}
        isLoading={isSettingUp["user-group"]}
        mode={dialogMode}
      />

      <DialogULimit
        open={ulimitDialogOpen}
        onOpenChange={setUlimitDialogOpen}
        onSubmit={handleUlimitDialogSubmit}
        defaultValues={userConfig}
        isLoading={isSettingUp.ulimit}
        mode={dialogMode}
      />
    </Card>
  )
}