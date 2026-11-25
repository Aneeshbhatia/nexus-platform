import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  UserCheck,
  Settings,
  LogOut,
  X,
  Command,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Navigation groups ───────────────────────────────────────────────────────

const CORE_OPS = [
  { label: "Dashboard",   path: "/dashboard",   icon: LayoutDashboard },
  { label: "Employees",   path: "/employees",   icon: Users },
  { label: "Departments", path: "/departments", icon: Building2 },
];

const WORKFORCE = [
  { label: "Attendance & Shifts", path: "/attendance", icon: CalendarCheck },
  { label: "Leave Requests",      path: "/leaves",     icon: CalendarOff },
];

// ─── Role badge config ────────────────────────────────────────────────────────

const ROLE_BADGE = {
  Admin:        "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
  "HR Manager": "bg-amber-500/10  border-amber-500/20  text-amber-300",
};
const roleBadgeClass = (role) =>
  ROLE_BADGE[role] ?? "bg-zinc-800/60 border-zinc-700/50 text-zinc-400";

// ─── Single nav item ──────────────────────────────────────────────────────────

function NavItem({ path, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `app-nav-item group ${
          isActive
            ? "app-nav-item-active"
            : ""
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <Icon
              size={17}
              strokeWidth={1.8}
              className={`shrink-0 transition-colors duration-150 ${
                isActive ? "text-blue-300" : "text-zinc-500 group-hover:text-zinc-300"
              }`}
            />
            <span>{label}</span>
          </div>
          {isActive && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 select-none">
      {children}
    </div>
  );
}

// ─── Main Sidebar component ────────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const governanceNav = [
    ...(isAdmin
      ? [{ label: "User Access Control", path: "/users", icon: UserCheck }]
      : []),
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <button
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`app-sidebar transition-transform duration-200 md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="app-sidebar-brand flex shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl
                border border-blue-300/20 bg-blue-500/15 text-blue-300"
            >
              <Command size={17} strokeWidth={1.8} />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold tracking-wide text-white">NEXUS</div>
              <div className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-500">
                PEOPLE OPERATIONS
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="app-sidebar-nav">
          <div className="space-y-1">
            <SectionLabel>Core Operations</SectionLabel>
            {CORE_OPS.map((item) => (
              <NavItem key={item.path} {...item} onClick={onClose} />
            ))}
          </div>

          <div className="space-y-1">
            <SectionLabel>Workforce</SectionLabel>
            {WORKFORCE.map((item) => (
              <NavItem key={item.path} {...item} onClick={onClose} />
            ))}
          </div>

          <div className="space-y-1">
            <SectionLabel>Governance</SectionLabel>
            {governanceNav.map((item) => (
              <NavItem key={item.path} {...item} onClick={onClose} />
            ))}
          </div>
        </nav>

        <div className="app-sidebar-footer shrink-0 space-y-3">
          <div
            className="flex items-center gap-3 rounded-xl border border-[#2b3a51]
              bg-[#131f32] px-3 py-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                border border-blue-300/20 bg-blue-500/15 text-sm font-semibold text-blue-200"
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-100">
                {user?.name || "Team Member"}
              </div>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5
                  text-[10px] font-medium
                  ${roleBadgeClass(role)}`}
              >
                <Shield size={10} />
                {role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg border border-[#2b3a51]
              px-3 py-2.5 text-sm font-medium text-zinc-400
              transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
