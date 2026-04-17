import { useState, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import CandidateUploadDialog from "@/components/candidates/CandidateUploadDialog";
import CandidateList from "@/components/candidates/CandidateList";
import CandidateReview from "@/components/candidates/CandidateReview";
import { Button } from "@/components/ui/button";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";

export default function Career() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const { user } = useAuth();
  const isAdmin = ["president", "pm", "mc"].includes(user?.role);
  const { data: candidates, isLoading } = useCandidates();

  const myApplication = useMemo(() => {
    if (!user || !candidates) return null;
    return candidates.find((c) => c.member === user._id || c.email === user.email);
  }, [user, candidates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career & Recruitment"
        subtitle="Join the Peak Craft Informatics Community"
        action={
          <Button onClick={() => setUploadOpen(true)}>Apply Now</Button>
        }
      />

      {myApplication && (myApplication.status === "approved" || myApplication.status === "rejected") && (
        <div
          className={`rounded-lg border p-4 ${
            myApplication.status === "approved"
              ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30"
              : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {myApplication.status === "approved" ? (
              <CheckCircle className="h-6 w-6 shrink-0 text-green-600 dark:text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Your promotion request was{" "}
                <Badge variant={myApplication.status === "approved" ? "success" : "destructive"}>
                  {myApplication.status}
                </Badge>
              </p>
              {myApplication.reviewComment ? (
                <div className="mt-2 rounded border border-border/80 bg-background/80 p-2 text-sm">
                  <p className="mb-0.5 flex items-center gap-1.5 font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    President&apos;s message
                  </p>
                  <p className="whitespace-pre-wrap">{myApplication.reviewComment}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-8">
          <h2 className="text-xl font-bold">Why Join PCIC?</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Be part of a community of 800+ students across Information Systems, Computer Science,
            and Information Technology. Grow your skills, collaborate on real projects, and build
            your professional network.
          </p>
          <Button className="mt-4" onClick={() => setUploadOpen(true)}>
            Submit Your Application
          </Button>
        </div>

        {isAdmin && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Applications</h2>
            <CandidateList
              candidates={candidates}
              isLoading={isLoading}
              showActions={user?.role === "president"}
              onReview={setReviewCandidate}
            />
          </div>
        )}
      </div>

      {user?.role === "member" && (
        <CandidateUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      )}

      <CandidateReview
        candidate={reviewCandidate}
        open={!!reviewCandidate}
        onOpenChange={(open) => !open && setReviewCandidate(null)}
      />
    </div>
  );
}
