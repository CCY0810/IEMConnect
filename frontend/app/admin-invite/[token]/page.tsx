"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { validateInviteToken, registerWithInvite } from "@/lib/admin-api";
import { Shield, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<{ email: string; expiresAt: string } | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [faculty, setFaculty] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const data = await validateInviteToken(token);
        setInviteData({ email: data.email, expiresAt: data.expiresAt });
      } catch (err: any) {
        setError(err?.response?.data?.error || "Invalid or expired invite token");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      checkToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (membershipNumber.length !== 6) {
      setError("Membership number must be exactly 6 characters");
      return;
    }
    if (matricNumber.length !== 9) {
      setError("Matric number must be exactly 9 characters");
      return;
    }

    setSubmitting(true);

    try {
      await registerWithInvite({
        token,
        name: name.trim(),
        password,
        membership_number: membershipNumber.trim(),
        matric_number: matricNumber.trim(),
        faculty,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Invite</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <Link href="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Welcome, Admin!</h2>
              <p className="text-slate-400 mb-6">
                Your admin account has been created successfully.
                Redirecting to login...
              </p>
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-lg bg-slate-800 border-slate-700">
        <CardHeader className="text-center border-b border-slate-700">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Admin Registration</CardTitle>
          <CardDescription className="text-slate-400">
            Complete your admin account setup for {inviteData.email}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <Alert className="mb-6 bg-rose-900/50 border-rose-700 text-rose-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={inviteData.email}
                disabled
                className="bg-slate-700 border-slate-600 text-slate-300"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={submitting}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>

            {/* Membership Number */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Membership Number *
              </label>
              <Input
                type="text"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value.toUpperCase())}
                placeholder="6 characters"
                maxLength={6}
                required
                disabled={submitting}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>

            {/* Matric Number */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Matric Number *
              </label>
              <Input
                type="text"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                placeholder="9 characters"
                maxLength={9}
                required
                disabled={submitting}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>

            {/* Faculty */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Faculty *
              </label>
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                required
                disabled={submitting}
                className="flex h-10 w-full rounded-md border bg-slate-900 border-slate-600 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="">Select your faculty</option>
                <option value="Azman Hashim International Business School (AHIBS)">AHIBS</option>
                <option value="Faculty of Artificial Intelligence (FAI)">FAI</option>
                <option value="Faculty of Built Environment and Surveying">Built Environment</option>
                <option value="Faculty of Chemical & Energy Engineering">Chemical & Energy</option>
                <option value="Faculty of Computing">Computing</option>
                <option value="Faculty of Educational Sciences and Technology (FEST)">FEST</option>
                <option value="Faculty of Electrical Engineering">Electrical</option>
                <option value="Faculty of Management">Management</option>
                <option value="Faculty of Mechanical Engineering">Mechanical</option>
                <option value="Faculty of Science">Science</option>
                <option value="Faculty of Social Sciences and Humanities">Social Sciences</option>
                <option value="Malaysia-Japan International Institute of Technology (MJIIT)">MJIIT</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                  disabled={submitting}
                  className="bg-slate-900 border-slate-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  disabled={submitting}
                  className="bg-slate-900 border-slate-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Create Admin Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
