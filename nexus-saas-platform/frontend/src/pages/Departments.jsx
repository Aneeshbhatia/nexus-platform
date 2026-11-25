import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Plus,
  Users,
  DollarSign,
  MapPin,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  UserCheck,
} from "lucide-react";
import departmentService from "../services/departmentService";
import employeeService from "../services/employeeService";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

const INITIAL_DEPT = {
  name: "",
  code: "",
  description: "",
  head: "",
  location: "Main HQ",
  budget: "",
  status: "active",
};

export default function Departments() {
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [searchParams, setSearchParams] = useSearchParams();

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_DEPT);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete candidate
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptResult, employeeResult] = await Promise.allSettled([
        departmentService.getDepartments(),
        employeeService.getEmployees({ limit: 100 }),
      ]);

      if (deptResult.status === "rejected") {
        throw deptResult.reason;
      }
      if (!deptResult.value.success) {
        throw new Error(deptResult.value.message || "Unable to load departments.");
      }

      setDepartments(deptResult.value.data);

      if (employeeResult.status === "fulfilled" && employeeResult.value.success) {
        setEmployees(employeeResult.value.data);
      } else {
        const error =
          employeeResult.status === "rejected"
            ? employeeResult.reason
            : new Error(employeeResult.value.message || "Unable to load employees.");
        console.error("Failed to load department leads:", error);
        setEmployees([]);
        showNotification("error", "Unable to load employees for department leads.");
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
      showNotification("error", "Unable to load departments list.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenCreate = useCallback(() => {
    const randomCode = `D-${Math.floor(10 + Math.random() * 90)}`;
    setFormData({
      ...INITIAL_DEPT,
      code: randomCode,
    });
    setIsEditing(false);
    setModalError("");
    setShowModal(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL query trigger (?action=create)
  useEffect(() => {
    if (searchParams.get("action") === "create" && canManage) {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, canManage, handleOpenCreate, setSearchParams]);

  const handleOpenEdit = (dept) => {
    setFormData({
      _id: dept._id,
      name: dept.name || "",
      code: dept.code || "",
      description: dept.description || "",
      head: dept.head?._id || dept.head || "",
      location: dept.location || "Main HQ",
      budget: dept.budget || "",
      status: dept.status || "active",
    });
    setIsEditing(true);
    setModalError("");
    setShowModal(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim() || !formData.code.trim()) {
      setModalError("Department Name and Code are required.");
      return;
    }

    try {
      setModalSaving(true);
      const payload = {
        ...formData,
        head: formData.head || null,
        budget: formData.budget ? Number(formData.budget) : 0,
      };

      if (isEditing) {
        await departmentService.updateDepartment(formData._id, payload);
        showNotification("success", `Department "${formData.name}" updated.`);
      } else {
        await departmentService.createDepartment(payload);
        showNotification("success", `Department "${formData.name}" created.`);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Save dept error:", err);
      setModalError(err.response?.data?.message || "Failed to save department.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    if (deleteCandidate.employeeCount > 0) {
      showNotification(
        "error",
        `Cannot delete department "${deleteCandidate.name}". It currently has ${deleteCandidate.employeeCount} active employee(s). Please reassign them first.`
      );
      setDeleteCandidate(null);
      return;
    }

    try {
      setDeleting(true);
      await departmentService.deleteDepartment(deleteCandidate._id);
      showNotification("success", `Department "${deleteCandidate.name}" removed.`);
      setDeleteCandidate(null);
      loadData();
    } catch (err) {
      console.error("Delete dept error:", err);
      showNotification("error", err.response?.data?.message || "Failed to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const q = search.toLowerCase();
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.code.toLowerCase().includes(q) ||
      (dept.description && dept.description.toLowerCase().includes(q))
    );
  });

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
              Departments & Divisions
            </h1>
            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
              {departments.length} Operational Units
            </span>
          </div>
          <p className="app-page-description">
            Manage functional business divisions, departmental heads, allocated budgets, and headcounts.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="btn-primary-spatial w-fit"
          >
            <Plus size={14} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="spatial-panel relative overflow-hidden rounded-2xl p-3 sm:p-3.5">
        <div className="specular-edge" />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by department name, code, or function..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-1.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-white/20"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <Loading fullScreen={false} message="Loading department organization..." />
      ) : filteredDepartments.length === 0 ? (
        <div className="spatial-panel rounded-2xl p-12 text-center text-zinc-400">
          <Building2 size={32} className="mx-auto text-zinc-500 mb-2" />
          <h3 className="text-sm font-semibold text-white">No departments found</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Refine your search or create a new department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => {
            const headName = dept.head?.fullName || "Unassigned";
            return (
              <div
                key={dept._id}
                className="spatial-card group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5"
              >
                <div className="specular-edge" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
                      {dept.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        dept.status === "active"
                          ? "badge-spatial-active"
                          : "badge-spatial-inactive"
                      }`}
                    >
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span>{dept.status === "active" ? "Active" : "Inactive"}</span>
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {dept.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {dept.description || "No official department description recorded."}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Users size={13} className="text-zinc-500" /> Headcount
                      </span>
                      <span className="font-semibold text-white font-mono text-[11px]">
                        {dept.employeeCount || 0} personnel
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <UserCheck size={13} className="text-zinc-500" /> Lead
                      </span>
                      <span className="font-medium text-zinc-200 truncate max-w-[140px]">
                        {headName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <DollarSign size={13} className="text-emerald-400" /> Budget
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                        ${Number(dept.budget || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <MapPin size={13} className="text-zinc-500" /> Location
                      </span>
                      <span className="text-zinc-300">{dept.location || "HQ"}</span>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-white/[0.06] pt-2.5">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      <Edit2 size={12} className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(dept)}
                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 size={12} className="inline mr-1" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="spatial-panel relative w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="specular-edge" />
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEditing ? "Edit Department Division" : "Create New Department"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveDepartment} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20 font-mono"
                    placeholder="e.g. ENG"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Department Lead
                </label>
                <select
                  value={formData.head}
                  onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                >
                  <option value="">Select Employee as Head</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  placeholder="Outline purpose and mission of unit..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Annual Budget ($)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="e.g. 500000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Office Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="Building A, Floor 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary-spatial"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="btn-primary-spatial disabled:opacity-50"
                >
                  {modalSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="spatial-panel w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-rose-500/20">
            <div className="specular-edge" />
            <div className="flex items-center gap-2.5 text-rose-400 mb-2.5">
              <Trash2 size={20} />
              <h3 className="text-base font-bold text-white tracking-tight">Delete Department</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-white">{deleteCandidate.name}</strong> (
              <span className="font-mono text-zinc-400">{deleteCandidate.code}</span>)?
            </p>
            {deleteCandidate.employeeCount > 0 ? (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                <strong>Safety Rule:</strong> This department has{" "}
                <strong>{deleteCandidate.employeeCount} assigned personnel</strong>. MERN safety
                checks require reassigning them before deletion.
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-400">
                This unit has 0 assigned staff and can safely be deleted.
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="btn-secondary-spatial"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-500 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
