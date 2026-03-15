import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import DecisionTable from "@/components/decisions/DecisionTable";
import DecisionFilters from "@/components/decisions/DecisionFilters";
import DecisionDetail from "@/components/decisions/DecisionDetail";
import CreateDecisionDialog from "@/components/decisions/CreateDecisionDialog";
import ScheduleCalendar from "@/components/decisions/ScheduleCalendar";
import RoleGate from "@/components/shared/RoleGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, List, CalendarDays } from "lucide-react";
import { useDecisions, useDecision } from "@/hooks/useDecisions";

export default function Reports() {
  const location = useLocation();
  const navigate = useNavigate();
  const openDecisionId = location.state?.openDecisionId;
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: decisions, isLoading } = useDecisions({
    category: category || undefined,
    status: status || undefined,
  });
  const { data: decisionById } = useDecision(openDecisionId || null);

  useEffect(() => {
    if (openDecisionId && decisionById) {
      setSelectedDecision(decisionById);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [openDecisionId, decisionById, navigate, location.pathname]);

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

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Schedule
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <DecisionFilters
            category={category}
            status={status}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
          />
          <DecisionTable decisions={decisions} isLoading={isLoading} onRowClick={setSelectedDecision} />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleCalendar />
        </TabsContent>
      </Tabs>

      <DecisionDetail
        key={selectedDecision ? `${selectedDecision._id}-${(selectedDecision.actionItems || []).length}` : "none"}
        decision={selectedDecision}
        open={!!selectedDecision}
        onOpenChange={(open) => !open && setSelectedDecision(null)}
        onDecisionUpdated={(updated) => {
          if (!updated) {
            setSelectedDecision(null);
            return;
          }
          setSelectedDecision({
            ...updated,
            actionItems: Array.isArray(updated.actionItems) ? [...updated.actionItems] : [],
          });
        }}
      />

      <CreateDecisionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
