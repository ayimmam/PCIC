import { format } from "date-fns";
import { Calendar, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const domainColors = {
  "T&G": "default",
  Technical: "secondary",
  Events: "success",
  Marketing: "warning",
  Finance: "outline",
  General: "secondary",
};

export default function EventCard({ event, onClick }) {
  const isPast = new Date(event.date) < new Date();
  const checkedInCount = event.attendees?.filter((a) => a.checkedIn).length || 0;

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onClick?.(event)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{event.title}</CardTitle>
          <Badge variant={domainColors[event.domain] || "secondary"}>{event.domain}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(event.date), "MMM d, yyyy · h:mm a")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            {checkedInCount} checked in
            {event.capacity > 0 && ` / ${event.capacity} capacity`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <Badge variant={isPast ? "secondary" : "success"} className="text-xs">
            {isPast ? "Past" : "Upcoming"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
