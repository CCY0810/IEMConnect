"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createEvent } from "@/lib/event-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Textarea = (props: any) => (
  <textarea
    {...props}
    className={`w-full min-h-[120px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className}`}
  />
);

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import {
  Menu,
  LogOut,
  FileText,
  Calendar,
  CheckSquare,
  Bell,
  Settings,
  HelpCircle,
  PieChart,
  ArrowLeft,
} from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    directorName: "",
    matric: "",
    phone: "",
    email: "",
    title: "",
    description: "",
    cost: "",
    targetedParticipants: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [paperworkFile, setPaperworkFile] = useState<File | null>(null);

  if (!user) return null;

  // Redirect non-admin users
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-lg border border-white/60 rounded-2xl shadow-2xl p-12 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Only administrators can create events. You'll be redirected to the
            dashboard.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createEvent({
        director_name: formData.directorName,
        director_matric: formData.matric,
        director_phone: formData.phone,
        director_email: formData.email,
        title: formData.title,
        description: formData.description,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        targeted_participants: formData.targetedParticipants,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: formData.startTime || undefined,
        end_time: formData.endTime || undefined,
        poster_file: posterFile || undefined,
        paperwork_file: paperworkFile || undefined,
      });

      alert("Event created successfully!");
      router.push("/event");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create event");
      console.error("Create event error:", err);
    } finally {
      setLoading(false);
    }
  };

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
              className={`bg-white/90 rounded-xl shadow-md flex items-center justify-center ${
                sidebarOpen ? "w-14 h-14" : "w-12 h-12"
              }`}
            >
              <img
                src="/iem-logo.jpg"
                className={`object-contain ${
                  sidebarOpen ? "w-10 h-10" : "w-8 h-8"
                }`}
              />
            </div>

            {sidebarOpen && (
              <div>
                <div className="text-sm font-semibold">IEM Connect</div>
                <div className="text-xs text-slate-300">Admin Panel</div>
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

        {/* MENU */}
        <nav className="px-3 py-6 space-y-2">
          <SidebarButton
            icon={<PieChart size={18} />}
            label="Dashboard"
            open={sidebarOpen}
            onClick={() => router.push("/dashboard")}
          />
          <SidebarButton
            icon={<FileText size={18} />}
            label="Reports"
            open={sidebarOpen}
            onClick={() => router.push("/admin/reports")}
          />
          <SidebarButton
            icon={<Calendar size={18} />}
            label="Events"
            open={sidebarOpen}
            active
            onClick={() => router.push("/event")}
          />
          <SidebarButton
            icon={<CheckSquare size={18} />}
            label="Attendance"
            open={sidebarOpen}
            onClick={() => router.push("/attendance")}
          />
          <SidebarButton
            icon={<Bell size={18} />}
            label="Notifications"
            open={sidebarOpen}
            onClick={() => router.push("/admin/notifications")}
          />
          <SidebarButton
            icon={<Settings size={18} />}
            label="Settings"
            open={sidebarOpen}
            onClick={() => router.push("/settings")}
          />
          <SidebarButton
            icon={<HelpCircle size={18} />}
            label="Help"
            open={sidebarOpen}
            onClick={() => router.push("/admin/help")}
          />

          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton
              icon={<LogOut size={18} />}
              label="Logout"
              open={sidebarOpen}
              onClick={logout}
            />
          </div>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/event")}
              className="p-2 rounded hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Create Event
              </h2>
              <p className="text-sm text-slate-500">
                Fill in event details and save
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">
                {user.role}
              </div>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shadow-sm hover:border-blue-500 transition-colors cursor-pointer"
              title="View Profile"
            >
              <img
                src="/placeholder-user.jpg"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        <main className="px-8 py-10 max-w-5xl mx-auto space-y-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* DIRECTOR INFO */}
            <Card className="bg-white/70 shadow">
              <CardHeader>
                <CardTitle>Director Information</CardTitle>
                <CardDescription>Event director details</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Full Name *
                  </span>
                  <Input
                    placeholder="Enter director name"
                    value={formData.directorName}
                    onChange={(e) =>
                      setFormData({ ...formData, directorName: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Matric Number *
                  </span>
                  <Input
                    placeholder="Enter matric number"
                    value={formData.matric}
                    onChange={(e) =>
                      setFormData({ ...formData, matric: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Phone Number *
                  </span>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Email Address *
                  </span>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* EVENT INFO */}
            <Card className="bg-white/70 shadow mt-10">
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
                <CardDescription>Event details & files</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-slate-600">
                    Event Title *
                  </span>
                  <Input
                    placeholder="Enter event title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-slate-600">
                    Description
                  </span>
                  <Textarea
                    placeholder="Enter event description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Cost (RM)
                  </span>
                  <Input
                    type="number"
                    placeholder="Enter cost"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Targeted Participants
                  </span>
                  <Input
                    placeholder="e.g. 100 students"
                    value={formData.targetedParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetedParticipants: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Upload Paperwork
                  </span>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) =>
                      setPaperworkFile(e.target.files?.[0] || null)
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Upload Poster
                  </span>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Date From *
                  </span>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Date Until *
                  </span>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                {/* TIME FIELDS */}
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Start Time
                  </span>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">
                    End Time
                  </span>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SAVE BUTTON */}
            <div className="flex justify-end mt-10">
              <Button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Event"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function SidebarButton({ icon, label, open, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      {open && <span>{label}</span>}
    </button>
  );
}
