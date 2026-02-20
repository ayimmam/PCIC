import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const DOMAINS = ["T&G", "Technical", "Events", "Marketing", "Finance", "General"];
const BATCHES = [
  { value: "batch_1", label: "Batch 1" },
  { value: "batch_2", label: "Batch 2" },
  { value: "batch_3", label: "Batch 3" },
];
const STATUSES = [
  { value: "active", label: "Active" },
  { value: "warning", label: "Warning" },
  { value: "inactive", label: "Inactive" },
];

export default function MemberFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value === "all" ? "" : value });

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={filters.search || ""}
          onChange={(e) => update("search", e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filters.domain || ""} onValueChange={(v) => update("domain", v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Domain" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All domains</SelectItem>
          {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.batch || ""} onValueChange={(v) => update("batch", v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Batch" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All batches</SelectItem>
          {BATCHES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.status || ""} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
