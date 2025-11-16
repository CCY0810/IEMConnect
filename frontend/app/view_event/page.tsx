"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

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

export default function ViewEventPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editing, setEditing] = useState(false);

  // Sample event (frontend only)
  const event = {
    directorName: "Dr. Farhan",
    matric: "A21MX1234",
    phone: "012-3456789",
    email: "farhan@utm.my",
    title: "Engineering Summit 2025",
    description:
      "A grand annual professional engineering event involving talks, workshops, and exhibitions.",
    cost: "20",
    target: "300 engineering students",
    paperwork: "/sample-paper.pdf",
    poster: "/placeholder-image.svg",
    from: "2025-02-20",
    until: "2025-02-21",
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
            onClick={() => router.push("/admin/attendance")}
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
            onClick={() => router.push("/admin/settings")}
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

      {/* MAIN AREA */}
      <div className="flex-1">

        {/* HEADER */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/event")}
              className="p-2 rounded hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">View Event</h2>
              <p className="text-sm text-slate-500">Event details & director information</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>

            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shadow-sm">
              <img src="/placeholder-user.jpg" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="px-8 py-10 max-w-5xl mx-auto space-y-10">

          {/* DIRECTOR INFO */}
          <Card className="bg-white/70 shadow">
            <CardHeader>
              <CardTitle>Director Information</CardTitle>
              <CardDescription>Details of the event director</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Full Name" editable={editing} defaultValue={event.directorName} />
              <InputField label="Matric Number" editable={editing} defaultValue={event.matric} />
              <InputField label="Phone Number" editable={editing} defaultValue={event.phone} />
              <InputField label="Email Address" editable={editing} defaultValue={event.email} />
            </CardContent>
          </Card>

          {/* EVENT INFO */}
          <Card className="bg-white/70 shadow">
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>Complete event details</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <InputField
                label="Event Title"
                editable={editing}
                defaultValue={event.title}
                className="md:col-span-2"
              />

              <div className="md:col-span-2">
                <span className="text-sm font-medium text-slate-600">Description</span>
                {editing ? (
                  <Textarea defaultValue={event.description} />
                ) : (
                  <p className="text-slate-700">{event.description}</p>
                )}
              </div>

              <InputField label="Cost (RM)" editable={editing} defaultValue={event.cost} />
              <InputField label="Targeted Participants" editable={editing} defaultValue={event.target} />

              <FileField label="Paperwork" file={event.paperwork} editable={editing} />
              <PosterField poster={event.poster} editable={editing} />

              <InputField label="Date From" type="date" editable={editing} defaultValue={event.from} />
              <InputField label="Date Until" type="date" editable={editing} defaultValue={event.until} />

            </CardContent>
          </Card>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-between mt-6">
            <Button
              className="px-6 py-2 bg-blue-600 text-white"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Save Changes" : "Edit Event"}
            </Button>

            <Button className="px-6 py-2 bg-slate-700 text-white">
              Generate Report
            </Button>
          </div>

        </main>
      </div>
    </div>
  );
}

/* ---------------------- COMPONENTS ---------------------- */

function InputField({ label, editable, defaultValue, type = "text", className = "" }: any) {
  return (
    <div className={className}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {editable ? (
        <Input type={type} defaultValue={defaultValue} />
      ) : (
        <p className="text-slate-700">{defaultValue}</p>
      )}
    </div>
  );
}

function FileField({ label, file, editable }: any) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-600">{label}</span>

      {editable ? (
        <Input type="file" className="mt-2" />
      ) : (
        <a href={file} download className="text-blue-600 underline text-sm block mt-1">
          Download File
        </a>
      )}
    </div>
  );
}

function PosterField({ poster, editable }: any) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-600">Poster</span>

      {editable ? (
        <Input type="file" accept="image/*" className="mt-2" />
      ) : (
        <img
          src={poster}
          className="w-40 h-40 object-cover rounded-md border mt-2"
        />
      )}
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
