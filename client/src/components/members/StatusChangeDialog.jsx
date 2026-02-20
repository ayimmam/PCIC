import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useUpdateMemberStatus } from "@/hooks/useMembers";
import { toast } from "sonner";

const statusVariant = { active: "success", warning: "warning", inactive: "danger" };

export default function StatusChangeDialog({ open, onOpenChange, member }) {
  const [newStatus, setNewStatus] = useState("");
  const updateStatus = useUpdateMemberStatus();

  const handleConfirm = async () => {
    if (!newStatus || !member) return;
    try {
      await updateStatus.mutateAsync({ id: member._id, status: newStatus });
      toast.success(`${member.name}'s status updated to ${newStatus}`);
      setNewStatus("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Member Status</DialogTitle>
          <DialogDescription>
            Update the membership status for {member?.name}. Warning status triggers an email notification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <span className="text-sm font-medium">{member?.name}</span>
            <Badge variant={statusVariant[member?.status]}>{member?.status}</Badge>
          </div>

          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {newStatus === "warning" && (
            <p className="text-sm text-yellow-600">A warning email will be sent to {member?.email}.</p>
          )}
          {newStatus === "inactive" && (
            <p className="text-sm text-destructive">This will mark the member as inactive.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={updateStatus.isPending || !newStatus || newStatus === member?.status}
            variant={newStatus === "inactive" ? "destructive" : "default"}
          >
            {updateStatus.isPending ? "Updating..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
