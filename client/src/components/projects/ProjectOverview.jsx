import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  ExternalLink,
  Edit2,
  Check,
  UserPlus,
  Trash2,
  X,
  Loader2,
  Save,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSetRepoUrl, useUpdateProject } from "@/hooks/useProjects";
import { useMembers, useUpdateMemberProfile } from "@/hooks/useMembers";
import { toast } from "sonner";

export default function ProjectOverview({ project }) {
  const { user } = useAuth();
  const setRepoUrl = useSetRepoUrl();
  const updateProject = useUpdateProject();
  const updateMemberProfile = useUpdateMemberProfile();
  const { data: memberData } = useMembers({}, { enabled: user?.role === "pm" });

  const [editingRepo, setEditingRepo] = useState(false);
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState("");
  const [url, setUrl] = useState(project?.repoUrl || "");
  const [description, setDescription] = useState(project?.description || "");
  const [deadline, setDeadline] = useState(
    project?.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : ""
  );
  const [newMemberId, setNewMemberId] = useState("");
  const [memberForm, setMemberForm] = useState({ name: "", email: "" });

  const allMembers = memberData?.members || [];

  if (!project) return null;

  const isLead =
    project.projectLead && (project.projectLead._id || project.projectLead) === user?._id;
  const isPm = user?.role === "pm";
  const daysLeft = differenceInDays(new Date(project.deadline), new Date());
  const teamMembers = project.members || [];
  const allowedCandidates = allMembers.filter(
    (member) =>
      (member.batch === "batch_2" || member.batch === "batch_3") &&
      !teamMembers.some((teamMember) => (teamMember._id || teamMember).toString() === member._id)
  );

  const syncOverviewState = () => {
    setDescription(project.description || "");
    setDeadline(project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : "");
  };

  const handleSaveOverview = () => {
    updateProject.mutate(
      {
        id: project._id,
        description: description.trim(),
        deadline,
      },
      {
        onSuccess: () => {
          toast.success("Project overview updated");
          setEditingOverview(false);
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update project"),
      }
    );
  };

  const handleAddMember = () => {
    if (!newMemberId) return;
    updateProject.mutate(
      {
        id: project._id,
        members: [...teamMembers.map((m) => m._id || m), newMemberId],
      },
      {
        onSuccess: () => {
          toast.success("Member added to project");
          setNewMemberId("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to add member"),
      }
    );
  };

  const handleRemoveMember = (memberId) => {
    const nextMembers = teamMembers
      .map((member) => member._id || member)
      .filter((id) => id !== memberId);

    const nextLead =
      (project.projectLead?._id || project.projectLead)?.toString() === memberId ? null : project.projectLead?._id || project.projectLead;

    updateProject.mutate(
      {
        id: project._id,
        members: nextMembers,
        projectLead: nextLead,
      },
      {
        onSuccess: () => toast.success("Member removed from project"),
        onError: (err) => toast.error(err.response?.data?.message || "Failed to remove member"),
      }
    );
  };

  const startEditMember = (member) => {
    setEditingMemberId(member._id);
    setMemberForm({ name: member.name || "", email: member.email || "" });
  };

  const handleSaveMember = () => {
    if (!editingMemberId) return;
    updateMemberProfile.mutate(
      {
        id: editingMemberId,
        name: memberForm.name,
        email: memberForm.email,
      },
      {
        onSuccess: () => {
          toast.success("Member profile updated");
          setEditingMemberId("");
          setMemberForm({ name: "", email: "" });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update member"),
      }
    );
  };

  const handleSaveUrl = () => {
    setRepoUrl.mutate(
      { id: project._id, repoUrl: url },
      {
        onSuccess: () => {
          toast.success("Repo URL updated");
          setEditingRepo(false);
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update"),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Charter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Project Charter</CardTitle>
            {isPm && (
              editingOverview ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      syncOverviewState();
                      setEditingOverview(false);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveOverview} disabled={updateProject.isPending}>
                    {updateProject.isPending ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    syncOverviewState();
                    setEditingOverview(true);
                  }}
                >
                  <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit Charter & Deadline
                </Button>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingOverview ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-charter">Project Charter</Label>
                <Textarea
                  id="project-charter"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe project scope, goals, and expectations"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-deadline" className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Extendable Deadline
                </Label>
                <Input
                  id="project-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {project.description || "No project charter description provided."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Time Left */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time Left</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? "Due today" : "Overdue"}
            </div>
            <p className="text-xs text-muted-foreground">
              Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}
            </p>
            {daysLeft < 0 && (
              <Badge variant="destructive" className="mt-1">
                {Math.abs(daysLeft)} days overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const total = project.todos?.length || 0;
              const done = project.todos?.filter((t) => t.status === "done").length || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <>
                  <div className="text-2xl font-bold">{pct}%</div>
                  <p className="text-xs text-muted-foreground">
                    {done}/{total} tasks completed
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Repo Link */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Repository</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {editingRepo ? (
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="h-8 text-xs"
                />
                <Button size="sm" onClick={handleSaveUrl} disabled={setRepoUrl.isPending}>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : project.repoUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-primary underline"
                >
                  {project.repoUrl}
                </a>
                {(isLead || isPm) && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingRepo(true)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">No repo URL set</p>
                {(isLead || isPm) && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditingRepo(true)}>
                    Set Repo URL
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPm && (
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Add Member (Batch 2 & Batch 3 only)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Select member...</option>
                  {allowedCandidates.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMember}
                  disabled={!newMemberId || updateProject.isPending}
                >
                  <UserPlus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {project.projectLead && (
              <Badge variant="default">
                ★ {project.projectLead.name || "Lead"} (Lead)
              </Badge>
            )}

            {(project.members || []).map((member) => {
              const memberId = member._id || member;
              const isEditingMember = editingMemberId === memberId;

              return (
                <div key={memberId} className="rounded-md border p-3">
                  {isEditingMember ? (
                    <div className="space-y-2">
                      <Input
                        value={memberForm.name}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Member name"
                      />
                      <Input
                        value={memberForm.email}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Member email"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveMember}
                          disabled={updateMemberProfile.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMemberId("");
                            setMemberForm({ name: "", email: "" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{member.name || memberId}</p>
                        <p className="text-xs text-muted-foreground">{member.email || "No email"}</p>
                        <p className="text-xs text-muted-foreground">{member.batch || "N/A"}</p>
                      </div>
                      {isPm && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditMember(member)}>
                            <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMember(memberId)}
                            disabled={updateProject.isPending}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(!project.members || project.members.length === 0) && !project.projectLead && (
              <p className="text-sm text-muted-foreground">No team members assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
