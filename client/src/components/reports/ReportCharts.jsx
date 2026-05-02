import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DOMAIN_COLORS = {
  "Code Crafters": "#6366f1",
  "Turing Tribe": "#f59e0b",
  "Cyber Crew": "#ef4444",
  "Pixel Peeps": "#10b981",
};

const STATUS_COLORS = {
  active: "#22c55e",
  warning: "#eab308",
  inactive: "#ef4444",
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
  implemented: "#6366f1",
  completed: "#22c55e",
  on_hold: "#94a3b8",
};

const BATCH_COLORS = ["#6366f1", "#f59e0b", "#10b981"];

const CATEGORY_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
];

const renderCustomLabel = ({ name, percent }) => {
  return `${name} ${(percent * 100).toFixed(0)}%`;
};

export function MembersByDomainChart({ data }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((d) => ({
    name: d._id,
    value: d.count,
  }));

  return (
    <div className="w-full h-[300px]">
      <h4 className="text-sm font-semibold mb-2 text-center">
        Members by Domain
      </h4>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderCustomLabel}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={DOMAIN_COLORS[entry.name] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MembersByBatchChart({ data }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((d) => ({
    name: d._id?.replace("_", " ") || "Unknown",
    value: d.count,
  }));

  return (
    <div className="w-full h-[300px]">
      <h4 className="text-sm font-semibold mb-2 text-center">
        Members by Batch
      </h4>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderCustomLabel}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={BATCH_COLORS[index % BATCH_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemberStatusChart({ data }) {
  if (!data) return null;
  const chartData = [
    { name: "Active", value: data.active || 0 },
    { name: "Warning", value: data.warning || 0 },
    { name: "Inactive", value: data.inactive || 0 },
  ];

  return (
    <div className="w-full h-[300px]">
      <h4 className="text-sm font-semibold mb-2 text-center">Member Status</h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" name="Members">
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name.toLowerCase()] || "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventsByDomainChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="w-full h-[300px]">
      <h4 className="text-sm font-semibold mb-2 text-center">
        Events by Domain
      </h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" name="Events">
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={DOMAIN_COLORS[entry.name] || "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DecisionsByCategoryChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.replace(/-/g, " "),
    value,
  }));

  return (
    <div className="w-full h-[300px]">
      <h4 className="text-sm font-semibold mb-2 text-center">
        Decisions by Category
      </h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" name="Decisions">
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CandidateOutcomesChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="w-full h-[300px]">
      <h4 className="text-sm font-semibold mb-2 text-center">
        Application Outcomes
      </h4>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderCustomLabel}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name.toLowerCase()] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
