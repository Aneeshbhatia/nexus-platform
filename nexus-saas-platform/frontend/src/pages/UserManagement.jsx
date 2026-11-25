import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  Shield,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
} from "lucide-react";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Role Edit Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("Employee");
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState("");

  // Toast Feedback
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getAllUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      showNotification("error", "Failed to retrieve user accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setModalError("");
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser._id === currentUser?.id && newRole !== "Admin") {
      setModalError("You cannot revoke Admin access from your own active account.");
      return;
    }

    try {
      setUpdating(true);
      await authService.updateUserRole(selectedUser._id, newRole);
      showNotification(
        "success",
        `Role updated for ${selectedUser.name} to "${newRole}".`
      );
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Update role error:", err);
      setModalError(err.response?.data?.message || "Failed to update user role.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "Admin":
        return "badge-spatial-indigo";
      case "HR Manager":
        return "badge-spatial-amber";
      default:
        return "badge-spatial-active";
    }
  };

  const adminCount = users.filter((u) => u.role === "Admin").length;
  const hrCount = users.filter((u) => u.role === "HR Manager").length;
  const empCount = users.filter((u) => u.role === "Employee").length;

  return (
    <div className="space-y-5">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="app-page-title">
              User Access & Roles
            </h1>
            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
              Admin Governance
            </span>
          </div>
          <p className="app-page-description">
            Manage authenticated accounts, permission roles, and account security.
          </p>
        </div>
      </div>

      {/* Role Counts Summary */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="spatial-card rounded-2xl p-4">
          <div className="specular-edge" />
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Administrators</span>
            <Shield size={14} className="text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{adminCount}</div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Full system authority</p>
        </div>

        <div className="spatial-card rounded-2xl p-4">
          <div className="specular-edge" />
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>HR Managers</span>
            <UserCheck size={14} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{hrCount}</div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Personnel & leave approvals</p>
        </div>

        <div className="spatial-card rounded-2xl p-4">
          <div className="specular-edge" />
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Staff Users</span>
            <User size={14} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{empCount}</div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Employee self-service</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="spatial-panel relative overflow-hidden rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="specular-edge" />
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-1.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-white/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-white/20"
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="HR Manager">HR Manager</option>
          <option value="Employee">Employee</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <Loading fullScreen={false} message="Loading system users..." />
      ) : filteredUsers.length === 0 ? (
        <div className="spatial-panel rounded-2xl py-10 text-center text-xs text-zinc-500">
          No users match your query.
        </div>
      ) : (
        <div className="spatial-panel relative overflow-hidden rounded-2xl">
          <div className="specular-edge" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-200 min-w-[650px]">
              <thead className="border-b border-white/[0.06] bg-white/[0.015] uppercase tracking-wider text-[10px] text-zinc-400">
                <tr>
                  <th className="py-3 px-3.5">User</th>
                  <th className="py-3 px-3.5">Assigned Role</th>
                  <th className="py-3 px-3.5">Account Status</th>
                  <th className="py-3 px-3.5">Created Date</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((u) => {
                  const isCurrent = u._id === currentUser?.id;
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";

                  return (
                    <tr key={u._id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-200 border border-white/10">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="rounded bg-white/[0.08] px-1 py-0.2 text-[9px] font-mono text-zinc-300">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border badge-spatial-active">
                          <span className="h-1 w-1 rounded-full bg-current" />
                          <span>{u.status || "active"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-zinc-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          className="btn-secondary-spatial py-1 px-2 text-[11px]"
                        >
                          <Edit2 size={11} /> Edit Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="spatial-panel w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="specular-edge" />
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <h3 className="text-base font-bold text-white tracking-tight">Assign Authorization Role</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveRole} className="mt-3.5 space-y-3.5">
              <div>
                <span className="text-[11px] text-zinc-400">Target User</span>
                <div className="mt-0.5 font-semibold text-white text-xs">
                  {selectedUser.name}{" "}
                  <span className="text-zinc-400 font-normal">({selectedUser.email})</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Access Level Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                >
                  <option value="Admin">Admin (Full System Privilege)</option>
                  <option value="HR Manager">HR Manager (Personnel & Approvals)</option>
                  <option value="Employee">Employee (Self-Service Profile)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="btn-secondary-spatial"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary-spatial disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Apply Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
