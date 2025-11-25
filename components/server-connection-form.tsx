"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Server } from "@/app/page"

interface ServerConnectionFormProps {
  onSubmit: (server: Server) => void
  onCancel: () => void
}

export default function ServerConnectionForm({ onSubmit, onCancel }: ServerConnectionFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    sshPort: 22,
    username: "root",
    sshKey: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sshPort" ? Number.parseInt(value) : value,
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          sshKey: e.target?.result as string,
        }))
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.ipAddress || !formData.sshKey) {
      alert("Please fill in all required fields")
      return
    }

    const newServer: Server = {
      id: Date.now().toString(),
      name: formData.name,
      ipAddress: formData.ipAddress,
      sshPort: formData.sshPort,
      username: formData.username,
      sshKey: formData.sshKey,
    }

    onSubmit(newServer)
  }

  return (
    <Card className="p-6 bg-card border border-border max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Add Server Connection</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Server Name *</label>
          <Input
            type="text"
            name="name"
            placeholder="e.g., Production Oracle VM"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-input border border-border text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">IP Address *</label>
            <Input
              type="text"
              name="ipAddress"
              placeholder="192.168.1.100"
              value={formData.ipAddress}
              onChange={handleChange}
              className="w-full bg-input border border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SSH Port</label>
            <Input
              type="number"
              name="sshPort"
              value={formData.sshPort}
              onChange={handleChange}
              className="w-full bg-input border border-border text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full bg-input border border-border text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">SSH Key (Private Key) *</label>
          <div className="space-y-2">
            <Input
              type="file"
              onChange={handleFileUpload}
              accept=".pem,.key"
              className="w-full bg-input border border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">Upload your private SSH key (.pem or .key file)</p>
            {formData.sshKey && <p className="text-xs text-green-600 dark:text-green-400">✓ Key loaded</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" onClick={onCancel} className="bg-muted text-foreground hover:bg-muted/80">
            Cancel
          </Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Server
          </Button>
        </div>
      </form>
    </Card>
  )
}
