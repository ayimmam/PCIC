import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import CandidateList from "@/components/candidates/CandidateList";
import CandidateReview from "@/components/candidates/CandidateReview";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const { user } = useAuth();
  const [reviewCandidate, setReviewCandidate] = useState(null);

  const { data: candidates, isLoading: candidatesLoading } = useCandidates();

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Panel" subtitle="Manage candidates and settings" />

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          <CandidateList
            candidates={candidates}
            isLoading={candidatesLoading}
            showActions={user?.role === "president"}
            onReview={setReviewCandidate}
          />
          <CandidateReview
            candidate={reviewCandidate}
            open={!!reviewCandidate}
            onOpenChange={(open) => !open && setReviewCandidate(null)}
          />
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Settings panel — coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
