import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDecision } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

const statusVariant = { pending: "warning", approved: "success", implemented: "default" };

const LEADERSHIP_ROLES = [
  { role: "president", label: "President" },
  { role: "vice_president", label: "Vice President" },
  { role: "pm", label: "Product Manager" },
  { role: "secretary", label: "Secretary" },
  { role: "domain_leader", label: "Domain Leader" },
  { role: "pr", label: "Public Relation (PR)" },
  { role: "mc", label: "Membership Coordinator" },
  { role: "event_organizer", label: "Event Organizer" },
];

function getAssigneeOptions(members) {
  if (!members?.length) return { leadership: [], other: [] };
  const leadershipUserIds = new Set();
  const leadership = [];
  LEADERSHIP_ROLES.forEach(({ role, label }) => {
    const user = members.find((m) => m.role === role);
    if (user && !leadershipUserIds.has(user._id)) {
      leadershipUserIds.add(user._id);
      leadership.push({ ...user, roleLabel: label });
    }
  });
  const other = members.filter((m) => !leadershipUserIds.has(m._id));
  return { leadership, other };
}

function actionItemToPayload(item) {
  const assignees = Array.isArray(item.assignees)
    ? item.assignees.map((a) => (a && (a._id || a)) || a).filter(Boolean)
    : item.assignee
      ? [item.assignee._id || item.assignee]
      : [];
  return {
    task: item.task,
    assignees,
    dueDate: item.dueDate,
    status: item.status || "pending",
  };
}

export default function DecisionDetail({ decision, open, onOpenChange, onDecisionUpdated }) {
  const { user } = useAuth();
  const updateDecision = useUpdateDecision();
  const { data: members } = useMembers({});
  const [newStatus, setNewStatus] = useState("");
  const [newTaskRows, setNewTaskRows] = useState([{ task: "", assigneeIds: [], dueDate: "" }]);
  const isAdmin = ["president", "pm"].includes(user?.role);

  const { leadership, other } = useMemo(() => getAssigneeOptions(members || []), [members]);
  const memberMap = useMemo(() => {
    const m = {};
    (members || []).forEach((u) => { m[u._id] = u; });
    return m;
  }, [members]);

  if (!decision) return null;

  const addAssigneeToRow = (rowIndex, userId) => {
    if (!userId || userId === "_none") return;
    setNewTaskRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex && !row.assigneeIds.includes(userId)
          ? { ...row, assigneeIds: [...row.assigneeIds, userId] }
          : row
      )
    );
  };

  const removeAssigneeFromRow = (rowIndex, userId) => {
    setNewTaskRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, assigneeIds: row.assigneeIds.filter((id) => id !== userId) } : row
      )
    );
  };

  const setRowField = (rowIndex, field, value) => {
    setNewTaskRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row))
    );
  };

  const addTaskRow = () => {
    setNewTaskRows((prev) => [...prev, { task: "", assigneeIds: [], dueDate: "" }]);
  };

  const removeTaskRow = (rowIndex) => {
    setNewTaskRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === decision.status) return;
    try {
      const updated = await updateDecision.mutateAsync({ id: decision._id, status: newStatus });
      toast.success("Status updated");
      setNewStatus("");
      onDecisionUpdated?.(updated);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAddActionItems = async () => {
    const validRows = newTaskRows.filter(
      (r) => r.task.trim() && r.assigneeIds.length > 0 && r.dueDate
    );
    if (validRows.length === 0) {
      toast.error("Add at least one task with assignees and due date");
      return;
    }
    try {
      const existing = (decision.actionItems || []).map(actionItemToPayload);
      const newItems = validRows.map((r) => ({
        task: r.task.trim(),
        assignees: r.assigneeIds,
        dueDate: r.dueDate,
        status: "pending",
      }));
      const items = [...existing, ...newItems];
      const updated = await updateDecision.mutateAsync({ id: decision._id, actionItems: items });
      toast.success("Next steps added");
      setNewTaskRows([{ task: "", assigneeIds: [], dueDate: "" }]);
      onDecisionUpdated?.(updated);
    } catch {
      toast.error("Failed to add next steps");
    }
  };

  const handleToggleActionItem = async (index) => {
    const items = (decision.actionItems || []).map((item, i) => {
      const payload = actionItemToPayload(item);
      if (i === index) {
        payload.status = payload.status === "done" ? "pending" : "done";
      }
      return payload;
    });
    try {
      const updated = await updateDecision.mutateAsync({ id: decision._id, actionItems: items });
      toast.success("Updated");
      onDecisionUpdated?.(updated);
    } catch {
      toast.error("Failed to update");
    }
  };

  const stakeholderNames = (decision.stakeholders || []).map((s) =>
    typeof s === "object" && s?.name ? s.name : s
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{decision.title}</SheetTitle>
          <SheetDescription>Created {format(new Date(decision.createdAt), "MMM d, yyyy")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{decision.category}</Badge>
            <Badge variant={statusVariant[decision.status]}>{decision.status}</Badge>
          </div>

          {(decision.startDate || decision.endDate) && (
            <p className="text-sm text-muted-foreground">
              {decision.startDate && format(new Date(decision.startDate), "MMM d, yyyy")}
              {decision.startDate && decision.endDate && " — "}
              {decision.endDate && format(new Date(decision.endDate), "MMM d, yyyy")}
            </p>
          )}

          {decision.description && (
            <p className="text-sm text-muted-foreground">{decision.description}</p>
          )}

          {stakeholderNames.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium">Stakeholders</p>
              <div className="flex flex-wrap gap-1">
                {stakeholderNames.map((name, i) => (
                  <Badge key={i} variant="secondary">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusChange} disabled={updateDecision.isPending || !newStatus}>
                  Update
                </Button>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">Next steps</h3>
            {decision.actionItems?.length > 0 ? (
              <div className="space-y-2">
                {decision.actionItems.map((item, i) => {
                  const assignees = item.assignees || (item.assignee ? [item.assignee] : []);
                  const names = assignees.map((a) => (a?.name ? a.name : a)).filter(Boolean);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-md border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.task}</p>
                        <p className="text-xs text-muted-foreground">
                          {names.length ? names.join(", ") : "—"} · Due{" "}
                          {item.dueDate && format(new Date(item.dueDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === "done" ? "default" : "secondary"}>
                          {item.status || "pending"}
                        </Badge>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActionItem(i)}
                            disabled={updateDecision.isPending}
                          >
                            {item.status === "done" ? "Reopen" : "Done"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No next steps yet.</p>
            )}
            {isAdmin && (
              <div className="mt-3 space-y-4 rounded-md border border-dashed p-3">
                <Label className="text-xs">Add next step(s)</Label>
                {newTaskRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="space-y-2 rounded border p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Task {newTaskRows.length > 1 ? rowIndex + 1 : ""}</span>
                      {newTaskRows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => removeTaskRow(rowIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Task description"
                      value={row.task}
                      onChange={(e) => setRowField(rowIndex, "task", e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1">
                      {row.assigneeIds.map((id) => (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          {memberMap[id]?.name || id}
                          <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-muted"
                            onClick={() => removeAssigneeFromRow(rowIndex, id)}
                            aria-label="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        if (v && v !== "_none" && !v.startsWith("_header")) addAssigneeToRow(rowIndex, v);
                      }}
                      key={`assignee-${rowIndex}-${row.assigneeIds.length}`}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to (leadership or Other)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leadership.length > 0 && (
                          <>
                            <SelectItem value="_header_leadership" disabled className="font-semibold">
                              Leadership
                            </SelectItem>
                            {leadership
                              .filter((u) => !row.assigneeIds.includes(u._id))
                              .map((u) => (
                                <SelectItem key={u._id} value={u._id}>
                                  {u.roleLabel} — {u.name}
                                </SelectItem>
                              ))}
                          </>
                        )}
                        {other.length > 0 && (
                          <>
                            <SelectItem value="_header_other" disabled className="font-semibold">
                              Other
                            </SelectItem>
                            {other
                              .filter((u) => !row.assigneeIds.includes(u._id))
                              .map((u) => (
                                <SelectItem key={u._id} value={u._id}>
                                  {u.name}
                                </SelectItem>
                              ))}
                          </>
                        )}
                        {leadership.length === 0 && other.length === 0 && (
                          <SelectItem value="_none" disabled>No users</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => setRowField(rowIndex, "dueDate", e.target.value)}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTaskRow}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add another task
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddActionItems}
                    disabled={updateDecision.isPending}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">Timeline</h3>
            {decision.timeline?.length > 0 ? (
              <div className="space-y-3">
                {decision.timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border p-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[entry.status]} className="text-xs">{entry.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.changedAt), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      {entry.notes && <p className="mt-1 text-sm">{entry.notes}</p>}
                      <p className="text-xs text-muted-foreground">by {entry.changedBy?.name || "System"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
