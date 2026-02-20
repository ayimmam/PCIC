import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function StrikeSearch({ members = [], onSelect }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, members]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search member by name or email..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {filtered.map((m) => (
            <button
              key={m._id}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={() => { onSelect(m); setQuery(m.name); setIsOpen(false); }}
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-muted-foreground">{m.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
