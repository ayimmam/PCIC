import { useState, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import MemberTable from "@/components/members/MemberTable";
import MemberFilters from "@/components/members/MemberFilters";
import MemberDetail from "@/components/members/MemberDetail";
import { useMembers } from "@/hooks/useMembers";
import { useStrikes } from "@/hooks/useStrikes";

export default function Members() {
  const [filters, setFilters] = useState({ search: "", domain: "", batch: "", status: "" });
  const [selectedMember, setSelectedMember] = useState(null);

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v)
  );

  const { data: members, isLoading } = useMembers(activeFilters);
  const { data: strikes } = useStrikes();

  const strikeCounts = useMemo(() => {
    if (!strikes) return {};
    return strikes.reduce((acc, s) => {
      const id = s.memberId?._id || s.memberId;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
  }, [strikes]);

  return (
    <div className="space-y-6">
      <PageHeader title="Members" subtitle="Manage community members and their status" />
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
    </div>
  );
}
