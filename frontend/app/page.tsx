"use client"

import { useState, useEffect } from "react"
import ServerSidebar from "@/components/server-sidebar"
import ServerConnectionForm from "@/components/server-connection-form"
import ConfigurationChecklist from "@/components/configuration-checklist"
import ExecutionLog from "@/components/execution-log"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export type Server = {
  id: string
  name: string
  ipAddress: string
  sshPort: number
  username: string
  sshKey: string
}

export type LogEntry = {
  id: string
  timestamp: string
  message: string
  type: "success" | "error" | "info" | "checking"
}

export default function Home() {
  const [servers, setServers] = useState<Server[]>([])
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [showAddServer, setShowAddServer] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [checkStatuses, setCheckStatuses] = useState<Record<string, "checking" | "configured" | "not-configured">>({
    userGroup: "not-configured",
    ulimit: "not-configured",
    securityLimits: "not-configured",
    sysctl: "not-configured",
    jvm: "not-configured",
    threadPool: "not-configured",
    garbageCollector: "not-configured",
  })

  // Load servers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("vm-servers")
    if (stored) {
      setServers(JSON.parse(stored))
    }
  }, [])

  // Save servers to localStorage
  useEffect(() => {
    localStorage.setItem("vm-servers", JSON.stringify(servers))
  }, [servers])

  const handleAddServer = (server: Server) => {
    setServers([...servers, server])
    setSelectedServer(server)
    setShowAddServer(false)
    addLog("info", `Server "${server.name}" added successfully`)
  }

  const handleDeleteServer = (serverId: string) => {
    setServers(servers.filter((s) => s.id !== serverId))
    if (selectedServer?.id === serverId) {
      setSelectedServer(null)
    }
    addLog("info", "Server deleted")
  }

  const addLog = (type: LogEntry["type"], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    }
    setLogs((prev) => [newLog, ...prev])
  }

  const handleValidateConfig = async (itemKey: string) => {
    setCheckStatuses((prev) => ({ ...prev, [itemKey]: "checking" }))
    addLog("checking", `Validating ${itemKey}...`)

    // Simulate validation - in real app, this would call your backend API
    // which connects via SSH to the server
    setTimeout(() => {
      const isConfigured = Math.random() > 0.5 // Random for demo
      setCheckStatuses((prev) => ({
        ...prev,
        [itemKey]: isConfigured ? "configured" : "not-configured",
      }))
      addLog(
        isConfigured ? "success" : "error",
        `${itemKey}: ${isConfigured ? "Configured ✓" : "Not configured - setup available"}`,
      )
    }, 1500)
  }

  const handleSetupConfig = async (itemKey: string) => {
    addLog("checking", `Setting up ${itemKey}...`)
    setCheckStatuses((prev) => ({ ...prev, [itemKey]: "checking" }))

    // Simulate setup - in real app, this would call your backend API
    // which executes the setup script on the remote server
    setTimeout(() => {
      setCheckStatuses((prev) => ({ ...prev, [itemKey]: "configured" }))
      addLog("success", `${itemKey}: Setup completed successfully ✓`)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
        <ServerSidebar
          servers={servers}
          selectedServer={selectedServer}
          onSelectServer={setSelectedServer}
          onDeleteServer={handleDeleteServer}
          onShowAddServer={() => setShowAddServer(true)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">VM Configuration Validator</h1>
              {/* <p className="text-muted-foreground mt-1">Validate and configure Oracle VM prerequisites</p> */}
            </div>

            {showAddServer ? (
              <ServerConnectionForm onSubmit={handleAddServer} onCancel={() => setShowAddServer(false)} />
            ) : selectedServer ? (
              <div className="space-y-6">
                {/* Selected Server Info */}
                <Card className="p-4 bg-card border border-border">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">{selectedServer.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedServer.ipAddress}:{selectedServer.sshPort}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        addLog("info", "Testing connection...")
                        setTimeout(() => {
                          addLog("success", "Connection successful ✓")
                        }, 1000)
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Test Connection
                    </Button>
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Checklist */}
                  <div className="lg:col-span-3">
                    <ConfigurationChecklist
                      checkStatuses={checkStatuses}
                      onValidate={handleValidateConfig}
                      onSetup={handleSetupConfig}
                    />
                  </div>

                  {/* Execution Log */}
                  {/* <div className="lg:col-span-1">
                    <ExecutionLog logs={logs} />
                  </div> */}
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center bg-card border border-border">
                <p className="text-muted-foreground mb-4">Select a server from the sidebar or add a new one</p>
                <Button
                  onClick={() => setShowAddServer(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  + Add Server
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
