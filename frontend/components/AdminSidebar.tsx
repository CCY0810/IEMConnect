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
  Bell,
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
  | "users"
  | "help"
  | "notifications";

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
 * - Smooth animations
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
          <div 
            className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700"
            style={{ animation: "slideInLeft 0.2s ease-out" }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Logout Confirmation</h3>
              <p className="mb-6 text-slate-400">Are you sure you want to end your session?</p>
              <div className="flex w-full gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700 transition-all duration-200" 
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 transition-all duration-200" 
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
        className={`sidebar-container sticky top-0 h-screen ${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col`}
      >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`bg-white rounded-xl p-2 shadow-md flex items-center justify-center transition-all duration-300 ${
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
            <div className="transition-opacity duration-300">
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
          className="p-2 text-slate-200 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-105"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={20} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
            active={activePage === "dashboard"}
          />
        </div>

        {/* Admin-only: Analytics & Reports */}
        {isAdmin && (
          <div className="sidebar-menu-item">
            <SidebarButton
              open={sidebarOpen}
              icon={<FileText size={20} />}
              label="Analytics & Reports"
              onClick={() => router.push("/admin/reports")}
              active={activePage === "reports"}
            />
          </div>
        )}

        {/* Admin-only: Feedback Reports */}
        {isAdmin && (
          <div className="sidebar-menu-item">
            <SidebarButton
              open={sidebarOpen}
              icon={<MessageSquare size={20} />}
              label="Feedback Reports"
              onClick={() => router.push("/admin/feedback")}
              active={activePage === "feedback"}
            />
          </div>
        )}

        {/* Events */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<Calendar size={20} />}
            label="Events"
            onClick={() => router.push("/event")}
            active={activePage === "events"}
          />
        </div>

        {/* Attendance */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<CheckSquare size={20} />}
            label="Attendance"
            onClick={() => router.push("/attendance")}
            active={activePage === "attendance"}
          />
        </div>

        {/* My Events - For all users */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<History size={20} />}
            label="My Events"
            onClick={() => router.push("/my-events")}
            active={activePage === "my-events"}
          />
        </div>

        {/* Notifications */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<Bell size={20} />}
            label="Notifications"
            onClick={() => router.push("/notifications")}
            active={activePage === "notifications"}
          />
        </div>

        {/* User Management */}
        {isAdmin && (
          <div className="sidebar-menu-item">
            <SidebarButton
              open={sidebarOpen}
              icon={<UserCheck size={20} />}
              label="User Management"
              onClick={() => router.push("/admin/users")}
              active={activePage === "users"}
            />
          </div>
        )}

        {/* Settings */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<Settings size={20} />}
            label="Settings"
            onClick={() => router.push("/settings")}
            active={activePage === "settings"}
          />
        </div>

        {/* Help Center */}
        <div className="sidebar-menu-item">
          <SidebarButton
            open={sidebarOpen}
            icon={<HelpCircle size={20} />}
            label="Help Center"
            onClick={() => router.push("/admin/help")}
            active={activePage === "help"}
          />
        </div>

        {/* Logout - with divider */}
        <div className="mt-6 border-t border-white/10 pt-4 sidebar-menu-item">
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
 * Sidebar Button Component with animations
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
    "sidebar-btn w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium";
  
  const activeClasses = active
    ? "sidebar-btn-active bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
    : variant === "destructive"
    ? "logout-btn text-rose-300 hover:bg-rose-900/30"
    : "text-slate-300 hover:bg-gray-800 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <div
        className={`w-6 h-6 flex items-center justify-center transition-transform duration-200 ${
          active ? "scale-110" : "scale-90 group-hover:scale-100"
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

