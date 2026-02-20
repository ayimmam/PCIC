import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StrikeBadge from "@/components/strikes/StrikeBadge";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingState";
import { Users } from "lucide-react";

const statusVariant = { active: "success", warning: "warning", inactive: "danger" };
const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function MemberTable({ members, isLoading, strikeCounts = {}, onRowClick }) {
  if (isLoading) return <LoadingTable rows={8} cols={5} />;
  if (!members?.length) return <EmptyState icon={Users} title="No members" message="No members match your filters." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Strikes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m._id} className="cursor-pointer" onClick={() => onRowClick?.(m)}>
            <TableCell>
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
            </TableCell>
            <TableCell>{batchLabels[m.batch] || m.batch}</TableCell>
            <TableCell><Badge variant="outline">{m.domain}</Badge></TableCell>
            <TableCell><Badge variant={statusVariant[m.status]}>{m.status}</Badge></TableCell>
            <TableCell><StrikeBadge count={strikeCounts[m._id] || 0} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
