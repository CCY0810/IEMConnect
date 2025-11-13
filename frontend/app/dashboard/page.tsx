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
import { Menu, LogOut, Users, ShieldCheck } from "lucide-react";

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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push("/login");
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

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">

      {/* SIDEBAR */}
      <aside
        className={`bg-card border-r border-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h1 className="font-bold text-xl text-foreground">IC</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </Button>
        </div>

        <div className="p-5 space-y-6">
          <SidebarItem open={sidebarOpen} icon={<Users size={18} />} label="Dashboard" active />
          <SidebarItem open={sidebarOpen} icon={<ShieldCheck size={18} />} label="Security" />
          <SidebarItem
            open={sidebarOpen}
            icon={<LogOut size={18} />}
            label="Logout"
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        {/* TOP HEADER */}
        <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">
              Welcome back, {user.name}. Here's your summary.
            </p>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="px-6 py-10 space-y-10 max-w-6xl mx-auto">
          {/* PROFILE SECTION */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>Your authenticated account details</CardDescription>
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
            </CardContent>
          </Card>

          {/* ADMIN PANEL */}
          {user.role === "admin" && (
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>Approve new user registrations</CardDescription>
                  </div>
                  <Button onClick={toggleApprovalPanel} variant="secondary">
                    {showApprovalPanel ? "Hide Panel" : "Show Approvals"}
                  </Button>
                </div>
              </CardHeader>

              {showApprovalPanel && (
                <CardContent className="mt-4">
                  <h3 className="text-lg font-semibold mb-4">Pending User Approvals</h3>

                  {message && (
                    <Alert
                      className="mb-4"
                      variant={message.type === "error" ? "destructive" : "default"}
                    >
                      <AlertTitle>
                        {message.type === "error" ? "Error" : "Success"}
                      </AlertTitle>
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  {loading ? (
                    <p className="text-muted-foreground">Loading users...</p>
                  ) : unverifiedUsers.length === 0 ? (
                    <div className="text-muted-foreground">No pending users.</div>
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
                                {approvalLoading === u.id ? "Verifying..." : "Verify"}
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

          {/* SECURITY */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Your account protection details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecurityItem title="2FA Enabled" description="Your account is protected with verified two-factor authentication." />
              <SecurityItem title="Encrypted Authentication" description="Your session and data are encrypted and secured." />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

/* SMALL REUSABLE COMPONENTS */
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}

function SecurityItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center mt-0.5">
        <span className="text-sm text-accent">✓</span>
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  open,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      {icon}
      {open && <span>{label}</span>}
    </button>
  );
}
