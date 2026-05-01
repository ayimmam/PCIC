import { format } from "date-fns";
import { AlertTriangle, Trash2, CheckCircle } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useRequestDeleteStrike, useApproveDeleteStrike } from "@/hooks/useStrikes";
import { Button } from "@/components/ui/button";

export default function StrikeHistory({ strikes = [], showMember = false }) {
  const { user } = useAuth();
  const requestDelete = useRequestDeleteStrike();
  const approveDelete = useApproveDeleteStrike();

  if (!strikes.length) {
    return <EmptyState icon={AlertTriangle} title="No strikes" message="This member has no strikes." />;
  }

  return (
    <div className="space-y-3">
      {strikes.map((strike) => {
        const canRequestDelete = user?._id === strike.assignedBy?._id && !strike.deleteRequested;
        const canApproveDelete = user?.role === "president" && strike.deleteRequested;
        const isPendingDelete = strike.deleteRequested;

        return (
          <div key={strike._id} className={`flex items-start gap-3 rounded-md border p-3 ${isPendingDelete ? "bg-muted/50 border-warning" : ""}`}>
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isPendingDelete ? "bg-warning" : "bg-destructive"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {strike.reason} {isPendingDelete && <span className="text-warning ml-2">(Pending Deletion)</span>}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(strike.createdAt), "MMM d, yyyy")}</span>
                <span>Assigned by {strike.assignedBy?.name || "Unknown"}</span>
                {showMember && <span>To: {strike.memberId?.name || "Unknown"}</span>}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0">
              {canRequestDelete && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => requestDelete.mutate(strike._id)}
                  disabled={requestDelete.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Request Delete
                </Button>
              )}
              {canApproveDelete && (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => approveDelete.mutate(strike._id)}
                  disabled={approveDelete.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve Delete
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
