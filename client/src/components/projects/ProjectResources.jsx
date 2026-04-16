import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Plus, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectResources, useAddResource } from "@/hooks/useProjects";
import { toast } from "sonner";

export default function ProjectResources({ projectId }) {
  const { user } = useAuth();
  const isPm = user?.role === "pm";
  const { data: resources = [], isLoading } = useProjectResources(projectId);
  const addResource = useAddResource();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    addResource.mutate(
      { projectId, title: title.trim(), url: url.trim() },
      {
        onSuccess: () => {
          toast.success("Resource shared");
          setShowForm(false);
          setTitle("");
          setUrl("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Project Resources</CardTitle>
        {isPm && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-3 w-3" /> Share Resource
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={handleAdd} className="space-y-2 rounded-md border p-3">
            <Input
              placeholder="Resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="URL (link, article, template)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={addResource.isPending}>
              <LinkIcon className="mr-1 h-3 w-3" /> Share
            </Button>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resources shared yet.</p>
        ) : (
          resources.map((r) => (
            <div key={r._id} className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  Shared by {r.sharedBy?.name || "PM"} ·{" "}
                  {format(new Date(r.createdAt), "MMM d")}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
