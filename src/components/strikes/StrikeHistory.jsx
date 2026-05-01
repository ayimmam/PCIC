import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function StrikeHistory({ strikes = [], showMember = false }) {
  if (!strikes.length) {
    return <EmptyState icon={AlertTriangle} title="No strikes" message="This member has no strikes." />;
  }

  return (
    <div className="space-y-3">
      {strikes.map((strike) => (
        <div key={strike._id} className="flex gap-3 rounded-md border p-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium">{strike.reason}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{format(new Date(strike.createdAt), "MMM d, yyyy")}</span>
              <span>Assigned by {strike.assignedBy?.name || "Unknown"}</span>
              {showMember && <span>To: {strike.memberId?.name || "Unknown"}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
