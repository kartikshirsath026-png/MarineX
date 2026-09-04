import { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Target,
  Waves,
  MapPin,
  Send,
  RefreshCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

interface Verification {
  id: number;
  detection_id: number;
  status: string;
  remarks: string | null;
  verified_by: number | null;
  created_at: string;
}

interface VerificationResponse {
  success: boolean;
  message?: string;
  verification?: Verification;
}

export default function Verification() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(
    location.search
  );

  const detectionId = queryParams.get("detectionId");

  const [detection, setDetection] =
    useState<Detection | null>(null);

  const [scan, setScan] = useState<Scan | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<"confirmed" | "rejected" | "uncertain" | "">(
      ""
    );

  const [remarks, setRemarks] = useState("");

  const [existingVerification, setExistingVerification] =
    useState<Verification | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------------------------------------------------------
  // LOAD DETECTION
  // ---------------------------------------------------------

  useEffect(() => {
    const loadDetection = async () => {
      if (!detectionId) {
        setError(
          "No detection was selected for verification."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
          Our detection endpoint needs the scan ID.
          Since the Verification URL only contains detectionId,
          first we check available scans.
        */

        const historyResponse =
          await api.get("/api/scans/history");

        const scans: Scan[] =
          historyResponse.data.scans || [];

        let foundDetection: Detection | null = null;
        let foundScan: Scan | null = null;

        for (const currentScan of scans) {
          try {
            const response =
              await api.get<ScanResponse>(
                `/api/scans/${currentScan.scan_id}`
              );

            const match =
              response.data.detections.find(
                (item) =>
                  item.detection_id ===
                  Number(detectionId)
              );

            if (match) {
              foundDetection = match;
              foundScan = response.data.scan;
              break;
            }
          } catch (scanError) {
            console.error(
              `Failed to inspect scan ${currentScan.scan_id}`,
              scanError
            );
          }
        }

        if (!foundDetection || !foundScan) {
          setError("Detection not found.");
          return;
        }

        setDetection(foundDetection);
        setScan(foundScan);

        // Check whether this detection was already verified
        try {
          const verificationResponse =
            await api.get(
              `/api/verification/${detectionId}`
            );

          if (
            verificationResponse.data?.verification
          ) {
            const verification =
              verificationResponse.data
                .verification;

            setExistingVerification(
              verification
            );

            if (
              verification.status ===
                "confirmed" ||
              verification.status ===
                "rejected" ||
              verification.status ===
                "uncertain"
            ) {
              setSelectedStatus(
                verification.status
              );
            }

            setRemarks(
              verification.remarks || ""
            );
          }
        } catch {
          // No verification yet is acceptable.
          setExistingVerification(null);
        }
      } catch (err) {
        console.error(
          "Failed to load verification data:",
          err
        );

        setError(
          "Unable to load verification information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetection();
  }, [detectionId]);

  // ---------------------------------------------------------
  // SUBMIT VERIFICATION
  // ---------------------------------------------------------

  const handleSubmit = async () => {
    if (!detectionId) {
      setError("Detection ID is missing.");
      return;
    }

    if (!selectedStatus) {
      setError(
        "Please select Confirm, Reject, or Uncertain."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response =
        await api.post<VerificationResponse>(
          `/api/verification/${detectionId}`,
          {
            status: selectedStatus,
            remarks:
              remarks.trim() || null,
            verified_by: 1,
          }
        );

      if (response.data.success) {
        setSuccess(
          "Verification submitted successfully."
        );

        if (response.data.verification) {
          setExistingVerification(
            response.data.verification
          );
        }
      }
    } catch (err) {
      console.error(
        "Verification submission failed:",
        err
      );

      setError(
        "Unable to submit verification. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const className = detection
    ? detection.object_class
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    : "";

  const confidence = detection
    ? detection.confidence * 100
    : 0;

  const priorityClass =
    detection?.priority.toLowerCase() === "high"
      ? "border-red-500/20 bg-red-500/10 text-red-400"
      : detection?.priority.toLowerCase() ===
        "medium"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

          <p className="mt-4 text-sm text-slate-500">
            Loading verification data...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error && (!detection || !scan)) {
    return (
      <div className="min-h-[70vh]">
        <button
          onClick={() => navigate("/analysis")}
          className="mb-6 text-sm text-slate-400 hover:text-cyan-400"
        >
          ← Back to AI Analysis
        </button>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />

          <h2 className="mt-4 text-lg font-semibold">
            Verification unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!detection || !scan) {
    return null;
  }

  // ---------------------------------------------------------
  // MAIN
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen text-white">

      {/* HEADER */}
      <div className="mb-6">

        <button
          onClick={() =>
            navigate(
              `/detections/${detection.detection_id}?scanId=${scan.scan_id}`
            )
          }
          className="mb-5 text-sm text-slate-400 transition hover:text-cyan-400"
        >
          ← Back to Detection Details
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">
                Human Verification
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Review and validate AI detection results
              </p>
            </div>

          </div>

          {existingVerification && (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-400">
              Previously Reviewed
            </span>
          )}

        </div>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">

          <CheckCircle2 className="h-5 w-5 text-emerald-400" />

          <p className="text-sm text-emerald-300">
            {success}
          </p>

        </div>
      )}

      {/* ERROR */}
      {error && detection && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">

          <AlertTriangle className="h-5 w-5 text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>

        </div>
      )}

      {/* DETECTION SUMMARY */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* LEFT */}
        <div className="xl:col-span-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-base font-semibold">
                  Detection Evidence
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Review the information produced by the AI
                </p>
              </div>

              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400">
                Detection #{detection.detection_id}
              </span>

            </div>

            {/* IMAGE PLACEHOLDER */}
            <div className="flex min-h-[430px] items-center justify-center rounded-xl border border-slate-800 bg-black">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
                  <Waves className="h-8 w-8 text-cyan-400" />
                </div>

                <p className="mt-5 text-sm font-medium text-slate-300">
                  Sonar Evidence
                </p>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
                  The original sonar image and AI detection
                  overlay will appear here once the image
                  processing pipeline is connected.
                </p>

              </div>

            </div>

          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* AI RESULT */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  AI Result
                </h2>

                <p className="text-xs text-slate-500">
                  Model prediction
                </p>
              </div>

            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

              <p className="text-xs text-slate-500">
                Classification
              </p>

              <p className="mt-2 text-lg font-semibold">
                {className}
              </p>

            </div>

            <div className="mt-4">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Confidence
                </span>

                <span className="text-sm font-semibold text-cyan-400">
                  {confidence.toFixed(0)}%
                </span>

              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${confidence}%`,
                  }}
                />
              </div>

            </div>

            <div className="mt-4 flex items-center justify-between">

              <span className="text-xs text-slate-500">
                AI Priority
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityClass}`}
              >
                {detection.priority}
              </span>

            </div>

          </div>

          {/* SURVEY INFO */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <h2 className="text-base font-semibold">
              Survey Information
            </h2>

            <div className="mt-5 space-y-4">

              <div>
                <p className="text-xs text-slate-500">
                  Scan
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {scan.scan_name}
                </p>
              </div>

              <div className="flex gap-3">

                <MapPin className="h-4 w-4 text-cyan-400" />

                <div>
                  <p className="text-xs text-slate-500">
                    Location
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {scan.latitude !== null &&
                    scan.longitude !== null
                      ? `${scan.latitude.toFixed(
                          5
                        )}, ${scan.longitude.toFixed(5)}`
                      : "Unavailable"}
                  </p>
                </div>

              </div>

              <div className="flex gap-3">

                <Waves className="h-4 w-4 text-cyan-400" />

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

            </div>

          </div>

        </div>
      </div>

      {/* VERIFICATION */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

        <div className="mb-6">

          <h2 className="text-lg font-semibold">
            Human Decision
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the result that best represents your review
            of the sonar evidence.
          </p>

        </div>

        {/* OPTIONS */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* CONFIRM */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatus("confirmed")
            }
            className={`rounded-xl border p-5 text-left transition ${
              selectedStatus === "confirmed"
                ? "border-emerald-400/50 bg-emerald-500/10"
                : "border-slate-800 bg-slate-950 hover:border-emerald-500/30"
            }`}
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>

              <div>
                <p className="font-semibold text-slate-200">
                  Confirm
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  AI detection is correct
                </p>
              </div>

            </div>

          </button>

          {/* REJECT */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatus("rejected")
            }
            className={`rounded-xl border p-5 text-left transition ${
              selectedStatus === "rejected"
                ? "border-red-400/50 bg-red-500/10"
                : "border-slate-800 bg-slate-950 hover:border-red-500/30"
            }`}
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>

              <div>
                <p className="font-semibold text-slate-200">
                  Reject
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  False positive
                </p>
              </div>

            </div>

          </button>

          {/* UNCERTAIN */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatus("uncertain")
            }
            className={`rounded-xl border p-5 text-left transition ${
              selectedStatus === "uncertain"
                ? "border-amber-400/50 bg-amber-500/10"
                : "border-slate-800 bg-slate-950 hover:border-amber-500/30"
            }`}
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                <HelpCircle className="h-6 w-6 text-amber-400" />
              </div>

              <div>
                <p className="font-semibold text-slate-200">
                  Uncertain
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Needs further review
                </p>
              </div>

            </div>

          </button>

        </div>

        {/* REMARKS */}
        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Review Remarks
            <span className="ml-2 text-xs font-normal text-slate-600">
              Optional
            </span>
          </label>

          <textarea
            value={remarks}
            onChange={(e) =>
              setRemarks(e.target.value)
            }
            rows={4}
            placeholder="Add observations or reasons for your decision..."
            className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
          />

        </div>

        {/* SUBMIT */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-slate-600">
            Your decision will be stored in the MarineX
            verification database.
          </p>

          <button
            onClick={handleSubmit}
            disabled={
              submitting || !selectedStatus
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Verification
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
}