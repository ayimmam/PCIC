import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, MessageSquare } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingState";

const statusVariant = { pending: "warning", approved: "success", rejected: "destructive" };

export default function CandidateList({ candidates, isLoading, showActions = false, onReview }) {
  if (isLoading) return <LoadingTable rows={5} cols={6} />;
  if (!candidates?.length) return <EmptyState title="No candidates" message="No applications have been submitted yet." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Portfolio</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Note</TableHead>
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
                  <a href={c.portfolioUrl.startsWith("http") ? c.portfolioUrl : `/${c.portfolioUrl}`} target="_blank" rel="noopener noreferrer">
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
            <TableCell className="max-w-[200px]">
              {c.reviewComment ? (
                <div
                  className="flex items-start gap-1.5 text-sm text-muted-foreground"
                  title={c.reviewComment}
                >
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">{c.reviewComment}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            {showActions && c.status === "pending" && (
              <TableCell className="text-right">
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => onReview?.(c)}>
                    <Eye className="mr-1 h-3 w-3" /> Review
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
