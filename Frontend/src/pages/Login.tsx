import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Waves, Lock, Mail, ArrowRight } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem(
          "marinex_user",
          JSON.stringify(response.data.user)
        );

        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to connect to MarineX server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">

        {/* Left Section */}
        <div className="hidden w-1/2 flex-col justify-between border-r border-slate-800 bg-slate-950 p-12 lg:flex">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
              <Waves className="h-6 w-6 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold">MarineX</h1>
              <p className="text-xs text-slate-500">
                Marine Intelligence Platform
              </p>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-cyan-400">
              Underwater Intelligence
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Discover what lies
              <span className="text-cyan-400"> beneath the surface.</span>
            </h2>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              AI-powered sonar analysis for detecting marine debris,
              marine life, and underwater anomalies.
            </p>

            <div className="mt-8 flex gap-3">
              <div className="h-1 w-16 rounded-full bg-cyan-400" />
              <div className="h-1 w-8 rounded-full bg-slate-700" />
              <div className="h-1 w-4 rounded-full bg-slate-800" />
            </div>
          </div>

          <p className="text-xs text-slate-600">
            MarineX • AI-Powered Marine Monitoring
          </p>
        </div>

        {/* Login Section */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
                <Waves className="h-6 w-6 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-xl font-bold">MarineX</h1>
                <p className="text-xs text-slate-500">
                  Marine Intelligence
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Sign in to access the MarineX monitoring system.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@marinex.com"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && (
                  <ArrowRight className="h-5 w-5" />
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-600">
              Secure MarineX Operations Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}