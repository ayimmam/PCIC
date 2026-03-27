import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";

export default function CreateProjectDialog({ open, onOpenChange }) {
  const createProject = useCreateProject();
  const { data: memberData } = useMembers();
  const allMembers = memberData?.members || [];
  const batch23 = allMembers.filter(
    (m) => m.batch === "batch_2" || m.batch === "batch_3"
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projectLead, setProjectLead] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [wbsTasks, setWbsTasks] = useState([""]);
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = batch23.filter(
    (m) =>
      !selectedMembers.includes(m._id) &&
      m._id !== projectLead &&
      m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const addMember = (id) => {
    setSelectedMembers([...selectedMembers, id]);
    setMemberSearch("");
  };

  const removeMember = (id) => {
    setSelectedMembers(selectedMembers.filter((m) => m !== id));
    if (projectLead === id) setProjectLead("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      toast.error("Title and deadline are required");
      return;
    }

    const todos = wbsTasks
      .filter((t) => t.trim())
      .map((t) => ({ task: t.trim() }));

    createProject.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        deadline,
        projectLead: projectLead || undefined,
        members: selectedMembers,
        todos,
      },
      {
        onSuccess: () => {
          toast.success("Project created");
          onOpenChange(false);
          resetForm();
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setProjectLead("");
    setSelectedMembers([]);
    setWbsTasks([""]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
          </div>

          <div className="space-y-2">
            <Label>Charter / Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project scope and objectives..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {/* Member selection */}
          <div className="space-y-2">
            <Label>Team Members (Batch 2 & 3)</Label>
            <div className="relative">
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members..."
              />
              {memberSearch && filteredMembers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                  {filteredMembers.slice(0, 8).map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => addMember(m._id)}
                    >
                      {m.name}
                      <span className="text-xs text-muted-foreground">{m.domain}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedMembers.map((id) => {
                const m = batch23.find((x) => x._id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {m?.name || id}
                    {projectLead === id && <span className="text-[10px]">★</span>}
                    <button type="button" onClick={() => removeMember(id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Project Lead */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Project Lead</Label>
              <select
                value={projectLead}
                onChange={(e) => setProjectLead(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select lead...</option>
                {selectedMembers.map((id) => {
                  const m = batch23.find((x) => x._id === id);
                  return (
                    <option key={id} value={id}>
                      {m?.name || id}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* WBS Tasks */}
          <div className="space-y-2">
            <Label>WBS Tasks (initial todo list)</Label>
            <div className="space-y-1">
              {wbsTasks.map((task, i) => (
                <div key={i} className="flex gap-1">
                  <Input
                    value={task}
                    onChange={(e) => {
                      const copy = [...wbsTasks];
                      copy[i] = e.target.value;
                      setWbsTasks(copy);
                    }}
                    placeholder={`Task ${i + 1}`}
                    className="h-8 text-sm"
                  />
                  {wbsTasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setWbsTasks(wbsTasks.filter((_, j) => j !== i))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWbsTasks([...wbsTasks, ""])}
              >
                <Plus className="mr-1 h-3 w-3" /> Add Task
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
