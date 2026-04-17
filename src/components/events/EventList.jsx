import EventCard from "./EventCard";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingCards } from "@/components/shared/LoadingState";
import { CalendarDays } from "lucide-react";

export default function EventList({ events, isLoading, onEventClick }) {
  if (isLoading) return <LoadingCards count={6} />;

  if (!events?.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No events found"
        message="Create your first event to get started."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event._id} event={event} onClick={onEventClick} />
      ))}
    </div>
  );
}
