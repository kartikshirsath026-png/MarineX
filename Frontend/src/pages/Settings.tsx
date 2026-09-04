import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function Settings() {
  const [name, setName] = useState("MarineX Admin");
  const [email, setEmail] = useState("admin@marinex.com");

  const [notifications, setNotifications] = useState(true);
  const [highPriorityAlerts, setHighPriorityAlerts] =
    useState(true);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      "marinex_settings",
      JSON.stringify({
        name,
        email,
        notifications,
        highPriorityAlerts,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen text-white">

      {/* HEADER */}

      <div className="mb-6 flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
          <SettingsIcon className="h-6 w-6 text-cyan-400" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage your MarineX application preferences
          </p>
        </div>

      </div>

      {/* SAVE MESSAGE */}

      {saved && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">

          <CheckCircle2 className="h-5 w-5 text-emerald-400" />

          <p className="text-sm text-emerald-300">
            Settings saved successfully.
          </p>

        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* LEFT */}

        <div className="space-y-6 xl:col-span-2">

          {/* PROFILE */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <User className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Profile
                </h2>

                <p className="text-xs text-slate-600">
                  Manage your MarineX account information
                </p>
              </div>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

            </div>

          </section>

          {/* NOTIFICATIONS */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Bell className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Notifications
                </h2>

                <p className="text-xs text-slate-600">
                  Configure detection and system alerts
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-5">

              {/* GENERAL */}

              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-sm font-medium text-slate-300">
                    System Notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Receive important MarineX system updates
                  </p>
                </div>

                <button
                  onClick={() =>
                    setNotifications(!notifications)
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    notifications
                      ? "bg-cyan-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      notifications
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              {/* HIGH PRIORITY */}

              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-sm font-medium text-slate-300">
                    High Priority Alerts
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Alert when high-priority anomalies are detected
                  </p>
                </div>

                <button
                  onClick={() =>
                    setHighPriorityAlerts(
                      !highPriorityAlerts
                    )
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    highPriorityAlerts
                      ? "bg-cyan-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      highPriorityAlerts
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

            </div>

          </section>

          {/* SECURITY */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Shield className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Security
                </h2>

                <p className="text-xs text-slate-600">
                  Application security information
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-3">

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">

                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Authentication
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    MarineX account authentication is enabled
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">

                <div>
                  <p className="text-sm font-medium text-slate-300">
                    User Role
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Current application access level
                  </p>
                </div>

                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
                  Administrator
                </span>

              </div>

            </div>

          </section>

        </div>

        {/* RIGHT */}

        <div className="space-y-6">

          {/* DATABASE */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Database className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="font-semibold">
                  System Status
                </h2>

                <p className="text-xs text-slate-600">
                  MarineX infrastructure
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-3">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-400">
                  Backend API
                </span>

                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Connected
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-400">
                  PostgreSQL
                </span>

                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Connected
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-400">
                  AI Engine
                </span>

                <span className="flex items-center gap-2 text-xs text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Prototype
                </span>

              </div>

            </div>

          </section>

          {/* APPLICATION INFO */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <h2 className="font-semibold">
              Application
            </h2>

            <div className="mt-5 space-y-4">

              <div>
                <p className="text-xs text-slate-600">
                  Application
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  MarineX
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Version
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  1.0.0
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Environment
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Development
                </p>
              </div>

            </div>

          </section>

          {/* SAVE */}

          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>

        </div>

      </div>

    </div>
  );
}