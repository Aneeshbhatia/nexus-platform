import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  LockKeyhole,
  UserRound,
  CheckCircle2,
  AlertCircle,
  Command,
} from "lucide-react";
import api from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setMessageType("");
  };

  const showFeedback = (type, text) => {
    setMessageType(type);
    setMessage(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!formData.name.trim()) {
      showFeedback("error", "Please provide your full name.");
      return;
    }

    if (!formData.email.trim()) {
      showFeedback("error", "Please enter a valid work email address.");
      return;
    }

    if (formData.password.length < 6) {
      showFeedback("error", "Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showFeedback("error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const response = await api.post("/auth/register", payload);

      if (response.data?.success) {
        showFeedback(
          "success",
          "Account registered successfully! Redirecting to sign in..."
        );
        setTimeout(() => {
          navigate("/login", {
            state: {
              registeredEmail: payload.email,
              message: "Registration successful. Please sign in.",
            },
          });
        }, 1200);
      } else {
        showFeedback("error", response.data?.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showFeedback(
        "error",
        err.response?.data?.message || "Registration service error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-500/15 text-blue-200">
            <Command size={19} strokeWidth={1.8} />
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Get started with your people operations workspace
          </p>
        </div>

        {message && (
          <div
            role="alert"
            className={`mb-5 flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
              messageType === "success"
                ? "border-emerald-500/30 bg-emerald-950/60 text-emerald-300"
                : "border-rose-500/30 bg-rose-950/60 text-rose-300"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Rivera"
                className="ems-input pl-10"
              />
              <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className="ems-input pl-10"
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="ems-input pl-10 pr-10"
              />
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="ems-input pl-10 pr-10"
              />
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-spatial w-full py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Registering Account..." : "Create Account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-300 hover:text-blue-200 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
