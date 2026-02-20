import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAssignStrike } from "@/hooks/useStrikes";
import { toast } from "sonner";

export default function AssignStrikeDialog({ open, onOpenChange, member }) {
  const [reason, setReason] = useState("");
  const assignStrike = useAssignStrike();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member || !reason.trim()) return;

    try {
      await assignStrike.mutateAsync({ memberId: member._id, reason });
      toast.success(`Strike assigned to ${member.name}`);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign strike");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Strike</DialogTitle>
          <DialogDescription>
            Assign a disciplinary strike to {member?.name || "this member"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">{member?.name}</p>
            <p className="text-sm text-muted-foreground">{member?.email}</p>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for this strike..."
              required
            />
          </div>
          <Button type="submit" variant="destructive" className="w-full" disabled={assignStrike.isPending}>
            {assignStrike.isPending ? "Assigning..." : "Assign Strike"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
