import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Download,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import employeeService from "../services/employeeService";
import departmentService from "../services/departmentService";
import { useAuth } from "../context/AuthContext";
import EmployeeCard from "../components/EmployeeCard";
import EmployeeList from "../components/EmployeeList";
import Loading from "../components/Loading";

const INITIAL_FORM = {
  employeeId: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "Male",
  dob: "",
  department: "",
  designation: "",
  salary: "",
  joiningDate: new Date().toISOString().split("T")[0],
  employmentType: "Full-time",
  employmentStatus: "Active",
  profileImage: "",
  address: {
    street: "",
    city: "",
    state: "",
    country: "USA",
    zipCode: "",
  },
};

export default function Employees() {
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  // Delete Confirmation Modal
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch departments for dropdown
  const loadDepartments = async () => {
    try {
      const res = await departmentService.getDepartments();
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  // Fetch employees with filters & pagination
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: search.trim() || undefined,
        department: selectedDept || undefined,
        status: selectedStatus || undefined,
        type: selectedType || undefined,
        sort: sortBy,
        order: sortOrder,
      };

      const res = await employeeService.getEmployees(params);
      if (res.success) {
        setEmployees(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || res.data.length);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      showNotification("error", "Failed to retrieve employee directory.");
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = useCallback(() => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      ...INITIAL_FORM,
      employeeId: `EMP-${randomSuffix}`,
      department: departments[0]?._id || "",
    });
    setIsEditing(false);
    setModalError("");
    setShowModal(true);
  }, [departments]);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, selectedDept, selectedStatus, selectedType, sortBy, sortOrder]);

  // Open create modal if URL has ?action=create
  useEffect(() => {
    if (searchParams.get("action") === "create" && canManage) {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, canManage, handleOpenCreate]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  // Sorting helper for Table view
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await employeeService.exportEmployeesCSV();
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || "Employee export returned invalid data.");
      }

      const headers = [
        "Employee ID",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "Department",
        "Designation",
        "Salary",
        "Joining Date",
        "Employment Type",
        "Employment Status",
      ];
      const rows = res.data.map((employee) => [
        employee.employeeId,
        employee.fullName,
        employee.email,
        employee.phone,
        employee.gender,
        employee.department?.name || "",
        employee.designation,
        employee.salary,
        employee.joiningDate,
        employee.employmentType,
        employee.employmentStatus,
      ]);
      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification("success", "Employee directory CSV exported.");
    } catch (err) {
      console.error("Export error:", err);
      showNotification("error", "Could not export employee CSV.");
    } finally {
      setExporting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (employee) => {
    setFormData({
      _id: employee._id,
      employeeId: employee.employeeId || "",
      fullName: employee.fullName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      gender: employee.gender || "Male",
      dob: employee.dob ? employee.dob.split("T")[0] : "",
      department: employee.department?._id || employee.department || "",
      designation: employee.designation || "",
      salary: employee.salary || "",
      joiningDate: employee.joiningDate ? employee.joiningDate.split("T")[0] : "",
      employmentType: employee.employmentType || "Full-time",
      employmentStatus: employee.employmentStatus || "Active",
      profileImage: employee.profileImage || "",
      address: {
        street: employee.address?.street || "",
        city: employee.address?.city || "",
        state: employee.address?.state || "",
        country: employee.address?.country || "USA",
        zipCode: employee.address?.zipCode || "",
      },
    });
    setIsEditing(true);
    setModalError("");
    setShowModal(true);
  };

  // Save (Create / Update)
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.designation.trim() || !formData.department) {
      setModalError("Please provide all required fields (Name, Email, Department, Designation).");
      return;
    }

    try {
      setModalSaving(true);
      if (isEditing) {
        await employeeService.updateEmployee(formData._id, formData);
        showNotification("success", `Employee "${formData.fullName}" updated.`);
      } else {
        await employeeService.createEmployee(formData);
        showNotification("success", `Employee "${formData.fullName}" created.`);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      console.error("Save error:", err);
      setModalError(err.response?.data?.message || "Failed to save employee record.");
    } finally {
      setModalSaving(false);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      await employeeService.deleteEmployee(deleteCandidate._id);
      showNotification("success", `Employee "${deleteCandidate.fullName}" removed.`);
      setDeleteCandidate(null);
      fetchEmployees();
    } catch (err) {
      console.error("Delete error:", err);
      showNotification("error", err.response?.data?.message || "Failed to delete employee.");
    } finally {
      setDeleting(false);
    }
  };

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
              Employee Directory
            </h1>
            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
              {totalCount} Total Records
            </span>
          </div>
          <p className="app-page-description">
            Workforce roster, departmental assignments, and personnel profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="btn-secondary-spatial"
          >
            <Download size={13} className={exporting ? "animate-bounce" : ""} />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>

          {/* View toggle */}
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "table"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="btn-primary-spatial"
            >
              <Plus size={14} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Enterprise Filter Toolbar */}
      <div className="spatial-panel relative overflow-hidden rounded-2xl p-3 sm:p-3.5">
        <div className="specular-edge" />
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2.5 md:flex-row">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, ID, designation, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-1.5 pl-9 pr-8 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition focus:border-white/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition focus:border-white/20"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition focus:border-white/20"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>

          <button
            type="submit"
            className="btn-secondary-spatial py-1.5 text-xs"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loading fullScreen={false} message="Loading employee roster..." />
      ) : employees.length === 0 ? (
        <div className="spatial-panel rounded-2xl p-12 text-center text-zinc-400">
          <Users size={32} className="mx-auto text-zinc-500 mb-2.5" />
          <h3 className="text-sm font-semibold text-white">No employees found</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Try adjusting your search criteria or clear the active filters.
          </p>
          {(search || selectedDept || selectedStatus || selectedType) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedDept("");
                setSelectedStatus("");
                setSelectedType("");
                setPage(1);
              }}
              className="mt-3.5 btn-secondary-spatial text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp._id}
              employee={emp}
              onEdit={handleOpenEdit}
              onDelete={(e) => setDeleteCandidate(e)}
              canManage={canManage}
            />
          ))}
        </div>
      ) : (
        <EmployeeList
          employees={employees}
          onEdit={handleOpenEdit}
          onDelete={(e) => setDeleteCandidate(e)}
          canManage={canManage}
          onSort={handleSortChange}
          currentSort={sortBy}
          currentOrder={sortOrder}
        />
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
          <div>
            Showing Page <span className="font-semibold text-white">{page}</span> of{" "}
            <span className="font-semibold text-white">{totalPages}</span> ({totalCount} total)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-secondary-spatial py-1 px-2.5 text-xs disabled:opacity-40"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn-secondary-spatial py-1 px-2.5 text-xs disabled:opacity-40"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="spatial-panel relative w-full max-w-2xl rounded-2xl p-6 sm:p-7 my-6 shadow-2xl">
            <div className="specular-edge" />
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEditing ? "Edit Employee Record" : "Onboard New Employee"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="e.g. EMP-101"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="e.g. Jane Cooper"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="jane@company.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="+1 555-0199"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="e.g. Lead Engineer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Annual Salary ($) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                    placeholder="e.g. 95000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
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
                  {modalSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Record"}
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
              <h3 className="text-base font-bold text-white">Delete Employee Record</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{deleteCandidate.fullName}</strong> (
              <span className="font-mono text-zinc-400">{deleteCandidate.employeeId}</span>)?
              This action will remove the employee from all attendance registers.
            </p>

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
