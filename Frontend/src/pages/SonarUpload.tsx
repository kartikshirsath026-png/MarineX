import { useState, type DragEvent, type FormEvent } from "react";
import {
  Upload,
  FileImage,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Waves,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function SonarUpload() {
  const navigate = useNavigate();

  const [scanName, setScanName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [depth, setDepth] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // -----------------------------
  // FILE SELECTION
  // -----------------------------
  const handleFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/tiff",
    ];

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".tif",
      ".tiff",
    ];

    const fileName = selectedFile.name.toLowerCase();

    const validType =
      allowedTypes.includes(selectedFile.type) ||
      allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!validType) {
      setError(
        "Invalid file format. Please upload JPG, JPEG, PNG, WEBP, TIF or TIFF."
      );
      return;
    }

    // 50 MB maximum
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50 MB.");
      return;
    }

    setFile(selectedFile);
  };

  // -----------------------------
  // DRAG & DROP
  // -----------------------------
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  // -----------------------------
  // REMOVE FILE
  // -----------------------------
  const removeFile = () => {
    setFile(null);
    setError("");
    setSuccess("");

    const input = document.getElementById(
      "sonar-file"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  // -----------------------------
  // FORM SUBMIT
  // -----------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validate scan name
    if (!scanName.trim()) {
      setError("Please enter a scan name.");
      return;
    }

    // Validate file
    if (!file) {
      setError("Please select a sonar image.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("scan_name", scanName.trim());
      formData.append("file", file);

      // Optional metadata
      if (latitude.trim()) {
        formData.append("latitude", latitude);
      }

      if (longitude.trim()) {
        formData.append("longitude", longitude);
      }

      if (depth.trim()) {
        formData.append("depth", depth);
      }

      const response = await api.post(
        "/api/scans/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response.data);

      setSuccess("Sonar scan uploaded successfully.");

      // Clear form
      setScanName("");
      setLatitude("");
      setLongitude("");
      setDepth("");
      setFile(null);

      const input = document.getElementById(
        "sonar-file"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      // Navigate to analysis page after upload
      setTimeout(() => {
        navigate("/analysis");
      }, 1200);
    } catch (err: any) {
      console.error("Upload error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(
          "Unable to upload sonar scan. Please make sure the backend server is running."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------
  // CANCEL
  // -----------------------------
  const handleCancel = () => {
    setScanName("");
    setLatitude("");
    setLongitude("");
    setDepth("");
    setFile(null);
    setError("");
    setSuccess("");

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
            <Waves className="h-6 w-6 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Sonar Scan Upload
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Upload side-scan sonar imagery for AI-powered analysis
            </p>
          </div>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />

          <p className="text-sm text-emerald-300">
            {success}
          </p>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* LEFT - UPLOAD */}
          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold">
                  Sonar Image
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload the side-scan sonar image captured during
                  underwater survey.
                </p>
              </div>

              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() =>
                    document
                      .getElementById("sonar-file")
                      ?.click()
                  }
                  className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                    dragActive
                      ? "border-cyan-400 bg-cyan-500/5"
                      : "border-slate-700 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
                    <Upload className="h-8 w-8 text-cyan-400" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-200">
                    Drop your sonar image here
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    or click to browse files
                  </p>

                  <p className="mt-4 text-xs text-slate-600">
                    JPG, JPEG, PNG, WEBP, TIF, TIFF • Max 50 MB
                  </p>

                  <input
                    id="sonar-file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.tif,.tiff"
                    className="hidden"
                    onChange={(e) =>
                      handleFile(e.target.files?.[0])
                    }
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                        <FileImage className="h-6 w-6 text-cyan-400" />
                      </div>

                      <div>
                        <p className="max-w-md truncate text-sm font-medium text-slate-200">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* FILE PREVIEW */}
                  {file.type.startsWith("image/") && (
                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-black">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Sonar preview"
                        className="max-h-80 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - SCAN DETAILS */}
          <div className="xl:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Scan Metadata
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add available survey information.
                </p>
              </div>

              {/* SCAN NAME */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Scan Name
                  <span className="ml-1 text-cyan-400">*</span>
                </label>

                <input
                  type="text"
                  value={scanName}
                  onChange={(e) => setScanName(e.target.value)}
                  placeholder="e.g. Mumbai Survey 01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </div>

              {/* LATITUDE */}
              <div className="mb-5">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  Latitude
                </label>

                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 18.5204"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </div>

              {/* LONGITUDE */}
              <div className="mb-5">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  Longitude
                </label>

                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 73.8567"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </div>

              {/* DEPTH */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Depth
                </label>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-16 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    meters
                  </span>
                </div>
              </div>

              {/* INFO BOX */}
              <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                <div className="flex gap-3">
                  <Waves className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />

                  <div>
                    <p className="text-xs font-medium text-cyan-300">
                      Optional metadata
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Latitude, longitude and depth can be added
                      when available. The system will not invent
                      missing geographic information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Sonar Scan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}