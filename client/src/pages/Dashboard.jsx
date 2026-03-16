import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, AlertTriangle, TrendingUp, FileText, ChevronRight } from "lucide-react";
import { useEventCount } from "@/hooks/useEvents";
import { useMemberCount } from "@/hooks/useMembers";
import { useStrikeSummary } from "@/hooks/useStrikes";
import { useMyTasks } from "@/hooks/useDecisions";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ title, value, description, icon: Icon, isLoading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: eventCount, isLoading: eventsLoading } = useEventCount();
  const { data: memberCount, isLoading: membersLoading } = useMemberCount();
  const { data: strikeSummary, isLoading: strikesLoading } = useStrikeSummary();
  const { data: myTasks = [], isLoading: tasksLoading } = useMyTasks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">PCIC Management System Overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={eventCount?.total || 0}
          description={`${eventCount?.upcoming || 0} upcoming`}
          icon={CalendarDays}
          isLoading={eventsLoading}
        />
        <StatCard
          title="Total Members"
          value={memberCount?.total || 0}
          description={`${memberCount?.active || 0} active`}
          icon={Users}
          isLoading={membersLoading}
        />
        <StatCard
          title="Total Strikes"
          value={strikeSummary?.total || 0}
          description={`${strikeSummary?.membersWithStrikes || 0} members affected`}
          icon={AlertTriangle}
          isLoading={strikesLoading}
        />
        <StatCard
          title="Active Rate"
          value={
            memberCount?.total
              ? `${Math.round((memberCount.active / memberCount.total) * 100)}%`
              : "0%"
          }
          description={`${memberCount?.warning || 0} on warning`}
          icon={TrendingUp}
          isLoading={membersLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-3">
                <StatusBar label="Active" count={memberCount?.active || 0} total={memberCount?.total || 1} color="bg-green-500" />
                <StatusBar label="Warning" count={memberCount?.warning || 0} total={memberCount?.total || 1} color="bg-yellow-500" />
                <StatusBar label="Inactive" count={memberCount?.inactive || 0} total={memberCount?.total || 1} color="bg-red-500" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between rounded-md bg-muted p-3">
                <span className="text-sm">Upcoming Events</span>
                <span className="font-semibold">{eventCount?.upcoming || 0}</span>
              </div>
              <div className="flex justify-between rounded-md bg-muted p-3">
                <span className="text-sm">Members With Strikes</span>
                <span className="font-semibold">{strikeSummary?.membersWithStrikes || 0}</span>
              </div>
              <div className="flex justify-between rounded-md bg-muted p-3">
                <span className="text-sm">Max Strikes (Single Member)</span>
                <span className="font-semibold">{strikeSummary?.maxStrikes || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> My Tasks
          </CardTitle>
          <p className="text-xs text-muted-foreground">Pending action items assigned to you</p>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending tasks.</p>
          ) : (
            <ul className="space-y-3">
              {myTasks.map((t, i) => (
                <li key={`${t.decisionId}-${t.itemIndex}-${i}`} className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{t.task}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.decisionTitle} · Due {t.dueDate && format(new Date(t.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/reports" state={{ openDecisionId: t.decisionId }}>
                      View <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBar({ label, count, total, color }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
