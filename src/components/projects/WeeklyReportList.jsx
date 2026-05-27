import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklyReports, useSubmitReport, useScoreReport } from "@/hooks/useProjects";
import { toast } from "sonner";

export default function WeeklyReportList({ projectId }) {
  const { user } = useAuth();
  const isPm = user?.role === "pm";
  const { data: reports = [], isLoading } = useWeeklyReports(projectId);
  const submitReport = useSubmitReport();
  const scoreReport = useScoreReport();

  const [showForm, setShowForm] = useState(false);
  const [weekNumber, setWeekNumber] = useState("");
  const [summary, setSummary] = useState("");
  const [scoringId, setScoringId] = useState(null);
  const [scoreVal, setScoreVal] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weekNumber || !summary.trim()) return;
    submitReport.mutate(
      { projectId, weekNumber: parseInt(weekNumber), summary: summary.trim() },
      {
        onSuccess: () => {
          toast.success("Report submitted");
          setShowForm(false);
          setWeekNumber("");
          setSummary("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  const handleScore = (reportId) => {
    const score = parseInt(scoreVal);
    if (score < 1 || score > 10) {
      toast.error("Score must be between 1 and 10");
      return;
    }
    scoreReport.mutate(
      { projectId, reportId, qualityScore: score },
      {
        onSuccess: () => {
          toast.success("Quality score saved");
          setScoringId(null);
          setScoreVal("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Weekly Progress Reports</CardTitle>
        {!isPm && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-3 w-3" /> Submit Report
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-2 rounded-md border p-3">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Week #"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                className="w-24"
              />
              <span className="flex items-center text-xs text-muted-foreground">Week number</span>
            </div>
            <Textarea
              placeholder="Describe this week's progress..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
            <Button type="submit" size="sm" disabled={submitReport.isPending}>
              <Send className="mr-1 h-3 w-3" /> Submit
            </Button>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports submitted yet.</p>
        ) : (
          reports.map((r) => (
            <div key={r._id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Week {r.weekNumber}</Badge>
                  <span className="text-xs text-muted-foreground">
                    by {r.submittedBy?.name || "Unknown"} ·{" "}
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                {r.qualityScore != null ? (
                  <Badge className="gap-1" variant={r.qualityScore >= 7 ? "default" : r.qualityScore >= 4 ? "secondary" : "destructive"}>
                    <Star className="h-3 w-3" /> {r.qualityScore}/10
                  </Badge>
                ) : isPm ? (
                  scoringId === r._id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={scoreVal}
                        onChange={(e) => setScoreVal(e.target.value)}
                        className="h-7 w-16 text-xs"
                        placeholder="1-10"
                      />
                      <Button size="sm" variant="outline" className="h-7" onClick={() => handleScore(r._id)}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setScoringId(r._id)}>
                      <Star className="mr-1 h-3 w-3" /> Score
                    </Button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">Not scored</span>
                )}
              </div>
              <p className="mt-2 text-sm">{r.summary}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
