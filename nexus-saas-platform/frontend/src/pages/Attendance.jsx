import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Shield,
} from "lucide-react";
import attendanceService from "../services/attendanceService";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export default function Attendance() {
  const { user, isAdmin, isHR } = useAuth();
  const canViewAll = isAdmin || isHR;

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Today self-status
  const [todayStatus, setTodayStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Table Logs
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today status for current user
  const fetchTodayStatus = async () => {
    try {
      const res = await attendanceService.getTodayStatus();
      if (res.success) {
        setTodayStatus(res.data);
      }
    } catch (err) {
      console.error("Error fetching today status:", err);
    }
  };

  // Fetch attendance records table
  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const params = {
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15,
      };

      const res = await attendanceService.getAttendance(params);
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error loading attendance records:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [dateFilter, statusFilter, page]);

  // Handle Check In
  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceService.checkIn();
      if (res.success) {
        showNotification("success", "Shift started successfully.");
        fetchTodayStatus();
        fetchLogs();
      }
    } catch (err) {
      console.error("CheckIn error:", err);
      showNotification("error", err.response?.data?.message || "Check-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceService.checkOut();
      if (res.success) {
        showNotification(
          "success",
          `Shift concluded. Total duration: ${res.data?.workingHours || 0} hrs.`
        );
        fetchTodayStatus();
        fetchLogs();
      }
    } catch (err) {
      console.error("CheckOut error:", err);
      showNotification("error", err.response?.data?.message || "Check-out failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return "badge-spatial-active";
      case "Late":
        return "badge-spatial-amber";
      case "Half-day":
        return "badge-spatial-indigo";
      case "Absent":
        return "badge-spatial-rose";
      default:
        return "badge-spatial-inactive";
    }
  };

  const isCheckedIn = todayStatus?.checkedIn;
  const isCheckedOut = todayStatus?.checkedOut;

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
          <h1 className="app-page-title">
            Attendance & Shift Management
          </h1>
          <p className="app-page-description">
            Real-time daily punch terminal, shift duration calculation, and organizational logbook.
          </p>
        </div>

        <button
          onClick={() => {
            fetchTodayStatus();
            fetchLogs();
          }}
          className="btn-secondary-spatial w-fit"
        >
          <RefreshCw size={13} />
          <span>Refresh Register</span>
        </button>
      </div>

      {/* Punch / Check-in Terminal Card */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="spatial-card lg:col-span-1 relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="specular-edge" />
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-zinc-300">
                Shift Terminal
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>

            {/* Precision Digital Clock */}
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wider">
              {currentTime.toLocaleTimeString([], { hour12: true })}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 font-medium">
              {currentTime.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>

            {/* Current Today Status Summary */}
            <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/40 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Today's Status</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    todayStatus?.status
                      ? getStatusBadge(todayStatus.status)
                      : "badge-spatial-inactive"
                  }`}
                >
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span>{todayStatus?.status || "Not Logged"}</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Check In</span>
                <span className="font-mono text-white">
                  {todayStatus?.checkIn
                    ? new Date(todayStatus.checkIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Check Out</span>
                <span className="font-mono text-white">
                  {todayStatus?.checkOut
                    ? new Date(todayStatus.checkOut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-white/[0.06] pt-2 font-medium">
                <span className="text-zinc-400">Logged Hours</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {todayStatus?.workingHours ? `${todayStatus.workingHours} hrs` : "0.0 hrs"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCheckIn}
              disabled={isCheckedIn || actionLoading}
              className={`btn-primary-spatial ${
                isCheckedIn
                  ? "opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-400"
                  : ""
              }`}
            >
              <LogIn size={13} /> Check In
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn || isCheckedOut || actionLoading}
              className={`btn-secondary-spatial ${
                !isCheckedIn || isCheckedOut
                  ? "opacity-40 cursor-not-allowed"
                  : "border-rose-500/20 text-rose-300 hover:bg-rose-500/10 hover:text-white"
              }`}
            >
              <LogOut size={13} /> Check Out
            </button>
          </div>
        </div>

        {/* Shift Policy Cards */}
        <div className="spatial-card lg:col-span-2 relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="specular-edge" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight mb-1">
              Standard Shift Guidelines
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Daily working schedule is 9 hours with standard check-in window between 09:00 AM – 09:30 AM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <span className="inline-block rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                  Cutoff: 09:30 AM
                </span>
                <h4 className="mt-2 text-xs font-semibold text-white">Present Status</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Check-ins before 09:30 AM recorded as regular on-time shift.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <span className="inline-block rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                  After 09:30 AM
                </span>
                <h4 className="mt-2 text-xs font-semibold text-white">Late Arrival</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Arrivals after grace window logged as Late and tracked for payroll.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <span className="inline-block rounded-md bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400">
                  &lt; 5.0 Hours
                </span>
                <h4 className="mt-2 text-xs font-semibold text-white">Half-Day Status</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Shifts concluded under 5 hours automatically calculated as half-day.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/[0.06] pt-3 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Staff Account: <strong className="text-zinc-200">{user?.name}</strong></span>
            <span className="font-mono text-zinc-400">ROLE: {user?.role}</span>
          </div>
        </div>
      </div>

      {/* Attendance History Filter & Table */}
      <div className="spatial-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="specular-edge" />
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-bold text-white tracking-tight">
            {canViewAll ? "Organization Attendance Logbook" : "Personal Attendance History"}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date filter */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <Calendar size={13} className="text-zinc-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2 py-1 text-xs text-white outline-none focus:border-white/20"
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter("");
                    setPage(1);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/[0.08] bg-[#0c0d14] px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-white/20"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half-day">Half-day</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loadingLogs ? (
          <Loading fullScreen={false} message="Loading attendance logs..." />
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            No attendance entries found for the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-200">
              <thead className="border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Check Out</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log) => {
                  const empName = log.employee?.fullName || "Staff Member";
                  const empId = log.employee?.employeeId || "—";
                  const dept = log.employee?.department?.name || "General";

                  return (
                    <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{empName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{empId}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">{dept}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-400">{log.date}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">
                        {log.checkIn
                          ? new Date(log.checkIn).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">
                        {log.checkOut
                          ? new Date(log.checkOut).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                        {log.workingHours || 0} hrs
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusBadge(
                            log.status
                          )}`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
            <span>
              Page <strong className="text-white">{page}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary-spatial py-1 px-2.5 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn-secondary-spatial py-1 px-2.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
