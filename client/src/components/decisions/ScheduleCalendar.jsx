import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

function dayHasDecision(day, decision) {
  const start = decision.startDate ? new Date(decision.startDate) : null;
  const end = decision.endDate ? new Date(decision.endDate) : decision.startDate ? new Date(decision.startDate) : null;
  if (!start) return false;
  if (!end) return isSameDay(day, start);
  return isWithinInterval(day, { start, end });
}

export default function ScheduleCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const { data: decisions = [], isLoading } = useDecisions({
    startDate: monthStart.toISOString().slice(0, 10),
    endDate: monthEnd.toISOString().slice(0, 10),
  });

  const scheduleDecisions = decisions.filter(
    (d) =>
      (d.category === "exam-schedule" || d.category === "holiday") &&
      d.startDate
  );

  const first = startOfMonth(month);
  const day = new Date(first);
  day.setDate(day.getDate() - day.getDay());
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-1 rounded-lg border p-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {weekDays.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, month);
              const dayDecisions = scheduleDecisions.filter((d) =>
                dayHasDecision(day, d)
              );
              return (
                <div
                  key={i}
                  className={`min-h-20 rounded-md border p-2 ${
                    inMonth ? "bg-background" : "bg-muted/30"
                  }`}
                >
                  <span
                    className={`text-sm ${inMonth ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayDecisions.slice(0, 2).map((d) => (
                      <div
                        key={d._id}
                        className={`truncate rounded px-1 py-0.5 text-xs ${
                          d.category === "exam-schedule"
                            ? "bg-primary/15 text-primary"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                        title={d.title}
                      >
                        {d.title}
                      </div>
                    ))}
                    {dayDecisions.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayDecisions.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

