import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanSearch,
  Target,
  Waves,
  AlertTriangle,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import api from "../services/api";

interface DashboardStats {
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
  statistics: DashboardStats;
  recent_scans: RecentScan[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_scans: 0,
    total_detections: 0,
    marine_debris: 0,
    marine_life: 0,
    unknown_anomalies: 0,
    high_priority: 0,
  });

  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<DashboardResponse>(
        "/api/dashboard/stats"
      );

      if (response.data.success) {
        setStats(response.data.statistics);
        setRecentScans(response.data.recent_scans);
      }
    } catch (err) {
      console.error("Dashboard API error:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Scans",
      value: stats.total_scans,
      change: "Uploaded scans",
      icon: ScanSearch,
    },
    {
      title: "Objects Detected",
      value: stats.total_detections,
      change: "AI detections",
      icon: Target,
    },
    {
      title: "Marine Debris",
      value: stats.marine_debris,
      change: "Detected objects",
      icon: ShieldAlert,
    },
    {
      title: "Marine Life",
      value: stats.marine_life,
      change: "Detected objects",
      icon: Waves,
    },
    {
      title: "Unknown Anomalies",
      value: stats.unknown_anomalies,
      change: "Requires review",
      icon: AlertTriangle,
    },
    {
      title: "High Priority",
      value: stats.high_priority,
      change: "Requires attention",
      icon: Activity,
    },
  ];

  const totalCategories =
    stats.marine_debris +
    stats.marine_life +
    stats.unknown_anomalies;

  const debrisPercentage =
    totalCategories > 0
      ? (stats.marine_debris / totalCategories) * 100
      : 0;

  const marineLifePercentage =
    totalCategories > 0
      ? (stats.marine_life / totalCategories) * 100
      : 0;

  const unknownPercentage =
    totalCategories > 0
      ? (stats.unknown_anomalies / totalCategories) * 100
      : 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            OPERATIONS OVERVIEW
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            MarineX Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor underwater sonar scans, AI detections and marine anomalies.
          </p>
        </div>

        <button 
            onClick={() => navigate("/sonar-upload")}
            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
          <ScanSearch className="h-4 w-4" />
          New Sonar Scan
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-400" />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.title}
              </p>

              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-bold">
                  {loading ? "..." : stat.value}
                </p>

                <span className="text-xs text-slate-600">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Recent Scans */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h2 className="font-semibold">
                Recent Sonar Scans
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest uploaded monitoring data
              </p>
            </div>

            <button className="text-xs font-medium text-cyan-400 hover:text-cyan-300">
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-800">

            {loading ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Loading recent scans...
              </div>
            ) : recentScans.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No sonar scans available.
              </div>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.scan_id}
                  className="flex items-center justify-between px-6 py-5"
                >
                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800">
                      <ScanSearch className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {scan.scan_name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        {scan.latitude !== null && (
                          <span>
                            Lat {scan.latitude}
                          </span>
                        )}

                        {scan.longitude !== null && (
                          <span>
                            Lon {scan.longitude}
                          </span>
                        )}

                        {scan.depth !== null && (
                          <span>
                            Depth {scan.depth}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium capitalize text-cyan-400">
                      {scan.status}
                    </span>

                    <p className="mt-2 flex items-center justify-end gap-1 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}

          </div>
        </div>

        {/* Detection Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-semibold">
              Detection Summary
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Current AI classification
            </p>
          </div>

          <div className="space-y-5 p-6">

            {/* Marine Debris */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Marine Debris
                </span>

                <span className="text-sm font-semibold">
                  {stats.marine_debris}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${debrisPercentage}%`,
                  }}
                />
              </div>
            </div>

            {/* Marine Life */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Marine Life
                </span>

                <span className="text-sm font-semibold">
                  {stats.marine_life}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${marineLifePercentage}%`,
                  }}
                />
              </div>
            </div>

            {/* Unknown Anomalies */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Unknown Anomalies
                </span>

                <span className="text-sm font-semibold">
                  {stats.unknown_anomalies}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${unknownPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-4">
              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-5 w-5 text-cyan-400" />

                <div>
                  <p className="text-sm font-medium">
                    AI Monitoring Active
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    MarineX is ready to analyze new side-scan sonar imagery.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              System Status
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              MarineX platform services
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Operational
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-lg bg-slate-950 p-4">
            <p className="text-xs text-slate-500">
              API Server
            </p>

            <p className="mt-2 text-sm font-medium text-cyan-400">
              Connected
            </p>
          </div>

          <div className="rounded-lg bg-slate-950 p-4">
            <p className="text-xs text-slate-500">
              PostgreSQL
            </p>

            <p className="mt-2 text-sm font-medium text-cyan-400">
              Connected
            </p>
          </div>

          <div className="rounded-lg bg-slate-950 p-4">
            <p className="text-xs text-slate-500">
              AI Engine
            </p>

            <p className="mt-2 text-sm font-medium text-amber-400">
              Awaiting Model
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}