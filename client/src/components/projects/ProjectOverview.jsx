import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, ExternalLink, Edit2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSetRepoUrl } from "@/hooks/useProjects";
import { toast } from "sonner";

export default function ProjectOverview({ project }) {
  const { user } = useAuth();
  const setRepoUrl = useSetRepoUrl();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(project?.repoUrl || "");

  if (!project) return null;

  const isLead =
    project.projectLead && (project.projectLead._id || project.projectLead) === user?._id;
  const isPm = user?.role === "pm";
  const daysLeft = differenceInDays(new Date(project.deadline), new Date());

  const handleSaveUrl = () => {
    setRepoUrl.mutate(
      { id: project._id, repoUrl: url },
      {
        onSuccess: () => {
          toast.success("Repo URL updated");
          setEditing(false);
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
          <CardTitle className="text-base">Project Charter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {project.description || "No project charter description provided."}
          </p>
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
            {editing ? (
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
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">No repo URL set</p>
                {(isLead || isPm) && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditing(true)}>
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
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {project.projectLead && (
              <Badge variant="default">
                ★ {project.projectLead.name || "Lead"} (Lead)
              </Badge>
            )}
            {(project.members || []).map((m) => (
              <Badge key={m._id || m} variant="secondary">
                {m.name || m}
              </Badge>
            ))}
            {(!project.members || project.members.length === 0) && !project.projectLead && (
              <p className="text-sm text-muted-foreground">No team members assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
