import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Moon,
  Sun,
  Server,
  Database,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";

export default function Settings() {
  const { user, updateUser, theme, toggleTheme } = useAuth();

  // Profile Form
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showNotification("error", "Name cannot be empty.");
      return;
    }

    try {
      setProfileSaving(true);
      const res = await authService.updateProfile({
        name: profileName.trim(),
        avatar: profileAvatar.trim(),
      });
      if (res.success) {
        updateUser(res.data);
        showNotification("success", "Profile updated successfully.");
      }
    } catch (err) {
      console.error("Profile error:", err);
      showNotification("error", err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      showNotification("error", "New password must be at least 6 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showNotification("error", "New passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      await authService.updateProfile({
        password: passwords.newPassword,
      });
      showNotification("success", "Security password updated.");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password change error:", err);
      showNotification("error", err.response?.data?.message || "Password update failed.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
              : "border-rose-500/30 bg-rose-950/90 text-rose-200"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="text-xs font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="app-page-title">
          Account & Environment Settings
        </h1>
        <p className="app-page-description">
          Personal profile settings, authentication credentials, visual theme, and runtime infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Profile Card */}
        <div className="spatial-panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="specular-edge" />
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-white/10">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Personal Identity</h2>
              <p className="text-[11px] text-zinc-400">Update display name and avatar image reference</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-primary-spatial disabled:opacity-50"
              >
                <Save size={13} /> {profileSaving ? "Saving..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="spatial-panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="specular-edge" />
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-white/10">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Security & Credentials</h2>
              <p className="text-[11px] text-zinc-400">Modify your authentication password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn-secondary-spatial disabled:opacity-50"
              >
                <Lock size={13} /> {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences & System Telemetry */}
        <div className="spatial-panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="specular-edge" />
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-white/10">
              <SettingsIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Preferences & Platform Status</h2>
              <p className="text-[11px] text-zinc-400">Visual appearance and environment specs</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {/* Theme switcher */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Visual Mode</div>
                <div className="text-[11px] text-zinc-400">
                  Switch between Dark Obsidian Spatial UI and Light mode
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="btn-secondary-spatial"
              >
                {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-400" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>

            {/* Platform Telemetry Info */}
            <div className="border-t border-white/[0.06] pt-4 space-y-2 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Server size={13} className="text-zinc-500" /> API Gateway
                </span>
                <span className="font-mono text-zinc-300 text-[11px]">http://localhost:5000/api</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Database size={13} className="text-emerald-400" /> Database Cluster
                </span>
                <span className="font-mono text-white text-[11px]">MongoDB (127.0.0.1:27017)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Shield size={13} className="text-indigo-400" /> Current Authorization
                </span>
                <span className="font-mono text-indigo-300 text-[11px] font-semibold">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
