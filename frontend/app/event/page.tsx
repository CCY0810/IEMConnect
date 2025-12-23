"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getEvents, Event } from "@/lib/event-api";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import { getFileUrl } from "@/lib/event-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// FIX: Added imports for Alert components
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
// FIX: Added Badge import which may be needed if using conditional badges
import { Badge } from "@/components/ui/badge";


import {
  Menu,
  LogOut,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon, 
  Plus,
  Search,
  Eye,
  UserCheck,
  X,
  ChevronRight,
  FileText,
  ChevronLeft,
} from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalImage, setModalImage] = useState<string | null>(null);

  
  const handleLogout = async () => {
    await logout();
  };

  // protect page: redirect to /login if no token
  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  // fetch events (backend logic intact)
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

    if (user) fetchEvents();
  }, [search, user]);

  // admin check
  const isAdmin = user?.role === "admin";

  // don't render until logged in (same as before)
  if (!user) return null;

  return (
    // APPLY DARK BACKGROUND: bg-slate-900
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
<aside
  className={`sticky top-0 h-screen transition-all duration-300 ease-in-out ${
    sidebarOpen ? "w-64" : "w-20"
  } bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col`}
>
  {/* sidebar header */}
  <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
    <div className="flex items-center gap-3">
      <div
        className={`bg-white rounded-xl p-2 shadow-md flex items-center justify-center ${
          sidebarOpen ? "w-12 h-12" : "w-10 h-10"
        }`}
      >
        <img
          src="/iem-logo.jpg"
          alt="IEM UTM Logo"
          className="object-contain w-full h-full"
        />
      </div>

      {sidebarOpen && (
        <div>
          <div className="text-base font-extrabold tracking-wide">IEM Connect</div>
          <div className="text-xs text-slate-400 font-medium">
            {isAdmin ? "Admin Portal" : "Member Dashboard"}
          </div>
        </div>
      )}
    </div>

    <button
      onClick={() => setSidebarOpen((s) => !s)}
      className="p-2 text-slate-200 rounded-lg hover:bg-white/10"
    >
      <Menu size={18} />
    </button>
  </div>

  {/* menu (MATCHED EXACT SPACING FROM DASHBOARD) */}
  <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={20} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
          />
          {isAdmin && (
            <SidebarButton
              open={sidebarOpen}
              icon={<UserCheck size={20} />}
              label="Admin Panel"
              onClick={() => router.push("/admin/admin_panel")}
            />
          )}
          {isAdmin && (
            <SidebarButton
              open={sidebarOpen}
              icon={<FileText size={20} />}
              label="Analytics & Reports"
              onClick={() => router.push("/admin/reports")}
            />
          )}
          <SidebarButton
            open={sidebarOpen}
            icon={<Calendar size={20} />}
            label="Events"
            onClick={() => router.push("/event")}
            active
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<CheckSquare size={20} />}
            label="Attendance"
            onClick={() => router.push("/attendance")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<Settings size={20} />}
            label="Settings"
            onClick={() => router.push("/settings")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<HelpCircle size={20} />}
            label="Help Center"
            onClick={() => router.push("/admin/help")}
          />

          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton
              open={sidebarOpen}
              icon={<LogOut size={20} />}
              label="Logout"
              onClick={handleLogout}
              variant="destructive"
            />
          </div>
        </nav>
</aside>


      {/* MAIN */}
      <div className="flex-1 min-h-screen">
        {/* Header matched to Dashboard */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Events</h2>
            <p className="text-sm text-slate-300">Manage IEM Connect events</p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-colors cursor-pointer"
              title="View Profile"
            >
              <UserAvatar size="md" />
            </button>

            <button className="p-2 rounded-lg hover:bg-white/10 text-white" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section
          className="relative text-white px-10 py-16"
          aria-hidden={false}
          style={{
            backgroundImage: "url('/eventbg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >

          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/70" />
          <div className="absolute inset-0 bg-white/0" />

          <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                Professional IEM Events
              </h1>
              <p className="text-lg text-white/90 mb-6 max-w-3xl">
                Browse upcoming events, register, or manage events 
              </p>

              <div className="flex gap-3 items-center">
                {isAdmin && (
                  <Button
                    onClick={() => router.push("/create_event")}
                    className="inline-flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-white
                              bg-gradient-to-r from-indigo-600 to-blue-500 shadow-lg
                              transform transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl
                              focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
                    aria-label="Create Event"
                    title="Create a new event"
                  >
                    <Plus size={16} />
                    <span className="whitespace-nowrap">Create Event</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-lg font-semibold
                            backdrop-blur-sm bg-white/6 text-white border border-white/30
                            hover:bg-white/10 hover:border-[#0a66ff] hover:text-[#0a66ff]
                            transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#0a66ff]/15"
                  aria-label="Browse Events"
                  title="Browse events"
                >
                  <Search size={16} />
                  <span className="whitespace-nowrap">Browse Events</span>
                </Button>
              </div>

            </div>

          </div>
        </section>

        {/* CONTENT */}
        <main className="px-8 py-10 max-w-7xl mx-auto space-y-10">
          {/* search + filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                {/* Search icon color adjusted */}
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                {/* APPLY DARK INPUT STYLE */}
                <Input
                  placeholder="Search event by title and director name ..."
                  className="pl-12 py-3 rounded-full shadow-lg bg-slate-800 text-white border-slate-700 placeholder-slate-400 focus:border-indigo-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex items-center gap-2 text-slate-300 hover:bg-slate-700"
                onClick={() => {
                  setSearch("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // APPLY DARK SKELETON STYLES
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-800 rounded-xl p-4 shadow-md h-60 border border-slate-700" />
             ))
            ) : events.length === 0 ? (
              // APPLY DARK NO RESULTS STYLE
              <div className="col-span-3 text-center py-12 text-slate-400 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
                No events found. {isAdmin && "Create your first event to get started."}
              </div>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden transform hover:scale-[1.01] transition duration-300"
                  aria-labelledby={`event-${event.id}`}
                >
                  <div className="w-full h-48 bg-slate-700 overflow-hidden">
                    <PosterImage
                      poster={event.poster_url}
                      onClick={() => event.poster_url && setModalImage(event.poster_url)}
                    />
                  </div>

                  <CardContent className="p-5">
                    <h3 id={`event-${event.id}`} className="text-lg font-semibold mb-2 text-white">
                      {event.title}
                    </h3>

                    <p className="text-sm text-slate-400 mb-3">
                      <strong>Director:</strong> {event.director_name || "—"}
                    </p>

                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="text-sm text-slate-400">
                        {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                      </div>

                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            event.status === "Upcoming"
                              ? "bg-blue-800 text-blue-300"
                              : event.status === "Open"
                              ? "bg-green-800 text-green-300"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {event.status || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => router.push(`/view_event?id=${event.id}`)}
                      >
                        <Eye size={14} /> View
                      </Button>

                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
                          onClick={() => router.push(`/view_event?id=${event.id}`)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </article>
             ))
           )}
          </section>
        </main>
      </div>

      {/* image modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  );
}



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
      <div className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? 'scale-100' : 'scale-90'}`}>{icon}</div>
      {open && <span className="truncate">{label}</span>}
      {open && active && <ChevronRight size={16} className="ml-auto text-white/70" />}
    </button>
  );
}



function PosterImage({ poster, onClick }: { poster?: string | null; onClick?: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poster) {
      setImageUrl(null);
      setImageError(false);
      setLoading(false);
      return;
    }

    let url = "";
    if (poster.startsWith("http")) {
      url = poster;
    } else if (poster.startsWith("/api/v1")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");
      url = `${baseUrl}${poster}`;
    } else {
      url = getFileUrl(poster);
    }

    const token = localStorage.getItem("token");
    if (token) {
      setLoading(true);
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setImageError(false);
        })
        .catch((err) => {
          console.error("Failed poster load", err);
          setImageError(true);
        })
        .finally(() => setLoading(false));
    } else {
      setImageUrl(url);
      setLoading(false);
    }

    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poster]);

  if (!poster) {
    return (
      <div className="w-full h-48 bg-slate-700 flex items-center justify-center text-xs text-slate-500">
        No poster
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-48 bg-slate-700 flex items-center justify-center text-xs text-slate-500">
        Loading...
      </div>
    );
  }

  if (imageError || !imageUrl) {
    return (
      <div className="w-full h-48 bg-slate-700 flex items-center justify-center text-xs text-slate-500">
        Error loading
      </div>
    );
  }

  return (
    <div
      className="w-full h-48 overflow-hidden cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <img src={imageUrl} alt="Event poster" className="w-full h-full object-cover" />
    </div>
  );
}

/* Modal - same auth-aware fetch logic as before */
function ImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let url = "";
    if (imageUrl.startsWith("http")) {
      url = imageUrl;
    } else if (imageUrl.startsWith("/api/v1")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");
      url = `${baseUrl}${imageUrl}`;
    } else {
      url = getFileUrl(imageUrl);
    }

    const token = localStorage.getItem("token");
    if (token) {
      setLoading(true);
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch modal image");
          return res.blob();
        })
        .then((blob) => {
          const obj = URL.createObjectURL(blob);
          setModalImageUrl(obj);
          setErr(false);
        })
        .catch((e) => {
          console.error(e);
          setErr(true);
        })
        .finally(() => setLoading(false));
    } else {
      setModalImageUrl(url);
      setLoading(false);
    }

    return () => {
      if (modalImageUrl && modalImageUrl.startsWith("blob:")) URL.revokeObjectURL(modalImageUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 p-2 bg-white/90 rounded-full shadow"
        aria-label="close"
      >
        <X size={20} />
      </button>

      <div className="relative w-[90vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white">Loading image...</div>
        ) : err || !modalImageUrl ? (
          <div className="w-full h-full flex items-center justify-center text-white">Failed to load image</div>
        ) : (
          <img src={modalImageUrl} alt="Event poster" className="w-full h-full object-contain rounded" />
        )}
      </div>
    </div>
  );
}
