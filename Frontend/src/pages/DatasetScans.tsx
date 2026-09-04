import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Database,
  MapPin,
  Waves,
  Loader2,
  Play,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DatasetScan {
  dataset_id: number;
  image_name: string;
  scan_name: string;
  latitude: number | null;
  longitude: number | null;
  depth: number | null;
  timestamp: string | null;
  image_available: boolean;
}

export default function DatasetScans() {
  const navigate = useNavigate();

  const [scans, setScans] = useState<DatasetScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const API_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    loadDataset();
  }, []);

  const loadDataset = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/dataset/scans`
      );

      setScans(response.data.scans || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load sonar dataset.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeScan = async (datasetId: number) => {
    try {
      setAnalyzingId(datasetId);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/dataset/analyze/${datasetId}`
      );

      const scanId = response.data.scan_id;

      if (!scanId) {
        throw new Error("Scan ID was not returned.");
      }

      navigate(`/analysis?scanId=${scanId}`);
    } catch (err) {
      console.error(err);
      setError("Unable to load this sonar scan.");
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading sonar dataset...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Database className="w-7 h-7 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Sonar Dataset
            </h1>

            <p className="text-slate-400 mt-1">
              Select a sonar scan and send it directly to MarineX AI analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">
            Available Scans
          </p>

          <p className="text-3xl font-bold text-white mt-2">
            {scans.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">
            Images Available
          </p>

          <p className="text-3xl font-bold text-cyan-400 mt-2">
            {scans.filter((scan) => scan.image_available).length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">
            AI Model
          </p>

          <p className="text-lg font-semibold text-white mt-3">
            MarineX YOLO
          </p>
        </div>

      </div>

      {/* Dataset cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {scans.map((scan) => {

          const imageUrl =
            `${API_URL}/api/dataset/image/${scan.dataset_id}`;

          return (
            <div
              key={scan.dataset_id}
              className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow-lg"
            >

              {/* Image */}
              <div className="relative h-64 bg-black">

                {scan.image_available ? (
                  <img
                    src={imageUrl}
                    alt={scan.scan_name}
                    className="w-full h-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Image unavailable
                  </div>
                )}

                {/* Scan number */}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/70 border border-slate-600 text-xs text-slate-200">
                  SCAN #{scan.dataset_id}
                </div>

              </div>

              {/* Information */}
              <div className="p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {scan.scan_name}
                    </h2>

                    <p className="text-xs text-slate-500 mt-1 break-all">
                      {scan.image_name}
                    </p>
                  </div>

                  {scan.image_available && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Image Ready
                    </div>
                  )}

                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 mt-5">

                  <div className="rounded-lg bg-slate-800/70 p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>

                    {scan.latitude !== null &&
                    scan.longitude !== null ? (
                      <p className="text-sm text-white mt-1">
                        {scan.latitude.toFixed(4)},{" "}
                        {scan.longitude.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-400 mt-1">
                        Metadata unavailable
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-slate-800/70 p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Waves className="w-4 h-4" />
                      Depth
                    </div>

                    {scan.depth !== null ? (
                      <p className="text-sm text-white mt-1">
                        {scan.depth} m
                      </p>
                    ) : (
                      <p className="text-sm text-amber-400 mt-1">
                        Metadata unavailable
                      </p>
                    )}
                  </div>

                </div>

                {/* Timestamp */}
                <div className="mt-3 text-xs text-slate-500">
                  Timestamp:{" "}
                  <span className="text-slate-300">
                    {scan.timestamp || "Metadata unavailable"}
                  </span>
                </div>

                {/* Analyze */}
                <button
                  onClick={() => analyzeScan(scan.dataset_id)}
                  disabled={
                    !scan.image_available ||
                    analyzingId === scan.dataset_id
                  }
                  className="w-full mt-5 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold py-3 transition"
                >
                  {analyzingId === scan.dataset_id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading Scan...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Analyze with MarineX AI
                    </>
                  )}
                </button>

              </div>
            </div>
          );
        })}

      </div>

      {/* Empty state */}
      {scans.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          No sonar scans found in the dataset.
        </div>
      )}

    </div>
  );
}