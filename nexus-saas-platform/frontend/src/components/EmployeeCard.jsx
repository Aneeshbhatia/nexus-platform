import { Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE = {
  Active:      { cls: "badge-spatial-active",   dot: "bg-emerald-400" },
  "On Leave":  { cls: "badge-spatial-amber",    dot: "bg-amber-400" },
  Terminated:  { cls: "badge-spatial-rose",     dot: "bg-rose-400" },
  Inactive:    { cls: "badge-spatial-inactive", dot: "bg-zinc-500" },
};

function statusBadge(status) {
  return STATUS_BADGE[status] ?? { cls: "badge-spatial-indigo", dot: "bg-indigo-400" };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmployeeCard — compact spatial portrait card
 *
 * Props: employee, onEdit, onDelete, canManage
 */
export default function EmployeeCard({ employee, onEdit, onDelete, canManage }) {
  if (!employee) return null;

  const {
    _id,
    employeeId,
    fullName,
    email,
    phone,
    department,
    designation,
    joiningDate,
    employmentStatus,
    employmentType,
    profileImage,
  } = employee;

  const initial = fullName ? fullName.charAt(0).toUpperCase() : "E";
  const deptName = department?.name || "General";
  const badge = statusBadge(employmentStatus);

  return (
    <div className="spatial-card group relative flex flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
      {/* Specular edge */}
      <div className="specular-edge" />

      {/* ── Top: Employee ID + Status ── */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded border border-white/[0.08] bg-white/[0.04]
            px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-zinc-400
            tracking-wider leading-none"
        >
          {employeeId}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full
            px-2 py-[3px] text-[10px] font-semibold leading-none border
            ${badge.cls}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          {employmentStatus}
        </span>
      </div>

      {/* ── Identity ── */}
      <div className="mt-3.5 flex items-center gap-3">
        {profileImage ? (
          <img
            src={profileImage}
            alt={fullName}
            className="h-10 w-10 shrink-0 rounded-xl object-cover border border-white/[0.1]"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
              bg-zinc-800 border border-white/[0.1]
              font-bold text-sm text-zinc-200 leading-none"
          >
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-100 leading-tight">
            {fullName}
          </h3>
          <p className="truncate text-[11px] text-zinc-500 mt-0.5 font-normal leading-tight">
            {designation}
          </p>
        </div>
      </div>

      {/* ── Info rows ── */}
      <div className="mt-4 flex-1 space-y-1.5 border-t border-white/[0.055] pt-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Building2 size={12} className="shrink-0 text-zinc-600" />
          <span className="truncate text-zinc-400 font-medium">{deptName}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Mail size={12} className="shrink-0 text-zinc-600" />
          <a
            href={`mailto:${email}`}
            className="truncate text-zinc-500 hover:text-zinc-200 transition-colors duration-100"
          >
            {email}
          </a>
        </div>

        {phone && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Phone size={12} className="shrink-0 text-zinc-600" />
            <span className="truncate">{phone}</span>
          </div>
        )}

        {/* Joining date + employment type */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-600">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {joiningDate ? new Date(joiningDate).toLocaleDateString() : "—"}
          </span>
          <span
            className="rounded border border-white/[0.06] bg-white/[0.03]
              px-1.5 py-[1px] font-mono text-[9px] text-zinc-500 leading-none"
          >
            {employmentType || "Full-time"}
          </span>
        </div>
      </div>

      {/* ── Actions footer ── */}
      <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.055] pt-2.5">
        <Link
          to={`/employees/${_id}`}
          className="inline-flex items-center gap-1.5 rounded-lg
            border border-white/[0.065] bg-white/[0.03]
            px-2.5 py-1.5 text-[11px] font-medium text-zinc-400
            hover:bg-white/[0.07] hover:text-zinc-100
            transition-colors duration-100"
        >
          <Eye size={11} />
          View
        </Link>

        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(employee)}
              className="rounded-lg border border-white/[0.065] bg-white/[0.03]
                p-1.5 text-zinc-500
                hover:bg-white/[0.08] hover:text-zinc-200
                transition-colors duration-100"
              title="Edit record"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDelete?.(employee)}
              className="rounded-lg border border-rose-500/[0.18] bg-rose-500/[0.07]
                p-1.5 text-rose-500
                hover:bg-rose-500/[0.14] hover:text-rose-300
                transition-colors duration-100"
              title="Delete record"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
