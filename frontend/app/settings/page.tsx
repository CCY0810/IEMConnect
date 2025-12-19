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
  Settings as SettingsIcon,
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
  UserCheck,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
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
import React from "react";
import AdminSidebar from "@/components/AdminSidebar";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      }, 1200);
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
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR - Now using shared AdminSidebar component */}
      <AdminSidebar activePage="settings" />

      {/* MAIN AREA */}
      <div className="flex-1 min-h-screen">
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/5 backdrop-blur-md border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
            <p className="text-sm text-slate-400">Manage your account settings & preferences</p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
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
        </header>

        <main className="px-8 py-10 max-w-7xl mx-auto space-y-6">
          {message && (
            <Alert
              className={
                message.type === "error"
                  ? "bg-rose-900/70 border-rose-700 text-rose-200"
                  : "bg-emerald-900/70 border-emerald-700 text-emerald-200"
              }
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading settings...</div>
          ) : (
            <>
              {/* Account Settings */}
              <Card className="bg-slate-800 border border-slate-700 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <User size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Account Settings</CardTitle>
                      <CardDescription className="text-slate-400">Your account information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-400">Full Name</Label>
                      <p className="text-lg font-medium mt-1 text-white">{user.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Email</Label>
                      <p className="text-lg mt-1 text-slate-300">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Membership Number</Label>
                      <p className="text-lg font-mono mt-1 text-white">{user.membership_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Matric Number</Label>
                      <p className="text-lg font-mono mt-1 text-white">{user.matric_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Faculty</Label>
                      <p className="text-lg mt-1 text-slate-300">{user.faculty}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Role</Label>
                      <p className="text-lg capitalize mt-1 text-white">{user.role}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                  <Button
                  onClick={() => router.push("/profile")}
                  className="bg-indigo-600 text-white font-semibold shadow-md gap-2
                            hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/40
                            transition-all duration-200"
                >
                  <User size={16} />
                  Edit Profile
                </Button>
                </div>


                </CardContent>
              </Card>

              {/* Security */}
              <Card className="bg-slate-800 border border-slate-700 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Shield size={20} className="text-rose-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Security Settings</CardTitle>
                      <CardDescription className="text-slate-400">Manage your account security</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Change Password */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold text-white">Change Password</Label>
                        <p className="text-sm text-slate-400">Update your account password</p>
                      </div>
                      {!showPasswordSection && (
                        <Button
                        size="sm"
                        onClick={() => setShowPasswordSection(true)}
                        className="bg-indigo-600 text-white font-semibold shadow-md 
                                  hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/40 
                                  transition-all duration-200"
                      >
                        Change Password
                      </Button>


                      )}
                    </div>

                    {showPasswordSection && (
                      <div className="space-y-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <div>
                          <Label className="text-slate-300">Current Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              disabled={passwordLoading}
                              className="bg-slate-800 text-slate-100 border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                              aria-label="toggle current password"
                            >
                              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-slate-300">New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password (min. 6 characters)"
                              disabled={passwordLoading}
                              className="bg-slate-800 text-slate-100 border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                              aria-label="toggle new password"
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-slate-300">Confirm New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              disabled={passwordLoading}
                              className="bg-slate-800 text-slate-100 border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                              aria-label="toggle confirm password"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                          onClick={handleChangePassword}
                          disabled={passwordLoading}
                          size="sm"
                          className="bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md transition-colors"
                        >
                          {passwordLoading ? "Saving..." : "Save Password"}
                        </Button>

                          <Button
                          size="sm"
                          onClick={() => {
                            setShowPasswordSection(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                          className="border-slate-400 text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </Button>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2FA */}
                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-semibold text-white">Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-400">Required for account security</p>
                      </div>
                      <Badge className="bg-emerald-700 text-emerald-100">
                        <CheckCircle size={12} className="mr-1" />
                        {twoFAEnabled ? "Enabled" : "Required"}
                      </Badge>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="pt-4 border-t border-slate-700">
                    <Label className="text-base font-semibold mb-3 block text-white">Active Sessions</Label>
                    <div className="space-y-2">
                      {sessions.length === 0 && <p className="text-slate-400">No active sessions found.</p>}
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-white">{session.device}</p>
                            <p className="text-sm text-slate-400">
                              {session.ip} • Last active: {new Date(session.last_activity).toLocaleString()}
                            </p>
                          </div>
                          {session.current ? (
                            <Badge className="bg-indigo-700 text-indigo-100">Current</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogoutSession(session.id)}
                              className="border-slate-600 text-slate-100"
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

              {/* Notification Preferences */}
              {preferences && (
                <Card className="bg-slate-800 border border-slate-700 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Bell size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Notification Preferences</CardTitle>
                        <CardDescription className="text-slate-400">Control how you receive notifications</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block text-white">Email Notifications</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">Event Reminders</Label>
                          <Switch
                            checked={preferences.notifications.email.reminders ?? true}
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
                          <Label className="text-slate-300">Event Announcements</Label>
                          <Switch
                            checked={preferences.notifications.email.announcements ?? true}
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
                          <Label className="text-slate-300">Registration Confirmations</Label>
                          <Switch
                            checked={preferences.notifications.email.registrations ?? true}
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
                          <Label className="text-slate-300">Attendance Confirmations</Label>
                          <Switch
                            checked={preferences.notifications.email.attendance ?? true}
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
                          <Label className="text-slate-300">System Notifications</Label>
                          <Switch
                            checked={preferences.notifications.email.system ?? true}
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
                            <Label className="text-slate-300">Admin Announcements</Label>
                            <Switch
                              checked={preferences.notifications.email.admin ?? true}
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

                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-white">In-App Notifications</Label>
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

                    <div className="pt-4 border-t border-slate-700">
                      <Label className="text-base font-semibold mb-3 block text-white">Notification Frequency</Label>
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
                        <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                      <Button onClick={handleSavePreferences} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Save size={16} />
                        {saving ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Danger Zone */}
              <Card className="bg-slate-800 border border-rose-700 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-rose-400" />
                    </div>
                    <div>
                      <CardTitle className="text-rose-300">Danger Zone</CardTitle>
                      <CardDescription className="text-slate-400">Irreversible and destructive actions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-rose-800">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-rose-200">Export Your Data</Label>
                      <p className="text-sm text-rose-300 mt-1">Download all your account data in JSON format</p>
                    </div>
                    <Button variant="outline" onClick={handleExportData} className="gap-2 border-rose-600 text-rose-600">
                      <Download size={16} />
                      Export Data
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-rose-800">
                    <div className="flex-1">
                      <Label className="text-base font-semibold text-rose-200">Delete Account</Label>
                      <p className="text-sm text-rose-300 mt-1">Permanently delete your account and all associated data</p>
                    </div>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2 bg-rose-600 hover:bg-rose-700">
                          <Trash2 size={16} />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border border-rose-800 text-slate-100">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="text-slate-200">Enter your password</Label>
                            <div className="relative mt-1">
                              <Input
                                type={showDeletePassword ? "text" : "password"}
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={deleteLoading}
                                className="bg-slate-800 text-slate-100 border-rose-700"
                              />
                              <button
                                type="button"
                                onClick={() => setShowDeletePassword(!showDeletePassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                              >
                                {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-slate-200">Type <span className="font-mono">DELETE</span> to confirm</Label>
                            <Input
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="Type DELETE"
                              disabled={deleteLoading}
                              className="mt-1 bg-slate-800 text-slate-100 border-rose-700"
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteLoading} className="bg-rose-600 hover:bg-rose-700">
                            {deleteLoading ? "Deleting..." : "Delete Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Stats */}
              {isAdmin && adminStats && (
                <Card className="bg-slate-800 border border-slate-700 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Server size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Admin Settings</CardTitle>
                        <CardDescription className="text-slate-400">System configuration & statistics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-400">Total Users</p>
                        <p className="text-2xl font-bold mt-1 text-white">{adminStats.total_users}</p>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-400">Total Events</p>
                        <p className="text-2xl font-bold mt-1 text-white">{adminStats.total_events}</p>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-400">System Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle size={20} className="text-green-400" />
                          <span className="text-lg font-semibold capitalize text-white">{adminStats.system_status}</span>
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

/* Sidebar Button Component (typed, optional props with defaults) */
type SidebarButtonVariant = "default" | "destructive";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
  variant?: SidebarButtonVariant;
}

function SidebarButton({
  icon,
  label,
  open,
  active = false,
  onClick,
  variant = "default",
}: SidebarButtonProps) {
  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-200 font-medium";

  const activeClasses = active
    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
    : variant === "destructive"
    ? "text-rose-300 hover:bg-rose-900/30"
    : "text-slate-300 hover:bg-gray-800 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <div className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? "scale-100" : "scale-90"}`}>{icon}</div>
      {open && <span className="truncate">{label}</span>}
    </button>
  );
}
