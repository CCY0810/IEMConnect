"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getEventById,
  updateEvent,
  Event,
  registerForEvent,
  unregisterFromEvent,
  getEventParticipants,
} from "@/lib/event-api";

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
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

export default function ViewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const eventId = parseInt(searchParams.get("id") || "0");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state for editing
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
  });

  const [newPoster, setNewPoster] = useState<File | null>(null);
  const [newPaperwork, setNewPaperwork] = useState<File | null>(null);

  // Registration state
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Participants state
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Invalid event ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getEventById(eventId);
        setEvent(data);

        // Populate form data
        setFormData({
          directorName: data.director_name,
          matric: data.director_matric,
          phone: data.director_phone,
          email: data.director_email,
          title: data.title,
          description: data.description || "",
          cost: data.cost.toString(),
          targetedParticipants: data.targeted_participants || "",
          startDate: data.start_date,
          endDate: data.end_date,
        });
        setError("");
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch event");
        console.error("Fetch event error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEvent();
    }
  }, [eventId, user]);

  const handleUpdate = async () => {
    if (!eventId) return;

    setError("");
    setLoading(true);

    try {
      const updated = await updateEvent(eventId, {
        director_name: formData.directorName,
        director_matric: formData.matric,
        director_phone: formData.phone,
        director_email: formData.email,
        title: formData.title,
        description: formData.description,
        cost: parseFloat(formData.cost),
        targeted_participants: formData.targetedParticipants,
        start_date: formData.startDate,
        end_date: formData.endDate,
        poster_file: newPoster || undefined,
        paperwork_file: newPaperwork || undefined,
      });

      setEvent(updated);
      setEditing(false);
      alert("Event updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update event");
      console.error("Update event error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!eventId) return;

    setRegistering(true);
    setRegistrationMessage(null);

    try {
      await registerForEvent(eventId);
      setRegistrationMessage({
        type: "success",
        text: "Successfully registered for event!",
      });

      // Refresh event data
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (err: any) {
      setRegistrationMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to register for event",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!eventId) return;

    setRegistering(true);
    setRegistrationMessage(null);

    try {
      await unregisterFromEvent(eventId);
      setRegistrationMessage({
        type: "success",
        text: "Successfully unregistered from event!",
      });

      // Refresh event data
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (err: any) {
      setRegistrationMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to unregister from event",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleViewParticipants = async () => {
    if (!eventId) return;

    setLoadingParticipants(true);
    try {
      const data = await getEventParticipants(eventId);
      setParticipants(data.participants || []);
      setShowParticipants(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load participants");
    } finally {
      setLoadingParticipants(false);
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
              <h2 className="text-2xl font-semibold tracking-tight">
                View Event
              </h2>
              <p className="text-sm text-slate-500">
                Event details & director information
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

        {/* CONTENT */}
        <main className="px-8 py-10 max-w-5xl mx-auto space-y-10">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading event...
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : !event ? (
            <div className="text-center py-8 text-gray-500">
              Event not found
            </div>
          ) : (
            <>
              {registrationMessage && (
                <div
                  className={`px-4 py-3 rounded-lg ${
                    registrationMessage.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {registrationMessage.text}
                </div>
              )}

              {/* EVENT STATISTICS */}
              <Card className="bg-white/70 shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    Event Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">
                        Registered Participants
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {event.participant_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Your Status</p>
                      {event.is_registered ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            ✓ Registered
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">
                          Not registered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* REGISTRATION ACTION BUTTON */}
                  {!isAdmin && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      {event.is_registered ? (
                        <Button
                          onClick={handleUnregister}
                          disabled={registering}
                          variant="destructive"
                          className="w-full gap-2"
                        >
                          <UserX size={18} />
                          {registering
                            ? "Unregistering..."
                            : "Unregister from Event"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRegister}
                          disabled={registering}
                          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <UserCheck size={18} />
                          {registering
                            ? "Registering..."
                            : "Register for Event"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* ADMIN VIEW PARTICIPANTS BUTTON */}
                  {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <Button
                        onClick={handleViewParticipants}
                        disabled={loadingParticipants}
                        className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                      >
                        <Users size={18} />
                        {loadingParticipants
                          ? "Loading..."
                          : "View Participant List"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PARTICIPANTS LIST (ADMIN ONLY) */}
              {isAdmin && showParticipants && (
                <Card className="bg-white/70 shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users size={20} />
                          Registered Participants
                        </CardTitle>
                        <CardDescription>
                          Total: {participants.length} participant(s)
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowParticipants(false)}
                      >
                        Hide List
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {participants.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No participants registered yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {participants.map((participant: any, index: number) => (
                          <div
                            key={participant.id}
                            className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-slate-700">
                                    #{index + 1}
                                  </span>
                                  <h4 className="font-semibold text-slate-900">
                                    {participant.user.name}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      participant.status === "registered"
                                        ? "bg-green-100 text-green-700"
                                        : participant.status === "attended"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {participant.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 mt-2">
                                  <p>
                                    <span className="font-medium">Email:</span>{" "}
                                    {participant.user.email}
                                  </p>
                                  <p>
                                    <span className="font-medium">Matric:</span>{" "}
                                    {participant.user.matric_number}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Membership:
                                    </span>{" "}
                                    {participant.user.membership_number}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Faculty:
                                    </span>{" "}
                                    {participant.user.faculty}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                  Registered on:{" "}
                                  {new Date(
                                    participant.registration_date
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* DIRECTOR INFO */}
              <Card className="bg-white/70 shadow">
                <CardHeader>
                  <CardTitle>Director Information</CardTitle>
                  <CardDescription>
                    Details of the event director
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Full Name"
                    editable={editing}
                    value={formData.directorName}
                    onChange={(e: any) =>
                      setFormData({ ...formData, directorName: e.target.value })
                    }
                  />
                  <InputField
                    label="Matric Number"
                    editable={editing}
                    value={formData.matric}
                    onChange={(e: any) =>
                      setFormData({ ...formData, matric: e.target.value })
                    }
                  />
                  <InputField
                    label="Phone Number"
                    editable={editing}
                    value={formData.phone}
                    onChange={(e: any) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  <InputField
                    label="Email Address"
                    editable={editing}
                    value={formData.email}
                    onChange={(e: any) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
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
                    value={formData.title}
                    onChange={(e: any) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="md:col-span-2"
                  />

                  <div className="md:col-span-2">
                    <span className="text-sm font-medium text-slate-600">
                      Description
                    </span>
                    {editing ? (
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <p className="text-slate-700">{event.description}</p>
                    )}
                  </div>

                  <InputField
                    label="Cost (RM)"
                    editable={editing}
                    value={formData.cost}
                    onChange={(e: any) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    type="number"
                  />
                  <InputField
                    label="Targeted Participants"
                    editable={editing}
                    value={formData.targetedParticipants}
                    onChange={(e: any) =>
                      setFormData({
                        ...formData,
                        targetedParticipants: e.target.value,
                      })
                    }
                  />

                  <FileField
                    label="Paperwork"
                    file={event.paperwork_url}
                    editable={editing}
                    onChange={(e: any) =>
                      setNewPaperwork(e.target.files?.[0] || null)
                    }
                  />
                  <PosterField
                    poster={event.poster_url}
                    editable={editing}
                    onChange={(e: any) =>
                      setNewPoster(e.target.files?.[0] || null)
                    }
                  />

                  <InputField
                    label="Date From"
                    type="date"
                    editable={editing}
                    value={formData.startDate}
                    onChange={(e: any) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                  <InputField
                    label="Date Until"
                    type="date"
                    editable={editing}
                    value={formData.endDate}
                    onChange={(e: any) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </CardContent>
              </Card>

              {/* FOOTER BUTTONS */}
              {isAdmin && (
                <div className="flex justify-between mt-6">
                  <Button
                    className="px-6 py-2 bg-blue-600 text-white"
                    onClick={() =>
                      editing ? handleUpdate() : setEditing(true)
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
                      : editing
                      ? "Save Changes"
                      : "Edit Event"}
                  </Button>

                  <Button className="px-6 py-2 bg-slate-700 text-white">
                    Generate Report
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------------- COMPONENTS ---------------------- */

function InputField({
  label,
  editable,
  value,
  onChange,
  type = "text",
  className = "",
}: any) {
  return (
    <div className={className}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {editable ? (
        <Input type={type} value={value} onChange={onChange} />
      ) : (
        <p className="text-slate-700">{value}</p>
      )}
    </div>
  );
}

function FileField({ label, file, editable, onChange }: any) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-600">{label}</span>

      {editable ? (
        <Input type="file" className="mt-2" onChange={onChange} />
      ) : file ? (
        <a
          href={`http://localhost:5000${file}`}
          download
          className="text-blue-600 underline text-sm block mt-1"
        >
          Download File
        </a>
      ) : (
        <p className="text-slate-500 text-sm mt-1">No file uploaded</p>
      )}
    </div>
  );
}

function PosterField({ poster, editable, onChange }: any) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-600">Poster</span>

      {editable ? (
        <Input
          type="file"
          accept="image/*"
          className="mt-2"
          onChange={onChange}
        />
      ) : poster ? (
        <img
          src={`http://localhost:5000${poster}`}
          alt="Event Poster"
          className="w-full max-w-sm h-auto object-cover rounded-md border mt-2"
          onError={(e) => {
            console.error("Failed to load poster:", poster);
            e.currentTarget.style.display = "none";
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display =
                "block";
            }
          }}
        />
      ) : (
        <p className="text-slate-500 text-sm mt-1">No poster uploaded</p>
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
