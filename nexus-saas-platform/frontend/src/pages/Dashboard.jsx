import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  CalendarCheck,
  CalendarOff,
  Clock,
  UserPlus,
  CalendarPlus,
  FolderPlus,
  ArrowRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import dashboardService from "../services/dashboardService";
import attendanceService from "../services/attendanceService";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";

export default function Dashboard() {
  const { isAdmin, isHR } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsRes, analyticsRes, todayRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getAnalytics(),
        attendanceService.getTodayStatus().catch(() => null),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }
      if (todayRes?.success) {
        setTodayAttendance(todayRes.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to synchronize dashboard statistics. Verify backend service is active.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading fullScreen={false} message="Loading enterprise analytics..." />;
  }

  const deptData = analytics?.departmentDistribution || [];
  const attendanceTrends = analytics?.attendanceTrends || [];
  const joiningTrends = analytics?.joiningTrends || [];
  const maxDeptCount = Math.max(...deptData.map((d) => d.count || 0), 1);
  const maxAttendanceCount = Math.max(
    ...attendanceTrends.map((d) => d.present || 0),
    1
  );

  const activePercent = stats?.totalEmployees
    ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="spatial-panel relative overflow-hidden rounded-xl p-5 sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-200">
                Workforce overview
              </span>
              <span className="text-zinc-400 text-sm">
                {stats?.totalEmployees || 0} Total Staff Assigned
              </span>
            </div>
            <h1 className="app-page-title mt-3">
              People operations
            </h1>
            <p className="app-page-description max-w-2xl">
              {isAdmin
                ? "A clear overview of your people, departments, attendance, and leave activity."
                : isHR
                ? "Review workforce records, monitor attendance, and keep leave requests moving."
                : "View your attendance, leave activity, and key workforce information."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="btn-secondary-spatial"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-zinc-300" : ""} />
              <span>{refreshing ? "Syncing..." : "Sync Ledger"}</span>
            </button>

            {(isAdmin || isHR) && (
              <button
                onClick={() => navigate("/employees?action=create")}
                className="btn-primary-spatial"
              >
                <UserPlus size={14} />
                <span>Onboard Employee</span>
              </button>
            )}

            {todayAttendance?.checkedIn && !todayAttendance?.checkedOut && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Shift ({todayAttendance.workingHours || 0} hrs)
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchDashboardData(true)}
            className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Primary KPI Grid (Linear / Datadog style) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workforce"
          value={stats?.totalEmployees ?? 0}
          subtitle="All registered staff records"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Headcount"
          value={stats?.activeEmployees ?? 0}
          subtitle={`${activePercent}% of total personnel active`}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Present Today"
          value={stats?.presentToday ?? 0}
          subtitle="Checked in for active shift"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Scheduled On Leave"
          value={stats?.onLeaveToday ?? 0}
          subtitle="Staff on approved time-off"
          icon={CalendarOff}
          color="amber"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingLeaves ?? 0}
          subtitle="Awaiting HR / Admin signoff"
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Departments"
          value={stats?.totalDepartments ?? 0}
          subtitle="Functional business divisions"
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Inactive / Notice"
          value={stats?.inactiveEmployees ?? 0}
          subtitle="Inactive or departed personnel"
          icon={UserX}
          color="amber"
        />
        <div className="spatial-card relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="specular-edge" />
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Quick Action Queue</span>
              <Activity size={14} className="text-zinc-500" />
            </div>
            <p className="mt-2 text-xs text-zinc-300 font-medium">
              Direct access to common employee operations
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              to="/employees"
              className="flex-1 rounded-xl bg-white/[0.06] border border-white/[0.08] py-1.5 text-center text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition"
            >
              Directory
            </Link>
            <Link
              to="/leaves"
              className="flex-1 rounded-xl bg-white/[0.06] border border-white/[0.08] py-1.5 text-center text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition"
            >
              Leaves
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Department Headcount Breakdown */}
        <div className="spatial-card relative overflow-hidden rounded-2xl p-5">
          <div className="specular-edge" />
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Department Distribution
              </h2>
              <p className="text-[11px] text-zinc-400">Headcount across organizational units</p>
            </div>
            <Link
              to="/departments"
              className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Manage Units <ArrowRight size={12} />
            </Link>
          </div>

          {deptData.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No department data available.
            </div>
          ) : (
            <div className="space-y-3.5">
              {deptData.map((dept, index) => {
                const count = dept.count || 0;
                const percentage = stats?.totalEmployees
                  ? Math.round((count / stats.totalEmployees) * 100)
                  : 0;

                return (
                  <div key={dept.name || index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200">{dept.name}</span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {count} staff ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max((count / maxDeptCount) * 100, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7-Day Attendance Trend */}
        <div className="spatial-card relative overflow-hidden rounded-2xl p-5">
          <div className="specular-edge" />
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                7-Day Attendance Activity
              </h2>
              <p className="text-[11px] text-zinc-400">Daily present count across the organization</p>
            </div>
            <Link
              to="/attendance"
              className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Audit Log <ArrowRight size={12} />
            </Link>
          </div>

          {attendanceTrends.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No recent attendance trends logged.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3 h-40 pt-4 pb-2 border-b border-white/[0.06]">
                {attendanceTrends.map((trend, i) => {
                  const presentCount = trend.present || 0;
                  const heightPercent = Math.max(
                    Math.round((presentCount / maxAttendanceCount) * 100),
                    10
                  );
                  return (
                    <div
                      key={trend.date || i}
                      className="group relative flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-8 hidden rounded-md bg-zinc-900 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-200 shadow-xl group-hover:block z-20 whitespace-nowrap">
                        {trend.date}: {presentCount} Present
                      </div>
                      <div
                        className="w-full max-w-[32px] rounded-t-md bg-emerald-500/70 transition-all duration-300 group-hover:bg-emerald-400"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {trend.date?.slice(5) || `D${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                  <span>Present Personnel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-white/[0.08]" />
                  <span>Shift Baseline</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operations Hub & Monthly Velocity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Operational Shortcuts */}
        <div className="spatial-card lg:col-span-1 relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
          <div className="specular-edge" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight mb-1">
              Workforce Actions
            </h2>
            <p className="text-[11px] text-zinc-400 mb-3.5">
              Key operational workflows
            </p>

            <div className="space-y-2">
              <button
                onClick={() => navigate("/attendance")}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.05] hover:border-white/[0.12] group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CalendarCheck size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Punch Shift In / Out</div>
                    <div className="text-[10px] text-zinc-400">Record daily work session</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => navigate("/leaves?action=apply")}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.05] hover:border-white/[0.12] group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <CalendarPlus size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Request Time-Off</div>
                    <div className="text-[10px] text-zinc-400">Apply for scheduled leaves</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>

              {(isAdmin || isHR) && (
                <button
                  onClick={() => navigate("/departments?action=create")}
                  className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.05] hover:border-white/[0.12] group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <FolderPlus size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Add Department Unit</div>
                      <div className="text-[10px] text-zinc-400">Set budget and leadership</div>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Onboarding Velocity */}
        <div className="spatial-card lg:col-span-2 relative overflow-hidden rounded-2xl p-5">
          <div className="specular-edge" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Workforce Growth & Pipeline
              </h2>
              <p className="text-[11px] text-zinc-400">Recent hires and pending administrative approvals</p>
            </div>
            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              Live Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Joining Velocity */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Monthly Joinings
              </span>
              {joiningTrends.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No joining records</p>
              ) : (
                <div className="space-y-2">
                  {joiningTrends.map((trend) => (
                    <div key={trend.month} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{trend.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full bg-indigo-400 rounded-full"
                            style={{
                              width: `${Math.min((trend.count / (stats?.totalEmployees || 1)) * 100 * 2, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-zinc-200">
                          +{trend.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave Pipeline Breakdown */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Leave Queue Status
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending Review
                  </span>
                  <span className="font-mono font-bold text-amber-400">{stats?.pendingLeaves ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> On Leave Today
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{stats?.onLeaveToday ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Total Active Workforce
                  </span>
                  <span className="font-mono font-bold text-zinc-200">{stats?.activeEmployees ?? 0}</span>
                </div>
                <div className="pt-1.5 border-t border-white/[0.06]">
                  <Link
                    to="/leaves"
                    className="block text-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-white/[0.06] hover:text-white transition"
                  >
                    Manage Leave Queue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
