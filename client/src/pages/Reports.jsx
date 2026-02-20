import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import DecisionTable from "@/components/decisions/DecisionTable";
import DecisionFilters from "@/components/decisions/DecisionFilters";
import DecisionDetail from "@/components/decisions/DecisionDetail";
import CreateDecisionDialog from "@/components/decisions/CreateDecisionDialog";
import RoleGate from "@/components/shared/RoleGate";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

export default function Reports() {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: decisions, isLoading } = useDecisions({
    category: category || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decision Repository"
        subtitle="Track executive meeting decisions and their status"
        action={
          <RoleGate allowedRoles={["president", "pm"]}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Decision
            </Button>
          </RoleGate>
        }
      />

      <DecisionFilters
        category={category}
        status={status}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
      />

      <DecisionTable decisions={decisions} isLoading={isLoading} onRowClick={setSelectedDecision} />

      <DecisionDetail
        decision={selectedDecision}
        open={!!selectedDecision}
        onOpenChange={(open) => !open && setSelectedDecision(null)}
      />

      <CreateDecisionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
