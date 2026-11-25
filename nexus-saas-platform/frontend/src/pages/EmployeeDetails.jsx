import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  DollarSign,
  MapPin,
  ShieldCheck,
  Edit2,
  AlertCircle,
} from "lucide-react";
import employeeService from "../services/employeeService";
import attendanceService from "../services/attendanceService";
import leaveService from "../services/leaveService";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [employee, setEmployee] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const empRes = await employeeService.getEmployeeById(id);
        if (empRes.success) {
          setEmployee(empRes.data);
        }

        // Fetch attendance logs for this employee
        const attRes = await attendanceService.getEmployeeAttendance(id).catch(() => ({ data: [] }));
        if (attRes.data) {
          setAttendanceLogs(attRes.data);
        }

        // Fetch leave requests for this employee
        const leaveRes = await leaveService.getLeaves({ employeeId: id }).catch(() => ({ data: [] }));
        if (leaveRes.data) {
          setLeaveHistory(leaveRes.data);
        }
      } catch (err) {
        console.error("Error loading employee profile:", err);
        setError("Could not locate employee record or you do not have permission.");
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, [id]);

  if (loading) {
    return <Loading fullScreen={false} message="Loading employee dossier..." />;
  }

  if (error || !employee) {
    return (
      <div className="spatial-panel rounded-2xl p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-rose-400 mb-2" />
        <h2 className="text-base font-bold text-white">Employee Record Not Found</h2>
        <p className="mt-1 text-xs text-rose-300">{error || "The requested record does not exist."}</p>
        <button
          onClick={() => navigate("/employees")}
          className="mt-4 btn-secondary-spatial text-xs"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const initial = employee.fullName ? employee.fullName.charAt(0).toUpperCase() : "E";

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "badge-spatial-active";
      case "Inactive":
        return "badge-spatial-inactive";
      case "On Leave":
        return "badge-spatial-amber";
      case "Terminated":
        return "badge-spatial-rose";
      default:
        return "badge-spatial-indigo";
    }
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate("/employees")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>
      </div>

      {/* Hero Profile Header */}
      <div className="spatial-panel relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="specular-edge" />
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {employee.profileImage ? (
              <img
                src={employee.profileImage}
                alt={employee.fullName}
                className="h-16 w-16 rounded-2xl object-cover border border-white/15 shadow-xl"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-xl font-bold text-zinc-200 shadow-md border border-white/10">
                {initial}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-300">
                  {employee.employeeId}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadge(
                    employee.employmentStatus
                  )}`}
                >
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span>{employee.employmentStatus}</span>
                </span>
                <span className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
                  {employee.employmentType}
                </span>
              </div>

              <h1 className="app-page-title mt-2">
                {employee.fullName}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-3.5 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                  <Briefcase size={13} className="text-zinc-500" /> {employee.designation}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-zinc-500" /> {employee.department?.name || "General"}
                </span>
                {employee.address?.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-zinc-500" /> {employee.address.city}, {employee.address.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div>
              <Link
                to={`/employees?action=edit&id=${employee._id}`}
                className="btn-secondary-spatial text-xs"
              >
                <Edit2 size={13} /> Edit Record
              </Link>
            </div>
          )}
        </div>

        {/* Tab selection */}
        <div className="mt-6 flex gap-2 border-b border-white/[0.06] pt-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === "overview"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Overview & Dossier
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === "attendance"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Attendance Logs ({attendanceLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === "leaves"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Leave History ({leaveHistory.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Contact & Personal */}
          <div className="spatial-card relative overflow-hidden rounded-2xl p-5 space-y-3.5">
            <div className="specular-edge" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Personal Information
            </h2>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-zinc-500 text-[11px]">Email Address</span>
                <div className="mt-0.5 flex items-center gap-2 font-medium text-white">
                  <Mail size={13} className="text-zinc-400" />
                  <a href={`mailto:${employee.email}`} className="hover:underline">
                    {employee.email}
                  </a>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">Phone</span>
                <div className="mt-0.5 flex items-center gap-2 font-medium text-white">
                  <Phone size={13} className="text-zinc-400" />
                  {employee.phone || "Not recorded"}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">Gender</span>
                <div className="mt-0.5 font-medium text-white">{employee.gender || "Unspecified"}</div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">Date of Birth</span>
                <div className="mt-0.5 font-medium text-white">
                  {employee.dob ? new Date(employee.dob).toLocaleDateString() : "Not recorded"}
                </div>
              </div>
            </div>
          </div>

          {/* Employment & Compensation */}
          <div className="spatial-card relative overflow-hidden rounded-2xl p-5 space-y-3.5">
            <div className="specular-edge" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Role & Compensation
            </h2>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-zinc-500 text-[11px]">Department</span>
                <div className="mt-0.5 flex items-center gap-2 font-medium text-white">
                  <Building2 size={13} className="text-zinc-400" />
                  {employee.department?.name || "General"}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">Designation</span>
                <div className="mt-0.5 font-medium text-white">{employee.designation}</div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">Annual Compensation</span>
                <div className="mt-0.5 flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                  <DollarSign size={13} />
                  {Number(employee.salary || 0).toLocaleString()} / year
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">Joining Date</span>
                <div className="mt-0.5 flex items-center gap-2 font-medium text-white">
                  <Calendar size={13} className="text-zinc-400" />
                  {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Account */}
          <div className="spatial-card relative overflow-hidden rounded-2xl p-5 space-y-3.5">
            <div className="specular-edge" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Location & System Account
            </h2>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-zinc-500 text-[11px]">Address</span>
                <div className="mt-0.5 font-medium text-white leading-relaxed">
                  {employee.address?.street && `${employee.address.street}, `}
                  {employee.address?.city && `${employee.address.city}, `}
                  {employee.address?.state && `${employee.address.state} `}
                  {employee.address?.country || "United States"}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">User System Account</span>
                <div className="mt-0.5 flex items-center gap-2 font-medium text-white">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  {employee.user ? "Active Login Linked" : "No Direct Account"}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px]">System Record Created</span>
                <div className="mt-0.5 font-medium text-zinc-400 font-mono text-[11px]">
                  {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Logs */}
      {activeTab === "attendance" && (
        <div className="spatial-panel relative overflow-hidden rounded-2xl p-5">
          <div className="specular-edge" />
          <h2 className="text-sm font-bold text-white mb-3 tracking-tight">Shift Attendance Ledger</h2>
          {attendanceLogs.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">No attendance recorded for this employee yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-200">
                <thead className="border-b border-white/[0.06] text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Check In</th>
                    <th className="py-2.5 px-3">Check Out</th>
                    <th className="py-2.5 px-3">Working Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {attendanceLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="py-2.5 px-3 font-mono text-zinc-400">{log.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">
                        {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">
                        {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">{log.workingHours || 0} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Leave Requests */}
      {activeTab === "leaves" && (
        <div className="spatial-panel relative overflow-hidden rounded-2xl p-5">
          <div className="specular-edge" />
          <h2 className="text-sm font-bold text-white mb-3 tracking-tight">Time-Off Request History</h2>
          {leaveHistory.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">No leave requests filed by this employee.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-200">
                <thead className="border-b border-white/[0.06] text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Days</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leaveHistory.map((leave) => (
                    <tr key={leave._id}>
                      <td className="py-2.5 px-3 font-semibold text-white">{leave.leaveType}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-300">{leave.daysCount} days</td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate text-zinc-400">{leave.reason}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            leave.status === "Approved"
                              ? "badge-spatial-active"
                              : leave.status === "Rejected"
                              ? "badge-spatial-rose"
                              : "badge-spatial-amber"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
