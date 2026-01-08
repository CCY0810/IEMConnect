"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Shield,
  UserPlus,
  ArrowUpCircle,
  ArrowDownCircle,
  Mail,
  Loader2,
  X,
  CheckCircle,
  Clock,
  Trash2,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import HeaderLogoutButton from "@/components/HeaderLogoutButton";
import {
  getAllUsers,
  getPendingInvites,
  createAdminInvite,
  promoteToAdmin,
  demoteToMember,
  revokeInvite,
  deleteMember,
} from "@/lib/admin-api";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  membership_number: string;
  matric_number: string;
  faculty: string;
  is_verified: number;
  createdAt: string;
}

interface Invite {
  id: number;
  email: string;
  expires_at: string;
  created_by: number;
  createdAt: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Derived state
  const isAuthenticated = !!user;

  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, invitesRes] = await Promise.all([
          getAllUsers(),
          getPendingInvites(),
        ]);
        setUsers(usersRes.users || []);
        setInvites(invitesRes.invites || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, toast]);

  const handleInviteAdmin = async () => {
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const result = await createAdminInvite(inviteEmail.trim(), inviteName.trim());
      toast({
        title: "Invite Sent!",
        description: result.message,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      // Refresh invites
      const invitesRes = await getPendingInvites();
      setInvites(invitesRes.invites || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handlePromote = async (userId: number) => {
    setActionLoading(userId);
    try {
      await promoteToAdmin(userId);
      toast({
        title: "Success",
        description: "User promoted to admin",
      });
      // Refresh users
      const usersRes = await getAllUsers();
      setUsers(usersRes.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (userId: number) => {
    setActionLoading(userId);
    try {
      await demoteToMember(userId);
      toast({
        title: "Success",
        description: "Admin demoted to member",
      });
      // Refresh users
      const usersRes = await getAllUsers();
      setUsers(usersRes.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to demote user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvite = async (inviteId: number) => {
    try {
      await revokeInvite(inviteId);
      toast({
        title: "Invite Revoked",
        description: "The invite has been cancelled",
      });
      setInvites(invites.filter((inv) => inv.id !== inviteId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to revoke invite",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteMember(memberToDelete.id);
      toast({
        title: "Member Removed",
        description: `${memberToDelete.name} has been removed from the platform`,
      });
      setShowDeleteModal(false);
      setMemberToDelete(null);
      // Refresh users
      const usersRes = await getAllUsers();
      setUsers(usersRes.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteConfirmation = (member: User) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const admins = users.filter((u) => u.role === "admin");
  const members = users.filter((u) => u.role === "member");

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <AdminSidebar activePage="users" />

      <div className="flex-1 min-h-screen">
        {/* HEADER */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              User Management
            </h2>
            <p className="text-sm text-slate-300">
              Manage users, admins, and invitations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
            <UserAvatar size="md" />
            <HeaderLogoutButton />
          </div>
        </header>

        {/* CONTENT */}
        <main className="px-8 py-10 max-w-6xl mx-auto space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{admins.length}</p>
                    <p className="text-sm text-slate-400">Administrators</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{members.length}</p>
                    <p className="text-sm text-slate-400">Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{invites.length}</p>
                    <p className="text-sm text-slate-400">Pending Invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* INVITE ADMIN BUTTON */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowInviteModal(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
              Invite Admin
            </Button>
          </div>

          {/* PENDING INVITES */}
          {invites.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Pending Admin Invites
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Invites that haven't been accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                    >
                      <div>
                        <p className="font-medium text-white">{invite.email}</p>
                        <p className="text-sm text-slate-400">
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ADMINS LIST */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Administrators ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{admin.name}</p>
                        <p className="text-sm text-slate-400">{admin.email}</p>
                      </div>
                    </div>
                    {/* Add toString() to IDs for safe comparison regardless of type */}
                    {admin.id.toString() !== user.id.toString() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDemote(admin.id)}
                        disabled={actionLoading === admin.id}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 gap-1"
                      >
                        {actionLoading === admin.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4" />
                        )}
                        Demote
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* MEMBERS LIST */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Members ({members.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Verified members of the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No members yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-slate-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePromote(member.id)}
                          disabled={actionLoading === member.id}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 gap-1"
                        >
                          {actionLoading === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4" />
                          )}
                          Promote
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteConfirmation(member)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 gap-1"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Invite New Admin</CardTitle>
                    <CardDescription className="text-slate-400">
                      Send an admin invite via email
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="newadmin@example.com"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name (optional)
                </label>
                <Input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteAdmin}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {inviteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Remove Member</CardTitle>
                    <CardDescription className="text-slate-400">
                      This action cannot be undone
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMemberToDelete(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-rose-900/20 border border-rose-800 rounded-lg p-4">
                <p className="text-rose-300 text-sm">
                  You are about to remove <strong className="text-white">{memberToDelete.name}</strong> ({memberToDelete.email}) from the platform.
                </p>
                <ul className="mt-3 text-sm text-rose-300 space-y-1">
                  <li>• All their event registrations will be deleted</li>
                  <li>• Their attendance records will be removed</li>
                  <li>• Their feedback and notifications will be cleared</li>
                  <li>• They will receive an email notification</li>
                </ul>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMemberToDelete(null);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteMember}
                  disabled={deleteLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                  Remove Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
