import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateMemberBatch } from "@/hooks/useMembers";
import { toast } from "sonner";

const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function BatchChangeDialog({ open, onOpenChange, member }) {
  const [newBatch, setNewBatch] = useState("");
  const updateBatch = useUpdateMemberBatch();

  const handleConfirm = async () => {
    if (!newBatch || !member) return;
    try {
      await updateBatch.mutateAsync({ id: member._id, batch: newBatch });
      toast.success(`${member.name}'s batch updated to ${batchLabels[newBatch] || newBatch}`);
      setNewBatch("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update batch");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Member Level</DialogTitle>
          <DialogDescription>
            Promote or demote the member&apos;s batch when a portfolio issue is detected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <span className="text-sm font-medium">{member?.name}</span>
            <Badge variant="secondary">{batchLabels[member?.batch] || member?.batch}</Badge>
          </div>

          <Select value={newBatch} onValueChange={setNewBatch}>
            <SelectTrigger>
              <SelectValue placeholder="Select new batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="batch_1">Batch 1</SelectItem>
              <SelectItem value="batch_2">Batch 2</SelectItem>
              <SelectItem value="batch_3">Batch 3</SelectItem>
            </SelectContent>
          </Select>

          <p className="text-sm text-muted-foreground">
            Demotions should be accompanied by an explanation in the Decisions repository.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={updateBatch.isPending || !newBatch || newBatch === member?.batch}
            variant="destructive"
          >
            {updateBatch.isPending ? "Updating..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

