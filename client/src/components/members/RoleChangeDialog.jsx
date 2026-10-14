import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpdateMemberRole } from "@/hooks/useMembers";

const roles = [
  ["member", "Member"], ["president", "President"], ["vice_president", "Vice President"],
  ["secretary", "Secretary"], ["pm", "Product Manager"], ["mc", "Membership Coordinator"],
  ["event_organizer", "Event Team"], ["pr", "Public Relations"], ["domain_leader", "Domain Leader"],
];

export default function RoleChangeDialog({ member, open, onOpenChange }) {
  const [role, setRole] = useState(member?.role || "member");
  const updateRole = useUpdateMemberRole();
  useEffect(() => { setRole(member?.role || "member"); }, [member]);

  const submit = async () => {
    try {
      await updateRole.mutateAsync({ id: member._id, role });
      toast.success("Leadership role updated. The member must sign in again.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update role");
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader><DialogTitle>Change leadership role</DialogTitle><DialogDescription>Assign a role to {member?.name}. Their current session will end.</DialogDescription></DialogHeader>
      <select aria-label="Leadership role" className="w-full rounded-md border bg-background px-3 py-2" value={role} onChange={(event) => setRole(event.target.value)}>
        {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={updateRole.isPending || role === member?.role}>{updateRole.isPending ? "Saving…" : "Save role"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
