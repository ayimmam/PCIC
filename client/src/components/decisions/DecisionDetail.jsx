import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDecision } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

const statusVariant = { pending: "warning", approved: "success", implemented: "default" };

export default function DecisionDetail({ decision, open, onOpenChange }) {
  const { user } = useAuth();
  const updateDecision = useUpdateDecision();
  const [newStatus, setNewStatus] = useState("");
  const isAdmin = ["president", "pm"].includes(user?.role);

  if (!decision) return null;

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === decision.status) return;
    try {
      await updateDecision.mutateAsync({ id: decision._id, status: newStatus });
      toast.success("Status updated");
      setNewStatus("");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{decision.title}</SheetTitle>
          <SheetDescription>Created {format(new Date(decision.createdAt), "MMM d, yyyy")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{decision.category}</Badge>
            <Badge variant={statusVariant[decision.status]}>{decision.status}</Badge>
          </div>

          {decision.description && (
            <p className="text-sm text-muted-foreground">{decision.description}</p>
          )}

          {decision.stakeholders?.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium">Stakeholders</p>
              <div className="flex flex-wrap gap-1">
                {decision.stakeholders.map((s, i) => (
                  <Badge key={i} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusChange} disabled={updateDecision.isPending || !newStatus}>
                  Update
                </Button>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">Timeline</h3>
            {decision.timeline?.length > 0 ? (
              <div className="space-y-3">
                {decision.timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border p-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[entry.status]} className="text-xs">{entry.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.changedAt), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      {entry.notes && <p className="mt-1 text-sm">{entry.notes}</p>}
                      <p className="text-xs text-muted-foreground">by {entry.changedBy?.name || "System"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
