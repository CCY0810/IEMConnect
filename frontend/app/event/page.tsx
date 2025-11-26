"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getEvents, Event } from "@/lib/event-api";
import NotificationBell from "@/components/NotificationBell";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

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
  Plus,
  Search,
  Eye,
} from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getEvents({ search });
        setEvents(data);
        setError("");
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch events");
        console.error("Fetch events error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [search, user]);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F3F6FB] text-slate-900">
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

      <div className="flex-1 min-h-screen">
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Events</h2>
            <p className="text-sm text-slate-500">Manage IEM Connect events</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <NotificationBell />

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

            <button className="p-2 rounded hover:bg-slate-200" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="px-8 py-10 space-y-8 max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Event Management</h3>
            </div>

            {isAdmin && (
              <Button
                className="flex items-center gap-2 bg-blue-600"
                onClick={() => router.push("/create_event")}
              >
                <Plus size={18} /> Create Event
              </Button>
            )}
          </div>

          <Card className="bg-white/70 shadow">
            <CardHeader>
              <CardTitle className="text-lg">Search Events</CardTitle>
              <CardDescription>Find events by name</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
                <Input
                  placeholder="Search event..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/*table*/}
          <Card className="bg-white/70 shadow">
            <CardHeader>
              <CardTitle className="text-lg">Event List</CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No events found. {isAdmin && "Create your first event!"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Director</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.title}</TableCell>
                        <TableCell>{event.director_name}</TableCell>
                        <TableCell>
                          {new Date(event.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {event.participant_count || 0} registered
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.status === "Upcoming"
                                ? "bg-blue-100 text-blue-600"
                                : event.status === "Open"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {event.status}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() =>
                              router.push(`/view_event?id=${event.id}`)
                            }
                          >
                            <Eye size={16} /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

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
