import React, { useMemo, useState } from "react";
// Local UI components, so this file can run without shadcn/ui
function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Button({ children, className = "", variant = "default", onClick }) {
  const variantClass = variant === "outline" ? "border border-slate-200 bg-white hover:bg-slate-50" : "";
  return (
    <button onClick={onClick} className={`${variantClass} ${className}`}>
      {children}
    </button>
  );
}
import {
  SlidersHorizontal,
  BarChart3,
  Leaf,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
  Search,
  RotateCcw,
  ChevronRight,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const baseProjects = [
  {
    id: "permeable-pavement",
    name: "Permeable Pavement Upgrade",
    type: "Green Infrastructure",
    location: "Urban street corridor",
    financial: 68,
    environmental: 92,
    social: 84,
    confidence: "Medium-High",
    cost: "$2.4M",
    time: "14 months",
    description:
      "Improves stormwater absorption, reduces flood risk and supports better street liveability, but has a higher upfront construction cost.",
    indicators: [
      { label: "Initial Cost", value: 58, category: "Financial", status: "Verified" },
      { label: "Maintenance Cost", value: 72, category: "Financial", status: "Verified" },
      { label: "Long-Term Economic Benefit", value: 75, category: "Financial", status: "Estimated" },
      { label: "CO₂ Reduction", value: 86, category: "Environmental", status: "Verified" },
      { label: "Flood Risk Reduction", value: 94, category: "Environmental", status: "Estimated" },
      { label: "Stormwater Management", value: 96, category: "Environmental", status: "Verified" },
      { label: "Safety Improvement", value: 81, category: "Social", status: "Estimated" },
      { label: "Accessibility", value: 78, category: "Social", status: "Medium Confidence" },
      { label: "Urban Liveability", value: 74, category: "Social", status: "Low Confidence" },
    ],
  },
  {
    id: "stormwater-drainage",
    name: "Stormwater Drainage Upgrade",
    type: "Water Management",
    location: "Flood-prone residential area",
    financial: 72,
    environmental: 81,
    social: 67,
    confidence: "Medium",
    cost: "$1.9M",
    time: "11 months",
    description:
      "Provides reliable flood reduction and water management benefits, but delivers weaker liveability and community-access outcomes.",
    indicators: [
      { label: "Initial Cost", value: 70, category: "Financial", status: "Verified" },
      { label: "Maintenance Cost", value: 74, category: "Financial", status: "Verified" },
      { label: "Long-Term Economic Benefit", value: 72, category: "Financial", status: "Estimated" },
      { label: "CO₂ Reduction", value: 61, category: "Environmental", status: "Estimated" },
      { label: "Flood Risk Reduction", value: 93, category: "Environmental", status: "Verified" },
      { label: "Stormwater Management", value: 89, category: "Environmental", status: "Verified" },
      { label: "Safety Improvement", value: 70, category: "Social", status: "Estimated" },
      { label: "Accessibility", value: 62, category: "Social", status: "Medium Confidence" },
      { label: "Urban Liveability", value: 59, category: "Social", status: "Low Confidence" },
    ],
  },
  {
    id: "road-resurfacing",
    name: "Conventional Road Resurfacing",
    type: "Transport Infrastructure",
    location: "Main road network",
    financial: 85,
    environmental: 42,
    social: 55,
    confidence: "High",
    cost: "$1.2M",
    time: "8 months",
    description:
      "Scores strongly on cost and delivery practicality, but provides limited environmental and broader social benefits.",
    indicators: [
      { label: "Initial Cost", value: 91, category: "Financial", status: "Verified" },
      { label: "Maintenance Cost", value: 84, category: "Financial", status: "Verified" },
      { label: "Long-Term Economic Benefit", value: 80, category: "Financial", status: "Verified" },
      { label: "CO₂ Reduction", value: 38, category: "Environmental", status: "Estimated" },
      { label: "Flood Risk Reduction", value: 29, category: "Environmental", status: "Verified" },
      { label: "Stormwater Management", value: 40, category: "Environmental", status: "Verified" },
      { label: "Safety Improvement", value: 62, category: "Social", status: "Verified" },
      { label: "Accessibility", value: 51, category: "Social", status: "Medium Confidence" },
      { label: "Urban Liveability", value: 52, category: "Social", status: "Low Confidence" },
    ],
  },
  {
    id: "bike-path",
    name: "Protected Bike Path",
    type: "Active Transport",
    location: "School and town-centre link",
    financial: 63,
    environmental: 77,
    social: 91,
    confidence: "Medium",
    cost: "$1.7M",
    time: "10 months",
    description:
      "Improves safety, accessibility and active transport outcomes, while also reducing car dependence in the long term.",
    indicators: [
      { label: "Initial Cost", value: 65, category: "Financial", status: "Verified" },
      { label: "Maintenance Cost", value: 66, category: "Financial", status: "Verified" },
      { label: "Long-Term Economic Benefit", value: 58, category: "Financial", status: "Estimated" },
      { label: "CO₂ Reduction", value: 80, category: "Environmental", status: "Estimated" },
      { label: "Flood Risk Reduction", value: 54, category: "Environmental", status: "Verified" },
      { label: "Stormwater Management", value: 61, category: "Environmental", status: "Verified" },
      { label: "Safety Improvement", value: 96, category: "Social", status: "Verified" },
      { label: "Accessibility", value: 92, category: "Social", status: "Medium Confidence" },
      { label: "Urban Liveability", value: 88, category: "Social", status: "Estimated" },
    ],
  },
];

const scenarios = {
  balanced: { label: "Balanced Council View", financial: 40, environmental: 35, social: 25 },
  budget: { label: "Budget Priority", financial: 60, environmental: 25, social: 15 },
  climate: { label: "Climate Priority", financial: 25, environmental: 55, social: 20 },
  community: { label: "Community Priority", financial: 25, environmental: 25, social: 50 },
};

function calculateScore(project, weights) {
  return Math.round(
    (project.financial * weights.financial +
      project.environmental * weights.environmental +
      project.social * weights.social) /
      100
  );
}

function ScoreBar({ value, tone = "slate" }) {
  const colorMap = {
    slate: "bg-slate-900",
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    purple: "bg-purple-600",
  };
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div className={`h-2 rounded-full ${colorMap[tone]}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function CategoryBadge({ category }) {
  const styles = {
    Financial: "bg-blue-50 text-blue-700 border-blue-100",
    Environmental: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Social: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[category]}`}>{category}</span>;
}

function StatusBadge({ status }) {
  const isLow = status.toLowerCase().includes("low");
  const isEstimated = status.toLowerCase().includes("estimated") || status.toLowerCase().includes("medium");
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isLow
          ? "bg-rose-50 text-rose-700"
          : isEstimated
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

function WeightSlider({ label, value, icon, onChange }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="flex items-center gap-2">{icon}{label}</span>
        <strong>{value}%</strong>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-slate-950"
      />
    </div>
  );
}

export default function MultiCriteriaDashboard() {
  const [weights, setWeights] = useState(scenarios.balanced);
  const [selectedId, setSelectedId] = useState("permeable-pavement");
  const [query, setQuery] = useState("");

  const totalWeight = weights.financial + weights.environmental + weights.social;

  const normalisedWeights = useMemo(() => {
    if (totalWeight === 0) return { financial: 0, environmental: 0, social: 0 };
    return {
      financial: Math.round((weights.financial / totalWeight) * 100),
      environmental: Math.round((weights.environmental / totalWeight) * 100),
      social: 100 - Math.round((weights.financial / totalWeight) * 100) - Math.round((weights.environmental / totalWeight) * 100),
    };
  }, [weights, totalWeight]);

  const rankedProjects = useMemo(() => {
    return baseProjects
      .filter((project) => project.name.toLowerCase().includes(query.toLowerCase()) || project.type.toLowerCase().includes(query.toLowerCase()))
      .map((project) => ({ ...project, score: calculateScore(project, normalisedWeights) }))
      .sort((a, b) => b.score - a.score);
  }, [query, normalisedWeights]);

  const selected = baseProjects.find((project) => project.id === selectedId) || rankedProjects[0] || baseProjects[0];
  const selectedScore = calculateScore(selected, normalisedWeights);

  const rankingChartData = rankedProjects.map((project) => ({
    name: project.name.replace(" Upgrade", "").replace("Conventional ", ""),
    score: project.score,
  }));

  const radarData = [
    { metric: "Financial", value: selected.financial },
    { metric: "Environmental", value: selected.environmental },
    { metric: "Social", value: selected.social },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-7xl space-y-5"
      >
        <div className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 p-6 text-white shadow-lg lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
              <Building2 className="h-4 w-4" /> Council Infrastructure Decision Dashboard
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Multi-Criteria Infrastructure Evaluation Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Compare infrastructure projects using weighted financial, environmental and social value. Adjust priorities, review rankings and inspect the assumptions behind each result.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 text-center">
            <div>
              <p className="text-xs text-slate-300">Projects</p>
              <p className="text-2xl font-bold">{baseProjects.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Top Score</p>
              <p className="text-2xl font-bold">{rankedProjects[0]?.score ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Weight Sum</p>
              <p className="text-2xl font-bold">100%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="rounded-3xl border-0 shadow-sm lg:col-span-3">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Decision Priorities</h2>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                {Object.entries(scenarios).map(([key, scenario]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-auto rounded-2xl px-3 py-2 text-xs"
                    onClick={() => setWeights(scenario)}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-5">
                <WeightSlider
                  label="Financial"
                  value={weights.financial}
                  icon={<DollarSign className="h-4 w-4 text-blue-600" />}
                  onChange={(value) => setWeights((prev) => ({ ...prev, financial: value }))}
                />
                <WeightSlider
                  label="Environmental"
                  value={weights.environmental}
                  icon={<Leaf className="h-4 w-4 text-emerald-600" />}
                  onChange={(value) => setWeights((prev) => ({ ...prev, environmental: value }))}
                />
                <WeightSlider
                  label="Social"
                  value={weights.social}
                  icon={<Users className="h-4 w-4 text-purple-600" />}
                  onChange={(value) => setWeights((prev) => ({ ...prev, social: value }))}
                />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">
                <Info className="mb-2 h-4 w-4" />
                Your raw slider total is {totalWeight}%. The dashboard normalises this to 100% before calculating rankings.
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-white p-3 text-sm shadow-sm">
                <div className="flex justify-between"><span>Financial</span><strong>{normalisedWeights.financial}%</strong></div>
                <div className="flex justify-between"><span>Environmental</span><strong>{normalisedWeights.environmental}%</strong></div>
                <div className="flex justify-between"><span>Social</span><strong>{normalisedWeights.social}%</strong></div>
              </div>

              <Button
                className="mt-4 w-full rounded-2xl bg-slate-950 py-5 text-white hover:bg-slate-800"
                onClick={() => setWeights(scenarios.balanced)}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Balanced View
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm lg:col-span-5">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Live Project Ranking</h2>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search project or category"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                {rankedProjects.map((project, index) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedId(project.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition hover:scale-[1.01] ${
                      selectedId === project.id ? "border-slate-900 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold ${index === 0 ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}>{index + 1}</div>
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-slate-500">{project.type} · {project.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{project.score}</p>
                        <p className="text-xs text-slate-500">/100</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="mb-1 flex justify-between"><span>Financial</span><strong>{project.financial}</strong></div>
                        <ScoreBar value={project.financial} tone="blue" />
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between"><span>Environmental</span><strong>{project.environmental}</strong></div>
                        <ScoreBar value={project.environmental} tone="green" />
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between"><span>Social</span><strong>{project.social}</strong></div>
                        <ScoreBar value={project.social} tone="purple" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>Confidence: {project.confidence}</span>
                      <span className="flex items-center gap-1">Open details <ChevronRight className="h-4 w-4" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold">Selected Project Detail</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.name}</p>

              <div className="my-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-950 p-4 text-center text-white">
                  <p className="text-xs text-slate-300">Score</p>
                  <p className="text-3xl font-bold">{selectedScore}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Cost</p>
                  <p className="text-lg font-bold">{selected.cost}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-lg font-bold">{selected.time}</p>
                </div>
              </div>

              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selected.description}</p>

              <div className="mt-5 h-64 rounded-3xl bg-white p-3 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#0f172a" fill="#0f172a" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mb-2 h-4 w-4" />
                This project is suitable for further review when environmental and community outcomes are prioritised.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="rounded-3xl border-0 shadow-sm lg:col-span-5">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Ranking Chart</h2>
              <div className="h-72 rounded-3xl bg-white p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#0f172a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Indicator Breakdown</h2>
              <div className="space-y-3">
                {selected.indicators.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <CategoryBadge category={item.category} />
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.value}</p>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    <ScoreBar value={item.value} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm lg:col-span-3">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Data Quality</h2>
              </div>

              <div className="space-y-3 text-sm leading-5">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
                  <strong>Verified data</strong>
                  <p className="mt-1">Cost, maintenance and some environmental indicators come from project estimates or engineering records.</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-800">
                  <strong>Estimated data</strong>
                  <p className="mt-1">Liveability, accessibility and vulnerable-group benefits may need consultation or survey support.</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-800">
                  <strong>Decision risk</strong>
                  <p className="mt-1">The final score should not be used alone. Users should inspect assumptions before making decisions.</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <AlertTriangle className="mb-2 h-4 w-4" />
                This dashboard is a decision-support tool. It makes trade-offs visible, but it does not replace expert judgement.
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
