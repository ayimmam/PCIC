import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PortfolioPreview from "./PortfolioPreview";
import { useApproveCandidate, useRejectCandidate } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

const statusVariant = { pending: "warning", approved: "success", rejected: "destructive" };

export default function CandidateReview({ candidate, open, onOpenChange }) {
  const { user } = useAuth();
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'approve' | 'reject'
  const [reasonMessage, setReasonMessage] = useState("");
  const approve = useApproveCandidate();
  const reject = useRejectCandidate();
  const isPresident = user?.role === "president";

  useEffect(() => {
    if (!open) {
      setReasonDialogOpen(false);
      setPendingAction(null);
      setReasonMessage("");
    }
  }, [open]);

  const openReasonDialog = (action) => {
    setPendingAction(action);
    setReasonMessage("");
    setReasonDialogOpen(true);
  };

  const closeReasonDialog = () => {
    setReasonDialogOpen(false);
    setPendingAction(null);
    setReasonMessage("");
  };

  const handleConfirmWithReason = async () => {
    const comment = reasonMessage.trim();
    if (pendingAction === "approve") {
      try {
        await approve.mutateAsync({ id: candidate._id, comment });
        toast.success("Candidate approved");
        closeReasonDialog();
        onOpenChange(false);
      } catch {
        toast.error("Approval failed");
      }
    } else if (pendingAction === "reject") {
      try {
        await reject.mutateAsync({ id: candidate._id, comment });
        toast.success("Candidate rejected");
        closeReasonDialog();
        onOpenChange(false);
      } catch {
        toast.error("Rejection failed");
      }
    }
  };

  if (!candidate) return null;

  return (
    <>
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

          {(candidate.status === "approved" || candidate.status === "rejected") && candidate.reviewComment && (
            <>
              <Separator />
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  President&apos;s message
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.reviewComment}</p>
              </div>
            </>
          )}

          {isPresident && candidate.status === "pending" && (
            <>
              <Separator />
              <div className="flex gap-2 rounded-lg border bg-muted/30 p-3">
                <Button onClick={() => openReasonDialog("approve")} className="flex-1">
                  Approve
                </Button>
                <Button variant="destructive" onClick={() => openReasonDialog("reject")} className="flex-1">
                  Reject
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={reasonDialogOpen} onOpenChange={(open) => !open && closeReasonDialog()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={closeReasonDialog}>
        <DialogHeader>
          <DialogTitle>
            {pendingAction === "approve" ? "Why approve?" : "Why reject?"}
          </DialogTitle>
          <DialogDescription>
            Your message will be visible to the applicant and the MC so they know the reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reason-message">Message (optional but recommended)</Label>
          <Textarea
            id="reason-message"
            placeholder="Explain why this application is approved or rejected..."
            value={reasonMessage}
            onChange={(e) => setReasonMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeReasonDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmWithReason}
            disabled={
              (pendingAction === "approve" && approve.isPending) ||
              (pendingAction === "reject" && reject.isPending)
            }
            variant={pendingAction === "reject" ? "destructive" : "default"}
          >
            {pendingAction === "approve"
              ? approve.isPending
                ? "Approving..."
                : "Confirm approve"
              : reject.isPending
                ? "Rejecting..."
                : "Confirm reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
