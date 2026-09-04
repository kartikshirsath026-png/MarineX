import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Target,
  MapPin,
  Waves,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

interface Detection {
  detection_id: number;
  object_class: string;
  confidence: number;
  bounding_box: {
    x_min: number | null;
    y_min: number | null;
    x_max: number | null;
    y_max: number | null;
  };
  priority: string;
}

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

interface ScanResponse {
  success: boolean;
  scan: Scan;
  detections: Detection[];
}

export default function DetectionDetails() {
  const navigate = useNavigate();
  const { detectionId } = useParams();
  const location = useLocation();

  const [detection, setDetection] =
    useState<Detection | null>(null);

  const [scan, setScan] =
    useState<Scan | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ---------------------------------------------------------
  // GET SCAN ID FROM URL
  // ---------------------------------------------------------

  const queryParams = new URLSearchParams(
    location.search
  );

  const scanId = queryParams.get("scanId");

  // ---------------------------------------------------------
  // LOAD DETECTION
  // ---------------------------------------------------------

  useEffect(() => {
    const loadDetection = async () => {
      if (!scanId || !detectionId) {
        setError(
          "Detection information is incomplete."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<ScanResponse>(
            `/api/scans/${scanId}`
          );

        const scanData =
          response.data.scan;

        const foundDetection =
          response.data.detections.find(
            (item) =>
              item.detection_id ===
              Number(detectionId)
          );

        if (!foundDetection) {
          setError("Detection not found.");
          return;
        }

        setScan(scanData);
        setDetection(foundDetection);
      } catch (err) {
        console.error(
          "Failed to load detection:",
          err
        );

        setError(
          "Unable to load detection details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetection();
  }, [scanId, detectionId]);

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const getClassName = (value: string) => {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getPriorityStyle = (
    priority: string
  ) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      case "medium":
        return "border-amber-500/20 bg-amber-500/10 text-amber-400";

      default:
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }
  };

  const confidencePercentage =
    detection
      ? Math.min(
          detection.confidence * 100,
          100
        )
      : 0;

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10">
            <BrainCircuit className="h-7 w-7 animate-pulse text-cyan-400" />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Loading detection details...
          </p>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (
    error ||
    !detection ||
    !scan
  ) {
    return (
      <div className="min-h-[70vh]">

        <button
          onClick={() =>
            navigate("/analysis")
          }
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Analysis
        </button>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">

          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />

          <h2 className="mt-4 text-lg font-semibold">
            Detection unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Unable to load this detection."}
          </p>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN PAGE
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen text-white">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">

        <button
          onClick={() =>
            navigate("/analysis")
          }
          className="mb-5 flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Analysis
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>

              <div>

                <h1 className="text-2xl font-semibold">
                  Detection Details
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Detection #{detection.detection_id}
                  {" "}from{" "}
                  {scan.scan_name}
                </p>

              </div>

            </div>

          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-semibold ${getPriorityStyle(
              detection.priority
            )}`}
          >
            {detection.priority
              .charAt(0)
              .toUpperCase() +
              detection.priority.slice(1)}{" "}
            Priority
          </span>

        </div>
      </div>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ===================================================
            LEFT - IMAGE
        ==================================================== */}

        <div className="xl:col-span-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-base font-semibold">
                  Detection View
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Sonar evidence for the detected object
                </p>

              </div>

              <span className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400">

                <BrainCircuit className="h-3.5 w-3.5" />

                AI Detection

              </span>

            </div>

            <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-slate-800 bg-black">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">

                  <Waves className="h-8 w-8 text-cyan-400" />

                </div>

                <p className="mt-5 text-sm font-medium text-slate-300">
                  Sonar Detection #
                  {detection.detection_id}
                </p>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                  The original sonar image and AI bounding-box
                  visualization will be displayed here when the
                  image-analysis pipeline is connected.
                </p>

              </div>

            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT - INFORMATION
        ==================================================== */}

        <div className="space-y-6">

          {/* =================================================
              CLASSIFICATION
          ================================================== */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>

              <div>

                <h2 className="text-base font-semibold">
                  Classification
                </h2>

                <p className="text-xs text-slate-500">
                  AI prediction
                </p>

              </div>

            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

              <p className="text-xs text-slate-500">
                Object Class
              </p>

              <p className="mt-2 text-lg font-semibold text-slate-200">
                {getClassName(
                  detection.object_class
                )}
              </p>

            </div>

            {/* CONFIDENCE */}

            <div className="mt-4">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  AI Confidence
                </span>

                <span className="text-sm font-semibold text-cyan-400">
                  {confidencePercentage.toFixed(0)}%
                </span>

              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">

                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${confidencePercentage}%`,
                  }}
                />

              </div>

            </div>
          </div>

          {/* =================================================
              SCAN INFORMATION
          ================================================== */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Waves className="h-5 w-5 text-cyan-400" />
              </div>

              <div>

                <h2 className="text-base font-semibold">
                  Survey Information
                </h2>

                <p className="text-xs text-slate-500">
                  Source scan details
                </p>

              </div>

            </div>

            <div className="space-y-4">

              {/* SCAN */}

              <div>

                <p className="text-xs text-slate-500">
                  Scan
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {scan.scan_name}
                </p>

              </div>

              {/* SCAN ID */}

              <div>

                <p className="text-xs text-slate-500">
                  Scan ID
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  #{scan.scan_id}
                </p>

              </div>

              {/* LOCATION */}

              <div className="flex items-start gap-3">

                <MapPin className="mt-0.5 h-4 w-4 text-cyan-400" />

                <div>

                  <p className="text-xs text-slate-500">
                    Location
                  </p>

                  <p className="mt-1 text-sm text-slate-300">

                    {scan.latitude !== null &&
                    scan.longitude !== null
                      ? `${scan.latitude.toFixed(
                          5
                        )}, ${scan.longitude.toFixed(
                          5
                        )}`
                      : "Location unavailable"}

                  </p>

                </div>

              </div>

              {/* DEPTH */}

              <div className="flex items-start gap-3">

                <Waves className="mt-0.5 h-4 w-4 text-cyan-400" />

                <div>

                  <p className="text-xs text-slate-500">
                    Depth
                  </p>

                  <p className="mt-1 text-sm text-slate-300">

                    {scan.depth !== null
                      ? `${scan.depth} m`
                      : "Unavailable"}

                  </p>

                </div>

              </div>

              {/* SCAN TIME */}

              <div className="flex items-start gap-3">

                <Clock3 className="mt-0.5 h-4 w-4 text-cyan-400" />

                <div>

                  <p className="text-xs text-slate-500">
                    Scan Time
                  </p>

                  <p className="mt-1 text-sm text-slate-300">

                    {scan.scan_timestamp
                      ? new Date(
                          scan.scan_timestamp
                        ).toLocaleString()
                      : "Unavailable"}

                  </p>

                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          AI EVIDENCE
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>

          <div>

            <h2 className="text-base font-semibold">
              AI Evidence
            </h2>

            <p className="text-xs text-slate-500">
              Detection information available for review
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* AI DETECTION */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2">

              <CheckCircle2 className="h-4 w-4 text-emerald-400" />

              <span className="text-sm font-medium text-slate-300">
                AI Detection
              </span>

            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Object candidate detected by the AI pipeline.
            </p>

          </div>

          {/* BOUNDING BOX */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2">

              <Target className="h-4 w-4 text-cyan-400" />

              <span className="text-sm font-medium text-slate-300">
                Bounding Box
              </span>

            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Spatial detection coordinates are stored with
              this detection.
            </p>

          </div>

          {/* HUMAN REVIEW */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center gap-2">

              <AlertTriangle className="h-4 w-4 text-amber-400" />

              <span className="text-sm font-medium text-slate-300">
                Human Review
              </span>

            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Detection should be reviewed before final
              confirmation.
            </p>

          </div>

        </div>
      </div>

      {/* =====================================================
          BOUNDING BOX
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

        <h2 className="text-base font-semibold">
          Detection Coordinates
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Bounding-box coordinates returned by the detection
          pipeline.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">

          {/* X MIN */}

          <div className="rounded-xl bg-slate-950 p-4">

            <p className="text-xs text-slate-600">
              X Min
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-300">
              {detection.bounding_box.x_min ?? "—"}
            </p>

          </div>

          {/* Y MIN */}

          <div className="rounded-xl bg-slate-950 p-4">

            <p className="text-xs text-slate-600">
              Y Min
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-300">
              {detection.bounding_box.y_min ?? "—"}
            </p>

          </div>

          {/* X MAX */}

          <div className="rounded-xl bg-slate-950 p-4">

            <p className="text-xs text-slate-600">
              X Max
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-300">
              {detection.bounding_box.x_max ?? "—"}
            </p>

          </div>

          {/* Y MAX */}

          <div className="rounded-xl bg-slate-950 p-4">

            <p className="text-xs text-slate-600">
              Y Max
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-300">
              {detection.bounding_box.y_max ?? "—"}
            </p>

          </div>

        </div>
      </div>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

        {/* BACK TO ANALYSIS */}

        <button
          onClick={() =>
            navigate("/analysis")
          }
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Back to Analysis
        </button>

        {/* =================================================
            VIEW ON MAP
        ================================================== */}

        <button
          onClick={() =>
            navigate(
              `/map?scanId=${scan.scan_id}`
            )
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20"
        >
          <MapPin className="h-4 w-4" />

          View on Map
        </button>

        {/* =================================================
            VERIFY DETECTION
        ================================================== */}

        <button
          onClick={() =>
            navigate(
              `/verification?detectionId=${detection.detection_id}`
            )
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <ShieldCheck className="h-4 w-4" />

          Verify Detection
        </button>

      </div>

    </div>
  );
}