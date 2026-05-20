import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  DollarSign,
  Equal,
  Gauge,
  Info,
  Leaf,
  LineChart as LineChartIcon,
  ListChecks,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/*
  ENGG3112 Multi-Criteria Infrastructure Evaluation Dashboard
  ------------------------------------------------------------
  Core logic matches the report:
  1. Project indicator scores are fixed project-level data, scaled 0–100.
  2. Stakeholders adjust financial/environmental/social weights.
  3. Composite score = wf * F + we * E + ws * S.
  4. Sensitivity analysis compares rankings under multiple weighting scenarios.
  5. Robustness means a project remains highly ranked across different scenarios.
*/

const STORAGE_KEY = "engg3112_sensitivity_dashboard_projects_v2";

const categoryColors = {
  financial: "#2563eb",
  environmental: "#059669",
  social: "#9333ea",
};

const lineColors = ["#2563eb", "#059669", "#9333ea", "#f59e0b", "#06b6d4", "#ef4444", "#64748b"];

const stakeholderTypes = [
  "Council Planner",
  "Engineer",
  "Environmental Officer",
  "Community Representative",
  "Finance Officer",
  "Policy / Governance Reviewer",
];

const defaultProjects = [
  {
    id: "water",
    name: "Water Sensitive Urban Design",
    shortName: "water",
    type: "Stormwater / Green Infrastructure",
    location: "Urban drainage corridor",
    financialScore: 50,
    environmentalScore: 55,
    socialScore: 45,
    initialWeights: { financial: 33, environmental: 33, social: 34 },
    confidence: "Medium-High",
    cost: "$2.4M",
    time: "14 months",
    description:
      "Improves stormwater management, flood resilience and environmental performance. It remains relatively balanced across financial, environmental and social objectives.",
    dataQuality: {
      financial: "Verified estimate",
      environmental: "Modelled / medium confidence",
      social: "Proxy-based estimate",
    },
  },
  {
    id: "road",
    name: "Conventional Road Resurfacing",
    shortName: "road",
    type: "Transport Infrastructure",
    location: "Main road network",
    financialScore: 85,
    environmentalScore: 42,
    socialScore: 55,
    initialWeights: { financial: 50, environmental: 25, social: 25 },
    confidence: "High",
    cost: "$1.2M",
    time: "8 months",
    description:
      "Scores strongly on cost and delivery practicality, but provides limited environmental and broader social benefits compared with greener alternatives.",
    dataQuality: {
      financial: "Verified estimate",
      environmental: "Low confidence proxy",
      social: "Medium confidence",
    },
  },
  {
    id: "park",
    name: "Local Park Accessibility Upgrade",
    shortName: "park",
    type: "Public Space / Accessibility",
    location: "Neighbourhood park network",
    financialScore: 45,
    environmentalScore: 40,
    socialScore: 70,
    initialWeights: { financial: 25, environmental: 25, social: 50 },
    confidence: "Medium",
    cost: "$1.6M",
    time: "10 months",
    description:
      "Improves access, liveability and benefits for vulnerable groups. Environmental benefits are moderate and depend on detailed design.",
    dataQuality: {
      financial: "Cost estimate",
      environmental: "Proxy-based estimate",
      social: "Stakeholder validation needed",
    },
  },
  {
    id: "footpath",
    name: "Footpath Safety Improvement",
    shortName: "footpath",
    type: "Pedestrian Safety",
    location: "High-use pedestrian streets",
    financialScore: 40,
    environmentalScore: 35,
    socialScore: 60,
    initialWeights: { financial: 30, environmental: 20, social: 50 },
    confidence: "Medium",
    cost: "$900K",
    time: "7 months",
    description:
      "Improves pedestrian safety and accessibility. Environmental impact is limited, but social benefit may be high in vulnerable-user areas.",
    dataQuality: {
      financial: "Verified estimate",
      environmental: "Limited data",
      social: "Needs local consultation",
    },
  },
  {
    id: "cycleway",
    name: "Protected Cycleway Link",
    shortName: "cycleway",
    type: "Active Transport",
    location: "School and town-centre link",
    financialScore: 35,
    environmentalScore: 50,
    socialScore: 45,
    initialWeights: { financial: 25, environmental: 35, social: 40 },
    confidence: "Medium",
    cost: "$1.7M",
    time: "10 months",
    description:
      "Supports active transport, safety and emissions reduction. Benefits depend on network connectivity and local uptake.",
    dataQuality: {
      financial: "Cost estimate",
      environmental: "Estimated emissions reduction",
      social: "Consultation recommended",
    },
  },
];

const emptyProjectForm = {
  name: "",
  shortName: "",
  type: "",
  location: "",
  cost: "",
  time: "",
  financialScore: 60,
  environmentalScore: 60,
  socialScore: 60,
  financialWeight: 33,
  environmentalWeight: 33,
  socialWeight: 34,
  confidence: "Medium",
  description: "",
};

function clampNumber(value, min = 0, max = 100) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normaliseWeights(rawWeights) {
  const f = clampNumber(rawWeights.financial, 0, 100);
  const e = clampNumber(rawWeights.environmental, 0, 100);
  const s = clampNumber(rawWeights.social, 0, 100);
  const total = f + e + s;

  if (total === 0) {
    return { financial: 33, environmental: 33, social: 34 };
  }

  const financial = Math.round((f / total) * 100);
  const environmental = Math.round((e / total) * 100);
  const social = 100 - financial - environmental;
  return { financial, environmental, social };
}

function calculateScore(project, weights) {
  return Number(
    (
      (project.financialScore * weights.financial +
        project.environmentalScore * weights.environmental +
        project.socialScore * weights.social) /
      100
    ).toFixed(1)
  );
}

function rankProjects(projects, weights) {
  return projects
    .map((project) => ({ ...project, score: calculateScore(project, weights) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((project, index) => ({ ...project, rank: index + 1 }));
}

function getScenarioList(activeWeights) {
  const balanced = normaliseWeights(activeWeights);
  return [
    { id: "current", name: "1. Current / Baseline", shortName: "Current", weights: balanced },
    { id: "financial", name: "2. Financial Priority", shortName: "Financial", weights: { financial: 50, environmental: 25, social: 25 } },
    { id: "environmental", name: "3. Environmental Priority", shortName: "Environmental", weights: { financial: 20, environmental: 60, social: 20 } },
    { id: "social", name: "4. Social Priority", shortName: "Social", weights: { financial: 20, environmental: 20, social: 60 } },
    { id: "equal", name: "5. Equal Weights", shortName: "Equal", weights: { financial: 33, environmental: 33, social: 34 } },
  ];
}

function computeScenarioResults(projects, scenarios) {
  return scenarios.map((scenario) => ({
    ...scenario,
    ranked: rankProjects(projects, scenario.weights),
  }));
}

function getRobustnessSummary(projects, scenarioResults) {
  if (!projects.length || !scenarioResults.length) return [];

  return projects.map((project) => {
    const ranks = scenarioResults.map((scenario) => {
      const result = scenario.ranked.find((item) => item.id === project.id);
      return result?.rank ?? projects.length;
    });
    const scores = scenarioResults.map((scenario) => {
      const result = scenario.ranked.find((item) => item.id === project.id);
      return result?.score ?? 0;
    });
    const averageRank = ranks.reduce((sum, value) => sum + value, 0) / ranks.length;
    const bestRank = Math.min(...ranks);
    const worstRank = Math.max(...ranks);
    const rankRange = worstRank - bestRank;
    const topCount = ranks.filter((rank) => rank === 1).length;
    const averageScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;

    return {
      id: project.id,
      name: project.name,
      shortName: project.shortName,
      averageRank,
      bestRank,
      worstRank,
      rankRange,
      topCount,
      averageScore: Number(averageScore.toFixed(1)),
      robustnessLabel:
        rankRange <= 1
          ? "High robustness"
          : rankRange <= 2
            ? "Moderate robustness"
            : "Sensitive to weighting",
    };
  });
}

function loadInitialProjects() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProjects;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultProjects;
    return parsed;
  } catch {
    return defaultProjects;
  }
}

function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

function Button({ children, className = "", variant = "default", onClick, disabled = false, type = "button" }) {
  const variantClass =
    variant === "outline"
      ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      : variant === "danger"
        ? "bg-rose-600 text-white hover:bg-rose-700"
        : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClass} rounded-2xl px-4 py-3 text-sm font-semibold transition ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
    >
      {children}
    </button>
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
      <div className={`h-2 rounded-full ${colorMap[tone]}`} style={{ width: `${clampNumber(value)}%` }} />
    </div>
  );
}

function WeightPill({ label, value, tone }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-purple-50 text-purple-700",
  }[tone];

  return (
    <span className={`rounded-2xl px-3 py-2 text-sm font-semibold ${toneClass}`}>
      {label} {value}%
    </span>
  );
}

function NumberField({ label, value, onChange, suffix = "" }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-slate-900">
        <input
          type="number"
          min="0"
          max="100"
          value={value}
          onChange={(event) => onChange(clampNumber(event.target.value))}
          className="w-full bg-transparent outline-none"
        />
        {suffix && <span className="text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="text-sm">
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-slate-900"
      />
    </label>
  );
}

function WeightControls({ weights, setWeights }) {
  const total = weights.financial + weights.environmental + weights.social;
  const normalised = normaliseWeights(weights);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        Adjust stakeholder or policy weights. If the raw total is not 100, the dashboard normalises it to 100 before calculating rankings.
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm"><span>Financial weight</span><strong>{weights.financial}%</strong></div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.financial}
            onChange={(event) => setWeights((prev) => ({ ...prev, financial: Number(event.target.value) }))}
            className="w-full accent-blue-600"
          />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm"><span>Environmental weight</span><strong>{weights.environmental}%</strong></div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.environmental}
            onChange={(event) => setWeights((prev) => ({ ...prev, environmental: Number(event.target.value) }))}
            className="w-full accent-emerald-600"
          />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm"><span>Social weight</span><strong>{weights.social}%</strong></div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.social}
            onChange={(event) => setWeights((prev) => ({ ...prev, social: Number(event.target.value) }))}
            className="w-full accent-purple-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-blue-50 p-3 text-center text-blue-700">
          <p className="text-xs">F normalised</p>
          <p className="text-2xl font-bold">{normalised.financial}%</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-center text-emerald-700">
          <p className="text-xs">E normalised</p>
          <p className="text-2xl font-bold">{normalised.environmental}%</p>
        </div>
        <div className="rounded-2xl bg-purple-50 p-3 text-center text-purple-700">
          <p className="text-xs">S normalised</p>
          <p className="text-2xl font-bold">{normalised.social}%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
        Raw total: <strong>{total}%</strong>. Calculation uses: <strong>{normalised.financial}% / {normalised.environmental}% / {normalised.social}%</strong>.
      </div>
    </div>
  );
}

function AddProjectForm({ onAdd }) {
  const [form, setForm] = useState(emptyProjectForm);

  const scoreWeights = normaliseWeights({
    financial: form.financialWeight,
    environmental: form.environmentalWeight,
    social: form.socialWeight,
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;

    const project = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: form.name.trim(),
      shortName: form.shortName.trim() || form.name.trim().split(" ")[0].toLowerCase(),
      type: form.type.trim() || "Infrastructure Project",
      location: form.location.trim() || "Unspecified location",
      cost: form.cost.trim() || "TBC",
      time: form.time.trim() || "TBC",
      financialScore: clampNumber(form.financialScore),
      environmentalScore: clampNumber(form.environmentalScore),
      socialScore: clampNumber(form.socialScore),
      initialWeights: scoreWeights,
      confidence: form.confidence || "Medium",
      description: form.description.trim() || "No description provided.",
      dataQuality: {
        financial: "User-entered estimate",
        environmental: "User-entered estimate",
        social: "User-entered estimate",
      },
    };

    onAdd(project);
    setForm(emptyProjectForm);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-lg font-semibold">Add New Project</h3>
        <p className="mt-1 text-sm text-slate-500">Enter project scores and the initial weighting assumption used as the baseline scenario.</p>
      </div>

      <TextField value={form.name} onChange={(value) => update("name", value)} placeholder="Project name" />
      <div className="grid grid-cols-2 gap-3">
        <TextField value={form.shortName} onChange={(value) => update("shortName", value)} placeholder="Short name for chart" />
        <TextField value={form.type} onChange={(value) => update("type", value)} placeholder="Project type" />
        <TextField value={form.location} onChange={(value) => update("location", value)} placeholder="Location" />
        <TextField value={form.cost} onChange={(value) => update("cost", value)} placeholder="Cost" />
        <TextField value={form.time} onChange={(value) => update("time", value)} placeholder="Time" />
        <TextField value={form.confidence} onChange={(value) => update("confidence", value)} placeholder="Confidence" />
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <h4 className="mb-3 font-semibold">Project Indicator Scores</h4>
        <p className="mb-3 text-sm text-slate-500">These scores describe the project itself. Each score is capped at 100.</p>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Financial" value={form.financialScore} onChange={(value) => update("financialScore", value)} />
          <NumberField label="Environmental" value={form.environmentalScore} onChange={(value) => update("environmentalScore", value)} />
          <NumberField label="Social" value={form.socialScore} onChange={(value) => update("socialScore", value)} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <h4 className="mb-3 font-semibold">Initial Weighting Assumption</h4>
        <p className="mb-3 text-sm text-slate-500">These weights form the baseline scenario for sensitivity analysis. They are normalised to 100%.</p>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Financial" value={form.financialWeight} onChange={(value) => update("financialWeight", value)} suffix="%" />
          <NumberField label="Environmental" value={form.environmentalWeight} onChange={(value) => update("environmentalWeight", value)} suffix="%" />
          <NumberField label="Social" value={form.socialWeight} onChange={(value) => update("socialWeight", value)} suffix="%" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <WeightPill label="F" value={scoreWeights.financial} tone="blue" />
          <WeightPill label="E" value={scoreWeights.environmental} tone="green" />
          <WeightPill label="S" value={scoreWeights.social} tone="purple" />
        </div>
      </div>

      <textarea
        value={form.description}
        onChange={(event) => update("description", event.target.value)}
        placeholder="Project description"
        className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
      />

      <Button type="submit" className="w-full">Create Project</Button>
    </form>
  );
}

function ProjectCard({ project, index, selected, onSelect, onDelete }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-3xl border p-4 text-left transition hover:scale-[1.01] ${selected ? "border-slate-950 bg-white shadow-sm" : "border-slate-200 bg-slate-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold ${index === 0 ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}>
            {index + 1}
          </div>
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

      <div className="mt-4 rounded-2xl bg-white/70 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Project Indicator Scores</p>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div><div className="mb-1 flex justify-between"><span>Financial</span><strong>{project.financialScore}</strong></div><ScoreBar value={project.financialScore} tone="blue" /></div>
          <div><div className="mb-1 flex justify-between"><span>Environmental</span><strong>{project.environmentalScore}</strong></div><ScoreBar value={project.environmentalScore} tone="green" /></div>
          <div><div className="mb-1 flex justify-between"><span>Social</span><strong>{project.socialScore}</strong></div><ScoreBar value={project.socialScore} tone="purple" /></div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <span>Confidence: {project.confidence}</span>
        <span className="flex items-center gap-1">Open details <ChevronRight className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 flex justify-end">
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </span>
      </div>
    </button>
  );
}

function SensitivityAnalysis({ projects, activeWeights }) {
  const scenarios = useMemo(() => getScenarioList(activeWeights), [activeWeights]);
  const scenarioResults = useMemo(() => computeScenarioResults(projects, scenarios), [projects, scenarios]);
  const robustness = useMemo(() => getRobustnessSummary(projects, scenarioResults), [projects, scenarioResults]);

  const chartData = useMemo(() => {
    return scenarios.map((scenario) => {
      const row = { scenario: scenario.shortName };
      const result = scenarioResults.find((item) => item.id === scenario.id);
      projects.forEach((project) => {
        const ranked = result?.ranked.find((item) => item.id === project.id);
        row[project.shortName] = ranked?.rank ?? null;
      });
      return row;
    });
  }, [projects, scenarios, scenarioResults]);

  const mostRobust = [...robustness].sort((a, b) => a.rankRange - b.rankRange || a.averageRank - b.averageRank)[0];
  const mostSensitive = [...robustness].sort((a, b) => b.rankRange - a.rankRange || a.averageRank - b.averageRank)[0];
  const topProject = [...robustness].sort((a, b) => b.topCount - a.topCount || a.averageRank - b.averageRank)[0];

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Sensitivity Analysis & Decision Robustness</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">See how project rankings change under different weighting scenarios.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Robust projects stay highly ranked across scenarios
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 font-semibold">Weighting Scenarios</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {scenarios.map((scenario, index) => (
              <div key={scenario.id} className={`rounded-2xl border p-4 ${index === 0 ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <p className="mb-3 font-semibold">{scenario.name}</p>
                <div className="flex flex-wrap gap-2">
                  <WeightPill label="F" value={scenario.weights.financial} tone="blue" />
                  <WeightPill label="E" value={scenario.weights.environmental} tone="green" />
                  <WeightPill label="S" value={scenario.weights.social} tone="purple" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="mb-1 flex items-center gap-2 font-semibold"><BarChart3 className="h-4 w-4" /> Ranking Changes Across Scenarios</h3>
            <p className="mb-4 text-sm text-slate-500">Lower rank position is better. Rank 1 is best.</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                  <YAxis reversed domain={[1, Math.max(projects.length, 1)]} allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {projects.map((project, index) => (
                    <Line
                      key={project.id}
                      type="monotone"
                      dataKey={project.shortName}
                      stroke={lineColors[index % lineColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><ListChecks className="h-4 w-4" /> Scenario Results Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="border border-slate-200 p-3">Project</th>
                    {scenarios.map((scenario) => (
                      <th key={scenario.id} className="border border-slate-200 p-3 text-center">{scenario.shortName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="border border-slate-200 p-3 font-semibold">{project.shortName}</td>
                      {scenarioResults.map((scenario) => {
                        const result = scenario.ranked.find((item) => item.id === project.id);
                        return (
                          <td key={scenario.id} className="border border-slate-200 p-3 text-center">
                            {result?.rank ?? "—"} ({result?.score ?? "—"})
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-500">Values in parentheses are total weighted scores out of 100.</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-800"><Info className="h-5 w-5" /> Key Insights</h3>
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            {topProject && (
              <p><strong>{topProject.shortName}</strong> is top-ranked in {topProject.topCount} out of {scenarios.length} scenarios, indicating its overall performance under changing stakeholder priorities.</p>
            )}
            {mostRobust && (
              <p><strong>{mostRobust.shortName}</strong> has the smallest ranking movement across scenarios ({mostRobust.bestRank} to {mostRobust.worstRank}), suggesting stronger decision robustness.</p>
            )}
            {mostSensitive && mostSensitive.rankRange > 0 && (
              <p><strong>{mostSensitive.shortName}</strong> changes the most across scenarios ({mostSensitive.bestRank} to {mostSensitive.worstRank}), so its ranking may require additional review or justification.</p>
            )}
            <p>Projects that remain highly ranked under financial-priority, environmental-priority, social-priority and equal-weight scenarios can be treated as more robust decision options.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MultiCriteriaDashboard() {
  const [projects, setProjects] = useState(loadInitialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "");
  const [query, setQuery] = useState("");
  const [stakeholderType, setStakeholderType] = useState("Council Planner");
  const [showAddProject, setShowAddProject] = useState(true);
  const [activeWeights, setActiveWeights] = useState({ financial: 33, environmental: 33, social: 34 });

  const normalisedWeights = useMemo(() => normaliseWeights(activeWeights), [activeWeights]);

  const rankedProjects = useMemo(() => {
    return rankProjects(projects, normalisedWeights).filter(
      (project) =>
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.type.toLowerCase().includes(query.toLowerCase()) ||
        project.location.toLowerCase().includes(query.toLowerCase())
    );
  }, [projects, normalisedWeights, query]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const selectedScore = selectedProject ? calculateScore(selectedProject, normalisedWeights) : null;

  const radarData = selectedProject
    ? [
        { metric: "Financial", value: selectedProject.financialScore },
        { metric: "Environmental", value: selectedProject.environmentalScore },
        { metric: "Social", value: selectedProject.socialScore },
      ]
    : [];

  const rankingChartData = rankedProjects.map((project) => ({ name: project.shortName, score: project.score }));

  function updateProjects(nextProjects) {
    setProjects(nextProjects);
    saveProjects(nextProjects);
  }

  function handleAddProject(project) {
    const nextProjects = [...projects, project];
    updateProjects(nextProjects);
    setSelectedProjectId(project.id);
    setActiveWeights(project.initialWeights);
  }

  function handleDeleteProject(projectId) {
    const confirmed = window.confirm("Delete this project? This only removes it from this browser's local dashboard data.");
    if (!confirmed) return;
    const nextProjects = projects.filter((project) => project.id !== projectId);
    updateProjects(nextProjects);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(nextProjects[0]?.id || "");
    }
  }

  function resetProjects() {
    const confirmed = window.confirm("Reset all project data to the default sample set?");
    if (!confirmed) return;
    updateProjects(defaultProjects);
    setSelectedProjectId(defaultProjects[0].id);
    setActiveWeights({ financial: 33, environmental: 33, social: 34 });
  }

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
              Compare infrastructure projects using financial, environmental and social scores. Adjust stakeholder weights and test ranking robustness with sensitivity analysis.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 text-center">
            <div>
              <p className="text-xs text-slate-300">Projects</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Top Score</p>
              <p className="text-2xl font-bold">{rankedProjects[0]?.score ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Active Weights</p>
              <p className="text-lg font-bold">{normalisedWeights.financial}/{normalisedWeights.environmental}/{normalisedWeights.social}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardContent>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Project Input</h2>
                </div>
                <Button className="px-3 py-2" onClick={() => setShowAddProject((prev) => !prev)}>
                  <Plus className="mr-1 inline h-4 w-4" /> Add
                </Button>
              </div>

              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(event) => {
                    const project = projects.find((item) => item.id === event.target.value);
                    setSelectedProjectId(event.target.value);
                    if (project?.initialWeights) setActiveWeights(project.initialWeights);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {showAddProject && <AddProjectForm onAdd={handleAddProject} />}

              <Button variant="outline" className="mt-4 w-full" onClick={resetProjects}>
                <RotateCcw className="mr-2 inline h-4 w-4" /> Reset Sample Projects
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Stakeholder Weight Adjustment</h2>
              </div>

              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium">Stakeholder / Scenario Type</label>
                <select
                  value={stakeholderType}
                  onChange={(event) => setStakeholderType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  {stakeholderTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <WeightControls weights={activeWeights} setWeights={setActiveWeights} />

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setActiveWeights({ financial: 33, environmental: 33, social: 34 })}>
                  <Equal className="mr-2 inline h-4 w-4" /> Equal
                </Button>
                <Button variant="outline" onClick={() => selectedProject?.initialWeights && setActiveWeights(selectedProject.initialWeights)}>
                  <RotateCcw className="mr-2 inline h-4 w-4" /> Baseline
                </Button>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">
                <Info className="mb-2 h-4 w-4" />
                Weights represent stakeholder or policy priorities. They do not change the project indicator scores; they change how the scores are combined.
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Live Project Ranking</h2>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search project or category"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                {rankedProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    selected={selectedProject?.id === project.id}
                    onSelect={() => setSelectedProjectId(project.id)}
                    onDelete={() => handleDeleteProject(project.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardContent>
              <h2 className="text-lg font-semibold">Selected Project Detail</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedProject?.name || "No project selected"}</p>

              {selectedProject && (
                <>
                  <div className="my-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-slate-950 p-4 text-center text-white">
                      <p className="text-xs text-slate-300">Score</p>
                      <p className="text-3xl font-bold">{selectedScore}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                      <p className="text-xs text-slate-500">Cost</p>
                      <p className="text-lg font-bold">{selectedProject.cost}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                      <p className="text-xs text-slate-500">Time</p>
                      <p className="text-lg font-bold">{selectedProject.time}</p>
                    </div>
                  </div>

                  <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedProject.description}</p>

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
                </>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold">Ranking Chart</h2>
              <div className="h-72 rounded-3xl bg-slate-50 p-4">
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

          <Card className="lg:col-span-4">
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Data Quality & Decision Notes</h2>
              </div>

              <div className="space-y-3 text-sm leading-5">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
                  <strong>Transparent weighting</strong>
                  <p className="mt-1">All financial, environmental and social weights are visible and adjustable before rankings are interpreted.</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-800">
                  <strong>Data confidence</strong>
                  <p className="mt-1">Environmental and social scores may rely on proxy data, stakeholder review or uncertain estimates.</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-800">
                  <strong>Decision-support boundary</strong>
                  <p className="mt-1">The final score should not replace expert judgement, consultation or formal business case review.</p>
                </div>
              </div>

              {selectedProject && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <AlertTriangle className="mb-2 h-4 w-4" />
                  <p className="font-semibold">Selected project data quality</p>
                  <p className="mt-2">Financial: {selectedProject.dataQuality?.financial}</p>
                  <p>Environmental: {selectedProject.dataQuality?.environmental}</p>
                  <p>Social: {selectedProject.dataQuality?.social}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <SensitivityAnalysis projects={projects} activeWeights={normalisedWeights} />
      </motion.div>
    </div>
  );
}
