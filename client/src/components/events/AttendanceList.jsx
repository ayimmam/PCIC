import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCheckin } from "@/hooks/useEvents";
import { toast } from "sonner";

export default function AttendanceList({ eventId, attendees = [] }) {
  const checkin = useCheckin();

  const handleToggle = async (memberId) => {
    try {
      await checkin.mutateAsync({ eventId, memberId });
      toast.success("Attendance updated");
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  if (!attendees.length) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No attendees yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Check-in Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendees.map((a) => (
          <TableRow key={a.memberId?._id || a.memberId}>
            <TableCell className="font-medium">{a.memberId?.name || "Unknown"}</TableCell>
            <TableCell>
              {a.checkedInAt ? format(new Date(a.checkedInAt), "h:mm a") : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={a.checkedIn ? "success" : "secondary"}>
                {a.checkedIn ? "Present" : "Absent"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggle(a.memberId?._id || a.memberId)}
                disabled={checkin.isPending}
              >
                Toggle
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
