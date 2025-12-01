import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface DialogUserGroupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { username: string; group: string; password: string }) => Promise<void>
  defaultValues?: {
    username?: string
    group?: string
    password?: string
  }
  isLoading?: boolean
  mode?: "validate" | "setup"
}

export function DialogUserGroup({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultValues = {},
  isLoading = false,
  mode = "setup"
}: DialogUserGroupProps) {
  const [formData, setFormData] = useState({
    username: defaultValues.username || "wmuser",
    group: defaultValues.group || "wmuser",
    password: defaultValues.password || ""
  })

  const handleSubmit = async () => {
    if (!formData.username || !formData.group) {
      return
    }
    if (mode === "setup" && !formData.password) {
      return
    }
    await onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "validate" ? "Validate User Group" : "Setup User Group"}</DialogTitle>
          <DialogDescription>
            {mode === "validate" 
              ? "Enter the user and group credentials to validate the configuration."
              : "Configure the user and group for system setup. These credentials will be used for all configurations."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-3">
            <Label htmlFor="user">User</Label>
            <Input 
              id="user"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="user-group">User Group</Label>
            <Input 
              id="user-group"
              value={formData.group}
              onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          {mode === "setup" && (
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "validate" ? "Validate" : "Save & Setup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}