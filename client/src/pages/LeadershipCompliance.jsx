import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/shared/FileUpload";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  useComplianceDashboard,
  useComplianceSemesters,
  useComplianceSubmissionHistory,
  useSubmitComplianceReport,
  useAddComplianceFeedback,
  useCreateComplianceSemester,
  useUpdateComplianceSemester,
} from "@/hooks/useLeadershipCompliance";

function statusBadgeVariant(status) {
  if (status === "compliant") return "success";
  if (status === "non_compliant") return "destructive";
  return "secondary";
}

function statusLabel(status) {
  if (status === "non_compliant") return "Non-compliant";
  if (status === "unassigned") return "Unassigned";
  return "Compliant";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function semesterStatusVariant(status) {
  if (status === "active") return "success";
  if (status === "closed") return "destructive";
  return "secondary";
}

export default function LeadershipCompliance() {
  const { user } = useAuth();
  const isPresident = user?.role === "president";
  const isDomainLeader = user?.role === "domain_leader";

  const [semester, setSemester] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [feedbackByReport, setFeedbackByReport] = useState({});
  const [file, setFile] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPayload, setDetailPayload] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyContext, setHistoryContext] = useState(null);
  const [semesterForm, setSemesterForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "planned",
    lockSubmissions: false,
    lockFeedback: false,
  });
  const [editingSemesterId, setEditingSemesterId] = useState(null);

  function fileHref(fileUrl) {
    if (!fileUrl) return "#";
    const normalized = String(fileUrl).replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/uploads/")) return normalized;
    if (normalized.startsWith("uploads/")) return `/${normalized}`;

    const fileName = normalized.split("/").pop();
    if (fileName) return `/uploads/${fileName}`;
    return "#";
  }

  const viewerScope = user ? `${user._id}:${user.role}` : "anonymous";
  const { data: semesterData, isLoading: isSemestersLoading } = useComplianceSemesters(viewerScope);
  const { data, isLoading } = useComplianceDashboard(semester || undefined, viewerScope);
  const { data: historyData, isLoading: isHistoryLoading } = useComplianceSubmissionHistory(
    semester,
    historyContext?.domainLeaderId,
    viewerScope,
    historyOpen
  );
  const semesterConfigs = semesterData?.items || data?.semesterConfigs || [];
  const semesters = semesterConfigs.map((item) => item.name);
  const semestersLoading = isLoading && semesters.length === 0;

  useEffect(() => {
    if (!semester && semesters.length > 0) {
      setSemester(semesters[0]);
    }
  }, [semesters, semester]);

  const submitReport = useSubmitComplianceReport();
  const addFeedback = useAddComplianceFeedback();
  const createSemester = useCreateComplianceSemester();
  const updateSemester = useUpdateComplianceSemester();

  const rows = data?.rows || [];
  const selectedSemesterConfig = useMemo(
    () => semesterConfigs.find((item) => item.name === semester) || null,
    [semesterConfigs, semester]
  );
  const myRow = useMemo(() => rows.find((row) => row.domainLeader?._id === user?._id), [rows, user?._id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!semester) {
      toast.error("Semester is required");
      return;
    }

    if (!file) {
      toast.error("Please attach a PDF report file");
      return;
    }

    if (selectedSemesterConfig?.lockSubmissions || selectedSemesterConfig?.status === "closed") {
      toast.error("Submissions are locked for this semester");
      return;
    }

    const formData = new FormData();
    formData.append("semester", semester);
    formData.append("file", file);
    if (reportTitle.trim()) formData.append("reportTitle", reportTitle.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (notes.trim()) formData.append("notes", notes.trim());
    if (evidenceUrl.trim()) formData.append("evidenceUrl", evidenceUrl.trim());

    submitReport.mutate(
      formData,
      {
        onSuccess: () => {
          toast.success("Compliance report submitted");
          setReportTitle("");
          setDescription("");
          setNotes("");
          setEvidenceUrl("");
          setFile(null);
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || "Failed to submit report");
        },
      }
    );
  };

  const handleFeedbackSubmit = (reportId) => {
    const message = String(feedbackByReport[reportId] || "").trim();
    if (!message) {
      toast.error("Feedback message is required");
      return;
    }

    addFeedback.mutate(
      { reportId, message },
      {
        onSuccess: () => {
          toast.success("Feedback added");
          setFeedbackByReport((prev) => ({ ...prev, [reportId]: "" }));
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || "Failed to add feedback");
        },
      }
    );
  };

  const openDetail = (submission) => {
    setDetailPayload(submission || null);
    setDetailOpen(true);
  };

  const openHistory = (row) => {
    if (!row?.domainLeader?._id) {
      toast.error("No assigned domain leader for this row");
      return;
    }

    setHistoryContext({
      domain: row.domain,
      domainLeaderId: row.domainLeader._id,
      domainLeaderName: row.domainLeader.name,
    });
    setHistoryOpen(true);
  };

  const handleSemesterSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: semesterForm.name.trim(),
      startDate: semesterForm.startDate,
      endDate: semesterForm.endDate,
      status: semesterForm.status,
      lockSubmissions: semesterForm.lockSubmissions,
      lockFeedback: semesterForm.lockFeedback,
    };

    if (editingSemesterId) {
      updateSemester.mutate(
        { id: editingSemesterId, payload },
        {
          onSuccess: () => {
            toast.success("Semester updated");
            setEditingSemesterId(null);
            setSemesterForm({
              name: "",
              startDate: "",
              endDate: "",
              status: "planned",
              lockSubmissions: false,
              lockFeedback: false,
            });
          },
          onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update semester");
          },
        }
      );
      return;
    }

    createSemester.mutate(payload, {
      onSuccess: () => {
        toast.success("Semester created");
        setSemesterForm({
          name: "",
          startDate: "",
          endDate: "",
          status: "planned",
          lockSubmissions: false,
          lockFeedback: false,
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to create semester");
      },
    });
  };

  const runSemesterUpdate = (id, payload) => {
    updateSemester.mutate(
      { id, payload },
      {
        onError: (error) => {
          toast.error(error.response?.data?.message || "Failed to update semester");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Leader Compliance"
        subtitle="Track domain leader reporting compliance by semester"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Semester Filter</CardTitle>
        </CardHeader>
        <CardContent>
          {semestersLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {isPresident && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semester Configuration</CardTitle>
            <p className="text-xs text-muted-foreground">President controls semester windows, active semester, and locks.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSemesterSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="semester-name">Name</Label>
                <Input
                  id="semester-name"
                  placeholder="2026-S1"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="semester-start">Start date</Label>
                <Input
                  id="semester-start"
                  type="date"
                  value={semesterForm.startDate}
                  onChange={(e) => setSemesterForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="semester-end">End date</Label>
                <Input
                  id="semester-end"
                  type="date"
                  value={semesterForm.endDate}
                  onChange={(e) => setSemesterForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={semesterForm.status}
                  onValueChange={(value) => setSemesterForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">planned</SelectItem>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="closed">closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Submissions lock</Label>
                <Select
                  value={semesterForm.lockSubmissions ? "true" : "false"}
                  onValueChange={(value) =>
                    setSemesterForm((prev) => ({ ...prev, lockSubmissions: value === "true" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Unlocked</SelectItem>
                    <SelectItem value="true">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Feedback lock</Label>
                <Select
                  value={semesterForm.lockFeedback ? "true" : "false"}
                  onValueChange={(value) =>
                    setSemesterForm((prev) => ({ ...prev, lockFeedback: value === "true" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Unlocked</SelectItem>
                    <SelectItem value="true">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={createSemester.isPending || updateSemester.isPending}>
                  {editingSemesterId
                    ? (updateSemester.isPending ? "Saving..." : "Save changes")
                    : (createSemester.isPending ? "Creating..." : "Create semester")}
                </Button>
                {editingSemesterId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingSemesterId(null);
                      setSemesterForm({
                        name: "",
                        startDate: "",
                        endDate: "",
                        status: "planned",
                        lockSubmissions: false,
                        lockFeedback: false,
                      });
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>

            {isSemestersLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : semesterConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No semester configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Name</th>
                      <th className="pb-2 pr-3 font-medium">Window</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Locks</th>
                      <th className="pb-2 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterConfigs.map((item) => (
                      <tr key={item._id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{item.name}</td>
                        <td className="py-2 pr-3">
                          {formatDate(item.startDate)} - {formatDate(item.endDate)}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={semesterStatusVariant(item.status)}>{item.status}</Badge>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={item.lockSubmissions ? "destructive" : "secondary"}>
                              submit {item.lockSubmissions ? "locked" : "open"}
                            </Badge>
                            <Badge variant={item.lockFeedback ? "destructive" : "secondary"}>
                              feedback {item.lockFeedback ? "locked" : "open"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-wrap gap-2">
                            {item.status !== "active" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSemesterId(item._id);
                                  setSemesterForm({
                                    name: item.name,
                                    startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : "",
                                    endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : "",
                                    status: item.status || "planned",
                                    lockSubmissions: !!item.lockSubmissions,
                                    lockFeedback: !!item.lockFeedback,
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSemesterId(item._id);
                                  setSemesterForm({
                                    name: item.name,
                                    startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : "",
                                    endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : "",
                                    status: item.status || "planned",
                                    lockSubmissions: !!item.lockSubmissions,
                                    lockFeedback: !!item.lockFeedback,
                                  });
                                }}
                                disabled={updateSemester.isPending}
                              >
                                Edit
                              </Button>
                            )}

                            {item.status !== "active" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => runSemesterUpdate(item._id, { status: "active" })}
                                disabled={updateSemester.isPending}
                              >
                                Set active
                              </Button>
                            ) : null}
                            {item.status !== "closed" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => runSemesterUpdate(item._id, { status: "closed" })}
                                disabled={updateSemester.isPending}
                              >
                                Close
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                runSemesterUpdate(item._id, {
                                  lockSubmissions: !item.lockSubmissions,
                                })
                              }
                              disabled={updateSemester.isPending}
                            >
                              {item.lockSubmissions ? "Unlock submit" : "Lock submit"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                runSemesterUpdate(item._id, {
                                  lockFeedback: !item.lockFeedback,
                                })
                              }
                              disabled={updateSemester.isPending}
                            >
                              {item.lockFeedback ? "Unlock feedback" : "Lock feedback"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.compliant || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Non-compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.nonCompliant || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.unassigned || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain Leader Status</CardTitle>
          <p className="text-xs text-muted-foreground">Status is based on whether a report exists for the selected semester.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No compliance records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Domain</th>
                    <th className="pb-2 pr-3 font-medium">Domain Leader</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Submitted</th>
                    <th className="pb-2 pr-3 font-medium">PDF</th>
                    <th className="pb-2 pr-3 font-medium">Report</th>
                    <th className="pb-2 pr-3 font-medium">Description</th>
                    <th className="pb-2 pr-3 font-medium">Feedback</th>
                    <th className="pb-2 pr-3 font-medium">History</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${row.domain}-${idx}`} className="border-b last:border-0">
                      <td className="py-2 pr-3">{row.domain}</td>
                      <td className="py-2 pr-3">{row.domainLeader?.name || "No assigned leader"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                      </td>
                      <td className="py-2 pr-3">{formatDate(row.submission?.submittedAt)}</td>
                      <td className="py-2 pr-3">
                        {row.submission?.fileUrl ? (
                          <a
                            href={fileHref(row.submission.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 pr-3">{row.submission?.reportTitle || "-"}</td>
                      <td className="py-2 pr-3 max-w-[280px]">
                        {row.submission ? (
                          <button
                            type="button"
                            className="line-clamp-2 text-left text-sm text-foreground hover:underline"
                            onClick={() =>
                              openDetail({
                                ...row.submission,
                              })
                            }
                            title="View full description"
                          >
                            {row.submission.description || row.submission.notes || "View details"}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 pr-3 align-top">
                        {row.submission ? (
                          <div className="space-y-2">
                            {(row.submission.feedback || []).length > 0 ? (
                              <div className="max-w-[280px] space-y-1">
                                {(row.submission.feedback || []).slice(-2).map((item) => (
                                  <p key={item._id || item.createdAt} className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{item.author?.name || "Leader"}:</span>{" "}
                                    {item.message}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No feedback yet</p>
                            )}

                            {isPresident && row.submission?._id && (
                              <div className="flex max-w-[280px] gap-2">
                                <Input
                                  value={feedbackByReport[row.submission._id] || ""}
                                  onChange={(e) =>
                                    setFeedbackByReport((prev) => ({
                                      ...prev,
                                      [row.submission._id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add feedback"
                                  className="h-8 text-xs"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleFeedbackSubmit(row.submission._id)}
                                  disabled={addFeedback.isPending}
                                >
                                  Send
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 pr-3 align-top">
                        {row.submission && row.domainLeader?._id ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openHistory(row)}
                          >
                            View history
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isDomainLeader && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Your Semester Report</CardTitle>
            {!selectedSemesterConfig ? (
              <p className="text-xs text-muted-foreground">President must configure a semester before submissions can start.</p>
            ) : null}
            {selectedSemesterConfig?.lockSubmissions || selectedSemesterConfig?.status === "closed" ? (
              <p className="text-xs text-destructive">Submissions are locked for {selectedSemesterConfig.name}.</p>
            ) : null}
            {myRow && (
              <p className="text-xs text-muted-foreground">
                Current status: {statusLabel(myRow.status)}
                {myRow.submission?.version ? ` (v${myRow.submission.version})` : ""}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FileUpload
                label="Report PDF (required)"
                onFileSelect={setFile}
                accept={{ "application/pdf": [".pdf"] }}
                maxSize={10 * 1024 * 1024}
              />
              <div className="space-y-2">
                <Label htmlFor="lc-report-title">Report Title (optional)</Label>
                <Input
                  id="lc-report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Turing Tribe Semester Progress"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-description">Description (optional)</Label>
                <Textarea
                  id="lc-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Key outcomes, blockers, and actions taken"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-notes">Notes (optional)</Label>
                <Textarea
                  id="lc-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional context"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-evidence">Evidence URL (optional)</Label>
                <Input
                  id="lc-evidence"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button
                type="submit"
                disabled={
                  submitReport.isPending ||
                  !selectedSemesterConfig ||
                  selectedSemesterConfig.status === "closed" ||
                  selectedSemesterConfig.lockSubmissions
                }
              >
                {submitReport.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailPayload?.reportTitle || "Report details"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap">{detailPayload?.description || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Additional notes</p>
              <p className="whitespace-pre-wrap">{detailPayload?.notes || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Previous submissions</p>
              <p className="text-xs text-muted-foreground">Use the "View history" action from the table row for the full timeline.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open);
          if (!open) setHistoryContext(null);
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Submission History
              {historyContext?.domain ? ` - ${historyContext.domain}` : ""}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            {historyContext?.domainLeaderName || "Domain leader"} - {semester || "Current semester"}
          </p>

          {isHistoryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (historyData?.history || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions found for this semester.</p>
          ) : (
            <div className="space-y-3">
              {(historyData?.history || []).map((item) => (
                <Card key={item._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      v{item.version || 1} - {item.reportTitle || "Untitled report"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Submitted {formatDate(item.submittedAt)}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="whitespace-pre-wrap">{item.description || "-"}</p>
                    {item.notes ? <p className="whitespace-pre-wrap text-xs text-muted-foreground">Notes: {item.notes}</p> : null}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {item.fileUrl ? (
                        <a
                          href={fileHref(item.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No PDF</span>
                      )}
                      {item.isLatest ? <Badge variant="secondary">Latest</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}