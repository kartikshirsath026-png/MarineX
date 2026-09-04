import { useEffect, useState } from "react";
import {
  Search,
  History,
  MapPin,
  Waves,
  Eye,
  Brain,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Scan {
  scan_id: number;
  scan_name: string;
  image_path: string;
  latitude: number | null;
  longitude: number | null;
  depth: number | null;
  scan_timestamp: string | null;
  status: string;
  created_at: string;
}

interface Detection {
  detection_id: number;
  object_class: string;
  confidence: number;
  priority: string;
}

interface ScanWithDetections extends Scan {
  detections: Detection[];
}

export default function ScanHistory() {
  const navigate = useNavigate();

  const [scans, setScans] = useState<ScanWithDetections[]>([]);
  const [filteredScans, setFilteredScans] = useState<
    ScanWithDetections[]
  >([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // LOAD SCAN HISTORY
  // ---------------------------------------------------------

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const historyResponse = await api.get("/api/scans/history");

      const scanList: Scan[] =
        historyResponse.data.scans || [];

      const scansWithDetections: ScanWithDetections[] = [];

      for (const scan of scanList) {
        try {
          const response = await api.get(
            `/api/scans/${scan.scan_id}`
          );

          scansWithDetections.push({
            ...scan,
            detections: response.data.detections || [],
          });
        } catch (scanError) {
          console.error(
            `Failed to load scan ${scan.scan_id}`,
            scanError
          );

          scansWithDetections.push({
            ...scan,
            detections: [],
          });
        }
      }

      setScans(scansWithDetections);
      setFilteredScans(scansWithDetections);
    } catch (err) {
      console.error("Failed to load scan history:", err);
      setError("Unable to load scan history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setFilteredScans(scans);
      return;
    }

    const filtered = scans.filter((scan) => {
      return (
        scan.scan_name.toLowerCase().includes(query) ||
        String(scan.scan_id).includes(query) ||
        scan.status.toLowerCase().includes(query)
      );
    });

    setFilteredScans(filtered);
  }, [search, scans]);

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getHighPriorityCount = (
    detections: Detection[]
  ) => {
    return detections.filter(
      (detection) =>
        detection.priority.toLowerCase() === "high"
    ).length;
  };

  const getStatusStyle = (status: string) => {
    const value = status.toLowerCase();

    if (value === "completed" || value === "verified") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (value === "processing") {
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    }

    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

          <p className="mt-4 text-sm text-slate-500">
            Loading scan history...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-[70vh]">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />

          <h2 className="mt-4 text-lg font-semibold text-white">
            Scan History Unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={loadHistory}
            className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen text-white">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
            <History className="h-6 w-6 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Scan History
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              View and manage previously uploaded sonar scans
            </p>
          </div>

        </div>

        <button
          onClick={loadHistory}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

      </div>

      {/* SEARCH */}

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scan name, ID or status..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
          />

        </div>

      </div>

      {/* SUMMARY */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <p className="text-xs text-slate-500">
            Total Scans
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {scans.length}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <p className="text-xs text-slate-500">
            Total Detections
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {scans.reduce(
              (total, scan) =>
                total + scan.detections.length,
              0
            )}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <p className="text-xs text-slate-500">
            High Priority
          </p>

          <p className="mt-2 text-2xl font-semibold text-red-400">
            {scans.reduce(
              (total, scan) =>
                total +
                getHighPriorityCount(scan.detections),
              0
            )}
          </p>

        </div>

      </div>

      {/* SCAN LIST */}

      {filteredScans.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-12 text-center">

          <History className="mx-auto h-10 w-10 text-slate-700" />

          <h2 className="mt-4 text-base font-semibold text-slate-300">
            No scans found
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {search
              ? "Try a different search term."
              : "Upload your first sonar scan to see it here."}
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {filteredScans.map((scan) => {

            const highPriority =
              getHighPriorityCount(scan.detections);

            return (
              <div
                key={scan.scan_id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700"
              >

                {/* TOP */}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-base font-semibold text-slate-200">
                        {scan.scan_name}
                      </h2>

                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-500">
                        Scan #{scan.scan_id}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                          scan.status
                        )}`}
                      >
                        {scan.status}
                      </span>

                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(scan.created_at)}
                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        navigate(
                          `/analysis?scanId=${scan.scan_id}`
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      <Brain className="h-4 w-4" />
                      Analyze
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/analysis?scanId=${scan.scan_id}`
                        )
                      }
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>

                  </div>

                </div>

                {/* DETAILS */}

                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                  {/* LOCATION */}

                  <div className="flex gap-3">

                    <MapPin className="mt-0.5 h-4 w-4 text-cyan-400" />

                    <div>
                      <p className="text-xs text-slate-600">
                        Location
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {scan.latitude !== null &&
                        scan.longitude !== null
                          ? `${scan.latitude.toFixed(
                              4
                            )}, ${scan.longitude.toFixed(4)}`
                          : "Unavailable"}
                      </p>
                    </div>

                  </div>

                  {/* DEPTH */}

                  <div className="flex gap-3">

                    <Waves className="mt-0.5 h-4 w-4 text-cyan-400" />

                    <div>
                      <p className="text-xs text-slate-600">
                        Depth
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {scan.depth !== null
                          ? `${scan.depth} m`
                          : "Unavailable"}
                      </p>
                    </div>

                  </div>

                  {/* DETECTIONS */}

                  <div className="flex gap-3">

                    <TargetIcon />

                    <div>
                      <p className="text-xs text-slate-600">
                        Detections
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {scan.detections.length}
                      </p>
                    </div>

                  </div>

                  {/* PRIORITY */}

                  <div className="flex gap-3">

                    {highPriority > 0 ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                    )}

                    <div>
                      <p className="text-xs text-slate-600">
                        Priority
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          highPriority > 0
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {highPriority > 0
                          ? `${highPriority} High`
                          : "No High Priority"}
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

/* Small reusable icon */

function TargetIcon() {
  return (
    <div className="flex h-4 w-4 items-center justify-center text-cyan-400">
      <span className="text-sm">◉</span>
    </div>
  );
}