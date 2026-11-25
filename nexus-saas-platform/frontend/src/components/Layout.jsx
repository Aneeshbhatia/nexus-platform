import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell text-zinc-100 selection:bg-blue-500/25 selection:text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main flex min-h-screen flex-col">
        <div className="app-topbar-wrap">
          <Navbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
        </div>
        <main className="app-content flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
