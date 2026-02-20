import { format } from "date-fns";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AttendanceList from "./AttendanceList";
import { useCheckin } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function EventDetail({ event, open, onOpenChange }) {
  const { user } = useAuth();
  const checkin = useCheckin();

  if (!event) return null;

  const handleSelfCheckin = async () => {
    try {
      await checkin.mutateAsync({ eventId: event._id, memberId: user._id });
      toast.success("Checked in!");
    } catch {
      toast.error("Check-in failed");
    }
  };

  const alreadyCheckedIn = event.attendees?.some(
    (a) => (a.memberId?._id || a.memberId) === user?._id && a.checkedIn
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{event.title}</SheetTitle>
          <SheetDescription>
            {format(new Date(event.date), "EEEE, MMMM d, yyyy · h:mm a")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{event.domain}</Badge>
            <Badge variant={new Date(event.date) < new Date() ? "secondary" : "success"}>
              {new Date(event.date) < new Date() ? "Past" : "Upcoming"}
            </Badge>
            {event.capacity > 0 && <Badge variant="outline">Capacity: {event.capacity}</Badge>}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          {!alreadyCheckedIn && new Date(event.date) >= new Date() && (
            <Button onClick={handleSelfCheckin} disabled={checkin.isPending} className="w-full">
              {checkin.isPending ? "Checking in..." : "Check In"}
            </Button>
          )}
          {alreadyCheckedIn && (
            <p className="rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-700">
              You are checked in
            </p>
          )}

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">Attendance ({event.attendees?.length || 0})</h3>
            <AttendanceList eventId={event._id} attendees={event.attendees || []} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
