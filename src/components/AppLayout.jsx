import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shadow-sm shrink-0 z-20">
        <button
          className="md:hidden p-2 -ml-2 text-gray-600"
          onClick={() => setSidebarOpen((s) => !s)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 ml-1">
          <div className="w-9 h-9 rounded-lg bg-[#1E2A4A] flex items-center justify-center text-white font-bold text-sm">
            SM
          </div>
          <h1 className="text-lg md:text-xl font-bold text-[#1E2A4A] tracking-tight">
            SAT Math Prep
          </h1>
        </div>
      </header>
      <div className="flex flex-1 min-h-0 relative">
        <div
          className={`fixed md:static inset-y-0 left-0 z-30 md:z-auto transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}