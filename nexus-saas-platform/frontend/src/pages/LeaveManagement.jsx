import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import leaveService from "../services/leaveService";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

const INITIAL_APPLY = {
  leaveType: "Annual",
  startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  reason: "",
};

export default function LeaveManagement() {
  const { isAdmin, isHR } = useAuth();
  const canApprove = isAdmin || isHR;

  const [searchParams, setSearchParams] = useSearchParams();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState(INITIAL_APPLY);
  const [applyError, setApplyError] = useState("");
  const [applying, setApplying] = useState(false);

  // Review / Decision Modal (Approve / Reject)
  const [decisionCandidate, setDecisionCandidate] = useState(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Toast Notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      };

      const res = await leaveService.getLeaves(params);
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      showNotification("error", "Failed to retrieve leave records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter]);

  // Handle URL query trigger (?action=apply)
  useEffect(() => {
    if (searchParams.get("action") === "apply") {
      setShowApplyModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Calculate day difference between two dates
  const calculatedDays = () => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  // Handle Apply Leave submit
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError("");

    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()) {
      setApplyError("Please complete all required fields.");
      return;
    }

    if (new Date(applyForm.endDate) < new Date(applyForm.startDate)) {
      setApplyError("End date cannot occur before start date.");
      return;
    }

    try {
      setApplying(true);
      await leaveService.applyLeave(applyForm);
      showNotification("success", "Leave request submitted for review.");
      setShowApplyModal(false);
      setApplyForm(INITIAL_APPLY);
      fetchLeaves();
    } catch (err) {
      console.error("Apply error:", err);
      setApplyError(err.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setApplying(false);
    }
  };

  // Open Decision (Approve / Reject) modal
  const handleOpenDecision = (leave, status) => {
    setDecisionCandidate({ leave, status });
    setDecisionComment("");
  };

  // Submit Decision
  const handleConfirmDecision = async () => {
    if (!decisionCandidate) return;
    try {
      setDecisionLoading(true);
      const { leave, status } = decisionCandidate;
      await leaveService.updateLeaveStatus(leave._id, status, decisionComment.trim());
      showNotification(
        "success",
        `Leave request for ${leave.employee?.fullName || "Employee"} marked as ${status}.`
      );
      setDecisionCandidate(null);
      fetchLeaves();
    } catch (err) {
      console.error("Decision error:", err);
      showNotification("error", err.response?.data?.message || "Action failed.");
    } finally {
      setDecisionLoading(false);
    }
  };

  // Handle Cancel Leave
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this pending leave request?")) return;
    try {
      await leaveService.deleteLeave(leaveId);
      showNotification("success", "Leave request cancelled.");
      fetchLeaves();
    } catch (err) {
      console.error("Cancel error:", err);
      showNotification("error", err.response?.data?.message || "Failed to cancel leave.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "badge-spatial-active";
      case "Rejected":
        return "badge-spatial-rose";
      default:
        return "badge-spatial-amber";
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
              Time-Off & Leave Governance
            </h1>
            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
              {leaves.length} Filed Requests
            </span>
          </div>
          <p className="app-page-description">
            Submit leave requests, review employee time-off, and execute administrative approvals.
          </p>
        </div>

        <button
          onClick={() => {
            setApplyError("");
            setShowApplyModal(true);
          }}
          className="btn-primary-spatial w-fit"
        >
          <Plus size={14} />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="spatial-panel relative overflow-hidden rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center gap-2.5">
        <div className="specular-edge" />
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Filter size={13} /> Filter:
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-white/20"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-white/20"
        >
          <option value="">All Leave Types</option>
          <option value="Annual">Annual (Vacation)</option>
          <option value="Sick">Sick Leave</option>
          <option value="Casual">Casual Leave</option>
          <option value="Maternity">Maternity</option>
          <option value="Paternity">Paternity</option>
          <option value="Unpaid">Unpaid Leave</option>
        </select>

        {(statusFilter || typeFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
            }}
            className="text-[11px] text-zinc-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Leave Requests Table */}
      {loading ? (
        <Loading fullScreen={false} message="Loading leave registry..." />
      ) : leaves.length === 0 ? (
        <div className="spatial-panel rounded-2xl p-12 text-center text-zinc-400">
          <CalendarOff size={32} className="mx-auto text-zinc-500 mb-2" />
          <h3 className="text-sm font-semibold text-white">No leave requests found</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            There are no requests matching your active criteria.
          </p>
        </div>
      ) : (
        <div className="spatial-panel relative overflow-hidden rounded-2xl">
          <div className="specular-edge" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-200 min-w-[700px]">
              <thead className="border-b border-white/[0.06] bg-white/[0.015] uppercase tracking-wider text-[10px] text-zinc-400">
                <tr>
                  <th className="py-3 px-3.5">Employee</th>
                  <th className="py-3 px-3.5">Leave Type</th>
                  <th className="py-3 px-3.5">Date Range</th>
                  <th className="py-3 px-3.5">Days</th>
                  <th className="py-3 px-3.5">Reason</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {leaves.map((leave) => {
                  const empName = leave.employee?.fullName || "Staff Member";
                  const empId = leave.employee?.employeeId || "—";
                  const isPending = leave.status === "Pending";

                  return (
                    <tr key={leave._id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white">{empName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{empId}</div>
                      </td>
                      <td className="py-3 px-3.5 font-medium text-zinc-300">
                        {leave.leaveType}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-zinc-400 text-[11px]">
                        {new Date(leave.startDate).toLocaleDateString()} —{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3.5 font-bold font-mono text-zinc-200">
                        {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"}
                      </td>
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <p className="truncate text-zinc-300" title={leave.reason}>
                          {leave.reason}
                        </p>
                        {leave.actionComment && (
                          <p className="mt-0.5 truncate text-[10px] text-zinc-400 italic">
                            HR: {leave.actionComment}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusBadge(
                            leave.status
                          )}`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          <span>{leave.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        {canApprove && isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDecision(leave, "Approved")}
                              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenDecision(leave, "Rejected")}
                              className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isPending ? (
                          <button
                            onClick={() => handleCancelLeave(leave._id)}
                            className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply For Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="spatial-panel relative w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="specular-edge" />
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white tracking-tight">Apply For Time-Off</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {applyError && (
              <div className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {applyError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Leave Type *
                </label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d14] px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                >
                  <option value="Annual">Annual Leave (Vacation)</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Total duration requested:</span>
                <span className="font-bold text-white font-mono">
                  {calculatedDays()} Day(s)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Reason for Leave *
                </label>
                <textarea
                  rows={2}
                  required
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                  placeholder="Provide description of the reason for time-off..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn-secondary-spatial"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="btn-primary-spatial disabled:opacity-50"
                >
                  {applying ? "Submitting..." : "Submit Leave Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR / Admin Approve/Reject Decision Modal */}
      {decisionCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="spatial-panel w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="specular-edge" />
            <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">
              {decisionCandidate.status === "Approved" ? "Approve Time-Off Request" : "Reject Time-Off Request"}
            </h3>
            <p className="text-xs text-zinc-300 mb-3.5 leading-relaxed">
              You are about to mark this {decisionCandidate.leave?.leaveType} request for{" "}
              <strong className="text-white">
                {decisionCandidate.leave?.employee?.fullName || "Employee"}
              </strong>{" "}
              as <strong className={decisionCandidate.status === "Approved" ? "text-emerald-400" : "text-rose-400"}>
                {decisionCandidate.status}
              </strong>.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Official Remark / Comment (Optional)
              </label>
              <textarea
                rows={2}
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Guidance or justification for applicant..."
                className="w-full rounded-xl border border-white/[0.08] bg-black/40 p-2.5 text-xs text-white outline-none focus:border-white/20"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDecisionCandidate(null)}
                className="btn-secondary-spatial"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={decisionLoading}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow transition disabled:opacity-50 ${
                  decisionCandidate.status === "Approved"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {decisionLoading ? "Processing..." : `Confirm ${decisionCandidate.status}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
