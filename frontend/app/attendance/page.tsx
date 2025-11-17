"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { checkInToEvent } from "@/lib/attendance-api";
import { CheckCircle, QrCode, Keyboard, Calendar, Clock } from "lucide-react";

interface AttendanceResult {
  event: {
    id: number;
    title: string;
    date: string;
  };
  attendance: {
    id: number;
    marked_at: string;
    method: string;
    status: string;
  };
}

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [attendanceResult, setAttendanceResult] =
    useState<AttendanceResult | null>(null);

  // Pre-fill code from URL parameter if provided (QR code scan)
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl);
    }
  }, [searchParams]);

  // Redirect if not logged in
  if (!token) {
    router.push("/login");
    return null;
  }

  const handleCheckIn = async () => {
    if (!code) {
      setMessage({
        type: "error",
        text: "Please enter the attendance code",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await checkInToEvent(code, "Code");
      setAttendanceResult(result);
      setMessage({
        type: "success",
        text: result.message || "Attendance marked successfully!",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to check in",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setMessage(null);
    setAttendanceResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Event Attendance
          </h1>
          <p className="text-slate-600">
            Enter the attendance code to check in to your event
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-2 border-indigo-100">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <QrCode size={28} />
              Check In
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Welcome, {user?.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {!attendanceResult ? (
              // FORM VIEW
              <div className="space-y-6">
                {/* Input Section */}
                <div className="space-y-3">
                  <label htmlFor="code" className="text-lg font-semibold block">
                    Attendance Code
                  </label>
                  <div className="flex gap-3">
                    <Input
                      id="code"
                      type="text"
                      placeholder="1234-5678"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={9}
                      className="text-2xl font-mono tracking-wider text-center h-14 text-indigo-600"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleCheckIn();
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Keyboard size={16} />
                    Enter the 8-digit code provided by your event organizer
                  </p>
                </div>

                {/* Message Display */}
                {message && (
                  <div
                    className={`px-4 py-3 rounded-lg border ${
                      message.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Check In Button */}
                <Button
                  onClick={handleCheckIn}
                  disabled={loading || !code}
                  className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {loading ? "Checking In..." : "Check In"}
                </Button>

                {/* QR Code Scanner Placeholder */}
                <div className="pt-6 border-t border-slate-200">
                  <p className="text-center text-sm text-slate-500 mb-3">
                    Or scan QR code
                  </p>
                  <div className="bg-slate-100 rounded-lg p-8 text-center text-slate-400">
                    <QrCode size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">QR Scanner Coming Soon</p>
                  </div>
                </div>
              </div>
            ) : (
              // SUCCESS VIEW
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="bg-green-100 rounded-full p-6">
                    <CheckCircle size={64} className="text-green-600" />
                  </div>
                </div>

                {/* Success Message */}
                <div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">
                    Attendance Confirmed!
                  </h2>
                  <p className="text-slate-600">
                    You have successfully checked in
                  </p>
                </div>

                {/* Event Details */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                      Event Name
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {attendanceResult.event.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200">
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Calendar size={14} />
                        Date
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(
                          attendanceResult.event.date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Clock size={14} />
                        Check-in Time
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(
                          attendanceResult.attendance.marked_at
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-200">
                    <div className="inline-block bg-green-600 text-white px-6 py-2 rounded-full font-bold text-lg">
                      ✓ {attendanceResult.attendance.status}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    Check In to Another Event
                  </Button>
                  <Button
                    onClick={() => router.push("/event")}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    View My Events
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="text-slate-600"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
