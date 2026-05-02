import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StrikeBadge from "@/components/strikes/StrikeBadge";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingState";
import { AlertTriangle, ShieldAlert, Users } from "lucide-react";
import { getMemberFlagLabel } from "@/lib/strikePolicy";

const statusVariant = { active: "success", warning: "warning", inactive: "danger" };
const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function MemberTable({
  members,
  isLoading,
  strikeCounts = {},
  onRowClick,
  canAssignStrikes = false,
  onStrikeClick,
}) {
  if (isLoading) return <LoadingTable rows={8} cols={5} />;
  if (!members?.length) return <EmptyState icon={Users} title="No members" message="No members match your filters." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Strikes</TableHead>
          <TableHead>Flag</TableHead>
          {canAssignStrikes && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow
            key={m._id}
            className={`cursor-pointer ${m.isFlagged ? "bg-red-50/70" : ""}`}
            onClick={() => onRowClick?.(m)}
          >
            <TableCell>
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
                <p className="text-xs text-muted-foreground">ID: {m._id}</p>
              </div>
            </TableCell>
            <TableCell>{batchLabels[m.batch] || m.batch}</TableCell>
            <TableCell><Badge variant="outline">{m.domain}</Badge></TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">
                {m.role?.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell><Badge variant={statusVariant[m.status]}>{m.status}</Badge></TableCell>
            <TableCell><StrikeBadge count={m.strikeCount ?? strikeCounts[m._id] ?? 0} /></TableCell>
            <TableCell>
              {m.isFlagged ? (
                <Badge variant="danger" className="inline-flex gap-1">
                  <ShieldAlert className="h-3 w-3" /> {getMemberFlagLabel(m.strikeCount)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Clear</span>
              )}
            </TableCell>
            {canAssignStrikes && (
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStrikeClick?.(m);
                  }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Strike
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
