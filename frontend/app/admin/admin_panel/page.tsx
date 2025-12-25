"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getUnverifiedUsers, verifyUser } from "@/lib/admin-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Menu, 
  LogOut, 
  PieChart as PieChartIcon, 
  FileText, 
  Calendar, 
  CheckSquare, 
  AlertTriangle,
  Settings, 
  HelpCircle, 
  UserCheck,
  ChevronRight,
  X 
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import React from "react";

interface UnverifiedUser {
  id: number;
  name: string;
  email: string;
  membership_number: string;
  createdAt: string;
}

export default function AdminPanelPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  // Responsive Sidebar States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = user?.role === "admin";

  // Handle Responsive Sidebar behavior
  useEffect(() => {
    if (!token) router.push("/login");
    if (user && user.role !== "admin") router.push("/dashboard");

    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [token, user, router]);

  useEffect(() => {
    fetchUnverifiedUsers();
  }, []);

  const fetchUnverifiedUsers = async () => {
    try {
      setLoading(true);
      const response = await getUnverifiedUsers();
      setUnverifiedUsers(response.users || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to fetch unverified users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (id: number) => {
    try {
      setApprovalLoading(id);
      const res = await verifyUser(id);
      setMessage({ type: "success", text: res.message });
      setUnverifiedUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to verify user",
      });
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      
      {/* 1. LOGOUT MODAL */}
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
                <Button variant="outline" className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MOBILE SIDEBAR OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[45] lg:hidden backdrop-blur-md transition-all duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* 3. SIDEBAR */}
      <aside
        className={`fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col shrink-0 overflow-hidden
        ${sidebarOpen 
            ? "translate-x-0 w-full sm:w-80 lg:w-64 opacity-100 visible" 
            : "-translate-x-full lg:translate-x-0 w-0 lg:w-0 opacity-0 invisible pointer-events-none"}`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0 h-[73px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white rounded-xl p-2 shadow-md flex items-center justify-center w-10 h-10 shrink-0">
              <img src="/iem-logo.jpg" alt="Logo" className="object-contain w-full h-full" />
            </div>
            {sidebarOpen && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="text-base font-extrabold tracking-wide">IEM Connect</div>
                <div className="text-xs text-slate-400 font-medium">Admin Portal</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
              <X size={28}/>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarButton open={sidebarOpen} icon={<PieChartIcon size={20} />} label="Dashboard" onClick={() => router.push("/dashboard")} />
          <SidebarButton open={sidebarOpen} icon={<UserCheck size={20} />} label="Admin Panel" onClick={() => router.push("/admin/admin_panel")} active />
          <SidebarButton open={sidebarOpen} icon={<FileText size={20} />} label="Reports" onClick={() => router.push("/admin/reports")} />
          <SidebarButton open={sidebarOpen} icon={<Calendar size={20} />} label="Events" onClick={() => router.push("/event")} />
          <SidebarButton open={sidebarOpen} icon={<CheckSquare size={20} />} label="Attendance" onClick={() => router.push("/attendance")} />
          <SidebarButton open={sidebarOpen} icon={<Settings size={20} />} label="Settings" onClick={() => router.push("/settings")} />
          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton open={sidebarOpen} icon={<LogOut size={20} />} label="Logout" onClick={() => setIsLogoutModalOpen(true)} variant="destructive" />
          </div>
        </nav>
      </aside>

      {/* 4. MAIN LAYOUT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* GLASSY STICKY HEADER */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-3 sticky top-0 z-40 bg-slate-900/60 backdrop-blur-md border-b border-white/10 shadow-xl shrink-0 h-[73px]">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <Menu size={24}/>
            </button>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-white truncate">Admin Panel</h2>
              <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 truncate">Manage member verifications</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 ml-4">
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">{user.role}</div>
              </div>
              <UserAvatar size="sm" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLogoutModalOpen(true)}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors h-9 w-9 shrink-0"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE ADMIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            <Card className="bg-slate-700/50 backdrop-blur-sm shadow-xl border border-slate-600 rounded-xl overflow-hidden">
              <CardHeader className="p-4 lg:p-6 border-b border-slate-600/50">
                <CardTitle className="text-lg lg:text-xl font-bold text-blue-400 flex items-center gap-2">
                  <UserCheck size={20} /> Pending Approvals
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Verify new users to grant them access to member features.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0"> {/* Remove padding for table to look better on mobile */}
                <div className="p-4 lg:p-6">
                  {message && (
                    <Alert className="mb-6 bg-slate-800 text-white border-slate-600" variant={message.type === "error" ? "destructive" : "default"}>
                      <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 text-sm">Fetching users...</p>
                    </div>
                  ) : unverifiedUsers.length === 0 ? (
                    <div className="text-slate-400 text-center py-16 border border-dashed border-slate-600 rounded-xl bg-slate-800/30">
                      <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
                      No pending verifications.
                    </div>
                  ) : (
                    <div className="border border-slate-600 rounded-xl overflow-x-auto bg-slate-800/20">
                      <Table>
                        <TableHeader className="bg-slate-800/50">
                          <TableRow className="border-slate-600 hover:bg-transparent">
                            <TableHead className="text-slate-300 font-bold whitespace-nowrap">Name</TableHead>
                            <TableHead className="text-slate-300 font-bold hidden md:table-cell">Email</TableHead>
                            <TableHead className="text-slate-300 font-bold">Membership No.</TableHead>
                            <TableHead className="text-slate-300 font-bold text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unverifiedUsers.map((u) => (
                            <TableRow key={u.id} className="border-slate-600 hover:bg-slate-600/30 transition-colors">
                              <TableCell className="font-medium text-white py-4 whitespace-nowrap">
                                {u.name}
                                <div className="text-[10px] text-slate-400 md:hidden mt-0.5">{u.email}</div>
                              </TableCell>
                              <TableCell className="text-slate-300 hidden md:table-cell">{u.email}</TableCell>
                              <TableCell className="text-white font-mono text-xs lg:text-sm">{u.membership_number}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  disabled={approvalLoading === u.id}
                                  onClick={() => handleApproveUser(u.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 h-8"
                                >
                                  {approvalLoading === u.id ? "..." : "Verify"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function SidebarButton({ icon, label, open, active, onClick, variant }: any) {
  const isDestructive = variant === 'destructive';
  if (!open) return (
     <button onClick={onClick} className={`w-full flex items-center justify-center py-4 lg:py-3 transition-all ${active ? "text-indigo-400" : "text-slate-400"}`}>
        <div className="w-6 h-6">{icon}</div>
     </button>
  );

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-4 lg:py-3 rounded-lg text-base lg:text-sm transition-all duration-200 font-medium whitespace-nowrap
      ${active ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" : 
        isDestructive ? "text-rose-300 hover:bg-rose-900/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">{icon}</div>
      <span className="truncate">{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}