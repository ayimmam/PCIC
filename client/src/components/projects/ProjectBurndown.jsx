import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBurndown, useBurndownSummary, useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function SingleBurndown({ projectId }) {
  const { data: burndown, isLoading } = useBurndown(projectId);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!burndown || !burndown.data?.length) {
    return <p className="text-sm text-muted-foreground">No burndown data available yet. Add WBS tasks to see the chart.</p>;
  }

  const chartData = burndown.data.map((d) => ({
    ...d,
    day: d.day.slice(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="5 5"
          dot={false}
          name="Ideal"
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          name="Actual"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PmBurndownDashboard() {
  const { data: projects = [] } = useProjects();
  const { data: summary = [], isLoading } = useBurndownSummary();
  const [selectedId, setSelectedId] = useState("");

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All projects overview" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects overview</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedId && selectedId !== "all" ? (
        <SingleBurndown projectId={selectedId} />
      ) : (
        <div className="space-y-3">
          {summary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active projects</p>
          ) : (
            summary.map((p) => (
              <div key={p._id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{p.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.completedTasks}/{p.totalTasks} tasks · {p.progress}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectBurndown({ projectId }) {
  const { user } = useAuth();
  const isPm = user?.role === "pm";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isPm ? "Burndown Dashboard" : "Burndown Chart"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPm ? <PmBurndownDashboard /> : <SingleBurndown projectId={projectId} />}
      </CardContent>
    </Card>
  );
}
