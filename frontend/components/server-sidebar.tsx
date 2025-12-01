"use client"
import { Button } from "@/components/ui/button"
import { Trash2, ServerIcon, Plus } from "lucide-react"
import type { Server } from "@/app/page"

interface ServerSidebarProps {
  servers: Server[]
  selectedServer: Server | null
  onSelectServer: (server: Server) => void
  onDeleteServer: (serverId: number) => void
  onShowAddServer: () => void
}

export default function ServerSidebar({
  servers,
  selectedServer,
  onSelectServer,
  onDeleteServer,
  onShowAddServer,
}: ServerSidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground flex items-center gap-2">
          Server List 
        </h2>
      </div>
      
      {/* Server List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {servers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No servers added yet</p>
        ) : (
          servers
            .filter(server => server && server.id !== undefined) // Filter out any invalid servers
            .map((server) => (
              <div
                key={server.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedServer?.id === server.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
                }`}
                onClick={() => onSelectServer(server)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{server.name}</p>
                    <p className="text-xs opacity-75 truncate">{server.address}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteServer(server.id)
                    }}
                    className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
                    aria-label="Delete server"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
      
      {/* Add Server Button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={onShowAddServer}
          className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </Button>
      </div>
    </aside>
  )
}