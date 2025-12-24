"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Menu,
  LogOut,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon,
  FileText,
  ChevronRight,
  UserCheck,
  MessageSquare,
  History,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ActivePage =
  | "dashboard"
  | "approvals"
  | "reports"
  | "feedback"
  | "events"
  | "attendance"
  | "my-events"
  | "settings"
  | "help";

interface AdminSidebarProps {
  activePage: ActivePage;
}

/**
 * Centralized Admin Sidebar Component
 * Provides consistent navigation across all pages with:
 * - Full navigation menu
 * - Active page highlighting
 * - Admin-only items conditionally displayed
 * - Collapsible state management
 */
export default function AdminSidebar({ activePage }: AdminSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  return (
    <>
      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Logout Confirmation</h3>
              <p className="mb-6 text-slate-400">Are you sure you want to end your session?</p>
              <div className="flex w-full gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700" 
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-600 text-white hover:bg-red-700" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`sticky top-0 h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col`}
      >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`bg-white rounded-xl p-2 shadow-md flex items-center justify-center ${
              sidebarOpen ? "w-12 h-12" : "w-10 h-10"
            }`}
          >
            <img
              src="/iem-logo.jpg"
              alt="IEM UTM Logo"
              className="object-contain w-full h-full"
            />
          </div>

          {sidebarOpen && (
            <div>
              <div className="text-base font-extrabold tracking-wide">
                IEM Connect
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {isAdmin ? "Admin Portal" : "Member Dashboard"}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 text-slate-200 rounded-lg hover:bg-white/10"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <SidebarButton
          open={sidebarOpen}
          icon={<PieChartIcon size={20} />}
          label="Dashboard"
          onClick={() => router.push("/dashboard")}
          active={activePage === "dashboard"}
        />

        {/* Admin-only: Approvals - NOW PART OF DASHBOARD TOGGLE */}
        {/* Note: Approvals is accessed via dashboard toggle, not separate nav item */}

        {/* Admin-only: Analytics & Reports */}
        {isAdmin && (
          <SidebarButton
            open={sidebarOpen}
            icon={<FileText size={20} />}
            label="Analytics & Reports"
            onClick={() => router.push("/admin/reports")}
            active={activePage === "reports"}
          />
        )}

        {/* Admin-only: Feedback Reports */}
        {isAdmin && (
          <SidebarButton
            open={sidebarOpen}
            icon={<MessageSquare size={20} />}
            label="Feedback Reports"
            onClick={() => router.push("/admin/feedback")}
            active={activePage === "feedback"}
          />
        )}

        {/* Events */}
        <SidebarButton
          open={sidebarOpen}
          icon={<Calendar size={20} />}
          label="Events"
          onClick={() => router.push("/event")}
          active={activePage === "events"}
        />

        {/* Attendance */}
        <SidebarButton
          open={sidebarOpen}
          icon={<CheckSquare size={20} />}
          label="Attendance"
          onClick={() => router.push("/attendance")}
          active={activePage === "attendance"}
        />

        {/* My Events - For all users */}
        <SidebarButton
          open={sidebarOpen}
          icon={<History size={20} />}
          label="My Events"
          onClick={() => router.push("/my-events")}
          active={activePage === "my-events"}
        />

        {/* Settings */}
        <SidebarButton
          open={sidebarOpen}
          icon={<Settings size={20} />}
          label="Settings"
          onClick={() => router.push("/settings")}
          active={activePage === "settings"}
        />

        {/* Help Center */}
        <SidebarButton
          open={sidebarOpen}
          icon={<HelpCircle size={20} />}
          label="Help Center"
          onClick={() => router.push("/admin/help")}
          active={activePage === "help"}
        />

        {/* Logout - with divider */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <SidebarButton
            open={sidebarOpen}
            icon={<LogOut size={20} />}
            label="Logout"
            onClick={() => setIsLogoutModalOpen(true)}
            variant="destructive"
          />
        </div>
      </nav>
    </aside>
    </>
  );
}

/**
 * Sidebar Button Component
 */
function SidebarButton({
  icon,
  label,
  open,
  active,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "destructive";
}) {
  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-200 font-medium";
  const activeClasses = active
    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
    : variant === "destructive"
    ? "text-rose-300 hover:bg-rose-900/30"
    : "text-slate-300 hover:bg-gray-800 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <div
        className={`w-6 h-6 flex items-center justify-center transition-transform ${
          active ? "scale-100" : "scale-90"
        }`}
      >
        {icon}
      </div>
      {open && <span className="truncate">{label}</span>}
      {open && active && (
        <ChevronRight size={16} className="ml-auto text-white/70" />
      )}
    </button>
  );
}
