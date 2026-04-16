import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectIssues, useCreateIssue, useReplyIssue } from "@/hooks/useProjects";
import { toast } from "sonner";

export default function ProjectIssues({ projectId }) {
  const { user } = useAuth();
  const isPm = user?.role === "pm";
  const { data: issues = [], isLoading } = useProjectIssues(projectId);
  const createIssue = useCreateIssue();
  const replyIssue = useReplyIssue();

  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    createIssue.mutate(
      { projectId, subject: subject.trim(), content: content.trim() },
      {
        onSuccess: () => {
          toast.success("Issue created");
          setShowCreate(false);
          setSubject("");
          setContent("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  const handleReply = (issueId, resolve = false) => {
    if (!replyText.trim() && !resolve) return;
    replyIssue.mutate(
      {
        projectId,
        issueId,
        content: replyText.trim() || (resolve ? "Issue resolved" : ""),
        resolve,
      },
      {
        onSuccess: () => {
          toast.success(resolve ? "Issue resolved" : "Reply sent");
          setReplyText("");
          if (resolve) setExpandedId(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Issues</CardTitle>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 h-3 w-3" /> New Issue
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showCreate && (
          <form onSubmit={handleCreate} className="space-y-2 rounded-md border p-3">
            <Input
              placeholder="Issue subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Textarea
              placeholder="Describe the issue..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <Button type="submit" size="sm" disabled={createIssue.isPending}>
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
        ) : issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No issues reported.</p>
        ) : (
          issues.map((issue) => (
            <div key={issue._id} className="rounded-md border">
              <button
                type="button"
                className="flex w-full items-center justify-between p-3 text-left"
                onClick={() => setExpandedId(expandedId === issue._id ? null : issue._id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{issue.subject}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={issue.status === "open" ? "secondary" : "default"}>
                    {issue.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {issue.messages?.length || 0}
                  </span>
                </div>
              </button>

              {expandedId === issue._id && (
                <div className="border-t px-3 pb-3">
                  <div className="max-h-60 space-y-2 overflow-y-auto py-2">
                    {(issue.messages || []).map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-md p-2 text-sm ${
                          (msg.sender?._id || msg.sender) === user?._id
                            ? "ml-6 bg-primary/10"
                            : "mr-6 bg-muted"
                        }`}
                      >
                        <p className="text-xs font-medium">
                          {msg.sender?.name || "Unknown"}{" "}
                          <span className="font-normal text-muted-foreground">
                            · {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </span>
                        </p>
                        <p className="mt-0.5">{msg.content}</p>
                      </div>
                    ))}
                  </div>

                  {issue.status === "open" && (
                    <div className="mt-2 flex gap-2">
                      <Textarea
                        placeholder="Type a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleReply(issue._id)}
                          disabled={replyIssue.isPending}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        {isPm && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReply(issue._id, true)}
                            disabled={replyIssue.isPending}
                            title="Resolve issue"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
