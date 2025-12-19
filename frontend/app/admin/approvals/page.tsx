"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUnverifiedUsers, verifyUser } from "@/lib/admin-api";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import {
  Menu,
  LogOut,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";

interface UnverifiedUser {
  id: number;
  name: string;
  email: string;
  membership_number: string;
  matric_number?: string;
  faculty?: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  // Auth guard
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      toast({
        title: "Access Denied",
        description: "Admin privileges required.",
        variant: "destructive",
      });
    }
  }, [user, token, router, toast]);

  // Fetch unverified users
  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchUsers();
    }
  }, [token, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUnverifiedUsers();
      setUsers(response.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch pending approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number, userName: string) => {
    try {
      setActionLoading(userId);
      await verifyUser(userId);
      
      // Optimistic UI update
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      
      toast({
        title: "User Approved",
        description: `${userName} has been verified successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.error || "Failed to approve user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR */}
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
                <div className="text-base font-extrabold tracking-wide">IEM Connect</div>
                <div className="text-xs text-slate-400 font-medium">Admin Portal</div>
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={20} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<UserCheck size={20} />}
            label="Approvals"
            onClick={() => router.push("/admin/approvals")}
            active
            badge={users.length > 0 ? users.length : undefined}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<FileText size={20} />}
            label="Analytics & Reports"
            onClick={() => router.push("/admin/reports")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<MessageSquare size={20} />}
            label="Feedback Reports"
            onClick={() => router.push("/admin/feedback")}
          />
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
              onClick={logout}
              variant="destructive"
            />
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">User Approvals</h2>
            <p className="text-sm text-slate-300">Review and verify new user registrations</p>
          </div>

          <div className="flex items-center gap-5">
            <NotificationBell />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-xs text-slate-400 capitalize">{user.role}</div>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                title="View Profile"
              >
                <UserAvatar size="md" />
              </button>

              <button className="p-2 rounded-lg hover:bg-white/10 text-white" onClick={logout}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-8 py-10 max-w-7xl mx-auto space-y-6">
          {/* Stats Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-900/40 rounded-xl">
                    <Users size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Pending Approvals</p>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                  </div>
                </div>
                <Button
                  onClick={fetchUsers}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Approvals Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserCheck size={20} className="text-indigo-400" />
                Pending User Registrations
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review and approve new member registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="ml-3 text-slate-400">Loading pending approvals...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg bg-slate-900/50">
                  <UserCheck size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg font-medium">All caught up!</p>
                  <p className="text-slate-500 text-sm mt-1">No pending user registrations to review.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-900">
                      <TableRow className="border-slate-700">
                        <TableHead className="font-bold text-slate-300">Name</TableHead>
                        <TableHead className="font-bold text-slate-300">Email</TableHead>
                        <TableHead className="font-bold text-slate-300">Membership No.</TableHead>
                        <TableHead className="font-bold text-slate-300">Matric No.</TableHead>
                        <TableHead className="font-bold text-slate-300">Faculty</TableHead>
                        <TableHead className="font-bold text-slate-300">Registered</TableHead>
                        <TableHead className="font-bold text-slate-300">Status</TableHead>
                        <TableHead className="font-bold text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="font-medium text-white">{u.name}</TableCell>
                          <TableCell className="text-slate-300">{u.email}</TableCell>
                          <TableCell className="text-white font-mono">{u.membership_number}</TableCell>
                          <TableCell className="text-slate-300">{u.matric_number || "-"}</TableCell>
                          <TableCell className="text-slate-300">{u.faculty || "-"}</TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-700 text-amber-100">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(u.id, u.name)}
                                disabled={actionLoading === u.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {actionLoading === u.id ? (
                                  <>
                                    <RefreshCw size={14} className="mr-1 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={14} className="mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            </div>
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

// Sidebar Button Component
function SidebarButton({
  icon,
  label,
  open,
  active,
  onClick,
  variant,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "destructive";
  badge?: number;
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
      {open && badge !== undefined && badge > 0 && (
        <Badge className="ml-auto bg-red-600 text-white text-xs px-2">{badge}</Badge>
      )}
      {open && active && !badge && <ChevronRight size={16} className="ml-auto text-white/70" />}
    </button>
  );
}
