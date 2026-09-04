import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SonarUpload from "./pages/SonarUpload";
import AnalysisResults from "./pages/AnalysisResults";
import DetectionDetails from "./pages/DetectionDetails";
import MapView from "./pages/MapView";
import Verification from "./pages/Verification";
import ScanHistory from "./pages/ScanHistory";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DatasetScans from "./pages/DatasetScans";

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-400">
        This MarineX module will be implemented next.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/sonar-upload"
            element={<SonarUpload />}
          />

          <Route
            path="/analysis"
            element={<AnalysisResults />}
          />

          <Route
            path="/detections/:detectionId"
            element={<DetectionDetails />}
          />

          <Route
            path="/map"
            element={<MapView />}
          />

          <Route
            path="/verification"
            element={<Verification />}
          />

          <Route 
            path="/history" 
            element={<ScanHistory />} 
          />

          <Route 
            path="/analytics" 
            element={<Analytics />} 
          />

          <Route
            path="/reports" 
            element={<Reports />}
          />

          <Route 
            path="/settings" 
            element={<Settings />}
          />

          <Route 
            path="/dataset" 
            element={<DatasetScans />} 
          />
        </Route>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}