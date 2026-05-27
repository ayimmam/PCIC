import { Badge } from "@/components/ui/badge";

const variants = {
  0: { variant: "success", label: "0 Strikes" },
  1: { variant: "warning", label: "1 Strike" },
  2: { variant: "warning", label: "2 Strikes" },
  3: { variant: "danger", label: "3 Strikes" },
};

export default function StrikeBadge({ count = 0 }) {
  const capped = Math.min(count, 3);
  const config = variants[capped] || variants[3];

  return (
    <Badge variant={config.variant}>
      {count > 3 ? `${count} Strikes` : config.label}
    </Badge>
  );
}
