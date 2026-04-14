import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import AttendanceList from "./AttendanceList";
import { useCheckin, useUpdateEvent } from "@/hooks/useEvents";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function EventDetail({ event, open, onOpenChange }) {
  const { user } = useAuth();
  const checkin = useCheckin();
  const updateEvent = useUpdateEvent();
  const [search, setSearch] = useState("");
  const [pendingMemberId, setPendingMemberId] = useState(null);
  const [reportedAttendeeCount, setReportedAttendeeCount] = useState("");

  const canManageAttendance = ["president", "pm", "mc", "domain_leader", "event_organizer"].includes(user?.role);

  const checkedInCount = event?.attendees?.filter((attendee) => attendee.checkedIn).length || 0;
  const attendanceCount = event?.attendees?.length || 0;
  const remainingCapacity =
    event?.capacity > 0 ? Math.max(event.capacity - checkedInCount, 0) : null;

  useEffect(() => {
    if (!event) {
      setReportedAttendeeCount("");
      return;
    }

    if (event.reportedAttendeeCount === null || event.reportedAttendeeCount === undefined) {
      setReportedAttendeeCount("");
      return;
    }
    setReportedAttendeeCount(String(event.reportedAttendeeCount));
  }, [event]);

  const { data: memberOptions = [], isFetching: isSearchingMembers } = useMembers(
    {
      search,
      status: "active",
    },
    {
      enabled: canManageAttendance && search.trim().length >= 2,
    }
  );

  const quickResults = useMemo(
    () =>
      memberOptions
        .filter(
          (member) =>
            !event?.attendees?.some(
              (a) => (a.memberId?._id || a.memberId) === member._id && a.checkedIn
            )
        )
        .slice(0, 8),
    [memberOptions, event]
  );

  if (!event) return null;

  const handleSelfCheckin = async () => {
    try {
      await checkin.mutateAsync({ eventId: event._id, memberId: user._id, action: "checkIn" });
      toast.success("Checked in!");
    } catch {
      toast.error("Check-in failed");
    }
  };

  const handleQuickCheckin = async (memberId) => {
    setPendingMemberId(memberId);

    try {
      await checkin.mutateAsync({ eventId: event._id, memberId, action: "checkIn" });
      toast.success("Member checked in");
      setSearch("");
    } catch (error) {
      const requiresOverride = error?.response?.status === 409 && error?.response?.data?.requiresOverride;

      if (!requiresOverride) {
        toast.error(error?.response?.data?.message || "Failed to check in member");
        return;
      }

      const confirmOverride = window.confirm(
        "Event capacity is full. Do you want to override capacity for this check-in?"
      );

      if (!confirmOverride) {
        return;
      }

      try {
        await checkin.mutateAsync({
          eventId: event._id,
          memberId,
          action: "checkIn",
          overrideCapacity: true,
        });
        toast.success("Member checked in with capacity override");
        setSearch("");
      } catch (overrideError) {
        toast.error(overrideError?.response?.data?.message || "Override check-in failed");
      }
    } finally {
      setPendingMemberId(null);
    }
  };

  const handleAttendanceSave = async () => {
    const trimmed = reportedAttendeeCount.trim();

    if (trimmed !== "" && Number.isNaN(Number(trimmed))) {
      toast.error("Attendee number must be a valid number");
      return;
    }

    const parsedValue = trimmed === "" ? null : Number(trimmed);
    if (parsedValue !== null && parsedValue < 0) {
      toast.error("Attendee number cannot be negative");
      return;
    }

    try {
      await updateEvent.mutateAsync({
        id: event._id,
        reportedAttendeeCount: parsedValue,
      });
      toast.success("Attendance number updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update attendance number");
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
            <Badge variant="outline">Checked In: {checkedInCount}</Badge>
            <Badge variant="outline">
              Reported: {event.reportedAttendeeCount ?? "Not set"}
            </Badge>
            {event.capacity > 0 && <Badge variant="outline">Remaining: {remainingCapacity}</Badge>}
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

          {canManageAttendance && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Attendance Number</h3>
                <p className="text-xs text-muted-foreground">
                  Enter the final attendee number for this event. Leave empty to clear.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={reportedAttendeeCount}
                    onChange={(e) => setReportedAttendeeCount(e.target.value)}
                    placeholder="e.g. 120"
                  />
                  <Button
                    onClick={handleAttendanceSave}
                    disabled={updateEvent.isPending}
                  >
                    {updateEvent.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {canManageAttendance && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Quick Check-in</h3>
                <Input
                  placeholder="Search active member by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search.trim().length > 0 && search.trim().length < 2 && (
                  <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
                )}
                {search.trim().length >= 2 && (
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
                    {isSearchingMembers && (
                      <p className="text-sm text-muted-foreground">Searching members...</p>
                    )}
                    {!isSearchingMembers && quickResults.length === 0 && (
                      <p className="text-sm text-muted-foreground">No available members found.</p>
                    )}
                    {quickResults.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleQuickCheckin(member._id)}
                          disabled={checkin.isPending || pendingMemberId === member._id}
                        >
                          {pendingMemberId === member._id ? "Checking in..." : "Check In"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">Attendance ({attendanceCount})</h3>
            <AttendanceList eventId={event._id} attendees={event.attendees || []} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
