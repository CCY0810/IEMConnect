"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  LogOut,
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Server,
  CheckCircle,
  ArrowLeft,
  Save,
  AlertTriangle,
  PieChart as PieChartIcon,
  FileText,
  Calendar,
  CheckSquare,
  HelpCircle,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import {
  getUserPreferences,
  updateUserPreferences,
  get2FAStatus,
  getActiveSessions,
  logoutSession,
  exportUserData,
  getAdminSystemStats,
} from "@/lib/settings-api";
import { changePassword, deleteAccount } from "@/lib/profile-api";
import { useToast } from "@/hooks/use-toast";

interface UserPreferences {
  notifications: {
    email: {
      reminders: boolean;
      announcements: boolean;
      registrations: boolean;
      attendance: boolean;
      system: boolean;
      admin: boolean;
    };
    in_app: boolean;
    frequency: "immediate" | "daily" | "weekly";
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Message state
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSettings();
  }, [token, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [prefsData, twoFAData, sessionsData] = await Promise.all([
        getUserPreferences(),
        get2FAStatus(),
        getActiveSessions(),
      ]);

      setPreferences(prefsData.preferences);
      setTwoFAEnabled(twoFAData.enabled);
      setSessions(sessionsData.sessions || []);

      if (isAdmin) {
        try {
          const stats = await getAdminSystemStats();
          setAdminStats(stats);
        } catch (err) {
          // Ignore if not admin or endpoint fails
        }
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setMessage(null);
      await updateUserPreferences(preferences);
      setMessage({ type: "success", text: "Preferences saved successfully!" });
      toast({
        title: "Success",
        description: "Your preferences have been saved.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to save preferences",
      });
    } finally {
      setSaving(false);
    }
  };


  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `iem-connect-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Your data has been exported successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }

    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Error",
        description: 'You must type "DELETE" to confirm',
        variant: "destructive",
      });
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteAccount(deletePassword, deleteConfirmText);
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      });
      setTimeout(() => {
        logout();
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await logoutSession(sessionId);
      if (sessionId === "current") {
        logout();
        router.push("/login");
      } else {
        fetchSettings();
        toast({
          title: "Success",
          description: "Session logged out successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to logout session",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F3F6FB] text-slate-900">
      {/* SIDEBAR */}
      <aside
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        } bg-[#071129] text-white shadow-xl`}
      >
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

        <nav className="px-3 py-6 space-y-2">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={18} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
          />
          {isAdmin && (
            <SidebarButton
              open={sidebarOpen}
              icon={<FileText size={18} />}
              label="Analytics"
              onClick={() => router.push("/admin/reports")}
            />
          )}
          <SidebarButton
            open={sidebarOpen}
            icon={<Calendar size={18} />}
            label="Events"
            onClick={() => router.push("/event")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<CheckSquare size={18} />}
            label="Attendance"
            onClick={() => router.push("/attendance")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => router.push("/settings")}
            active
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<HelpCircle size={18} />}
            label="Help"
            onClick={() => router.push("/help")}
          />

          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton
              open={sidebarOpen}
              icon={<LogOut size={18} />}
              label="Logout"
              onClick={logout}
            />
          </div>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
              <p className="text-sm text-slate-500">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shadow-sm hover:border-blue-500 transition-colors cursor-pointer"
              title="View Profile"
            >
              <img
                src="/placeholder-user.jpg"
                className="w-full h-full object-cover"
                alt="Profile"
              />
            </button>
          </div>
        </header>

        <main className="px-8 py-10 max-w-6xl mx-auto space-y-6">
          {message && (
            <Alert
              className={
                message.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-green-50 border-green-200 text-green-800"
              }
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-10">Loading settings...</div>
          ) : (
            <>
              {/* 1. ACCOUNT SETTINGS */}
              <Card className="bg-white/70 shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>Your account information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">Full Name</Label>
                      <p className="text-lg font-medium mt-1">{user.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Email</Label>
                      <p className="text-lg mt-1">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">
                        Membership Number
                      </Label>
                      <p className="text-lg font-mono mt-1">
                        {user.membership_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Matric Number</Label>
                      <p className="text-lg font-mono mt-1">
                        {user.matric_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Faculty</Label>
                      <p className="text-lg mt-1">{user.faculty}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Role</Label>
                      <p className="text-lg capitalize mt-1">{user.role}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/profile")}
                      className="gap-2"
                    >
                      <User size={16} />
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. SECURITY SETTINGS */}
              <Card className="bg-white/70 shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Shield size={20} className="text-red-600" />
                    </div>
                    <div>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage your account security and authentication
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Change Password */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">
                          Change Password
                        </Label>
                        <p className="text-sm text-slate-500">
                          Update your account password
                        </p>
                      </div>
                      {!showPasswordSection && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPasswordSection(true)}
                        >
                          Change Password
                        </Button>
                      )}
                    </div>

                    {showPasswordSection && (
                      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                        <div>
                          <Label>Current Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              disabled={passwordLoading}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showCurrentPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label>New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password (min. 6 characters)"
                              disabled={passwordLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showNewPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label>Confirm New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              disabled={passwordLoading}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleChangePassword}
                            disabled={passwordLoading}
                            size="sm"
                          >
                            {passwordLoading ? "Saving..." : "Save Password"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowPasswordSection(false);
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2FA Status (Read-only) */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-semibold">
                          Two-Factor Authentication
                        </Label>
                        <p className="text-sm text-slate-500">
                          Required for account security
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" />
                        {twoFAEnabled ? "Enabled" : "Required"}
                      </Badge>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="pt-4 border-t">
                    <Label className="text-base font-semibold mb-3 block">
                      Active Sessions
                    </Label>
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{session.device}</p>
                            <p className="text-sm text-slate-500">
                              {session.ip} • Last active:{" "}
                              {new Date(session.last_activity).toLocaleString()}
                            </p>
                          </div>
                          {session.current ? (
                            <Badge>Current</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogoutSession(session.id)}
                            >
                              Logout
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. NOTIFICATION PREFERENCES */}
              {preferences && (
                <Card className="bg-white/70 shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Bell size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Notification Preferences</CardTitle>
                        <CardDescription>
                          Control how you receive notifications
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Email Notifications
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Event Reminders</Label>
                          <Switch
                            checked={
                              preferences.notifications.email.reminders ?? true
                            }
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notifications: {
                                  ...preferences.notifications,
                                  email: {
                                    ...preferences.notifications.email,
                                    reminders: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Event Announcements</Label>
                          <Switch
                            checked={
                              preferences.notifications.email.announcements ?? true
                            }
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notifications: {
                                  ...preferences.notifications,
                                  email: {
                                    ...preferences.notifications.email,
                                    announcements: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Registration Confirmations</Label>
                          <Switch
                            checked={
                              preferences.notifications.email.registrations ?? true
                            }
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notifications: {
                                  ...preferences.notifications,
                                  email: {
                                    ...preferences.notifications.email,
                                    registrations: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Attendance Confirmations</Label>
                          <Switch
                            checked={
                              preferences.notifications.email.attendance ?? true
                            }
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notifications: {
                                  ...preferences.notifications,
                                  email: {
                                    ...preferences.notifications.email,
                                    attendance: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>System Notifications</Label>
                          <Switch
                            checked={
                              preferences.notifications.email.system ?? true
                            }
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notifications: {
                                  ...preferences.notifications,
                                  email: {
                                    ...preferences.notifications.email,
                                    system: checked,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        {isAdmin && (
                          <div className="flex items-center justify-between">
                            <Label>Admin Announcements</Label>
                            <Switch
                              checked={
                                preferences.notifications.email.admin ?? true
                              }
                              onCheckedChange={(checked) =>
                                setPreferences({
                                  ...preferences,
                                  notifications: {
                                    ...preferences.notifications,
                                    email: {
                                      ...preferences.notifications.email,
                                      admin: checked,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          In-App Notifications
                        </Label>
                        <Switch
                          checked={preferences.notifications.in_app ?? true}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              notifications: {
                                ...preferences.notifications,
                                in_app: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="text-base font-semibold mb-3 block">
                        Notification Frequency
                      </Label>
                      <Select
                        value={preferences.notifications.frequency || "immediate"}
                        onValueChange={(value: "immediate" | "daily" | "weekly") =>
                          setPreferences({
                            ...preferences,
                            notifications: {
                              ...preferences.notifications,
                              frequency: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleSavePreferences}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 4. DANGER ZONE */}
              <Card className="bg-white/70 shadow border-red-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-red-600">Danger Zone</CardTitle>
                      <CardDescription>
                        Irreversible and destructive actions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-red-900">
                        Export Your Data
                      </Label>
                      <p className="text-sm text-red-700 mt-1">
                        Download all your account data in JSON format
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Download size={16} />
                      Export Data
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-red-900">
                        Delete Account
                      </Label>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="gap-2"
                        >
                          <Trash2 size={16} />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your account and remove all your data from our
                            servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Enter your password</Label>
                            <div className="relative mt-1">
                              <Input
                                type={showDeletePassword ? "text" : "password"}
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={deleteLoading}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowDeletePassword(!showDeletePassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                              >
                                {showDeletePassword ? (
                                  <EyeOff size={18} />
                                ) : (
                                  <Eye size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label>
                              Type <span className="font-mono">DELETE</span> to confirm
                            </Label>
                            <Input
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="Type DELETE"
                              disabled={deleteLoading}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleteLoading}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteLoading ? "Deleting..." : "Delete Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              {/* 5. ADMIN-ONLY SETTINGS */}
              {isAdmin && adminStats && (
                <Card className="bg-white/70 shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Server size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle>Admin Settings</CardTitle>
                        <CardDescription>
                          System configuration and statistics
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg border">
                        <p className="text-sm text-slate-500">Total Users</p>
                        <p className="text-2xl font-bold mt-1">
                          {adminStats.total_users}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border">
                        <p className="text-sm text-slate-500">Total Events</p>
                        <p className="text-2xl font-bold mt-1">
                          {adminStats.total_events}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border">
                        <p className="text-sm text-slate-500">System Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle
                            size={20}
                            className="text-green-600"
                          />
                          <span className="text-lg font-semibold capitalize">
                            {adminStats.system_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
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


