import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  BarChart3,
  Vote,
  Info,
  CheckCircle2,
  AlertTriangle,
  CircleDollarSign,
  Leaf,
  Users,
} from "lucide-react";

const PRIORITIES = [
  {
    key: "financial",
    label: "Financial",
    short: "F",
    icon: CircleDollarSign,
    description: "Cost, maintenance, and long-term economic benefit",
  },
  {
    key: "environmental",
    label: "Environmental",
    short: "E",
    icon: Leaf,
    description: "CO₂ reduction, stormwater, flood risk, and water quality",
  },
  {
    key: "social",
    label: "Social",
    short: "S",
    icon: Users,
    description: "Safety, accessibility, liveability, and vulnerable groups",
  },
];

const DEFAULT_PROJECTS = [
  {
    id: "road-resurfacing",
    name: "Conventional Road Resurfacing",
    type: "Road maintenance",
    financial: 86,
    environmental: 38,
    social: 49,
    confidence: "High",
    note: "Low delivery risk and strong cost efficiency, but limited environmental and social uplift.",
  },
  {
    id: "stormwater-upgrade",
    name: "Green Stormwater Upgrade",
    type: "Green infrastructure",
    financial: 64,
    environmental: 91,
    social: 76,
    confidence: "Medium",
    note: "Strong flood reduction and water quality benefit, with moderate social liveability value.",
  },
  {
    id: "bike-corridor",
    name: "Protected Bike Lane Corridor",
    type: "Active transport",
    financial: 58,
    environmental: 79,
    social: 92,
    confidence: "Medium",
    note: "High safety and accessibility benefit, but may require more stakeholder consultation.",
  },
  {
    id: "bus-stop-accessibility",
    name: "Accessible Bus Stop Upgrade",
    type: "Public transport access",
    financial: 69,
    environmental: 57,
    social: 90,
    confidence: "High",
    note: "Strong inclusion and accessibility outcome for elderly, disabled, and low-income users.",
  },
];

const EMPTY_PROJECT_FORM = {
  name: "",
  type: "",
  financial: 50,
  environmental: 50,
  social: 50,
  confidence: "Medium",
  note: "User-added project. Scores can be refined when better data is available.",
};

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function getTotalVotes(votes) {
  return PRIORITIES.reduce((sum, p) => sum + Number(votes[p.key] || 0), 0);
}

function weightsFromVotes(votes) {
  const total = getTotalVotes(votes);
  if (total === 0) {
    return { financial: 0, environmental: 0, social: 0 };
  }
  return {
    financial: (votes.financial / total) * 100,
    environmental: (votes.environmental / total) * 100,
    social: (votes.social / total) * 100,
  };
}

function finalScore(project, weights) {
  const totalWeight = weights.financial + weights.environmental + weights.social;
  if (totalWeight === 0) return 0;
  return (
    (project.financial * weights.financial +
      project.environmental * weights.environmental +
      project.social * weights.social) /
    totalWeight
  );
}

function rankProjects(projects, weights) {
  return [...projects]
    .map((project) => ({ ...project, final: finalScore(project, weights) }))
    .sort((a, b) => b.final - a.final);
}

function dominantPriority(project) {
  const scores = [
    { key: "financial", label: "Financial priority", value: project.financial },
    { key: "environmental", label: "Environmental priority", value: project.environmental },
    { key: "social", label: "Social priority", value: project.social },
  ];
  return scores.sort((a, b) => b.value - a.value)[0];
}

function confidenceStyle(confidence) {
  if (confidence === "High") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (confidence === "Low") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-sky-50 text-sky-700 border-sky-200";
}

function ScoreCircle({ score, size = 82 }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 82 82" className="-rotate-90">
        <circle
          cx="41"
          cy="41"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200"
        />
        <motion.circle
          cx="41"
          cy="41"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-slate-900"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold leading-none text-slate-950">{score.toFixed(1)}</div>
        <div className="text-[10px] font-medium text-slate-500">/ 100</div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, open, onToggle, children, subtitle }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">{title}</h3>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open ? <div className="border-t border-slate-100 p-4 pt-3">{children}</div> : null}
    </section>
  );
}

export default function InfrastructureDashboardRedesign() {
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_PROJECTS[0].id);
  const [voteCounts, setVoteCounts] = useState({ financial: 0, environmental: 0, social: 0 });
  const [myVote, setMyVote] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sensitivityOpen, setSensitivityOpen] = useState(true);
  const [form, setForm] = useState(EMPTY_PROJECT_FORM);

  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem("engg3112_vote_counts_v2");
      const savedMyVote = localStorage.getItem("engg3112_my_vote_v2");
      const savedProjects = localStorage.getItem("engg3112_projects_v2");
      if (savedVotes) setVoteCounts(JSON.parse(savedVotes));
      if (savedMyVote && savedMyVote !== "null") setMyVote(savedMyVote);
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          setSelectedProjectId(parsed[0].id);
        }
      }
    } catch {
      setVoteCounts({ financial: 0, environmental: 0, social: 0 });
      setMyVote(null);
      setProjects(DEFAULT_PROJECTS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("engg3112_vote_counts_v2", JSON.stringify(voteCounts));
  }, [voteCounts]);

  useEffect(() => {
    localStorage.setItem("engg3112_my_vote_v2", JSON.stringify(myVote));
  }, [myVote]);

  useEffect(() => {
    localStorage.setItem("engg3112_projects_v2", JSON.stringify(projects));
  }, [projects]);

  const publicWeights = useMemo(() => weightsFromVotes(voteCounts), [voteCounts]);
  const totalVotes = useMemo(() => getTotalVotes(voteCounts), [voteCounts]);
  const currentRanking = useMemo(() => rankProjects(projects, publicWeights), [projects, publicWeights]);
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const scenarios = useMemo(
    () => [
      {
        name: "Current Public Vote",
        description: "Uses only the live vote distribution. This is the main dashboard weighting.",
        weights: publicWeights,
      },
      {
        name: "Equal Weight",
        description: "Checks whether the ranking changes when all criteria are treated equally.",
        weights: { financial: 33.33, environmental: 33.33, social: 33.34 },
      },
      {
        name: "Council Priority",
        description: "Example policy scenario with stronger financial emphasis.",
        weights: { financial: 50, environmental: 30, social: 20 },
      },
    ],
    [publicWeights]
  );

  function submitVote(priorityKey) {
    setVoteCounts((prev) => {
      const next = { ...prev };
      if (myVote) next[myVote] = Math.max(0, next[myVote] - 1);
      next[priorityKey] = next[priorityKey] + 1;
      return next;
    });
    setMyVote(priorityKey);
  }

  function clearMyVote() {
    if (!myVote) return;
    setVoteCounts((prev) => ({
      ...prev,
      [myVote]: Math.max(0, prev[myVote] - 1),
    }));
    setMyVote(null);
  }

  function resetDemoData() {
    setVoteCounts({ financial: 0, environmental: 0, social: 0 });
    setMyVote(null);
    setProjects(DEFAULT_PROJECTS);
    setSelectedProjectId(DEFAULT_PROJECTS[0].id);
    setForm(EMPTY_PROJECT_FORM);
  }

  function addProject(event) {
    event.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) return;

    const newProject = {
      id: `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: cleanName,
      type: form.type.trim() || "User-defined project",
      financial: clampScore(form.financial),
      environmental: clampScore(form.environmental),
      social: clampScore(form.social),
      confidence: form.confidence,
      note: form.note.trim() || EMPTY_PROJECT_FORM.note,
    };

    setProjects((prev) => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setForm(EMPTY_PROJECT_FORM);
    setAddOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                ENGG3112 · Group 13
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Multi-Criteria Infrastructure Evaluation Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                A redesigned UI where public voting determines the main weights, project cards only select projects, and sensitivity analysis compares assumptions without changing the live ranking model.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur">
              {PRIORITIES.map((p) => (
                <div key={p.key} className="rounded-xl bg-white/10 px-4 py-3">
                  <div className="text-2xl font-bold">{publicWeights[p.key].toFixed(0)}%</div>
                  <div className="text-xs text-slate-300">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                    <Vote size={20} /> Public Weighting Vote
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Weights are calculated only from votes, not from project card clicks.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {PRIORITIES.map((priority) => {
                  const Icon = priority.icon;
                  const active = myVote === priority.key;
                  const voteCount = voteCounts[priority.key] || 0;
                  const weight = publicWeights[priority.key] || 0;
                  return (
                    <button
                      key={priority.key}
                      type="button"
                      onClick={() => submitVote(priority.key)}
                      className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-white/15" : "bg-slate-100"}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="font-semibold">{priority.label}</div>
                            <p className={`mt-0.5 text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>
                              {priority.description}
                            </p>
                          </div>
                        </div>
                        {active ? <CheckCircle2 size={18} /> : null}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span>{voteCount} votes</span>
                        <span className="font-semibold">Weight: {weight.toFixed(1)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={clearMyVote}
                  disabled={!myVote}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear my vote
                </button>
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  <RotateCcw size={15} /> Reset demo
                </button>
              </div>

              {totalVotes === 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No votes yet. The public-vote ranking stays at 0 until users submit priorities.
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Weighting Logic</h2>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-700">
                Score = wF × F + wE × E + wS × S
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The final score updates only when vote-derived weights change. Selecting a project does not change F, E, S, votes, or weights.
              </p>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Project Selection</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a project to inspect. This action does not modify weighting results.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                  {projects.length} projects available
                </div>
              </div>
            </div>

            <CollapsibleSection
              title="Add Project"
              subtitle="Add a new option without affecting current public weights"
              icon={Plus}
              open={addOpen}
              onToggle={() => setAddOpen((v) => !v)}
            >
              <form onSubmit={addProject} className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Project name</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Urban Tree Canopy Expansion"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Project type</span>
                  <input
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                    placeholder="e.g. Green infrastructure"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-500"
                  />
                </label>
                {PRIORITIES.map((p) => (
                  <label key={p.key} className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">{p.label} Score: {form[p.key]}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form[p.key]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                      className="w-full accent-slate-950"
                    />
                  </label>
                ))}
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Data confidence</span>
                  <select
                    value={form.confidence}
                    onChange={(e) => setForm((prev) => ({ ...prev, confidence: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-500"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Project note</span>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-500"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 md:col-span-2"
                >
                  Add project
                </button>
              </form>
            </CollapsibleSection>

            <CollapsibleSection
              title="Sensitivity Analysis"
              subtitle="Scenario comparison only; does not change the main vote weights"
              icon={BarChart3}
              open={sensitivityOpen}
              onToggle={() => setSensitivityOpen((v) => !v)}
            >
              <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-800">
                Sensitivity analysis tests whether rankings are robust under different weighting assumptions. These scenarios are read-only and never overwrite public vote weights.
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                {scenarios.map((scenario) => {
                  const ranking = rankProjects(projects, scenario.weights);
                  return (
                    <div key={scenario.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="font-bold text-slate-950">{scenario.name}</h4>
                      <p className="mt-1 min-h-12 text-xs leading-5 text-slate-500">{scenario.description}</p>
                      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[11px] font-semibold text-slate-600">
                        <span className="rounded-lg bg-white px-2 py-1">F {scenario.weights.financial.toFixed(0)}%</span>
                        <span className="rounded-lg bg-white px-2 py-1">E {scenario.weights.environmental.toFixed(0)}%</span>
                        <span className="rounded-lg bg-white px-2 py-1">S {scenario.weights.social.toFixed(0)}%</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {ranking.slice(0, 3).map((project, index) => (
                          <div key={project.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                            <span className="truncate pr-2">
                              #{index + 1} {project.name}
                            </span>
                            <span className="font-bold text-slate-950">{project.final.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            <div className="grid gap-4 xl:grid-cols-2">
              {projects.map((project) => {
                const isSelected = selectedProjectId === project.id;
                const score = finalScore(project, publicWeights);
                const priority = dominantPriority(project);
                return (
                  <motion.button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    layout
                    className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-bold text-slate-950">{project.name}</h3>
                          {isSelected ? (
                            <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs font-semibold text-white">Selected</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{project.type}</p>
                      </div>
                      <ScoreCircle score={score} />
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Financial Score</div>
                        <div className="mt-1 text-xl font-bold text-slate-950">{project.financial} / 100</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Environmental Score</div>
                        <div className="mt-1 text-xl font-bold text-slate-950">{project.environmental} / 100</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Social Score</div>
                        <div className="mt-1 text-xl font-bold text-slate-950">{project.social} / 100</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {priority.label}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceStyle(project.confidence)}`}>
                        Data confidence: {project.confidence}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Current Ranking</h2>
              <p className="mt-1 text-sm text-slate-500">Based on current public-vote weights.</p>
              <div className="mt-4 space-y-2">
                {currentRanking.map((project, index) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition hover:bg-slate-50 ${
                      selectedProjectId === project.id ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-950">#{index + 1}</div>
                      <div className="truncate text-sm font-semibold text-slate-800">{project.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-950">{project.final.toFixed(1)}</div>
                      <div className="text-xs text-slate-500">weighted score</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {selectedProject ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">Selected Project Detail</h2>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{selectedProject.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{selectedProject.type}</p>
                  </div>
                  <ScoreCircle score={finalScore(selectedProject, publicWeights)} size={74} />
                </div>

                <div className="mt-4 space-y-3">
                  {PRIORITIES.map((p) => (
                    <div key={p.key}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{p.label}</span>
                        <span className="font-bold text-slate-950">{selectedProject[p.key]} / 100</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-slate-950 transition-all"
                          style={{ width: `${selectedProject[p.key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
                    <Info size={16} /> Interpretation
                  </div>
                  {selectedProject.note}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <AlertTriangle size={18} /> Fixed UI Issues
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>• Project card clicks only select projects.</li>
                <li>• Vote counts are the only source of public weights.</li>
                <li>• Sensitivity analysis is read-only and scenario-based.</li>
                <li>• All scores are labelled as /100 to avoid unclear numbers.</li>
                <li>• The dynamic final-score circle is restored.</li>
              </ul>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
