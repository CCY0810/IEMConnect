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
import { Badge } from "@/components/ui/badge";

import {
  Menu,
  LogOut,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  Bell,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon,
} from "lucide-react";
import React from "react";
import NotificationBell from "@/components/NotificationBell";

interface UnverifiedUser {
  id: number;
  name: string;
  email: string;
  membership_number: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const handleLogout = async () => {
    await logout();
    // Logout function handles redirect internally
  };

  const fetchUnverifiedUsers = async () => {
    try {
      setLoading(true);
      const response = await getUnverifiedUsers();
      setUnverifiedUsers(response.users);
      setMessage(null);
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

  const toggleApprovalPanel = () => {
    const open = !showApprovalPanel;
    setShowApprovalPanel(open);
    if (open && user?.role === "admin") fetchUnverifiedUsers();
  };

  const isAdmin = user?.role === "admin";

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F3F6FB] text-slate-900">
      {/* SIDEBAR */}
      <aside
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        } bg-[#071129] text-white shadow-xl`}
      >
        {/* sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`bg-white/90 backdrop-blur-sm rounded-xl border border-white/40 shadow-md flex items-center justify-center ${
                sidebarOpen ? "w-14 h-14" : "w-12 h-12"
              }`}
            >
              <img
                src="/iem-logo.jpg"
                alt="IEM UTM Logo"
                className={`object-contain ${
                  sidebarOpen ? "w-10 h-10" : "w-8 h-8"
                }`}
              />
            </div>

            {sidebarOpen && (
              <div>
                <div className="text-sm font-semibold">IEM Connect</div>
                <div className="text-xs text-slate-300">
                  {isAdmin ? "Admin Panel" : "Member Portal"}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 text-slate-200 rounded hover:bg-white/10"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* menu */}
        <nav className="px-3 py-6 space-y-2">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={18} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
            active
          />
          {isAdmin && (
            <SidebarButton
              open={sidebarOpen}
              icon={<FileText size={18} />}
              label="Reports"
              onClick={() => router.push("/admin/reports")}
            />
          )}
          <SidebarButton
            open={sidebarOpen}
            icon={<Calendar size={18} />}
            label="Events"
            onClick={() => router.push("/event")} //
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<CheckSquare size={18} />}
            label="Attendance"
            onClick={() =>
              router.push(isAdmin ? "/admin/attendance" : "/attendance")
            }
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => router.push("/admin/settings")} //
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<HelpCircle size={18} />}
            label="Help"
            onClick={() => router.push("/admin/help")} //
          />

          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton
              open={sidebarOpen}
              icon={<LogOut size={18} />}
              label="Logout"
              onClick={handleLogout}
            />
          </div>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 min-h-screen">
        {/* top header */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
            <p className="text-sm text-slate-500">Welcome back, {user.name}.</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Name + Role */}
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">
                {user.role}
              </div>
            </div>

            {/* Profile Picture - Clickable */}
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shadow-sm hover:border-blue-500 transition-colors cursor-pointer"
              title="View Profile"
            >
              <img
                src="/placeholder-user.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded hover:bg-slate-200"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* content */}
        <main className="px-8 py-10 space-y-8 max-w-7xl mx-auto">
          {/* PROFILE CARD */}
          <Card className="bg-white/70 shadow">
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>
                Your authenticated profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Info label="Full Name" value={user.name} />
              <Info label="Email" value={user.email} />
              <Info
                label="Role"
                value={
                  <span className="flex items-center gap-2 capitalize">
                    {user.role} {user.role === "admin" && <Badge>Admin</Badge>}
                  </span>
                }
              />
              <Info label="Membership Number" value={user.membership_number} />
              <Info label="Matric Number" value={user.matric_number} />
              <Info label="Faculty" value={user.faculty} />
            </CardContent>
          </Card>

          {/* ADMIN PANEL */}
          {user.role === "admin" && (
            <Card className="bg-white/70 shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>
                      Approve new user registrations
                    </CardDescription>
                  </div>
                  <Button onClick={toggleApprovalPanel} variant="secondary">
                    {showApprovalPanel ? "Hide Approvals" : "Show Approvals"}
                  </Button>
                </div>
              </CardHeader>

              {showApprovalPanel && (
                <CardContent className="mt-4" id="approvals-panel">
                  <h3 className="text-lg font-semibold mb-4">
                    Pending User Approvals
                  </h3>

                  {message && (
                    <Alert
                      className="mb-4"
                      variant={
                        message.type === "error" ? "destructive" : "default"
                      }
                    >
                      <AlertTitle>
                        {message.type === "error" ? "Error" : "Success"}
                      </AlertTitle>
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  {loading ? (
                    <p className="text-slate-500">Loading users...</p>
                  ) : unverifiedUsers.length === 0 ? (
                    <div className="text-slate-500">No pending users.</div>
                  ) : (
                    <Table className="border rounded-md overflow-hidden">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Membership No.</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unverifiedUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.membership_number}</TableCell>
                            <TableCell>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                disabled={approvalLoading === u.id}
                                onClick={() => handleApproveUser(u.id)}
                              >
                                {approvalLoading === u.id
                                  ? "Verifying..."
                                  : "Verify"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  open,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      {open && <span className="truncate">{label}</span>}
    </button>
  );
}
