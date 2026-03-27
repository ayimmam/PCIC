import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import RoleGate from "@/components/shared/RoleGate";
import ProjectOverview from "@/components/projects/ProjectOverview";
import ProjectBurndown from "@/components/projects/ProjectBurndown";
import WeeklyReportList from "@/components/projects/WeeklyReportList";
import ProjectResources from "@/components/projects/ProjectResources";
import ProjectIssues from "@/components/projects/ProjectIssues";
import ProjectTodoSidebar from "@/components/projects/ProjectTodoSidebar";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, BarChart3, FileText, BookOpen, MessageCircle, LayoutDashboard } from "lucide-react";
import { useProjects, useProject } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectMetricLog() {
  const { user } = useAuth();
  const isPm = user?.role === "pm";
  const { data: projects = [], isLoading } = useProjects();
  const [selectedId, setSelectedId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Auto-select first project when loaded
  const activeId = selectedId || projects[0]?._id || "";
  const { data: project } = useProject(activeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Metric Log"
        subtitle="Track project progress, artifacts, and team activity"
        action={
          <div className="flex items-center gap-2">
            {project?.repoUrl && (
              <Button variant="outline" asChild>
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Repo
                </a>
              </Button>
            )}
            <RoleGate allowedRoles={["pm"]}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            </RoleGate>
          </div>
        }
      />

      {/* Project selector */}
      {isLoading ? (
        <Skeleton className="h-9 w-64" />
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {isPm
              ? "No projects yet. Create your first project to get started."
              : "You haven't been assigned to any projects yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Main content */}
          <div className="flex-1 space-y-4">
            <Select value={activeId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {project && (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="overview" className="gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Reports
                  </TabsTrigger>
                  <TabsTrigger value="burndown" className="gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> Burndown
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Resources
                  </TabsTrigger>
                  <TabsTrigger value="issues" className="gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> Issues
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <ProjectOverview project={project} />
                </TabsContent>
                <TabsContent value="reports">
                  <WeeklyReportList projectId={activeId} />
                </TabsContent>
                <TabsContent value="burndown">
                  <ProjectBurndown projectId={activeId} />
                </TabsContent>
                <TabsContent value="resources">
                  <ProjectResources projectId={activeId} />
                </TabsContent>
                <TabsContent value="issues">
                  <ProjectIssues projectId={activeId} />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Right sidebar — Todo list */}
          {project && (
            <div className="w-full lg:w-72 xl:w-80">
              <ProjectTodoSidebar project={project} />
            </div>
          )}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
