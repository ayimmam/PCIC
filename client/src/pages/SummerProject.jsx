import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  useMySummerSubmission,
  usePendingSummerSubmissions,
  useSubmitSummerProject,
  useGradeSummerProject,
} from "@/hooks/useSummerProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUpload from "@/components/shared/FileUpload";
import { toast } from "sonner";
import { ExternalLink, ClipboardCheck } from "lucide-react";

const uploadSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
});

const statusVariant = { pending: "warning", passed: "success", failed: "destructive" };

function fileHref(fileUrl) {
  if (!fileUrl) return "#";
  const normalized = fileUrl.replace(/\\/g, "/");
  return normalized.startsWith("http") ? normalized : `/${normalized}`;
}

export default function SummerProject() {
  const { user, refreshUser } = useAuth();
  const isDomainLeader = user?.role === "domain_leader";
  const showMemberPanel = user?.role === "member" && user?.batch === "batch_1";

  const { data: mine, isLoading: mineLoading } = useMySummerSubmission(showMemberPanel);
  const { data: pending = [], isLoading: pendingLoading } = usePendingSummerSubmissions(isDomainLeader);

  useEffect(() => {
    if (mine?.status === "passed" && user?.batch === "batch_1" && refreshUser) {
      refreshUser();
    }
  }, [mine?.status, user?.batch, refreshUser]);

  const submitProject = useSubmitSummerProject();
  const gradeProject = useGradeSummerProject();

  const [file, setFile] = useState(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradingRow, setGradingRow] = useState(null);
  const [gradeVerdict, setGradeVerdict] = useState("pass");
  const [gradeComment, setGradeComment] = useState("");

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: "", notes: "" },
  });

  const onUpload = async (values) => {
    if (!file) {
      toast.error("Please attach a PDF (max 10MB)");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (values.title) formData.append("title", values.title);
    if (values.notes) formData.append("notes", values.notes);
    try {
      await submitProject.mutateAsync(formData);
      toast.success("Summer project submitted");
      reset();
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    }
  };

  const openGrade = (row, verdict) => {
    setGradingRow(row);
    setGradeVerdict(verdict);
    setGradeComment("");
    setGradeOpen(true);
  };

  const confirmGrade = async () => {
    if (!gradingRow) return;
    if (gradeVerdict === "fail" && !gradeComment.trim()) {
      toast.error("A comment is required when marking as not passed");
      return;
    }
    try {
      await gradeProject.mutateAsync({
        id: gradingRow._id,
        verdict: gradeVerdict === "pass" ? "pass" : "fail",
        comment: gradeComment.trim(),
      });
      toast.success(gradeVerdict === "pass" ? "Marked as passed — student moved to Batch 2" : "Marked as not passed");
      setGradeOpen(false);
      setGradingRow(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save grade");
    }
  };

  const canAccess = isDomainLeader || showMemberPanel;

  if (!canAccess) {
    return (
      <div className="space-y-4">
        <PageHeader title="Summer project" subtitle="Batch 1 submissions and domain grading" />
        <p className="text-sm text-muted-foreground">
          This page is available to Batch 1 members (to upload) and Domain Leaders (to review). If you are Batch 1
          but do not see the upload form, confirm your account role is &quot;member&quot; and your domain is not
          General—contact the MC to update your domain.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Summer project"
        subtitle="Batch 1 students submit a PDF; your Domain Leader grades pass or fail. Passing promotes you to Batch 2."
      />

      {isDomainLeader && (
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Pending in your domain ({user?.domain})</h2>
          </div>
          {pendingLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending submissions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      <div className="font-medium">{row.student?.name}</div>
                      <div className="text-xs text-muted-foreground">{row.student?.email}</div>
                    </TableCell>
                    <TableCell>{row.title || "—"}</TableCell>
                    <TableCell>
                      <a
                        href={fileHref(row.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        Open PDF <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="default" onClick={() => openGrade(row, "pass")}>
                        Pass
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openGrade(row, "fail")}>
                        Not passed
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      {showMemberPanel && (
        <section className="space-y-4 rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold">Your submission</h2>
          {mineLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !mine ? (
            <p className="text-sm text-muted-foreground">You have not submitted a summer project for this cycle yet.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariant[mine.status] || "secondary"}>{mine.status}</Badge>
              </div>
              {mine.title ? (
                <p>
                  <span className="text-muted-foreground">Title:</span> {mine.title}
                </p>
              ) : null}
              {mine.notes ? (
                <p>
                  <span className="text-muted-foreground">Notes:</span> {mine.notes}
                </p>
              ) : null}
              <p>
                <a
                  href={fileHref(mine.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  View uploaded PDF <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
              {mine.status === "failed" && mine.gradeComment ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Feedback</p>
                  <p className="whitespace-pre-wrap">{mine.gradeComment}</p>
                </div>
              ) : null}
              {mine.status === "pending" ? (
                <p className="text-muted-foreground">Awaiting review by your Domain Leader.</p>
              ) : null}
              {mine.status === "passed" ? (
                <p className="text-muted-foreground">
                  You passed — your batch is now <strong>Batch 2</strong> (you are on track as a Batch 2 learner).
                </p>
              ) : null}
              {mine.status === "failed" ? (
                <p className="text-muted-foreground">You may submit again for this cycle if your Domain Leader allows a resubmission.</p>
              ) : null}
            </div>
          )}

          {showMemberPanel && (!mine || mine.status === "failed") && (
            <form onSubmit={handleSubmit(onUpload)} className="space-y-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {mine?.status === "failed"
                  ? "Submit a revised PDF for the same review cycle."
                  : "Upload one PDF (max 10 MB). Your Domain Leader must match your profile domain."}
              </p>
              <div className="space-y-2">
                <Label htmlFor="summer-title">Project title (optional)</Label>
                <Input id="summer-title" placeholder="e.g. Community inventory app" {...register("title")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summer-notes">Notes for reviewer (optional)</Label>
                <Textarea id="summer-notes" rows={3} placeholder="Stack, repo link in PDF, etc." {...register("notes")} />
              </div>
              <FileUpload
                label="Summer project (PDF only, max 10MB)"
                onFileSelect={setFile}
                accept={{ "application/pdf": [".pdf"] }}
                maxSize={10 * 1024 * 1024}
              />
              <Button type="submit" disabled={submitProject.isPending}>
                {submitProject.isPending ? "Uploading…" : "Submit PDF"}
              </Button>
            </form>
          )}

          {mine?.status === "pending" && (
            <p className="text-xs text-muted-foreground">You cannot upload again until this submission is graded.</p>
          )}
          {mine?.status === "passed" && (
            <p className="text-xs text-muted-foreground">No further uploads for this cycle.</p>
          )}
        </section>
      )}

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{gradeVerdict === "pass" ? "Pass submission?" : "Mark as not passed?"}</DialogTitle>
            <DialogDescription>
              {gradingRow?.student?.name} — {gradeVerdict === "pass"
                ? "Their batch will be set to Batch 2."
                : "Their batch will not change. A comment is required."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="grade-comment">{gradeVerdict === "fail" ? "Comment (required)" : "Comment (optional)"}</Label>
            <Textarea
              id="grade-comment"
              rows={3}
              value={gradeComment}
              onChange={(e) => setGradeComment(e.target.value)}
              placeholder={gradeVerdict === "fail" ? "Explain what needs improvement" : "Optional note for the repository"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={gradeVerdict === "pass" ? "default" : "destructive"}
              onClick={confirmGrade}
              disabled={gradeProject.isPending}
            >
              {gradeProject.isPending ? "Saving…" : gradeVerdict === "pass" ? "Confirm pass" : "Confirm not passed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
