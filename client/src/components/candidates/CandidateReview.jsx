import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PortfolioPreview from "./PortfolioPreview";
import { useApproveCandidate, useRejectCandidate } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const statusVariant = { pending: "warning", approved: "success", rejected: "destructive" };

export default function CandidateReview({ candidate, open, onOpenChange }) {
  const { user } = useAuth();
  const approve = useApproveCandidate();
  const reject = useRejectCandidate();
  const isPresident = user?.role === "president";

  if (!candidate) return null;

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(candidate._id);
      toast.success("Candidate approved");
      onOpenChange(false);
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async () => {
    try {
      await reject.mutateAsync(candidate._id);
      toast.success("Candidate rejected");
      onOpenChange(false);
    } catch {
      toast.error("Rejection failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{candidate.name}</SheetTitle>
          <SheetDescription>{candidate.email}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[candidate.status]}>{candidate.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Applied {format(new Date(candidate.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          {candidate.motivation && (
            <div>
              <p className="mb-1 text-sm font-medium">Motivation</p>
              <p className="text-sm text-muted-foreground">{candidate.motivation}</p>
            </div>
          )}

          <Separator />

          {candidate.portfolioUrl && (
            <PortfolioPreview url={candidate.portfolioUrl} />
          )}

          {candidate.resumeUrl && (
            <div>
              <p className="mb-2 text-sm font-medium">Resume</p>
              <PortfolioPreview url={candidate.resumeUrl} />
            </div>
          )}

          {isPresident && candidate.status === "pending" && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button onClick={handleApprove} disabled={approve.isPending} className="flex-1">
                  {approve.isPending ? "Approving..." : "Approve"}
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={reject.isPending} className="flex-1">
                  {reject.isPending ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
