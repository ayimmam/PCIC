import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StrikeBadge from "@/components/strikes/StrikeBadge";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingState";
import { Users, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRequestDismissFlag, useApproveDismissFlag } from "@/hooks/useMembers";

const statusVariant = { active: "success", warning: "warning", inactive: "danger", suspended: "destructive" };
const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function MemberTable({ members, isLoading, strikeCounts = {}, onRowClick, onAssignStrike }) {
  const { user } = useAuth();
  const requestDismiss = useRequestDismissFlag();
  const approveDismiss = useApproveDismissFlag();

  if (isLoading) return <LoadingTable rows={8} cols={6} />;
  if (!members?.length) return <EmptyState icon={Users} title="No members" message="No members match your filters." />;

  const isLeader = ["president", "pm", "mc"].includes(user?.role);

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead className="hidden md:table-cell">Domain</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Strikes</TableHead>
          {isLeader && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => {
          const canAssignStrike = isLeader;
          const canRequestDismiss = m.isFlagged && m.flagAssignedBy === user?._id && !m.dismissFlagRequested;
          const canApproveDismiss = m.dismissFlagRequested && user?.role === "president";

          return (
            <TableRow key={m._id} className="cursor-pointer" onClick={() => onRowClick?.(m)}>
              <TableCell>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {m.name} 
                    {m.isFlagged && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {m.dismissFlagRequested && <span className="text-xs text-warning border border-warning px-1 rounded">Pending Dismissal</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </TableCell>
              <TableCell>{batchLabels[m.batch] || m.batch}</TableCell>
              <TableCell className="hidden md:table-cell"><Badge variant="outline">{m.domain}</Badge></TableCell>
              <TableCell><Badge variant={statusVariant[m.status] || "secondary"}>{m.status}</Badge></TableCell>
              <TableCell className="hidden md:table-cell"><StrikeBadge count={strikeCounts[m._id] || 0} /></TableCell>
              
              {isLeader && (
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {canAssignStrike && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => onAssignStrike?.(m)}
                      >
                        Assign Strike
                      </Button>
                    )}
                    
                    {canRequestDismiss && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={requestDismiss.isPending}
                        onClick={() => requestDismiss.mutate(m._id)}
                      >
                        Request Dismiss
                      </Button>
                    )}

                    {canApproveDismiss && (
                      <Button 
                        size="sm" 
                        variant="default"
                        disabled={approveDismiss.isPending}
                        onClick={() => approveDismiss.mutate(m._id)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" /> Approve Dismiss
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
}
