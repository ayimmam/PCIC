import { useState, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import MemberTable from "@/components/members/MemberTable";
import MemberFilters from "@/components/members/MemberFilters";
import MemberDetail from "@/components/members/MemberDetail";
import AssignStrikeDialog from "@/components/strikes/AssignStrikeDialog";
import CandidateReview from "@/components/candidates/CandidateReview";
import { useMembers } from "@/hooks/useMembers";
import { useStrikes } from "@/hooks/useStrikes";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMemberFlagged, STRIKE_THRESHOLD } from "@/lib/strikePolicy";

export default function Members() {
  const [filters, setFilters] = useState({ search: "", domain: "", batch: "", status: "", role: "" });
  const [memberView, setMemberView] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [strikeMember, setStrikeMember] = useState(null);
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const { user } = useAuth();
  const canAssignStrikes = ["president", "pm", "mc"].includes(user?.role);

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v)
  );

  const { data: members, isLoading } = useMembers(activeFilters);
  const { data: strikes } = useStrikes();
  const { data: candidates } = useCandidates();

  const strikeCounts = useMemo(() => {
    if (!strikes) return {};
    return strikes.reduce((acc, s) => {
      const id = s.memberId?._id || s.memberId;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
  }, [strikes]);

  const membersWithStrikeMeta = useMemo(() => {
    if (!members) return [];
    return members.map((member) => {
      const strikeCount = strikeCounts[member._id] || 0;
      return {
        ...member,
        strikeCount,
        isFlagged: isMemberFlagged(member, strikeCount),
      };
    });
  }, [members, strikeCounts]);

  const flaggedMembers = useMemo(() => {
    return membersWithStrikeMeta.filter((member) => member.isFlagged);
  }, [membersWithStrikeMeta]);

  const visibleMembers = useMemo(() => {
    if (memberView === "flagged") return flaggedMembers;
    return membersWithStrikeMeta;
  }, [memberView, flaggedMembers, membersWithStrikeMeta]);

  const memberCandidate = useMemo(() => {
    if (!user || !candidates) return null;
    return candidates.find((c) => c.member === user._id || c.email === user.email);
  }, [user, candidates]);

  const pendingPromotions = useMemo(() => {
    if (!candidates) return [];
    return candidates.filter((c) => c.status === "pending");
  }, [candidates]);

  return (
    <div className="space-y-6">
      <PageHeader title="Members" subtitle="Manage community members and their status" />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <Badge variant="danger">Threshold: {STRIKE_THRESHOLD} strikes</Badge>
        <span className="text-muted-foreground">
          Members crossing this threshold are automatically marked as
        </span>
        <Badge variant="warning">Pending Demotion Review</Badge>
        <Badge variant="outline">Flagged: {flaggedMembers.length}</Badge>
      </div>

      <div className="space-y-3">
        {memberCandidate && (
          <div className="rounded-lg border bg-muted/60 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  Promotion request{" "}
                  <Badge variant={memberCandidate.status === "pending" ? "warning" : memberCandidate.status === "approved" ? "success" : "destructive"}>
                    {memberCandidate.status}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Your level-change request is visible to leadership under this Members view.
                </p>
              </div>
              {memberCandidate.portfolioUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewCandidate(memberCandidate)}
                >
                  View portfolio
                </Button>
              )}
            </div>
            {(memberCandidate.status === "approved" || memberCandidate.status === "rejected") && memberCandidate.reviewComment && (
              <div className="rounded border border-border/80 bg-background p-2 text-xs">
                <p className="font-medium text-muted-foreground mb-0.5">President&apos;s message</p>
                <p className="whitespace-pre-wrap">{memberCandidate.reviewComment}</p>
              </div>
            )}
          </div>
        )}

        {(user?.role === "president" || user?.role === "mc") && pendingPromotions.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3 text-sm">
            <div>
              <p className="font-medium">
                Pending promotion requests{" "}
                <Badge variant="warning">{pendingPromotions.length}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Click &quot;Review next&quot; to open the candidate&apos;s portfolio and view their PDF.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setReviewCandidate(pendingPromotions[0])}
            >
              Review next
            </Button>
          </div>
        )}
      </div>
      <MemberFilters filters={filters} onChange={setFilters} />

      <Tabs value={memberView} onValueChange={setMemberView}>
        <TabsList>
          <TabsTrigger value="all">All Members ({membersWithStrikeMeta.length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({flaggedMembers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <MemberTable
            members={visibleMembers}
            isLoading={isLoading}
            strikeCounts={strikeCounts}
            onRowClick={setSelectedMember}
            canAssignStrikes={canAssignStrikes}
            onStrikeClick={setStrikeMember}
          />
        </TabsContent>
        <TabsContent value="flagged" className="mt-4">
          <MemberTable
            members={visibleMembers}
            isLoading={isLoading}
            strikeCounts={strikeCounts}
            onRowClick={setSelectedMember}
            canAssignStrikes={canAssignStrikes}
            onStrikeClick={setStrikeMember}
          />
        </TabsContent>
      </Tabs>

      <MemberDetail
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
      <AssignStrikeDialog
        member={strikeMember}
        open={!!strikeMember}
        onOpenChange={(open) => !open && setStrikeMember(null)}
      />
      <CandidateReview
        candidate={reviewCandidate}
        open={!!reviewCandidate}
        onOpenChange={(open) => !open && setReviewCandidate(null)}
      />
    </div>
  );
}
