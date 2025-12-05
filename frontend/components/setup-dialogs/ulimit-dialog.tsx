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

interface DialogULimitProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { username: string }, itemKey : string) => Promise<void>
  defaultValues?: {
    username?: string
  }
  isLoading?: boolean
  mode?: "validate" | "setup"
}

export function DialogULimit({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultValues = {},
  isLoading = false,
  mode = "setup"
}: DialogULimitProps) {
  const [formData, setFormData] = useState({
    username: defaultValues.username || "wmuser",
  })

  const handleSubmit = async () => {
    if (!formData.username ) {
      return
    }
    if (mode === "setup" ) {
      return
    }
    await onSubmit(formData, "ulimit")
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
            <Label htmlFor="user">Username</Label>
            <Input 
              id="user"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              disabled={isLoading}
            />
          </div>
       
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