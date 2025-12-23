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
  Settings, 
  HelpCircle, 
  UserCheck,
  ChevronRight 
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = user?.role === "admin";

  // Security Redirect
  useEffect(() => {
    if (!token) router.push("/login");
    if (user && user.role !== "admin") router.push("/dashboard");
  }, [token, user, router]);

  useEffect(() => {
    fetchUnverifiedUsers();
  }, []);

  const fetchUnverifiedUsers = async () => {
    try {
      setLoading(true);
      const response = await getUnverifiedUsers();
      setUnverifiedUsers(response.users);
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
    await logout();
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
          {/* SIDEBAR (matches dashboard style) */}
          <aside
            className={`sticky top-0 h-screen transition-all duration-300 ease-in-out ${
              sidebarOpen ? "w-64" : "w-20"
            } bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col`}
          >
            {/* sidebar header */}
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
                      Admin Portal
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

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                          <SidebarButton
                            open={sidebarOpen}
                            icon={<PieChartIcon size={20} />}
                            label="Dashboard"
                            onClick={() => router.push("/dashboard")}
                          />
                          {isAdmin && (
                            <SidebarButton
                              open={sidebarOpen}
                              icon={<UserCheck size={20} />}
                              label="Admin Panel"
                              onClick={() => router.push("/admin/admin_panel")}
                              active
                            />
                          )}
                          {isAdmin && (
                            <SidebarButton
                              open={sidebarOpen}
                              icon={<FileText size={20} />}
                              label="Analytics & Reports"
                              onClick={() => router.push("/admin/reports")}
                            />
                          )}
                          <SidebarButton
                            open={sidebarOpen}
                            icon={<Calendar size={20} />}
                            label="Events"
                            onClick={() => router.push("/event")}
                          />
                          <SidebarButton
                            open={sidebarOpen}
                            icon={<CheckSquare size={20} />}
                            label="Attendance"
                            onClick={() => router.push("/attendance")}
                          />
                          <SidebarButton
                            open={sidebarOpen}
                            icon={<Settings size={20} />}
                            label="Settings"
                            onClick={() => router.push("/settings")}
                          />
                          <SidebarButton
                            open={sidebarOpen}
                            icon={<HelpCircle size={20} />}
                            label="Help Center"
                            onClick={() => router.push("/admin/help")}
                          />
                
                          <div className="mt-6 border-t border-white/10 pt-4">
                            <SidebarButton
                              open={sidebarOpen}
                              icon={<LogOut size={20} />}
                              label="Logout"
                              onClick={handleLogout}
                              variant="destructive"
                            />
                          </div>
                        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-screen">
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-sm text-slate-300">Manage member verifications</p>
          </div>
          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="flex items-center gap-3">
               <UserAvatar size="md" />
               <button onClick={logout} className="p-2 text-white hover:bg-white/10 rounded-lg"><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <main className="px-8 py-10 max-w-7xl mx-auto">
          <Card className="bg-slate-700 shadow-xl border border-slate-600 rounded-xl">
            <CardHeader className="border-b border-slate-600">
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <UserCheck size={20} /> Pending Approvals
              </CardTitle>
              <CardDescription className="text-slate-400">
                Verify new users to grant them access to member features.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {message && (
                <Alert className="mb-6 bg-slate-800 text-white border-slate-600" variant={message.type === "error" ? "destructive" : "default"}>
                  <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <p className="text-slate-400 text-center py-10">Fetching users...</p>
              ) : unverifiedUsers.length === 0 ? (
                <div className="text-slate-400 text-center py-10 border border-dashed rounded-lg bg-slate-800">
                  No pending verifications.
                </div>
              ) : (
                <div className="border border-slate-600 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-800">
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Membership No.</TableHead>
                        <TableHead className="text-slate-300 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-slate-700">
                      {unverifiedUsers.map((u) => (
                        <TableRow key={u.id} className="border-slate-600 hover:bg-slate-600">
                          <TableCell className="font-medium text-white">{u.name}</TableCell>
                          <TableCell className="text-slate-300">{u.email}</TableCell>
                          <TableCell className="text-white">{u.membership_number}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              disabled={approvalLoading === u.id}
                              onClick={() => handleApproveUser(u.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {approvalLoading === u.id ? "Verifying..." : "Verify"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

// Helper Sidebar Component (Matches your original dashboard)
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