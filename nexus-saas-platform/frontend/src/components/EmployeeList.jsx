import { Link } from "react-router-dom";
import { Eye, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE = {
  Active:      "badge-spatial-active",
  "On Leave":  "badge-spatial-amber",
  Terminated:  "badge-spatial-rose",
  Inactive:    "badge-spatial-inactive",
};

function getStatusBadge(status) {
  return STATUS_BADGE[status] ?? "badge-spatial-indigo";
}

// ─── Sortable column header ───────────────────────────────────────────────────

function SortableHeader({ label, field, currentSort, currentOrder, onSort }) {
  const isSorted = currentSort === field;
  const Icon = isSorted
    ? currentOrder === "asc" ? ArrowUp : ArrowDown
    : ArrowUpDown;

  return (
    <th
      onClick={() => onSort?.(field)}
      className="cursor-pointer select-none px-4 py-3 text-left"
    >
      <div className="inline-flex items-center gap-1.5 ems-section-title hover:text-zinc-300 transition-colors">
        {label}
        <Icon
          size={10}
          className={isSorted ? "text-indigo-400" : "text-zinc-700"}
          strokeWidth={2.5}
        />
      </div>
    </th>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmployeeList — enterprise data table with sticky header
 *
 * Props: employees, onEdit, onDelete, canManage, onSort, currentSort, currentOrder
 */
export default function EmployeeList({
  employees = [],
  onEdit,
  onDelete,
  canManage,
  onSort,
  currentSort = "createdAt",
  currentOrder = "desc",
}) {
  const sortProps = { currentSort, currentOrder, onSort };

  if (!employees.length) {
    return (
      <div className="spatial-panel rounded-2xl p-12 text-center">
        <p className="text-sm text-zinc-500 font-medium">No employee records found</p>
        <p className="mt-1 text-xs text-zinc-600">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="spatial-panel relative overflow-hidden rounded-2xl">
      <div className="specular-edge" />

      {/* Scrollable table with sticky header */}
      <div className="overflow-x-auto">
        <table className="ems-data-table min-w-[860px]">
          {/* ── Sticky thead ── */}
          <thead className="sticky top-0 z-10">
            <tr>
              <SortableHeader label="ID"          field="employeeId"       {...sortProps} />
              <SortableHeader label="Employee"    field="fullName"         {...sortProps} />
              <th className="px-4 py-3 text-left ems-section-title">Department</th>
              <SortableHeader label="Designation" field="designation"      {...sortProps} />
              <th className="px-4 py-3 text-left ems-section-title">Type</th>
              <SortableHeader label="Status"      field="employmentStatus" {...sortProps} />
              <SortableHeader label="Joined"      field="joiningDate"      {...sortProps} />
              <th className="px-4 py-3 text-right ems-section-title">Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => {
              const initial  = emp.fullName ? emp.fullName.charAt(0).toUpperCase() : "E";
              const deptName = emp.department?.name || "General";

              return (
                <tr key={emp._id} className="ems-row-hover">
                  {/* Employee ID */}
                  <td className="px-4 py-3">
                    <span
                      className="rounded border border-white/[0.07] bg-white/[0.03]
                        px-1.5 py-[3px] font-mono text-[10px] font-semibold
                        text-zinc-400 tracking-wider leading-none"
                    >
                      {emp.employeeId}
                    </span>
                  </td>

                  {/* Employee identity */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {emp.profileImage ? (
                        <img
                          src={emp.profileImage}
                          alt={emp.fullName}
                          className="h-7 w-7 shrink-0 rounded-lg object-cover border border-white/[0.1]"
                        />
                      ) : (
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                            bg-zinc-800 border border-white/[0.1]
                            font-bold text-[11px] text-zinc-300 leading-none"
                        >
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-100 truncate leading-tight">
                          {emp.fullName}
                        </div>
                        <div className="text-[10px] text-zinc-600 truncate leading-tight mt-0.5">
                          {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3 font-medium text-zinc-400">
                    {deptName}
                  </td>

                  {/* Designation */}
                  <td className="px-4 py-3 text-zinc-500">
                    {emp.designation || "—"}
                  </td>

                  {/* Employment type */}
                  <td className="px-4 py-3">
                    <span
                      className="rounded border border-white/[0.055] bg-white/[0.025]
                        px-1.5 py-[3px] font-mono text-[10px] text-zinc-500 leading-none"
                    >
                      {emp.employmentType || "Full-time"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full
                        px-2 py-[3px] text-[10px] font-semibold leading-none border
                        ${getStatusBadge(emp.employmentStatus)}`}
                    >
                      <span className="h-1 w-1 rounded-full bg-current" />
                      {emp.employmentStatus}
                    </span>
                  </td>

                  {/* Joining date */}
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 tabular-nums">
                    {emp.joiningDate
                      ? new Date(emp.joiningDate).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/employees/${emp._id}`}
                        className="rounded-lg border border-white/[0.065] bg-white/[0.025]
                          p-1.5 text-zinc-500
                          hover:bg-white/[0.08] hover:text-zinc-200
                          transition-colors duration-100"
                        title="View profile"
                      >
                        <Eye size={12} />
                      </Link>

                      {canManage && (
                        <>
                          <button
                            onClick={() => onEdit?.(emp)}
                            className="rounded-lg border border-white/[0.065] bg-white/[0.025]
                              p-1.5 text-zinc-500
                              hover:bg-white/[0.08] hover:text-zinc-200
                              transition-colors duration-100"
                            title="Edit employee"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onDelete?.(emp)}
                            className="rounded-lg border border-rose-500/[0.18] bg-rose-500/[0.07]
                              p-1.5 text-rose-500
                              hover:bg-rose-500/[0.14] hover:text-rose-300
                              transition-colors duration-100"
                            title="Delete employee"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
