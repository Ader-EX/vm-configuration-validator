"use client"

import { useState, useEffect } from "react"
import ServerSidebar from "@/components/server-sidebar"
import ServerConnectionForm from "@/components/server-connection-form"
import ConfigurationChecklist from "@/components/configuration-checklist"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { sshService } from "@/services/ssh-services"
import toast from 'react-hot-toast';
import axios, { AxiosError } from "axios"
import ExecutionLog from "@/components/execution-log"
import useLogStore from "@/store/log-store"

export type Server = {
  id: any
  name: string
  address: string
  port: number
  password : string
  username: string
  ssh_key : File
  passphrase: string
  userGroup: number
  ulimit: number
  securityLimits: number
  sysctl: number
  jvm: number
  threadPool: number
  garbageCollector: number

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
  const { responseLog  }  = useLogStore();
  const [checkStatuses, setCheckStatuses] = useState<Record<string, "checking" | "configured" | "not-configured">>({
    userGroup: "not-configured",
    ulimit: "not-configured",
    securityLimits: "not-configured",
    sysctl: "not-configured",
    jvm: "not-configured",
    threadPool: "not-configured",
    garbageCollector: "not-configured",
  })

  const loadServers = async () => {
    const serverData = await sshService.getAllData();

    if (serverData) {
      setServers(serverData);  
    }
  };
useEffect(() => {
  loadServers();
}, []);

  useEffect(() => {
    localStorage.setItem("vm-servers", JSON.stringify(servers))
  }, [servers])

const handleAddServer = async (server: Server) => {
  try {
    const formData = new FormData();
    formData.append('name', server.name);
    formData.append('address', server.address);
    formData.append('port', String(server.port));
    formData.append('username', server.username);
    formData.append('password', server.password);
    

    // formData.append('file', sshKeyFile);

    const postData = await sshService.createServer(formData)
    const createdServer = postData;
    setServers([...servers, createdServer]);
    setSelectedServer(createdServer);
    setShowAddServer(false);

    return createdServer;
  } catch (error ) {
     const err = error as AxiosError;
    throw error;
  }
};
  const handleDeleteServer = async (serverId: number) => {
    try {
    const response = await sshService.deleteServer(serverId)
    toast.success("Data successfully deleted")
    loadServers()
    

    } catch (error) {
      toast.error("Something went wrong!")
    }
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
                        {selectedServer.address}:{selectedServer.port}
                      </p>
                    </div>
                   {/* <Button
  onClick={async () => {
    const t = toast.loading("Testing connection...");

    try {
      const result = await sshService.testConnection(Number(selectedServer.id));

      toast.dismiss(t);
      toast.success("Successfully connected!");
    } catch (error) {
      toast.dismiss(t);

      const err = error as Error;
      toast.error(err.message || "Something went wrong");
    }
  }}
  className="bg-primary text-primary-foreground hover:bg-primary/90"
>
  Test Connection
</Button> */}

                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Checklist */}
                  <div className="lg:col-span-2">
                 <ConfigurationChecklist
                 serverId={selectedServer.id}
     serverName={selectedServer.name}
   />
                  </div>

                  {/* Execution Log */}
                  <div className="lg:col-span-1">
                    <ExecutionLog logs={responseLog} />
                  </div>
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
