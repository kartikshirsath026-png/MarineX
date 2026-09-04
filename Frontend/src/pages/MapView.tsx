import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  RefreshCw,
  AlertTriangle,
  Target,
  Waves,
  Eye,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "leaflet/dist/leaflet.css";


// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

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

interface ScanHistoryResponse {
  success: boolean;
  total_scans: number;
  scans: Scan[];
}


// ---------------------------------------------------------
// LEAFLET MARKER ICON
// ---------------------------------------------------------

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


// ---------------------------------------------------------
// MAP FOCUS COMPONENT
// ---------------------------------------------------------

interface MapFocusProps {
  selectedScan: Scan | null;

  markerRefs: React.MutableRefObject<{
    [key: number]: L.Marker | null;
  }>;
}

function MapFocus({
  selectedScan,
  markerRefs,
}: MapFocusProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedScan) {
      return;
    }

    if (
      selectedScan.latitude === null ||
      selectedScan.longitude === null
    ) {
      return;
    }

    const position: [number, number] = [
      selectedScan.latitude,
      selectedScan.longitude,
    ];

    // -----------------------------------------------------
    // OPTION 1
    // Automatically zoom to selected scan
    // -----------------------------------------------------

    map.flyTo(position, 14, {
      duration: 1.2,
    });

    // -----------------------------------------------------
    // OPTION 4
    // Automatically open selected marker popup
    // -----------------------------------------------------

    const timer = window.setTimeout(() => {
      const marker =
        markerRefs.current[selectedScan.scan_id];

      if (marker) {
        marker.openPopup();
      }
    }, 1300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [selectedScan, map, markerRefs]);

  return null;
}


// ---------------------------------------------------------
// MAP VIEW
// ---------------------------------------------------------

export default function MapView() {
  const navigate = useNavigate();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected scan
  const [selectedScanId, setSelectedScanId] =
    useState<number | null>(null);

  // References to Leaflet markers
  const markerRefs = useRef<{
    [key: number]: L.Marker | null;
  }>({});


  // -------------------------------------------------------
  // READ SELECTED SCAN FROM URL
  // -------------------------------------------------------

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const scanId = params.get("scanId");

    if (scanId) {
      const parsedScanId = Number(scanId);

      if (!Number.isNaN(parsedScanId)) {
        setSelectedScanId(parsedScanId);
      }
    }
  }, []);


  // -------------------------------------------------------
  // LOAD SCANS
  // -------------------------------------------------------

  const loadScans = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ScanHistoryResponse>(
          "/api/scans/history"
        );

      setScans(response.data.scans || []);
    } catch (err) {
      console.error(
        "Failed to load map data:",
        err
      );

      setError(
        "Unable to load scan locations. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadScans();
  }, []);


  // -------------------------------------------------------
  // SCANS WITH LOCATION
  // -------------------------------------------------------

  const locatedScans = scans.filter(
    (scan) =>
      scan.latitude !== null &&
      scan.longitude !== null
  );


  const scansWithoutLocation = scans.filter(
    (scan) =>
      scan.latitude === null ||
      scan.longitude === null
  );


  // -------------------------------------------------------
  // SELECTED SCAN
  // -------------------------------------------------------

  const selectedScan =
    selectedScanId !== null
      ? scans.find(
          (scan) =>
            scan.scan_id === selectedScanId
        ) || null
      : null;


  // -------------------------------------------------------
  // MAP CENTER
  // -------------------------------------------------------

  const defaultCenter: [number, number] = [
    20.5937,
    78.9629,
  ];


  const mapCenter: [number, number] =
    locatedScans.length > 0
      ? [
          locatedScans[0].latitude!,
          locatedScans[0].longitude!,
        ]
      : defaultCenter;


  // -------------------------------------------------------
  // PRIORITY
  // -------------------------------------------------------

  const getPriority = (scan: Scan) => {
    if (scan.high_priority_detections > 0) {
      return "high";
    }

    if (scan.total_detections > 0) {
      return "medium";
    }

    return "low";
  };


  const getPriorityClass = (
    priority: string
  ) => {
    if (priority === "high") {
      return "text-red-400 bg-red-500/10 border-red-500/20";
    }

    if (priority === "medium") {
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }

    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };


  // -------------------------------------------------------
  // CLEAR FOCUS
  // -------------------------------------------------------

  const clearFocus = () => {
    setSelectedScanId(null);

    navigate("/map", {
      replace: true,
    });
  };


  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">

          <RefreshCw
            className="mx-auto h-8 w-8 animate-spin text-cyan-400"
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading geolocation data...
          </p>

        </div>
      </div>
    );
  }


  // -------------------------------------------------------
  // MAIN
  // -------------------------------------------------------

  return (
    <div className="min-h-screen text-white">

      {/* ------------------------------------------------- */}
      {/* HEADER */}
      {/* ------------------------------------------------- */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">

              <MapPin className="h-6 w-6 text-cyan-400" />

            </div>

            <div>

              <h1 className="text-2xl font-semibold">
                Map & Geolocation
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Geographic view of sonar surveys and detected
                anomalies
              </p>

            </div>

          </div>

        </div>


        <div className="flex items-center gap-3">

          {/* Focused scan indicator */}
          {selectedScan && (
            <button
              onClick={clearFocus}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Show All Locations
            </button>
          )}

          <button
            onClick={loadScans}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
          >

            <RefreshCw className="h-4 w-4" />

            Refresh Map

          </button>

        </div>

      </div>


      {/* ------------------------------------------------- */}
      {/* FOCUSED SCAN BANNER */}
      {/* ------------------------------------------------- */}

      {selectedScan && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">

              <Target className="h-5 w-5 text-cyan-400" />

            </div>

            <div>

              <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                Focused Survey Location
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {selectedScan.scan_name}
              </p>

            </div>

          </div>


          <div className="text-right">

            <p className="text-xs text-slate-400">
              Scan #{selectedScan.scan_id}
            </p>

            {selectedScan.latitude !== null &&
              selectedScan.longitude !== null && (
                <p className="mt-1 text-xs text-cyan-300">
                  {selectedScan.latitude.toFixed(5)},
                  {" "}
                  {selectedScan.longitude.toFixed(5)}
                </p>
              )}

          </div>

        </div>
      )}


      {/* ------------------------------------------------- */}
      {/* ERROR */}
      {/* ------------------------------------------------- */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">

          <AlertTriangle className="h-5 w-5 text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>

        </div>
      )}


      {/* ------------------------------------------------- */}
      {/* STATISTICS */}
      {/* ------------------------------------------------- */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Surveys */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">

              <Target className="h-5 w-5 text-cyan-400" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Total Surveys
              </p>

              <p className="mt-1 text-xl font-semibold">
                {scans.length}
              </p>

            </div>

          </div>

        </div>


        {/* Located Surveys */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">

              <MapPin className="h-5 w-5 text-emerald-400" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Located Surveys
              </p>

              <p className="mt-1 text-xl font-semibold">
                {locatedScans.length}
              </p>

            </div>

          </div>

        </div>


        {/* High Priority */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">

              <AlertTriangle className="h-5 w-5 text-red-400" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                High Priority
              </p>

              <p className="mt-1 text-xl font-semibold">

                {scans.reduce(
                  (sum, scan) =>
                    sum +
                    scan.high_priority_detections,
                  0
                )}

              </p>

            </div>

          </div>

        </div>


        {/* Total Detections */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">

              <Waves className="h-5 w-5 text-amber-400" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Total Detections
              </p>

              <p className="mt-1 text-xl font-semibold">

                {scans.reduce(
                  (sum, scan) =>
                    sum +
                    scan.total_detections,
                  0
                )}

              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ------------------------------------------------- */}
      {/* MAP + SIDE PANEL */}
      {/* ------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">

        {/* ------------------------------------------------ */}
        {/* MAP */}
        {/* ------------------------------------------------ */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 xl:col-span-3">

          <div className="border-b border-slate-800 p-5">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-base font-semibold">
                  Survey Locations
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Locations are based only on available survey
                  metadata
                </p>

              </div>


              <div className="flex items-center gap-4 text-xs">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                  High

                </div>

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />

                  Medium

                </div>

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                  Low

                </div>

              </div>

            </div>

          </div>


          <div className="h-[600px] w-full">

            <MapContainer
              center={mapCenter}
              zoom={5}
              scrollWheelZoom={true}
              className="h-full w-full"
            >

              {/* AUTO FOCUS */}
              <MapFocus
                selectedScan={selectedScan}
                markerRefs={markerRefs}
              />


              {/* MAP TILES */}
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              {/* ------------------------------------------------ */}
              {/* SCAN MARKERS */}
              {/* ------------------------------------------------ */}

              {locatedScans.map((scan) => {

                const priority =
                  getPriority(scan);

                const isSelected =
                  selectedScanId ===
                  scan.scan_id;

                const isFaded =
                  selectedScanId !== null &&
                  !isSelected;


                return (
                  <div
                    key={scan.scan_id}
                  >

                    {/* ------------------------------------------ */}
                    {/* MARKER */}
                    {/* ------------------------------------------ */}

                    <Marker
                      ref={(marker) => {
                        markerRefs.current[
                          scan.scan_id
                        ] = marker;
                      }}

                      position={[
                        scan.latitude!,
                        scan.longitude!,
                      ]}

                      icon={markerIcon}

                      opacity={
                        isFaded
                          ? 0.25
                          : 1
                      }
                    >

                      {/* ---------------------------------------- */}
                      {/* POPUP */}
                      {/* ---------------------------------------- */}

                      <Popup>

                        <div className="min-w-[220px] text-slate-900">

                          <p className="text-sm font-semibold">
                            {scan.scan_name}
                          </p>

                          <p className="mt-1 text-xs">
                            Scan #{scan.scan_id}
                          </p>

                          <hr className="my-2" />

                          <p className="text-xs">
                            Location:{" "}
                            {scan.latitude?.toFixed(
                              5
                            )}
                            ,{" "}
                            {scan.longitude?.toFixed(
                              5
                            )}
                          </p>

                          <p className="mt-1 text-xs">
                            Depth:{" "}
                            {scan.depth !== null
                              ? `${scan.depth} m`
                              : "Unavailable"}
                          </p>

                          <p className="mt-1 text-xs">
                            Detections:{" "}
                            {scan.total_detections}
                          </p>

                          <p className="mt-1 text-xs">
                            High Priority:{" "}
                            {scan.high_priority_detections}
                          </p>


                          {/* Priority */}
                          <div className="mt-2">

                            <span
                              className={`inline-block rounded-full border px-2 py-1 text-[10px] font-medium ${getPriorityClass(
                                priority
                              )}`}
                            >
                              {priority.toUpperCase()}
                            </span>

                          </div>


                          {/* View Analysis */}
                          <button
                            onClick={() =>
                              navigate(
                                `/analysis?scanId=${scan.scan_id}`
                              )
                            }

                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950"
                          >

                            <Eye className="h-3 w-3" />

                            View Analysis

                          </button>

                        </div>

                      </Popup>

                    </Marker>


                    {/* ------------------------------------------ */}
                    {/* PRIORITY CIRCLE */}
                    {/* ------------------------------------------ */}

                    <CircleMarker
                      center={[
                        scan.latitude!,
                        scan.longitude!,
                      ]}

                      radius={
                        priority === "high"
                          ? 14
                          : priority === "medium"
                          ? 11
                          : 8
                      }

                      pathOptions={{
                        color:
                          priority === "high"
                            ? "#ef4444"
                            : priority === "medium"
                            ? "#f59e0b"
                            : "#10b981",

                        fillOpacity:
                          isFaded
                            ? 0.03
                            : 0.15,

                        opacity:
                          isFaded
                            ? 0.2
                            : 1,

                        weight: 2,
                      }}
                    />

                  </div>
                );
              })}

            </MapContainer>

          </div>

        </div>


        {/* ------------------------------------------------ */}
        {/* RIGHT PANEL */}
        {/* ------------------------------------------------ */}

        <div className="space-y-6">

          {/* ------------------------------------------------ */}
          {/* LOCATION STATUS */}
          {/* ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <h2 className="text-base font-semibold">
              Location Coverage
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Availability of geographic metadata
            </p>


            <div className="mt-5 space-y-3">

              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">

                <span className="text-sm text-slate-400">
                  With location
                </span>

                <span className="font-semibold text-emerald-400">
                  {locatedScans.length}
                </span>

              </div>


              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">

                <span className="text-sm text-slate-400">
                  Without location
                </span>

                <span className="font-semibold text-amber-400">
                  {scansWithoutLocation.length}
                </span>

              </div>

            </div>

          </div>


          {/* ------------------------------------------------ */}
          {/* RECENT LOCATIONS */}
          {/* ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <h2 className="text-base font-semibold">
              Survey Locations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Recently uploaded sonar scans
            </p>


            <div className="mt-5 space-y-3">

              {scans.length === 0 ? (

                <p className="py-6 text-center text-xs text-slate-600">
                  No scans available.
                </p>

              ) : (

                scans
                  .slice(0, 5)
                  .map((scan) => {

                    const priority =
                      getPriority(scan);

                    const isSelected =
                      selectedScanId ===
                      scan.scan_id;

                    return (
                      <div
                        key={scan.scan_id}

                        className={`rounded-xl border bg-slate-950 p-4 transition ${
                          isSelected
                            ? "border-cyan-500/50 bg-cyan-500/5"
                            : "border-slate-800"
                        }`}
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium text-slate-300">
                              {scan.scan_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              Scan #{scan.scan_id}
                            </p>

                          </div>


                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-medium ${getPriorityClass(
                              priority
                            )}`}
                          >
                            {priority}
                          </span>

                        </div>


                        <div className="mt-3 flex items-center gap-2">

                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />

                          <span className="text-xs text-slate-500">

                            {scan.latitude !== null &&
                            scan.longitude !== null
                              ? `${scan.latitude.toFixed(
                                  4
                                )}, ${scan.longitude.toFixed(
                                  4
                                )}`
                              : "Location unavailable"}

                          </span>

                        </div>


                        {/* Focus button */}
                        {scan.latitude !== null &&
                          scan.longitude !== null && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/map?scanId=${scan.scan_id}`
                                )
                              }

                              className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-cyan-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {isSelected
                                ? "Focused Location"
                                : "Focus on Map"}
                            </button>
                          )}

                      </div>
                    );
                  })
              )}

            </div>

          </div>

        </div>

      </div>


      {/* ------------------------------------------------- */}
      {/* LOCATION WARNING */}
      {/* ------------------------------------------------- */}

      {scansWithoutLocation.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">

          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

          <div>

            <p className="text-sm font-medium text-amber-300">
              Some scans have no geographic metadata
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              MarineX does not invent coordinates. These scans
              will appear in the scan history but cannot be
              plotted on the map until valid location metadata
              is available.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}