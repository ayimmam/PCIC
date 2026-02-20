import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EventList from "@/components/events/EventList";
import EventDetail from "@/components/events/EventDetail";
import CreateEventForm from "@/components/events/CreateEventForm";
import RoleGate from "@/components/shared/RoleGate";
import { useEvents } from "@/hooks/useEvents";

const DOMAINS = ["T&G", "Technical", "Events", "Marketing", "Finance", "General"];

export default function Events() {
  const [tab, setTab] = useState("upcoming");
  const [domainFilter, setDomainFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filters = { timeframe: tab === "create" ? undefined : tab, domain: domainFilter || undefined };
  const { data: events, isLoading } = useEvents(tab === "create" ? {} : filters);

  return (
    <div className="space-y-6">
      <PageHeader title="Events" subtitle="Manage community events and track attendance" />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <RoleGate allowedRoles={["president", "pm", "mc", "domain_leader"]}>
              <TabsTrigger value="create">Create</TabsTrigger>
            </RoleGate>
          </TabsList>

          {tab !== "create" && (
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="upcoming">
          <EventList events={events} isLoading={isLoading} onEventClick={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="past">
          <EventList events={events} isLoading={isLoading} onEventClick={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="create">
          <div className="mx-auto max-w-lg">
            <CreateEventForm onSuccess={() => setTab("upcoming")} />
          </div>
        </TabsContent>
      </Tabs>

      <EventDetail event={selectedEvent} open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)} />
    </div>
  );
}
