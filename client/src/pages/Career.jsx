import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import CandidateUploadDialog from "@/components/candidates/CandidateUploadDialog";
import CandidateList from "@/components/candidates/CandidateList";
import CandidateReview from "@/components/candidates/CandidateReview";
import RoleGate from "@/components/shared/RoleGate";
import { Button } from "@/components/ui/button";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";

export default function Career() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const { user } = useAuth();
  const isAdmin = ["president", "pm", "mc"].includes(user?.role);
  const { data: candidates, isLoading } = useCandidates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career & Recruitment"
        subtitle="Join the Peak Craft Informatics Community"
        action={
          <Button onClick={() => setUploadOpen(true)}>Apply Now</Button>
        }
      />

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

      <CandidateUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <CandidateReview
        candidate={reviewCandidate}
        open={!!reviewCandidate}
        onOpenChange={(open) => !open && setReviewCandidate(null)}
      />
    </div>
  );
}
