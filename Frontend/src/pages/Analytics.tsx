import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Target,
  Waves,
  ScanLine,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../services/api";

interface Statistics {
  total_scans: number;
  total_detections: number;
  marine_debris: number;
  marine_life: number;
  unknown_anomalies: number;
  high_priority: number;
}

interface RecentScan {
  scan_id: number;
  scan_name: string;
  latitude: number | null;
  longitude: number | null;
  depth: number | null;
  status: string;
  created_at: string;
}

interface DashboardResponse {
  success: boolean;
  statistics: Statistics;
  recent_scans: RecentScan[];
}

export default function Analytics() {
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [recentScans, setRecentScans] =
    useState<RecentScan[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // LOAD ANALYTICS DATA
  // ---------------------------------------------------------

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<DashboardResponse>(
          "/api/dashboard/stats"
        );

      setStatistics(response.data.statistics);
      setRecentScans(response.data.recent_scans || []);
    } catch (err) {
      console.error(
        "Failed to load analytics:",
        err
      );

      setError(
        "Unable to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

          <p className="mt-4 text-sm text-slate-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error || !statistics) {
    return (
      <div className="min-h-[70vh]">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">

          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />

          <h2 className="mt-4 text-lg font-semibold">
            Analytics Unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || "No analytics data available."}
          </p>

          <button
            onClick={loadAnalytics}
            className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // CHART DATA
  // ---------------------------------------------------------

  const categoryData = [
    {
      name: "Marine Debris",
      value: statistics.marine_debris,
    },
    {
      name: "Marine Life",
      value: statistics.marine_life,
    },
    {
      name: "Unknown",
      value: statistics.unknown_anomalies,
    },
  ];

  const priorityData = [
    {
      name: "High Priority",
      value: statistics.high_priority,
    },
    {
      name: "Other",
      value:
        Math.max(
          statistics.total_detections -
            statistics.high_priority,
          0
        ),
    },
  ];

  const scanActivity = recentScans
    .slice()
    .reverse()
    .map((scan, index) => ({
      name: `Scan ${scan.scan_id}`,
      detections: 0,
      scanNumber: index + 1,
    }));

  return (
    <div className="min-h-screen text-white">

      {/* --------------------------------------------------- */}
      {/* HEADER */}
      {/* --------------------------------------------------- */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Analytics
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Marine detection intelligence and scan statistics
            </p>
          </div>

        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

      </div>

      {/* --------------------------------------------------- */}
      {/* KPI CARDS */}
      {/* --------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* SCANS */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs text-slate-500">
                Total Scans
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {statistics.total_scans}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
              <ScanLine className="h-5 w-5 text-cyan-400" />
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-600">
            Sonar scans processed by MarineX
          </p>

        </div>

        {/* DETECTIONS */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs text-slate-500">
                Total Detections
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {statistics.total_detections}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-600">
            AI-detected objects and anomalies
          </p>

        </div>

        {/* DEBRIS */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs text-slate-500">
                Marine Debris
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {statistics.marine_debris}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
              <Waves className="h-5 w-5 text-cyan-400" />
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-600">
            Potential debris detections
          </p>

        </div>

        {/* HIGH PRIORITY */}

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs text-slate-500">
                High Priority
              </p>

              <p className="mt-2 text-3xl font-semibold text-red-400">
                {statistics.high_priority}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-600">
            Detections requiring attention
          </p>

        </div>

      </div>

      {/* --------------------------------------------------- */}
      {/* CHARTS */}
      {/* --------------------------------------------------- */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* CATEGORY CHART */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="mb-5">
            <h2 className="text-base font-semibold">
              Detection Categories
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Distribution of detected objects
            </p>
          </div>

          <div className="h-[320px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={categoryData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* PRIORITY CHART */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="mb-5">
            <h2 className="text-base font-semibold">
              Priority Distribution
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              High-priority versus other detections
            </p>
          </div>

          <div className="h-[320px]">

            {statistics.total_detections === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                No detections available
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={65}
                    paddingAngle={3}
                  >
                    {priorityData.map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "#ef4444"
                              : "#334155"
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>
            )}

          </div>

          <div className="flex justify-center gap-6 text-xs">

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              High Priority
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              Other
            </div>

          </div>

        </div>

      </div>

      {/* --------------------------------------------------- */}
      {/* RECENT ACTIVITY */}
      {/* --------------------------------------------------- */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

        <div className="mb-5">

          <h2 className="text-base font-semibold">
            Recent Scan Activity
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Recently processed sonar scans
          </p>

        </div>

        {recentScans.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">
            No recent scan activity.
          </div>
        ) : (
          <div className="space-y-3">

            {recentScans.map((scan) => (

              <div
                key={scan.scan_id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                      <ScanLine className="h-4 w-4 text-cyan-400" />
                    </div>

                    <div>

                      <p className="text-sm font-medium text-slate-300">
                        {scan.scan_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Scan #{scan.scan_id}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">

                  <span className="text-slate-500">
                    {scan.depth !== null
                      ? `${scan.depth} m`
                      : "Depth unavailable"}
                  </span>

                  <span className="text-slate-600">
                    {new Date(
                      scan.created_at
                    ).toLocaleString()}
                  </span>

                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-400">
                    {scan.status}
                  </span>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}