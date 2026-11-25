import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  Command,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/authContext.jsx";

// Demo credential sets for 1-click switching
const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    email: "admin@nexus.com",
    password: "admin123",
    color: "hover:border-indigo-500/30 hover:text-indigo-300",
    badge: "text-indigo-400 border-indigo-500/20 bg-indigo-500/8",
  },
  {
    label: "HR Manager",
    email: "hr@nexus.com",
    password: "hr123456",
    color: "hover:border-amber-500/30 hover:text-amber-300",
    badge: "text-amber-400 border-amber-500/20 bg-amber-500/8",
  },
  {
    label: "Employee",
    email: "employee@nexus.com",
    password: "emp12345",
    color: "hover:border-zinc-500/40 hover:text-zinc-200",
    badge: "text-zinc-400 border-white/[0.1] bg-white/[0.04]",
  },
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(location.state?.message || "");
  const [messageType, setMessageType] = useState(
    location.state?.message ? "success" : ""
  );
  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setMessageType("");
  };

  const handleQuickLogin = (email, password) => {
    setFormData({ email, password });
    setMessage("");
    setMessageType("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.email.trim() || !formData.password) {
      setMessageType("error");
      setMessage("Email and password are required.");
      return;
    }

    const result = await login({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });

    if (result.success) {
      setMessageType("success");
      setMessage("Authentication successful. Loading workspace...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 500);
    } else {
      setMessageType("error");
      setMessage(result.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl
                border border-blue-300/20 bg-blue-500/15 text-blue-200"
            >
              <Command size={19} strokeWidth={1.8} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Sign in to NEXUS
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              Your people operations workspace
            </p>
          </div>

          <div className="auth-demo-panel mb-5">
            <div className="flex items-center justify-between border-b border-[#2a3a53] px-3 py-2.5">
              <span className="text-[11px] font-semibold text-zinc-300">
                Use a demo account
              </span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-[#2a3a53]">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.password)}
                  className={`auth-demo-button ${acc.color}`}
                >
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${acc.badge}`}
                  >
                    {acc.label}
                  </span>
                  <span className="w-full truncate text-[11px] text-zinc-400">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div
              role="alert"
              className={`mb-4 flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
                messageType === "success"
                  ? "border-emerald-500/25 bg-emerald-950/40 text-emerald-300"
                  : "border-rose-500/25 bg-rose-950/40 text-rose-300"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-zinc-300"
              >
                Work Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="ems-input pl-10"
                />
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="ems-input pl-10 pr-10"
                />
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={16}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-spatial w-full py-3 text-sm font-semibold"
              >
                {loading ? (
                  "Authenticating..."
                ) : (
                  <>
                    Sign in to Workspace
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-400">
            Need an account?{" "}
            <Link
              to="/register"
              className="inline-flex items-center gap-0.5 font-semibold text-blue-300 transition hover:text-blue-200"
            >
              Register
              <ChevronRight size={14} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
