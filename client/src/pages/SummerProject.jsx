import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { ExternalLink, ClipboardCheck, Github, Link2 } from "lucide-react";
import { isPcicDomain } from "@/lib/pcicDomains";

const statusVariant = { pending: "warning", passed: "success", failed: "destructive" };

function fileHref(fileUrl) {
  if (!fileUrl) return "#";
  const normalized = fileUrl.replace(/\\/g, "/");
  return normalized.startsWith("http") ? normalized : `/${normalized}`;
}

function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidGithubUrl(value) {
  if (!isValidHttpUrl(value)) return false;
  const parsed = new URL(value);
  const host = parsed.hostname.toLowerCase();
  return host === "github.com" || host.endsWith(".github.com");
}

export default function SummerProject() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const isDomainLeader = user?.role === "domain_leader";
  const isMember = user?.role === "member";
  const isPixelPeepsMember = isMember && user?.domain === "Pixel Peeps";
  const githubRequired = isMember && !isPixelPeepsMember;
  /** Upload API only allows Batch 1 + assigned PCIC domain; Batch 2+ can still view their submission. */
  const canUpload = isMember && user?.batch === "batch_1" && isPcicDomain(user?.domain);

  const { data: mine, isLoading: mineLoading } = useMySummerSubmission(isMember);
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
    defaultValues: { title: "", notes: "", githubUrl: "", demoUrl: "" },
  });

  const onUpload = async (values) => {
    if (!file) {
      toast.error("Please attach a PDF (max 10MB)");
      return;
    }
    const githubUrl = String(values.githubUrl || "").trim();
    const demoUrl = String(values.demoUrl || "").trim();

    if (githubRequired && !githubUrl) {
      toast.error("GitHub link is required for your domain.");
      return;
    }
    if (githubUrl && !isValidGithubUrl(githubUrl)) {
      toast.error("Please enter a valid GitHub link (https://github.com/...)");
      return;
    }
    if (demoUrl && !isValidHttpUrl(demoUrl)) {
      toast.error("Please enter a valid deployed/relevant link (http:// or https://)");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (values.title) formData.append("title", values.title);
    if (values.notes) formData.append("notes", values.notes);
    if (githubUrl) formData.append("githubUrl", githubUrl);
    if (demoUrl) formData.append("demoUrl", demoUrl);
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

  const canAccess = isDomainLeader || isMember;

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="space-y-4">
        <PageHeader title="Summer project" subtitle="Batch 1 submissions and domain grading" />
        <p className="text-sm text-muted-foreground">
          This page is for <strong>members</strong> (view or upload their summer PDF) and <strong>Domain Leaders</strong>{" "}
          (review their domain). Leadership accounts should use the Members page for oversight.
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
                  <TableHead className="text-center">GitHub</TableHead>
                  <TableHead className="text-center">Link</TableHead>
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
                    <TableCell className="text-center">
                      {row.githubUrl ? (
                        <a
                          href={row.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-muted/30 text-foreground hover:bg-muted"
                          title="Open GitHub repository"
                          aria-label="Open GitHub repository"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.demoUrl ? (
                        <a
                          href={row.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-muted/30 text-foreground hover:bg-muted"
                          title="Open deployed or related link"
                          aria-label="Open deployed or related link"
                        >
                          <Link2 className="h-4 w-4" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
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

      {isMember && (
        <section className="space-y-4 rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold">Your submission</h2>
          {!canUpload && user?.batch !== "batch_1" ? (
            <p className="text-sm text-muted-foreground">
              Summer project <strong>uploads</strong> are only for <strong>Batch 1</strong> members. Your current batch
              is <strong>{user?.batch?.replace("batch_", "Batch ") || user?.batch || "unknown"}</strong>. If you were
              promoted after passing, your record for this cycle is still shown below when available.
            </p>
          ) : null}
          {!canUpload && user?.batch === "batch_1" && !isPcicDomain(user?.domain) ? (
            <p className="text-sm text-amber-700 dark:text-amber-500">
              Your profile must list a PCIC domain (Code Crafters, Turing Tribe, Cyber Crew, or Pixel Peeps). Ask the
              Membership Coordinator to set your domain before you can upload a summer project.
            </p>
          ) : null}
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
              {mine.githubUrl ? (
                <p>
                  <span className="text-muted-foreground">GitHub:</span>{" "}
                  <a
                    href={mine.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    {mine.githubUrl} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </p>
              ) : null}
              {mine.demoUrl ? (
                <p>
                  <span className="text-muted-foreground">Deployed/other link:</span>{" "}
                  <a
                    href={mine.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    {mine.demoUrl} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
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
                <p className="text-muted-foreground">You may submit again for this cycle.</p>
              ) : null}
            </div>
          )}

          {canUpload && (!mine || mine.status === "failed") && (
            <form onSubmit={handleSubmit(onUpload)} className="space-y-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {mine?.status === "failed"
                  ? "Submit a revised PDF for the same review cycle."
                  : "Upload one PDF (max 10 MB)."}
              </p>
              <div className="space-y-2">
                <Label htmlFor="summer-title">Project title (optional)</Label>
                <Input id="summer-title" placeholder="e.g. Community inventory app" {...register("title")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summer-github">
                  GitHub link {githubRequired ? "(required)" : "(optional for Pixel Peeps)"}
                </Label>
                <Input
                  id="summer-github"
                  placeholder="https://github.com/username/repository"
                  {...register("githubUrl")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summer-demo">Deployed/other relevant link (optional)</Label>
                <Input
                  id="summer-demo"
                  placeholder="https://your-app.example.com"
                  {...register("demoUrl")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summer-notes">Notes for reviewer (optional)</Label>
                <Textarea id="summer-notes" rows={3} placeholder="Stack, instructions, context, etc." {...register("notes")} />
              </div>
              <FileUpload
                label="Summer project (PDF only, max 10MB)"
                onFileSelect={setFile}
                accept={{ "application/pdf": [".pdf"] }}
                maxSize={10 * 1024 * 1024}
              />
              <Button type="submit" disabled={submitProject.isPending}>
                {submitProject.isPending ? "Uploading…" : "Submit Project"}
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
