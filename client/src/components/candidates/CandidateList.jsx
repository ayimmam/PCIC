import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Check, X } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingState";
import { useApproveCandidate, useRejectCandidate } from "@/hooks/useCandidates";
import { toast } from "sonner";

const statusVariant = { pending: "warning", approved: "success", rejected: "destructive" };

export default function CandidateList({ candidates, isLoading, showActions = false, onReview }) {
  const approve = useApproveCandidate();
  const reject = useRejectCandidate();

  if (isLoading) return <LoadingTable rows={5} cols={5} />;
  if (!candidates?.length) return <EmptyState title="No candidates" message="No applications have been submitted yet." />;

  const handleApprove = async (id) => {
    try {
      await approve.mutateAsync(id);
      toast.success("Candidate approved");
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await reject.mutateAsync(id);
      toast.success("Candidate rejected");
    } catch {
      toast.error("Rejection failed");
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Portfolio</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((c) => (
          <TableRow key={c._id} className={onReview ? "cursor-pointer" : ""} onClick={() => onReview?.(c)}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>{c.email}</TableCell>
            <TableCell>{format(new Date(c.createdAt), "MMM d, yyyy")}</TableCell>
            <TableCell>
              {c.portfolioUrl ? (
                <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                  <a href={`/${c.portfolioUrl}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" /> View
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
            </TableCell>
            {showActions && c.status === "pending" && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => handleApprove(c._id)} disabled={approve.isPending}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(c._id)} disabled={reject.isPending}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </div>
              </TableCell>
            )}
            {showActions && c.status !== "pending" && <TableCell />}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
