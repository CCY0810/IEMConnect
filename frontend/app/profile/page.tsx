"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  updateProfile,
  changePassword,
  deleteAccount,
} from "@/lib/profile-api";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, verify2FA } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete account state
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user) {
      setName(user.name);
      setBio(user.bio || "");
    }
  }, [token, user, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await updateProfile(name, bio);

      // Update the user in auth context
      if (user && token) {
        verify2FA(
          { ...user, name: response.user.name, bio: response.user.bio },
          token
        );
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "All password fields are required",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage(null);

      await changePassword(currentPassword, newPassword);

      setPasswordMessage({
        type: "success",
        text: "Password changed successfully!",
      });
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage(null);
    setShowPasswordSection(false);
  };

  const handleDeleteAccount = async () => {
    // Validate inputs
    if (!deletePassword) {
      setDeleteMessage({ type: "error", text: "Password is required" });
      return;
    }

    if (deleteConfirmText !== "DELETE") {
      setDeleteMessage({
        type: "error",
        text: 'You must type "DELETE" to confirm',
      });
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteMessage(null);

      await deleteAccount(deletePassword, deleteConfirmText);

      setDeleteMessage({
        type: "success",
        text: "Account deleted successfully. Redirecting...",
      });

      // Logout and redirect to home page
      setTimeout(() => {
        logout();
        router.push("/");
      }, 2000);
    } catch (error: any) {
      setDeleteMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to delete account",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletePassword("");
    setDeleteConfirmText("");
    setDeleteMessage(null);
    setShowDeleteSection(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                My Profile
              </h1>
              <p className="text-sm text-slate-500">
                View and manage your account information
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* MESSAGE */}
        {message && (
          <Alert
            className={`mb-6 ${
              message.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <AlertDescription
              className={
                message.type === "error" ? "text-red-800" : "text-green-800"
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* PROFILE CARD */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <CardDescription className="text-sm capitalize">
                    {user.role}
                  </CardDescription>
                </div>
              </div>

              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* NAME - Editable */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name{" "}
                  {isEditing && (
                    <span className="text-blue-600">(Editable)</span>
                  )}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="max-w-md"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-lg font-medium text-slate-900">
                    {user.name}
                  </p>
                )}
              </div>

              {/* EMAIL - Read-only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address{" "}
                  <span className="text-slate-400">(Read-only)</span>
                </label>
                <p className="text-lg text-slate-600">{user.email}</p>
              </div>

              {/* MEMBERSHIP NUMBER - Read-only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  IEM Membership Number{" "}
                  <span className="text-slate-400">(Read-only)</span>
                </label>
                <p className="text-lg font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-md inline-block">
                  {user.membership_number}
                </p>
              </div>

              {/* MATRIC NUMBER - Read-only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Matric Number{" "}
                  <span className="text-slate-400">(Read-only)</span>
                </label>
                <p className="text-lg font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-md inline-block">
                  {user.matric_number}
                </p>
              </div>

              {/* FACULTY - Read-only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Faculty <span className="text-slate-400">(Read-only)</span>
                </label>
                <p className="text-lg text-slate-900">{user.faculty}</p>
              </div>

              {/* BIO - Editable */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bio{" "}
                  {isEditing && (
                    <span className="text-blue-600">(Editable)</span>
                  )}
                </label>
                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about yourself (max 500 characters)"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-lg text-slate-700">
                    {user.bio || "No bio provided"}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-slate-500 mt-1">
                    {bio.length}/500 characters
                  </p>
                )}
              </div>

              {/* ROLE - Read-only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Account Role{" "}
                  <span className="text-slate-400">(Read-only)</span>
                </label>
                <p className="text-lg capitalize text-slate-900">
                  {user.role}
                  {user.role === "admin" && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                      Administrator
                    </span>
                  )}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Save size={16} />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={loading}
                    className="gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECURITY NOTE */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Security Information
                </h3>
                <p className="text-sm text-blue-800">
                  Your email and membership number cannot be changed for
                  security reasons. If you need to update these fields, please
                  contact your administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASSWORD CHANGE SECTION */}
        <Card className="mt-6">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Lock size={20} className="text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Password & Security</CardTitle>
                  <CardDescription>
                    Manage your account password
                  </CardDescription>
                </div>
              </div>

              {!showPasswordSection && (
                <Button
                  onClick={() => setShowPasswordSection(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Lock size={16} />
                  Change Password
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {!showPasswordSection ? (
              <p className="text-sm text-slate-600">
                Keep your account secure by using a strong password. Click
                "Change Password" to update your password.
              </p>
            ) : (
              <div className="space-y-6">
                {/* PASSWORD MESSAGE */}
                {passwordMessage && (
                  <Alert
                    className={`${
                      passwordMessage.type === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <AlertDescription
                      className={
                        passwordMessage.type === "error"
                          ? "text-red-800"
                          : "text-green-800"
                      }
                    >
                      {passwordMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                {/* CURRENT PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* NEW PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM NEW PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* PASSWORD REQUIREMENTS */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-900 mb-2">
                    Password Requirements:
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      At least 6 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Use a unique password not used elsewhere
                    </li>
                  </ul>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="gap-2"
                  >
                    <Save size={16} />
                    {passwordLoading ? "Changing..." : "Change Password"}
                  </Button>
                  <Button
                    onClick={handleCancelPasswordChange}
                    variant="outline"
                    disabled={passwordLoading}
                    className="gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DANGER ZONE */}
        <Card className="mt-6 border-red-200 bg-red-50/50">
          <CardHeader className="border-b border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-900">
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Irreversible and destructive actions
                  </CardDescription>
                </div>
              </div>

              {!showDeleteSection && (
                <Button
                  onClick={() => setShowDeleteSection(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <AlertTriangle size={16} />
                  Delete Account
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {!showDeleteSection ? (
              <div className="space-y-3">
                <p className="text-sm text-red-900 font-medium">
                  Once you delete your account, there is no going back.
                </p>
                <p className="text-sm text-red-800">
                  This action will permanently delete your account, including:
                </p>
                <ul className="text-sm text-red-800 space-y-1 ml-5">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    Your profile information (name, bio, email)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    Your event history and registrations
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    Any certificates you've earned
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    All other data associated with your account
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-6">
                {/* DELETE MESSAGE */}
                {deleteMessage && (
                  <Alert
                    className={`${
                      deleteMessage.type === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <AlertDescription
                      className={
                        deleteMessage.type === "error"
                          ? "text-red-800"
                          : "text-green-800"
                      }
                    >
                      {deleteMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                {/* WARNING BOX */}
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={24}
                      className="text-red-600 flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-red-900 mb-2">
                        WARNING: This action cannot be undone!
                      </h4>
                      <p className="text-sm text-red-800">
                        Your account and all associated data will be permanently
                        deleted. You will not be able to recover your account or
                        any of your data after this action is completed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PASSWORD FIELD */}
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Confirm your password *
                  </label>
                  <div className="relative">
                    <Input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password to confirm"
                      disabled={deleteLoading}
                      className="border-red-300 focus-visible:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showDeletePassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM TEXT FIELD */}
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Type{" "}
                    <span className="font-mono bg-red-200 px-2 py-0.5 rounded text-red-900">
                      DELETE
                    </span>{" "}
                    to confirm *
                  </label>
                  <Input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Type "DELETE" in capital letters'
                    disabled={deleteLoading}
                    className="border-red-300 focus-visible:ring-red-500"
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-4 border-t border-red-200">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    variant="destructive"
                    className="gap-2"
                  >
                    <AlertTriangle size={16} />
                    {deleteLoading
                      ? "Deleting Account..."
                      : "Permanently Delete Account"}
                  </Button>
                  <Button
                    onClick={handleCancelDelete}
                    variant="outline"
                    disabled={deleteLoading}
                    className="gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
