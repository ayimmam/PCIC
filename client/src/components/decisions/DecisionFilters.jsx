import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  { value: "exam-schedule", label: "Exam Schedule" },
  { value: "holiday", label: "Holiday" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "project-progress", label: "Project Progress" },
  { value: "learning", label: "Learning" },
];

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "implemented", label: "Implemented" },
];

export default function DecisionFilters({ category, status, onCategoryChange, onStatusChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={category || ""} onValueChange={(v) => onCategoryChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status || ""} onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
