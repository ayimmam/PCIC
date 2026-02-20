import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import StrikeSearch from "@/components/strikes/StrikeSearch";
import StrikeHistory from "@/components/strikes/StrikeHistory";
import AssignStrikeDialog from "@/components/strikes/AssignStrikeDialog";
import CandidateList from "@/components/candidates/CandidateList";
import CandidateReview from "@/components/candidates/CandidateReview";
import { useStrikes, useMemberStrikes } from "@/hooks/useStrikes";
import { useCandidates } from "@/hooks/useCandidates";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reviewCandidate, setReviewCandidate] = useState(null);

  const { data: members } = useMembers();
  const { data: allStrikes, isLoading: strikesLoading } = useStrikes();
  const { data: memberStrikes } = useMemberStrikes(selectedMember?._id);
  const { data: candidates, isLoading: candidatesLoading } = useCandidates();

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Panel" subtitle="Manage strikes, candidates, and settings" />

      <Tabs defaultValue="strikes">
        <TabsList>
          <TabsTrigger value="strikes">Strikes</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="strikes" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <StrikeSearch members={members || []} onSelect={setSelectedMember} />
            </div>
            {selectedMember && (
              <Button variant="destructive" onClick={() => setAssignOpen(true)}>
                Assign Strike to {selectedMember.name}
              </Button>
            )}
          </div>

          {selectedMember ? (
            <div>
              <h3 className="mb-3 text-lg font-semibold">
                Strikes for {selectedMember.name} ({memberStrikes?.length || 0})
              </h3>
              <StrikeHistory strikes={memberStrikes || []} />
            </div>
          ) : (
            <div>
              <h3 className="mb-3 text-lg font-semibold">All Recent Strikes</h3>
              <StrikeHistory strikes={allStrikes || []} showMember />
            </div>
          )}

          <AssignStrikeDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            member={selectedMember}
          />
        </TabsContent>

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
