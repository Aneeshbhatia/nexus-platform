import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Route → page title map ────────────────────────────────────────────────

const PAGE_TITLES = {
  "/dashboard":   "Dashboard",
  "/employees":   "Employees",
  "/departments": "Departments",
  "/attendance":  "Attendance & Shifts",
  "/leaves":      "Leave Requests",
  "/users":       "User Access Control",
  "/settings":    "Settings",
};

function usePageTitle(pathname) {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return title;
  }
  return "NEXUS EMS";
}

// ─── Main Navbar ───────────────────────────────────────────────────────────

export default function Navbar({ onToggleSidebar }) {
  const { user, role, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = usePageTitle(pathname);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click-outside → close dropdown
  useEffect(() => {
    const onDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [dropdownOpen]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <header className="app-topbar">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="shrink-0 rounded-lg border border-[#30415b] bg-[#17243a]
            p-2 text-zinc-300 transition-colors hover:bg-[#20314b] md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <div className="text-[11px] font-medium text-zinc-500">NEXUS / WORKSPACE</div>
          <h1 className="truncate text-base font-semibold leading-tight text-zinc-100">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg border border-[#30415b] bg-[#17243a]
            p-2 text-zinc-400 transition-colors hover:bg-[#20314b] hover:text-white"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-amber-300" />
          ) : (
            <Moon size={17} className="text-zinc-300" />
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg border border-[#30415b]
              bg-[#17243a] px-2 py-1.5 transition-colors hover:border-[#496384] hover:bg-[#20314b]"
            aria-expanded={dropdownOpen}
            aria-label="Open account menu"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full
                border border-blue-300/20 bg-blue-500/15 text-xs font-semibold text-blue-200"
            >
              {initial}
            </div>
            <span className="hidden max-w-32 truncate text-sm font-medium text-zinc-200 sm:block">
              {firstName}
            </span>
          </button>

          {dropdownOpen && (
            <div
              className="spatial-panel absolute right-0 top-[calc(100%+8px)] z-50 w-64
                rounded-xl p-2 shadow-2xl"
            >
              <div className="mb-1 border-b border-[#2b3a51] px-3 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {user?.email}
                </p>
                <span
                  className="mt-2 inline-flex items-center rounded-md border border-[#30415b]
                    bg-[#17243a] px-2 py-1 text-[11px] font-medium text-zinc-300"
                >
                  {role}
                </span>
              </div>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5
                  text-sm text-zinc-300 transition-colors hover:bg-[#1b2a40] hover:text-white"
              >
                <User size={16} className="text-zinc-500" />
                Profile &amp; Account
              </Link>

              <div className="mt-1 border-t border-[#2b3a51] pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5
                    text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
