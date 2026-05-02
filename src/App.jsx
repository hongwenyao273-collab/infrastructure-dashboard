import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  DollarSign,
  Info,
  Leaf,
  ListChecks,
  PieChart as PieChartIcon,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  Users,
  Vote,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;

function getOrCreateVoterId() {
  const storageKey = "infrastructure_dashboard_voter_id";
  let voterId = localStorage.getItem(storageKey);
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem(storageKey, voterId);
  }
  return voterId;
}

function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
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
      className={`${variantClass} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

const defaultProjects = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Permeable Pavement Upgrade",
    type: "Green Infrastructure",
    location: "Urban street corridor",
    financial_score: 68,
    environmental_score: 92,
    social_score: 84,
    confidence: "Medium-High",
    cost: "$2.4M",
    time: "14 months",
    description:
      "Improves stormwater absorption, reduces flood risk and supports better street liveability, but has a higher upfront construction cost.",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Stormwater Drainage Upgrade",
    type: "Water Management",
    location: "Flood-prone residential area",
    financial_score: 72,
    environmental_score: 81,
    social_score: 67,
    confidence: "Medium",
    cost: "$1.9M",
    time: "11 months",
    description:
      "Provides reliable flood reduction and water management benefits, but delivers weaker liveability and community-access outcomes.",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Conventional Road Resurfacing",
    type: "Transport Infrastructure",
    location: "Main road network",
    financial_score: 85,
    environmental_score: 42,
    social_score: 55,
    confidence: "High",
    cost: "$1.2M",
    time: "8 months",
    description:
      "Scores strongly on cost and delivery practicality, but provides limited environmental and broader social benefits.",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Protected Bike Path",
    type: "Active Transport",
    location: "School and town-centre link",
    financial_score: 63,
    environmental_score: 77,
    social_score: 91,
    confidence: "Medium",
    cost: "$1.7M",
    time: "10 months",
    description:
      "Improves safety, accessibility and active transport outcomes, while also reducing car dependence in the long term.",
  },
];

const priorityOptions = [
  {
    id: "financial",
    label: "Financial Priority",
    shortLabel: "Financial",
    icon: DollarSign,
    description: "Cost control, maintenance efficiency and long-term economic benefit.",
    tone: "blue",
  },
  {
    id: "environmental",
    label: "Environmental Priority",
    shortLabel: "Environmental",
    icon: Leaf,
    description: "CO₂ reduction, flood risk reduction, stormwater management and water quality.",
    tone: "green",
  },
  {
    id: "social",
    label: "Social Priority",
    shortLabel: "Social",
    icon: Users,
    description: "Safety, accessibility, liveability and benefits to vulnerable groups.",
    tone: "purple",
  },
];

const stakeholderTypes = [
  "Council Planner",
  "Engineer",
  "Environmental Advisor",
  "Community Representative",
  "Finance Officer",
  "Public Health Officer",
];

const categoryColors = {
  financial: "#2563eb",
  environmental: "#059669",
  social: "#9333ea",
};

const emptyProjectForm = {
  name: "",
  type: "",
  location: "",
  cost: "",
  time: "",
  financial_score: 60,
  environmental_score: 60,
  social_score: 60,
  confidence: "Medium",
  description: "",
};

function getPriorityLabel(priorityId) {
  return priorityOptions.find((item) => item.id === priorityId)?.shortLabel || priorityId;
}

function normaliseVoteRecord(vote) {
  const selected = [];
  if (vote.financial_selected) selected.push("financial");
  if (vote.environmental_selected) selected.push("environmental");
  if (vote.social_selected) selected.push("social");
  if (selected.length === 0 && vote.priority) selected.push(vote.priority);
  return selected;
}

function getProjectVoteStats(votes, projectId) {
  const projectVotes = votes.filter((vote) => vote.project_id === projectId);
  const counts = { financial: 0, environmental: 0, social: 0 };

  projectVotes.forEach((vote) => {
    normaliseVoteRecord(vote).forEach((priority) => {
      if (counts[priority] !== undefined) counts[priority] += 1;
    });
  });

  const totalSelections = counts.financial + counts.environmental + counts.social;
  if (totalSelections === 0) {
    return {
      counts,
      percentages: { financial: 0, environmental: 0, social: 0 },
      voters: projectVotes.length,
      selections: 0,
    };
  }

  const financial = Math.round((counts.financial / totalSelections) * 100);
  const environmental = Math.round((counts.environmental / totalSelections) * 100);
  const social = 100 - financial - environmental;

  return {
    counts,
    percentages: { financial, environmental, social },
    voters: projectVotes.length,
    selections: totalSelections,
  };
}

function calculateScore(project, weights) {
  return Math.round(
    (project.financial_score * weights.financial +
      project.environmental_score * weights.environmental +
      project.social_score * weights.social) /
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

function PriorityCard({ option, selected, onClick, selections, percentage }) {
  const Icon = option.icon;
  const toneMap = {
    blue: {
      selected: "border-blue-600 bg-blue-50",
      icon: "bg-blue-100 text-blue-700",
      text: "text-blue-700",
    },
    green: {
      selected: "border-emerald-600 bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-700",
    },
    purple: {
      selected: "border-purple-600 bg-purple-50",
      icon: "bg-purple-100 text-purple-700",
      text: "text-purple-700",
    },
  };
  const styles = toneMap[option.tone];

  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
        selected ? styles.selected : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-2 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{option.label}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"}`}>
              {selected ? "Selected" : "Tap to select"}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/70 p-3">
          <p className="text-xs text-slate-500">Selections</p>
          <p className={`text-2xl font-bold ${styles.text}`}>{selections}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3">
          <p className="text-xs text-slate-500">Share</p>
          <p className={`text-2xl font-bold ${styles.text}`}>{percentage}%</p>
        </div>
      </div>
    </button>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-900"
      />
    </label>
  );
}

export default function MultiCriteriaDashboard() {
  const [projects, setProjects] = useState([]);
  const [votes, setVotes] = useState([]);
  const [voterId] = useState(getOrCreateVoterId);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedStakeholder, setSelectedStakeholder] = useState("Council Planner");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState(emptyProjectForm);

  async function loadData() {
    if (!supabase) {
      setProjects(defaultProjects);
      setVotes([]);
      setSelectedProjectId((prev) => prev || defaultProjects[0]?.id || "");
      setIsLoading(false);
      setStatusMessage("Supabase is not connected yet. Add environment variables to enable shared project voting.");
      return;
    }

    const [projectResponse, voteResponse] = await Promise.all([
      supabase.from("dashboard_projects").select("*").order("created_at", { ascending: true }),
      supabase
        .from("dashboard_votes")
        .select("id, project_id, voter_id, stakeholder, priority, financial_selected, environmental_selected, social_selected, created_at, updated_at")
        .order("updated_at", { ascending: false }),
    ]);

    if (projectResponse.error) {
      console.error("Failed to load projects:", projectResponse.error);
      setStatusMessage("Failed to load projects. Check the dashboard_projects table.");
      setIsLoading(false);
      return;
    }

    if (voteResponse.error) {
      console.error("Failed to load votes:", voteResponse.error);
      setStatusMessage("Failed to load votes. Check the dashboard_votes table.");
      setIsLoading(false);
      return;
    }

    const loadedProjects = projectResponse.data || [];
    setProjects(loadedProjects);
    setVotes(voteResponse.data || []);
    setSelectedProjectId((prev) => prev || loadedProjects[0]?.id || "");
    setIsLoading(false);
    setStatusMessage("");
  }

  useEffect(() => {
    loadData();
    if (!supabase) return undefined;

    const channel = supabase
      .channel("dashboard-project-specific-voting")
      .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_projects" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_votes" }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (selectedProject && selectedProject.id !== selectedProjectId) {
      setSelectedProjectId(selectedProject.id);
    }
  }, [selectedProject, selectedProjectId]);

  const myVoteForSelectedProject = useMemo(() => {
    if (!selectedProject) return null;
    return votes.find((vote) => vote.voter_id === voterId && vote.project_id === selectedProject.id) || null;
  }, [votes, voterId, selectedProject]);

  useEffect(() => {
    if (myVoteForSelectedProject) {
      setSelectedPriorities(normaliseVoteRecord(myVoteForSelectedProject));
      setSelectedStakeholder(myVoteForSelectedProject.stakeholder || "Council Planner");
    } else {
      setSelectedPriorities([]);
    }
  }, [myVoteForSelectedProject, selectedProjectId]);

  const selectedStats = useMemo(() => {
    if (!selectedProject) {
      return {
        counts: { financial: 0, environmental: 0, social: 0 },
        percentages: { financial: 0, environmental: 0, social: 0 },
        voters: 0,
        selections: 0,
      };
    }
    return getProjectVoteStats(votes, selectedProject.id);
  }, [votes, selectedProject]);

  const rankedProjects = useMemo(() => {
    return projects
      .filter(
        (project) =>
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.type.toLowerCase().includes(query.toLowerCase()) ||
          project.location.toLowerCase().includes(query.toLowerCase())
      )
      .map((project) => {
        const stats = getProjectVoteStats(votes, project.id);
        return {
          ...project,
          stats,
          score: stats.selections > 0 ? calculateScore(project, stats.percentages) : null,
        };
      })
      .sort((a, b) => {
        if (a.score === null && b.score === null) return a.name.localeCompare(b.name);
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return b.score - a.score;
      });
  }, [projects, votes, query]);

  const selectedScore = selectedProject && selectedStats.selections > 0 ? calculateScore(selectedProject, selectedStats.percentages) : null;

  const selectedIndicators = selectedProject
    ? [
        { label: "Financial", value: selectedProject.financial_score, category: "Financial", status: "Verified" },
        { label: "Environmental", value: selectedProject.environmental_score, category: "Environmental", status: "Estimated" },
        { label: "Social", value: selectedProject.social_score, category: "Social", status: selectedProject.confidence },
      ]
    : [];

  const radarData = selectedProject
    ? [
        { metric: "Financial", value: selectedProject.financial_score },
        { metric: "Environmental", value: selectedProject.environmental_score },
        { metric: "Social", value: selectedProject.social_score },
      ]
    : [];

  const votingChartData = priorityOptions.map((option) => ({
    name: option.shortLabel,
    value: selectedStats.counts[option.id],
    percentage: selectedStats.percentages[option.id],
    id: option.id,
  }));

  const rankingChartData = rankedProjects.map((project) => ({
    name: project.name.replace(" Upgrade", "").replace("Conventional ", ""),
    score: project.score ?? 0,
  }));

  function togglePriority(priorityId) {
    setSelectedPriorities((prev) => {
      if (prev.includes(priorityId)) return prev.filter((item) => item !== priorityId);
      return [...prev, priorityId];
    });
  }

  async function handleSubmitVote() {
    if (!supabase) {
      setStatusMessage("Supabase is not connected yet. Shared voting is disabled.");
      return;
    }
    if (!selectedProject) {
      setStatusMessage("Please select or add a project first.");
      return;
    }
    if (selectedPriorities.length === 0) {
      setStatusMessage("Please select at least one priority before submitting.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    const votePayload = {
      project_id: selectedProject.id,
      voter_id: voterId,
      stakeholder: selectedStakeholder,
      priority: selectedPriorities[0],
      financial_selected: selectedPriorities.includes("financial"),
      environmental_selected: selectedPriorities.includes("environmental"),
      social_selected: selectedPriorities.includes("social"),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("dashboard_votes")
      .upsert(votePayload, { onConflict: "project_id,voter_id" });

    if (error) {
      console.error("Failed to submit vote:", error);
      setStatusMessage("Failed to submit vote. Check the dashboard_votes unique constraint and policies.");
      setIsSubmitting(false);
      return;
    }

    await loadData();
    setStatusMessage(`Your selections for ${selectedProject.name} were saved.`);
    setIsSubmitting(false);
  }

  async function handleClearMyVote() {
    if (!supabase || !selectedProject) return;
    setIsSubmitting(true);
    setStatusMessage("");

    const { error } = await supabase
      .from("dashboard_votes")
      .delete()
      .eq("project_id", selectedProject.id)
      .eq("voter_id", voterId);

    if (error) {
      console.error("Failed to clear vote:", error);
      setStatusMessage("Failed to clear your vote for this project.");
      setIsSubmitting(false);
      return;
    }

    await loadData();
    setSelectedPriorities([]);
    setStatusMessage(`Your vote for ${selectedProject.name} was cleared. Other project votes remain unchanged.`);
    setIsSubmitting(false);
  }

  async function handleAddProject(event) {
    event.preventDefault();
    if (!supabase) {
      setStatusMessage("Supabase is not connected. Project creation requires the database.");
      return;
    }
    if (!newProject.name.trim()) {
      setStatusMessage("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    const projectPayload = {
      ...newProject,
      name: newProject.name.trim(),
      type: newProject.type.trim() || "Infrastructure Project",
      location: newProject.location.trim() || "Unspecified location",
      cost: newProject.cost.trim() || "TBC",
      time: newProject.time.trim() || "TBC",
      description: newProject.description.trim() || "No description provided.",
      financial_score: Number(newProject.financial_score),
      environmental_score: Number(newProject.environmental_score),
      social_score: Number(newProject.social_score),
    };

    const { data, error } = await supabase
      .from("dashboard_projects")
      .insert(projectPayload)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to add project:", error);
      setStatusMessage("Failed to add project. Check the dashboard_projects table policies.");
      setIsSubmitting(false);
      return;
    }

    await loadData();
    setSelectedProjectId(data.id);
    setNewProject(emptyProjectForm);
    setShowAddProject(false);
    setStatusMessage("New project added and selected for voting.");
    setIsSubmitting(false);
  }

  async function handleDeleteSelectedProject() {
    if (!supabase || !selectedProject) return;
    const confirmed = window.confirm(`Delete ${selectedProject.name}? This will also delete its votes.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("dashboard_projects").delete().eq("id", selectedProject.id);

    if (error) {
      console.error("Failed to delete project:", error);
      setStatusMessage("Failed to delete project.");
      setIsSubmitting(false);
      return;
    }

    setSelectedProjectId("");
    await loadData();
    setStatusMessage("Project deleted. Its project-specific votes were removed as well.");
    setIsSubmitting(false);
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
            <h1 className="text-3xl font-semibold tracking-tight">Project-Specific Infrastructure Evaluation Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Select a project, vote on the priorities that apply to that project, and compare project-specific stakeholder support across infrastructure options.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 text-center">
            <div>
              <p className="text-xs text-slate-300">Projects</p>
              <p className="text-2xl font-bold">{isLoading ? "..." : projects.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Total Votes</p>
              <p className="text-2xl font-bold">{isLoading ? "..." : votes.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Selected</p>
              <p className="text-lg font-bold">{selectedProject ? selectedProject.name.split(" ")[0] : "None"}</p>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <Info className="mr-2 inline h-4 w-4" /> {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="rounded-3xl border-0 bg-white shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Project Voting</h2>
                </div>
                <Button className="rounded-2xl px-3 py-2 text-xs" onClick={() => setShowAddProject((prev) => !prev)}>
                  <Plus className="mr-1 inline h-4 w-4" /> Add
                </Button>
              </div>

              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium">Select Project to Vote On</label>
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {showAddProject && (
                <form onSubmit={handleAddProject} className="mb-4 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">Add New Project</h3>
                  <input
                    value={newProject.name}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Project name"
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newProject.type}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, type: e.target.value }))}
                      placeholder="Type"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                    <input
                      value={newProject.location}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                    <input
                      value={newProject.cost}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, cost: e.target.value }))}
                      placeholder="Cost"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                    <input
                      value={newProject.time}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, time: e.target.value }))}
                      placeholder="Time"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <NumberInput label="Financial" value={newProject.financial_score} onChange={(value) => setNewProject((prev) => ({ ...prev, financial_score: value }))} />
                    <NumberInput label="Environmental" value={newProject.environmental_score} onChange={(value) => setNewProject((prev) => ({ ...prev, environmental_score: value }))} />
                    <NumberInput label="Social" value={newProject.social_score} onChange={(value) => setNewProject((prev) => ({ ...prev, social_score: value }))} />
                  </div>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Project description"
                    className="h-20 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                  <Button type="submit" className="w-full rounded-2xl py-3 text-sm font-semibold" disabled={isSubmitting}>
                    Create Project
                  </Button>
                </form>
              )}

              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <UserRound className="h-4 w-4" /> Stakeholder Type
                </label>
                <select
                  value={selectedStakeholder}
                  onChange={(event) => setSelectedStakeholder(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  {stakeholderTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                These selections apply only to <strong>{selectedProject?.name || "the selected project"}</strong>. Select one or more priorities.
              </div>

              <div className="space-y-3">
                {priorityOptions.map((option) => (
                  <PriorityCard
                    key={option.id}
                    option={option}
                    selected={selectedPriorities.includes(option.id)}
                    onClick={() => togglePriority(option.id)}
                    selections={selectedStats.counts[option.id]}
                    percentage={selectedStats.percentages[option.id]}
                  />
                ))}
              </div>

              <Button
                className="mt-4 w-full rounded-2xl py-4 text-sm font-semibold"
                onClick={handleSubmitVote}
                disabled={isSubmitting || isLoading || selectedPriorities.length === 0 || !selectedProject}
              >
                {myVoteForSelectedProject ? "Update My Vote for This Project" : "Submit Vote for This Project"}
              </Button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl py-3 text-sm font-medium"
                  onClick={handleClearMyVote}
                  disabled={isSubmitting || isLoading || !myVoteForSelectedProject}
                >
                  <RotateCcw className="mr-2 inline h-4 w-4" /> Clear My Vote
                </Button>
                <Button
                  variant="danger"
                  className="rounded-2xl py-3 text-sm font-medium"
                  onClick={handleDeleteSelectedProject}
                  disabled={isSubmitting || isLoading || !selectedProject}
                >
                  <Trash2 className="mr-2 inline h-4 w-4" /> Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-white shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Selected Project Voting Statistics</h2>
              </div>

              <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                Current project: <strong>{selectedProject?.name || "None"}</strong>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-center">
                  <p className="text-xs text-blue-700">Financial</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedStats.percentages.financial}%</p>
                  <p className="text-xs text-blue-700">{selectedStats.counts.financial} selections</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-emerald-700">Environmental</p>
                  <p className="text-2xl font-bold text-emerald-700">{selectedStats.percentages.environmental}%</p>
                  <p className="text-xs text-emerald-700">{selectedStats.counts.environmental} selections</p>
                </div>
                <div className="rounded-2xl bg-purple-50 p-3 text-center">
                  <p className="text-xs text-purple-700">Social</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedStats.percentages.social}%</p>
                  <p className="text-xs text-purple-700">{selectedStats.counts.social} selections</p>
                </div>
              </div>

              <div className="mt-5 h-64 rounded-3xl bg-slate-50 p-3">
                {selectedStats.selections > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={votingChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                      >
                        {votingChartData.map((entry) => (
                          <Cell key={entry.id} fill={categoryColors[entry.id]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    No votes yet for this project. Select priorities and submit a project-specific vote.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <ListChecks className="h-4 w-4" /> Project-Specific Weighting
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="mb-1 flex justify-between"><span>Financial weight</span><strong>{selectedStats.percentages.financial}%</strong></div>
                    <ScoreBar value={selectedStats.percentages.financial} tone="blue" />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between"><span>Environmental weight</span><strong>{selectedStats.percentages.environmental}%</strong></div>
                    <ScoreBar value={selectedStats.percentages.environmental} tone="green" />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between"><span>Social weight</span><strong>{selectedStats.percentages.social}%</strong></div>
                    <ScoreBar value={selectedStats.percentages.social} tone="purple" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-white shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Live Project Ranking</h2>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition hover:scale-[1.01] ${
                      selectedProject?.id === project.id ? "border-slate-900 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold ${index === 0 && project.score !== null ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-slate-500">{project.type} · {project.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{project.score ?? "—"}</p>
                        <p className="text-xs text-slate-500">/100</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                      <div><div className="mb-1 flex justify-between"><span>Financial</span><strong>{project.financial_score}</strong></div><ScoreBar value={project.financial_score} tone="blue" /></div>
                      <div><div className="mb-1 flex justify-between"><span>Environmental</span><strong>{project.environmental_score}</strong></div><ScoreBar value={project.environmental_score} tone="green" /></div>
                      <div><div className="mb-1 flex justify-between"><span>Social</span><strong>{project.social_score}</strong></div><ScoreBar value={project.social_score} tone="purple" /></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{project.stats.voters} voters · {project.stats.selections} selections</span>
                      <span className="flex items-center gap-1">Select project <ChevronRight className="h-4 w-4" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="rounded-3xl border-0 bg-white shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold">Selected Project Detail</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedProject?.name || "No project selected"}</p>

              {selectedProject && (
                <>
                  <div className="my-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-slate-950 p-4 text-center text-white">
                      <p className="text-xs text-slate-300">Score</p>
                      <p className="text-3xl font-bold">{selectedScore ?? "—"}</p>
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

          <Card className="rounded-3xl border-0 bg-white shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Ranking Chart</h2>
              <div className="h-72 rounded-3xl bg-slate-50 p-4">
                {rankingChartData.some((item) => item.score > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankingChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#0f172a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    No project-specific ranking yet. Submit votes for one or more projects to generate scores.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-white shadow-sm lg:col-span-4">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Recent Votes & Data Quality</h2>
              </div>

              <div className="mb-5 max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">
                {isLoading ? (
                  <p className="text-sm text-slate-500">Loading data...</p>
                ) : votes.length === 0 ? (
                  <p className="text-sm text-slate-500">No votes yet. Select a project and submit priorities.</p>
                ) : (
                  votes.slice(0, 6).map((vote) => {
                    const project = projects.find((item) => item.id === vote.project_id);
                    const selected = normaliseVoteRecord(vote);
                    return (
                      <div key={vote.id || `${vote.project_id}-${vote.voter_id}`} className={`rounded-2xl bg-white px-3 py-2 text-sm shadow-sm ${vote.voter_id === voterId ? "ring-2 ring-slate-900" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-700">{vote.stakeholder}{vote.voter_id === voterId ? " (You)" : ""}</span>
                          <span className="font-semibold text-slate-900">{selected.length} selected</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{project?.name || "Deleted project"}: {selected.map(getPriorityLabel).join(" + ")}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-3 text-sm leading-5">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
                  <strong>Project-specific voting</strong>
                  <p className="mt-1">Votes are attached to a selected project, rather than applied to all projects globally.</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-800">
                  <strong>Flexible project list</strong>
                  <p className="mt-1">Users can add new project options and delete project records when needed.</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-800">
                  <strong>Decision risk</strong>
                  <p className="mt-1">The score is still a decision-support signal. It should be interpreted with expert judgement.</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <AlertTriangle className="mb-2 h-4 w-4" />
                Each project has its own voting distribution. This avoids the earlier problem where one global vote changed every project equally.
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
