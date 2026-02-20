import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StrikeBadge from "@/components/strikes/StrikeBadge";
import StrikeHistory from "@/components/strikes/StrikeHistory";
import { useMemberStrikes } from "@/hooks/useStrikes";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import StatusChangeDialog from "./StatusChangeDialog";

const statusVariant = { active: "success", warning: "warning", inactive: "danger" };
const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function MemberDetail({ member, open, onOpenChange }) {
  const { user } = useAuth();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const { data: strikes } = useMemberStrikes(member?._id);
  const canChangeStatus = ["president", "pm", "mc"].includes(user?.role);

  if (!member) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{member.name}</SheetTitle>
            <SheetDescription>{member.email}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
              <Badge variant="outline">{member.domain}</Badge>
              <Badge variant="secondary">{batchLabels[member.batch] || member.batch}</Badge>
              <StrikeBadge count={strikes?.length || 0} />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-md bg-muted p-4">
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">{member.role?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Domain</p>
                <p className="text-sm font-medium">{member.domain}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Batch</p>
                <p className="text-sm font-medium">{batchLabels[member.batch] || member.batch}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium capitalize">{member.status}</p>
              </div>
            </div>

            {canChangeStatus && (
              <Button variant="outline" className="w-full" onClick={() => setStatusDialogOpen(true)}>
                Change Status
              </Button>
            )}

            <Separator />

            <div>
              <h3 className="mb-3 font-semibold">Strike History ({strikes?.length || 0})</h3>
              <StrikeHistory strikes={strikes || []} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        member={member}
      />
    </>
  );
}
