import { useEffect, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  RefreshCw,
  MapPin,
  Waves,
  Target,
  AlertTriangle,
  Download,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

interface Scan {
  scan_id: number;
  scan_name: string;
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

interface ScanDetails {
  success: boolean;
  scan: Scan;
  detections: Detection[];
}

export default function Reports() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] =
    useState<number | null>(null);

  const [scanDetails, setScanDetails] =
    useState<ScanDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [error, setError] = useState("");
  const [downloading, setDownloading] =
    useState<"pdf" | "csv" | "">("");

  // ---------------------------------------------------------
  // LOAD SCANS
  // ---------------------------------------------------------

  const loadScans = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/api/scans/history");

      const scanList: Scan[] =
        response.data.scans || [];

      setScans(scanList);

      if (scanList.length > 0) {
        setSelectedScanId(scanList[0].scan_id);
      } else {
        setSelectedScanId(null);
        setScanDetails(null);
      }
    } catch (err) {
      console.error(
        "Failed to load scans:",
        err
      );

      setError("Unable to load scans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  // ---------------------------------------------------------
  // LOAD SELECTED SCAN DETAILS
  // ---------------------------------------------------------

  useEffect(() => {
    if (!selectedScanId) {
      setScanDetails(null);
      return;
    }

    const loadDetails = async () => {
      try {
        setLoadingDetails(true);
        setError("");

        const response =
          await api.get<ScanDetails>(
            `/api/scans/${selectedScanId}`
          );

        setScanDetails(response.data);
      } catch (err) {
        console.error(
          "Failed to load scan details:",
          err
        );

        setError(
          "Unable to load selected scan details."
        );
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [selectedScanId]);

  // ---------------------------------------------------------
  // DOWNLOAD REPORT
  // ---------------------------------------------------------

  const downloadReport = async (
    type: "pdf" | "csv"
  ) => {
    if (!selectedScanId) return;

    try {
      setDownloading(type);
      setError("");

      const response = await api.get(
        `/api/reports/scan/${selectedScanId}/${type}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type:
            type === "pdf"
              ? "application/pdf"
              : "text/csv",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `marinex_scan_${selectedScanId}.${type}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        `Failed to download ${type} report:`,
        err
      );

      setError(
        `Unable to generate ${type.toUpperCase()} report.`
      );
    } finally {
      setDownloading("");
    }
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const formatClassName = (value: string) => {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const highPriorityCount =
    scanDetails?.detections.filter(
      (detection) =>
        detection.priority.toLowerCase() ===
        "high"
    ).length || 0;

  const averageConfidence =
    scanDetails &&
    scanDetails.detections.length > 0
      ? scanDetails.detections.reduce(
          (sum, detection) =>
            sum + detection.confidence,
          0
        ) / scanDetails.detections.length
      : 0;

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">

          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

          <p className="mt-4 text-sm text-slate-500">
            Loading reports...
          </p>

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
            <FileText className="h-6 w-6 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Generate and export MarineX scan reports
            </p>
          </div>

        </div>

        <button
          onClick={loadScans}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">

          <AlertTriangle className="h-5 w-5 text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>

        </div>
      )}

      {/* NO SCANS */}

      {scans.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-12 text-center">

          <FileText className="mx-auto h-10 w-10 text-slate-700" />

          <h2 className="mt-4 text-lg font-semibold text-slate-300">
            No scans available
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Upload a sonar scan before generating a report.
          </p>

        </div>
      ) : (
        <>
          {/* ------------------------------------------------ */}
          {/* SELECT SCAN */}
          {/* ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Select Sonar Scan
            </label>

            <select
              value={selectedScanId ?? ""}
              onChange={(e) =>
                setSelectedScanId(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-500"
            >
              {scans.map((scan) => (
                <option
                  key={scan.scan_id}
                  value={scan.scan_id}
                >
                  {scan.scan_name} — Scan #
                  {scan.scan_id}
                </option>
              ))}
            </select>

          </div>

          {/* ------------------------------------------------ */}
          {/* REPORT PREVIEW */}
          {/* ------------------------------------------------ */}

          {loadingDetails ? (
            <div className="mt-6 flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">

              <div className="text-center">

                <RefreshCw className="mx-auto h-7 w-7 animate-spin text-cyan-400" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading scan information...
                </p>

              </div>

            </div>
          ) : scanDetails ? (
            <div className="mt-6">

              {/* REPORT TITLE */}

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-cyan-400">
                      MarineX Automated Report
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      {scanDetails.scan.scan_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Scan #{scanDetails.scan.scan_id}
                    </p>

                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-400">

                    <CheckCircle2 className="h-4 w-4" />

                    Report Ready

                  </div>

                </div>

                {/* SUMMARY CARDS */}

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <Target className="h-5 w-5 text-cyan-400" />

                    <p className="mt-3 text-xs text-slate-600">
                      Detections
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {scanDetails.detections.length}
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <AlertTriangle className="h-5 w-5 text-red-400" />

                    <p className="mt-3 text-xs text-slate-600">
                      High Priority
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-red-400">
                      {highPriorityCount}
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <Target className="h-5 w-5 text-cyan-400" />

                    <p className="mt-3 text-xs text-slate-600">
                      Avg. Confidence
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {(averageConfidence * 100).toFixed(0)}%
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <Waves className="h-5 w-5 text-cyan-400" />

                    <p className="mt-3 text-xs text-slate-600">
                      Depth
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {scanDetails.scan.depth !==
                      null
                        ? `${scanDetails.scan.depth} m`
                        : "N/A"}
                    </p>

                  </div>

                </div>

                {/* SURVEY INFORMATION */}

                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                    <h3 className="text-sm font-semibold">
                      Survey Information
                    </h3>

                    <div className="mt-4 space-y-4">

                      <div>
                        <p className="text-xs text-slate-600">
                          Scan Name
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {scanDetails.scan.scan_name}
                        </p>
                      </div>

                      <div className="flex gap-3">

                        <MapPin className="mt-0.5 h-4 w-4 text-cyan-400" />

                        <div>

                          <p className="text-xs text-slate-600">
                            Location
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {scanDetails.scan.latitude !==
                              null &&
                            scanDetails.scan.longitude !==
                              null
                              ? `${scanDetails.scan.latitude.toFixed(
                                  5
                                )}, ${scanDetails.scan.longitude.toFixed(
                                  5
                                )}`
                              : "Unavailable"}
                          </p>

                        </div>

                      </div>

                      <div>
                        <p className="text-xs text-slate-600">
                          Status
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {scanDetails.scan.status}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-600">
                          Created
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {new Date(
                            scanDetails.scan.created_at
                          ).toLocaleString()}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* DETECTION SUMMARY */}

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                    <h3 className="text-sm font-semibold">
                      Detection Summary
                    </h3>

                    {scanDetails.detections.length ===
                    0 ? (
                      <div className="py-10 text-center text-sm text-slate-600">
                        No detections recorded.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">

                        {scanDetails.detections.map(
                          (detection) => (
                            <div
                              key={
                                detection.detection_id
                              }
                              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-3"
                            >

                              <div>

                                <p className="text-sm font-medium text-slate-300">
                                  {formatClassName(
                                    detection.object_class
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                  Detection #
                                  {
                                    detection.detection_id
                                  }
                                </p>

                              </div>

                              <div className="text-right">

                                <p className="text-sm font-semibold text-cyan-400">
                                  {(
                                    detection.confidence *
                                    100
                                  ).toFixed(0)}
                                  %
                                </p>

                                <p
                                  className={`mt-1 text-xs ${
                                    detection.priority.toLowerCase() ===
                                    "high"
                                      ? "text-red-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {detection.priority}
                                </p>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </div>

              </div>

              {/* ------------------------------------------------ */}
              {/* EXPORT */}
              {/* ------------------------------------------------ */}

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

                <h2 className="text-lg font-semibold">
                  Export Report
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Generate a downloadable report for the selected scan.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* PDF */}

                  <button
                    onClick={() =>
                      downloadReport("pdf")
                    }
                    disabled={downloading !== ""}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-5 text-left transition hover:border-cyan-500/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                        <FileText className="h-5 w-5 text-red-400" />
                      </div>

                      <div>

                        <p className="font-semibold text-slate-200">
                          PDF Report
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Printable detailed report
                        </p>

                      </div>

                    </div>

                    {downloading === "pdf" ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                    ) : (
                      <Download className="h-5 w-5 text-slate-500" />
                    )}

                  </button>

                  {/* CSV */}

                  <button
                    onClick={() =>
                      downloadReport("csv")
                    }
                    disabled={downloading !== ""}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-5 text-left transition hover:border-cyan-500/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                      </div>

                      <div>

                        <p className="font-semibold text-slate-200">
                          CSV Report
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Data for analysis and processing
                        </p>

                      </div>

                    </div>

                    {downloading === "csv" ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                    ) : (
                      <Download className="h-5 w-5 text-slate-500" />
                    )}

                  </button>

                </div>

              </div>

            </div>
          ) : null}
        </>
      )}

    </div>
  );
}