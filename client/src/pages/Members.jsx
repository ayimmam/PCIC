import { useState, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import MemberTable from "@/components/members/MemberTable";
import MemberFilters from "@/components/members/MemberFilters";
import MemberDetail from "@/components/members/MemberDetail";
import CandidateReview from "@/components/candidates/CandidateReview";
import { useMembers } from "@/hooks/useMembers";
import { useStrikes } from "@/hooks/useStrikes";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Members() {
  const [filters, setFilters] = useState({ search: "", domain: "", batch: "", status: "" });
  const [selectedMember, setSelectedMember] = useState(null);
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const { user } = useAuth();

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

      <div className="space-y-3">
        {memberCandidate && (
          <div className="rounded-lg border bg-muted/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  Promotion request{" "}
                  <Badge variant={memberCandidate.status === "pending" ? "warning" : "success"}>
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
          </div>
        )}

        {user?.role === "president" && pendingPromotions.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3 text-sm">
            <div>
              <p className="font-medium">
                Pending promotion requests{" "}
                <Badge variant="warning">{pendingPromotions.length}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Click &quot;Review next&quot; to open the candidate&apos;s portfolio from this page.
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
      <MemberTable
        members={members}
        isLoading={isLoading}
        strikeCounts={strikeCounts}
        onRowClick={setSelectedMember}
      />
      <MemberDetail
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
      <CandidateReview
        candidate={reviewCandidate}
        open={!!reviewCandidate}
        onOpenChange={(open) => !open && setReviewCandidate(null)}
      />
    </div>
  );
}
