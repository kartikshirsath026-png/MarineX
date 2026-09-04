import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Waves,
  ScanSearch,
  Database,
  Map,
  ShieldCheck,
  History,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Sonar Dataset",
    path: "/dataset",
    icon: Database,
  },
  {
    name: "Sonar Scan",
    path: "/sonar-upload",
    icon: ScanSearch,
  },
  {
    name: "AI Analysis",
    path: "/analysis",
    icon: Waves,
  },
  {
    name: "Map & Geolocation",
    path: "/map",
    icon: Map,
  },
  {
    name: "Verification",
    path: "/verification",
    icon: ShieldCheck,
  },
  {
    name: "Scan History",
    path: "/history",
    icon: History,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
];

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950">
        
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
            <Waves className="h-6 w-6 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-wide">MarineX</h1>
            <p className="text-xs text-slate-500">
              Marine Intelligence
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Operations
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="my-5 border-t border-slate-800" />

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* User */}
        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-400">
              MX
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                MarineX Admin
              </p>
              <p className="truncate text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <LogOut className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="ml-64 min-h-screen">
        
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-8 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold">
              Marine Monitoring System
            </h2>
            <p className="text-xs text-slate-500">
              AI-powered underwater intelligence
            </p>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white">
              <Bell className="h-5 w-5" />

              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-cyan-400" />
            </button>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-right">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-slate-500">Online</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}