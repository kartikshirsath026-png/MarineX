import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Eye,
  RefreshCw,
  ChevronDown,
  Target,
  Waves,
  MapPin,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import api from "../services/api";

interface Scan {
  scan_id: number;
  scan_name: string;
  latitude: number | null;
  longitude: number | null;
  depth: number | null;
  status: string;
  created_at: string;
  total_detections: number;
  high_priority_detections: number;
}

interface BoundingBox {
  x_min: number | null;
  y_min: number | null;
  x_max: number | null;
  y_max: number | null;
}

interface Detection {
  detection_id: number;
  object_class: string;
  confidence: number;
  bounding_box: BoundingBox | null;
  priority: string;
}

interface DetectionResponse {
  success: boolean;
  detections: Detection[];
}

const API_BASE_URL = "http://127.0.0.1:8000";

function getPriorityStyles(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return {
        border: "border-red-400",
        label: "bg-red-400",
        text: "text-red-400",
        dot: "bg-red-400",
      };

    case "medium":
      return {
        border: "border-amber-400",
        label: "bg-amber-400",
        text: "text-amber-400",
        dot: "bg-amber-400",
      };

    default:
      return {
        border: "border-emerald-400",
        label: "bg-emerald-400",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
      };
  }
}

function hasValidBoundingBox(
  box: BoundingBox | null
): box is {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
} {
  return (
    box !== null &&
    typeof box.x_min === "number" &&
    typeof box.y_min === "number" &&
    typeof box.x_max === "number" &&
    typeof box.y_max === "number"
  );
}

export default function AnalysisResults() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const urlScanId = searchParams.get("scanId");
  const requestedScanId = urlScanId
    ? Number(urlScanId)
    : null;

  const imageRef = useRef<HTMLImageElement | null>(null);

  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);

  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const [loadingScans, setLoadingScans] = useState(true);
  const [loadingDetections, setLoadingDetections] = useState(false);
  const [runningAI, setRunningAI] = useState(false);

  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  const selectedScan = scans.find(
    (scan) => scan.scan_id === selectedScanId
  );

  const imageUrl = selectedScanId
    ? `${API_BASE_URL}/api/scans/${selectedScanId}/image`
    : "";

  /* ============================================================
     LOAD SCANS
  ============================================================ */

  const loadScans = async () => {
    try {
      setLoadingScans(true);
      setError("");

      const response = await api.get("/api/scans/history");

      const scanList: Scan[] = response.data.scans || [];

      setScans(scanList);

      if (scanList.length > 0) {
        setSelectedScanId((currentId) => {

          // If Dataset page sent a scanId,
          // use that specific scan.
          if (requestedScanId !== null) {
            const requestedScanExists = scanList.some(
              (scan) => scan.scan_id === requestedScanId
            );

            if (requestedScanExists) {
              return requestedScanId;
            }
          }

          // Otherwise keep the currently selected scan.
          const currentStillExists = scanList.some(
            (scan) => scan.scan_id === currentId
          );

          return currentStillExists
            ? currentId
            : scanList[0].scan_id;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load scan history.");
    } finally {
      setLoadingScans(false);
    }
  };

  /* ============================================================
     LOAD DETECTIONS
  ============================================================ */

  const loadDetections = async (scanId: number) => {
    try {
      setLoadingDetections(true);
      setError("");

      const response = await api.get<DetectionResponse>(
        `/api/detections/${scanId}`
      );

      setDetections(response.data.detections || []);
    } catch (err) {
      console.error(err);
      setDetections([]);
      setError("Unable to load detections.");
    } finally {
      setLoadingDetections(false);
    }
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    loadScans();
  }, []);

  /* ============================================================
     WHEN SCAN CHANGES
  ============================================================ */

  useEffect(() => {
    if (selectedScanId !== null) {
      loadDetections(selectedScanId);

      setImageError(false);
      setImageWidth(0);
      setImageHeight(0);
    }
  }, [selectedScanId]);

  /* ============================================================
     UPDATE IMAGE DIMENSIONS WHEN WINDOW RESIZES
  ============================================================ */

  useEffect(() => {
    const updateDimensions = () => {
      const image = imageRef.current;

      if (!image) return;

      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setImageWidth(image.naturalWidth);
        setImageHeight(image.naturalHeight);
      }
    };

    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener(
        "resize",
        updateDimensions
      );
    };
  }, []);

  /* ============================================================
     RUN AI ANALYSIS
  ============================================================ */

  const runAIAnalysis = async () => {
    if (!selectedScanId) return;

    try {
      setRunningAI(true);
      setError("");

      const response = await api.post(
        `/api/detections/analyze/${selectedScanId}`
      );

      console.log("MarineX AI Result:", response.data);

      await loadDetections(selectedScanId);
      await loadScans();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "AI analysis failed."
      );
    } finally {
      setRunningAI(false);
    }
  };

  /* ============================================================
     IMAGE LOADED
  ============================================================ */

  const handleImageLoad = () => {
    const image = imageRef.current;

    if (!image) return;

    setImageError(false);

    setImageWidth(image.naturalWidth);
    setImageHeight(image.naturalHeight);

    console.log(
      "Original image dimensions:",
      image.naturalWidth,
      "x",
      image.naturalHeight
    );
  };

  /* ============================================================
     STATISTICS
  ============================================================ */

  const totalDetections = detections.length;

  const highPriority = detections.filter(
    (detection) =>
      detection.priority.toLowerCase() === "high"
  ).length;

  const mediumPriority = detections.filter(
    (detection) =>
      detection.priority.toLowerCase() === "medium"
  ).length;

  const lowPriority = detections.filter(
    (detection) =>
      detection.priority.toLowerCase() === "low"
  ).length;

  const averageConfidence =
    detections.length > 0
      ? detections.reduce(
          (sum, detection) =>
            sum + detection.confidence,
          0
        ) / detections.length
      : 0;

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-200">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-[#091625]">

        <div className="mx-auto max-w-[1500px] px-6 py-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">

                <BrainCircuit className="h-6 w-6 text-cyan-400" />

              </div>

              <div>

                <h1 className="text-2xl font-semibold text-white">
                  AI Analysis
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Sonar object detection and AI evidence analysis
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={loadScans}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >

                <RefreshCw className="h-4 w-4" />

                Refresh

              </button>

              {selectedScan && (
                <button
                  onClick={runAIAnalysis}
                  disabled={runningAI}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <BrainCircuit className="h-4 w-4" />

                  {runningAI
                    ? "Analyzing..."
                    : "Analyze with AI"}

                </button>
              )}

            </div>

          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1500px] px-6 py-6">

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">

            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />

            <div>

              <p className="text-sm font-medium text-red-300">
                Analysis Error
              </p>

              <p className="mt-1 text-xs text-red-400">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ====================================================
            SCAN SELECTOR
        ==================================================== */}

        <section className="mb-6 rounded-xl border border-slate-800 bg-[#0b1726] p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Select Sonar Scan
              </label>

              <div className="relative">

                <select
                  value={selectedScanId ?? ""}
                  onChange={(event) =>
                    setSelectedScanId(
                      event.target.value
                        ? Number(event.target.value)
                        : null
                    )
                  }
                  disabled={loadingScans}
                  className="w-full appearance-none rounded-lg border border-slate-700 bg-[#07111f] px-4 py-3 pr-10 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
                >

                  {loadingScans && (
                    <option value="">
                      Loading scans...
                    </option>
                  )}

                  {!loadingScans &&
                    scans.length === 0 && (
                      <option value="">
                        No scans available
                      </option>
                    )}

                  {scans.map((scan) => (
                    <option
                      key={scan.scan_id}
                      value={scan.scan_id}
                    >
                      #{scan.scan_id} — {scan.scan_name}
                    </option>
                  ))}

                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              </div>

            </div>

            {selectedScan && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                <StatCard
                  label="Detections"
                  value={totalDetections}
                  valueClass="text-white"
                />

                <StatCard
                  label="High"
                  value={highPriority}
                  valueClass="text-red-400"
                />

                <StatCard
                  label="Medium"
                  value={mediumPriority}
                  valueClass="text-amber-400"
                />

                <StatCard
                  label="Avg. Confidence"
                  value={`${(
                    averageConfidence * 100
                  ).toFixed(1)}%`}
                  valueClass="text-cyan-400"
                />

              </div>
            )}

          </div>

        </section>

        {selectedScan ? (

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

            {/* =================================================
                LEFT — SONAR IMAGE
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0b1726]">

              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">

                    <Waves className="h-5 w-5 text-cyan-400" />

                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      Sonar Image
                    </h2>

                    <p className="text-xs text-slate-500">
                      Original sonar image with AI bounding boxes
                    </p>

                  </div>

                </div>

                <div className="rounded-md border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
                  AI OVERLAY
                </div>

              </div>

              {/* IMAGE */}

              <div className="bg-black p-4">

                {imageError ? (

                  <div className="flex min-h-[500px] items-center justify-center rounded-lg border border-red-500/20 bg-[#05090f]">

                    <div className="text-center">

                      <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />

                      <p className="mt-4 text-sm font-medium text-slate-300">
                        Sonar image unavailable
                      </p>

                      <p className="mt-2 text-xs text-slate-600">
                        Could not load the image for this scan.
                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-slate-800 bg-black">

                    {/* REAL IMAGE */}

                    <img
                      ref={imageRef}
                      key={imageUrl}
                      src={imageUrl}
                      alt={selectedScan.scan_name}
                      className="block h-auto w-full"
                      onLoad={handleImageLoad}
                      onError={() => setImageError(true)}
                    />

                    {/* =================================================
                        EXACT YOLO BOXES
                    ================================================= */}

                    {imageWidth > 0 &&
                      imageHeight > 0 &&
                      !loadingDetections &&
                      detections.map((detection) => {

                        if (
                          !hasValidBoundingBox(
                            detection.bounding_box
                          )
                        ) {
                          return null;
                        }

                        const box =
                          detection.bounding_box;

                        /*
                         * YOLO gives coordinates in the original
                         * image pixel coordinate system.
                         *
                         * Example:
                         *
                         * x_min = 123
                         * y_min = 372
                         * x_max = 188
                         * y_max = 466
                         *
                         * We convert them to percentages using
                         * the REAL image dimensions.
                         */

                        const left =
                          (box.x_min / imageWidth) *
                          100;

                        const top =
                          (box.y_min / imageHeight) *
                          100;

                        const width =
                          ((box.x_max - box.x_min) /
                            imageWidth) *
                          100;

                        const height =
                          ((box.y_max - box.y_min) /
                            imageHeight) *
                          100;

                        const styles =
                          getPriorityStyles(
                            detection.priority
                          );

                        return (
                          <div
                            key={detection.detection_id}
                            className="absolute"
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                            }}
                          >

                            {/* BOX */}

                            <div
                              className={`absolute inset-0 border-2 ${styles.border}`}
                            />

                            {/* LABEL */}

                            <div
                              className={`absolute -top-7 left-0 whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold text-slate-950 ${styles.label}`}
                            >

                              {detection.object_class}

                              {" • "}

                              {(
                                detection.confidence *
                                100
                              ).toFixed(1)}
                              %

                            </div>

                          </div>
                        );
                      })}

                  </div>

                )}

              </div>

              {/* IMAGE INFO */}

              <div className="grid grid-cols-2 border-t border-slate-800 sm:grid-cols-4">

                <InfoCell
                  label="Scan"
                  value={`#${selectedScan.scan_id}`}
                />

                <InfoCell
                  label="Objects"
                  value={String(totalDetections)}
                />

                <InfoCell
                  label="Image"
                  value={
                    imageWidth > 0
                      ? `${imageWidth} × ${imageHeight}px`
                      : "Loading..."
                  }
                />

                <InfoCell
                  label="Model"
                  value="MarineX YOLO"
                  valueClass="text-cyan-400"
                />

              </div>

            </section>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="space-y-6">

              {/* SCAN INFORMATION */}

              <section className="rounded-xl border border-slate-800 bg-[#0b1726]">

                <div className="border-b border-slate-800 px-5 py-4">

                  <h2 className="text-sm font-semibold text-white">
                    Scan Information
                  </h2>

                </div>

                <div className="space-y-4 p-5">

                  <div>

                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Scan Name
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {selectedScan.scan_name}
                    </p>

                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div>

                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Latitude
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {selectedScan.latitude ??
                          "Unavailable"}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Longitude
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {selectedScan.longitude ??
                          "Unavailable"}
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div>

                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Depth
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {selectedScan.depth !== null
                          ? `${selectedScan.depth} m`
                          : "Unavailable"}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Status
                      </p>

                      <p className="mt-1 text-sm capitalize text-cyan-400">
                        {selectedScan.status}
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/map?scanId=${selectedScan.scan_id}`
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-400"
                  >

                    <MapPin className="h-4 w-4" />

                    View on Map

                  </button>

                </div>

              </section>

              {/* DETECTIONS */}

              <section className="rounded-xl border border-slate-800 bg-[#0b1726]">

                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      AI Detections
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Objects detected by MarineX
                    </p>

                  </div>

                  <div className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
                    {totalDetections}
                  </div>

                </div>

                <div className="p-4">

                  {loadingDetections ? (

                    <div className="flex items-center justify-center py-10">

                      <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />

                    </div>

                  ) : detections.length === 0 ? (

                    <div className="py-10 text-center">

                      <Target className="mx-auto h-9 w-9 text-slate-700" />

                      <p className="mt-3 text-sm text-slate-500">
                        No detections yet
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Run AI analysis to detect objects.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-3">

                      {detections.map((detection) => {

                        const styles =
                          getPriorityStyles(
                            detection.priority
                          );

                        return (
                          <div
                            key={detection.detection_id}
                            className="rounded-lg border border-slate-800 bg-[#07111f] p-4"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="flex items-center gap-3">

                                <div
                                  className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                                />

                                <div>

                                  <p className="text-sm font-medium capitalize text-slate-200">
                                    {detection.object_class}
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-600">
                                    Detection #
                                    {detection.detection_id}
                                  </p>

                                </div>

                              </div>

                              <span
                                className={`rounded-md border border-slate-700 px-2 py-1 text-[10px] font-medium uppercase ${styles.text}`}
                              >
                                {detection.priority}
                              </span>

                            </div>

                            <div className="mt-4">

                              <div className="mb-2 flex justify-between">

                                <span className="text-[10px] uppercase tracking-wider text-slate-600">
                                  Confidence
                                </span>

                                <span className="text-xs font-semibold text-cyan-400">
                                  {(
                                    detection.confidence *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>

                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

                                <div
                                  className="h-full rounded-full bg-cyan-400"
                                  style={{
                                    width: `${Math.min(
                                      detection.confidence *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                            </div>

                            <button
                              onClick={() =>
                                navigate(
                                  `/verification?detectionId=${detection.detection_id}`
                                )
                              }
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-400"
                            >

                              <Eye className="h-3.5 w-3.5" />

                              Verify Detection

                            </button>

                          </div>
                        );
                      })}

                    </div>

                  )}

                </div>

              </section>

              {/* PRIORITY SUMMARY */}

              <section className="rounded-xl border border-slate-800 bg-[#0b1726] p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">

                    <Clock3 className="h-5 w-5 text-amber-400" />

                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      Priority Summary
                    </h2>

                    <p className="text-xs text-slate-500">
                      Detection priority distribution
                    </p>

                  </div>

                </div>

                <div className="mt-5 space-y-3">

                  <PriorityRow
                    label="High"
                    count={highPriority}
                    color="red"
                  />

                  <PriorityRow
                    label="Medium"
                    count={mediumPriority}
                    color="amber"
                  />

                  <PriorityRow
                    label="Low"
                    count={lowPriority}
                    color="emerald"
                  />

                </div>

              </section>

              {/* AI PIPELINE */}

              <section className="rounded-xl border border-slate-800 bg-[#0b1726] p-5">

                <div className="mb-5 flex items-center gap-3">

                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                  <div>

                    <h2 className="text-sm font-semibold text-white">
                      AI Pipeline
                    </h2>

                    <p className="text-xs text-slate-500">
                      MarineX processing stages
                    </p>

                  </div>

                </div>

                <div className="space-y-3">

                  {[
                    "Sonar Image",
                    "YOLO Object Detection",
                    "Confidence Filtering",
                    "Priority Assessment",
                    "Human Verification",
                  ].map((stage, index) => (

                    <div
                      key={stage}
                      className="flex items-center gap-3"
                    >

                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] font-semibold text-emerald-400">
                        {index + 1}
                      </div>

                      <span className="text-xs text-slate-400">
                        {stage}
                      </span>

                      {index < 4 && (
                        <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-400" />
                      )}

                    </div>

                  ))}

                </div>

              </section>

            </div>

          </div>

        ) : (

          <div className="rounded-xl border border-slate-800 bg-[#0b1726] py-20 text-center">

            <Waves className="mx-auto h-12 w-12 text-slate-700" />

            <h2 className="mt-5 text-lg font-semibold text-slate-300">
              No Sonar Scan Selected
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Upload or select a sonar scan to begin AI analysis.
            </p>

          </div>

        )}

      </main>

    </div>
  );
}

/* ==============================================================
   STAT CARD
============================================================== */

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#07111f] px-4 py-3">

      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-semibold ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}

/* ==============================================================
   INFO CELL
============================================================== */

function InfoCell({
  label,
  value,
  valueClass = "text-slate-300",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="border-r border-slate-800 px-5 py-4 last:border-r-0">

      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-xs font-medium ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}

/* ==============================================================
   PRIORITY ROW
============================================================== */

function PriorityRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "red" | "amber" | "emerald";
}) {
  const dot =
    color === "red"
      ? "bg-red-400"
      : color === "amber"
      ? "bg-amber-400"
      : "bg-emerald-400";

  const text =
    color === "red"
      ? "text-red-400"
      : color === "amber"
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-2">

        <span
          className={`h-2 w-2 rounded-full ${dot}`}
        />

        <span className="text-xs text-slate-400">
          {label}
        </span>

      </div>

      <span
        className={`text-xs font-semibold ${text}`}
      >
        {count}
      </span>

    </div>
  );
}