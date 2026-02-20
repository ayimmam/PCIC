import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingState";
import { FileText } from "lucide-react";

const statusVariant = { pending: "warning", approved: "success", implemented: "default" };
const categoryLabels = {
  "exam-schedule": "Exam Schedule",
  holiday: "Holiday",
  stakeholder: "Stakeholder",
  "project-progress": "Project Progress",
  learning: "Learning",
};

export default function DecisionTable({ decisions, isLoading, onRowClick }) {
  if (isLoading) return <LoadingTable rows={5} cols={5} />;

  if (!decisions?.length) {
    return <EmptyState icon={FileText} title="No decisions" message="No decisions match your filters." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Author</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {decisions.map((d) => (
          <TableRow key={d._id} className="cursor-pointer" onClick={() => onRowClick?.(d)}>
            <TableCell className="font-medium">{d.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{categoryLabels[d.category] || d.category}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[d.status] || "secondary"}>{d.status}</Badge>
            </TableCell>
            <TableCell>{format(new Date(d.createdAt), "MMM d, yyyy")}</TableCell>
            <TableCell>{d.author?.name || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
