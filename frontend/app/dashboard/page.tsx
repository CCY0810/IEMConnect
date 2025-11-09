"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

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

  const handleApproveUser = async (userId: number) => {
    try {
      setApprovalLoading(userId);
      const response = await verifyUser(userId);
      setMessage({ type: "success", text: response.message });

      // Remove the approved user from the list
      setUnverifiedUsers((prev) => prev.filter((user) => user.id !== userId));
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
    const newValue = !showApprovalPanel;
    setShowApprovalPanel(newValue);

    if (newValue && user?.role === "admin") {
      fetchUnverifiedUsers();
    }
  };

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-background">IC</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">IEM Connect</h1>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-background"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Welcome Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-3xl text-foreground">
                Welcome, {user.name}!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your account is fully authenticated and secure
              </CardDescription>
            </CardHeader>
          </Card>

          {/* User Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-lg font-medium text-foreground">
                    {user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-lg font-medium text-foreground">
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="text-lg font-medium text-foreground capitalize">
                    {user.role}{" "}
                    {user.role === "admin" && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Membership Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Membership Number
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {user.membership_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Security Status
                  </p>
                  <p className="text-lg font-medium text-accent">
                    ✓ 2FA Verified
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Approval Button (only for admins) */}
          {user.role === "admin" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Admin Panel</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage user approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={toggleApprovalPanel}
                  variant={showApprovalPanel ? "secondary" : "default"}
                >
                  {showApprovalPanel
                    ? "Hide Approval Panel"
                    : "Approve New Users"}
                </Button>

                {/* Approval Panel */}
                {showApprovalPanel && (
                  <div className="mt-6">
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
                      <p>Loading unverified users...</p>
                    ) : unverifiedUsers.length === 0 ? (
                      <p className="text-muted-foreground">
                        No users pending approval.
                      </p>
                    ) : (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Membership Number</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unverifiedUsers.map((unverifiedUser) => (
                              <TableRow key={unverifiedUser.id}>
                                <TableCell className="font-medium">
                                  {unverifiedUser.name}
                                </TableCell>
                                <TableCell>{unverifiedUser.email}</TableCell>
                                <TableCell>
                                  {unverifiedUser.membership_number}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    unverifiedUser.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() =>
                                      handleApproveUser(unverifiedUser.id)
                                    }
                                    disabled={
                                      approvalLoading === unverifiedUser.id
                                    }
                                    size="sm"
                                  >
                                    {approvalLoading === unverifiedUser.id
                                      ? "Verifying..."
                                      : "Verify"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Security Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your account is protected with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-sm text-accent">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Two-Factor Authentication (2FA)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Active and protecting your account
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-sm text-accent">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Secure Login</p>
                    <p className="text-sm text-muted-foreground">
                      Your session is encrypted and secure
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
