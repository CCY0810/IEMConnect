"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { QRCodeSVG } from "qrcode.react";
import {
  getEventById,
  updateEvent,
  Event,
  registerForEvent,
  unregisterFromEvent,
  getEventParticipants,
  startEvent,
  endEvent,
  deleteEvent,
} from "@/lib/event-api";
import {
  startAttendance,
  stopAttendance,
  getAttendanceList,
  checkInToEvent,
} from "@/lib/attendance-api";
import { downloadCertificate } from "@/lib/certificate-api";
import { useToast } from "@/hooks/use-toast";
import { sendEventAnnouncement } from "@/lib/notification-api";
import NotificationBell from "@/components/NotificationBell";
import { getFileUrl } from "@/lib/event-api";
import UserAvatar from "@/components/UserAvatar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Textarea = (props: any) => (
  <textarea
    {...props}
    // APPLY DARK TEXTAREA STYLES
    className={`w-full min-h-[120px] rounded-md border border-slate-600 bg-slate-800 text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className}`}
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
  CheckCircle,
  Bell,
  Settings,
  HelpCircle,
  PieChart,
  ArrowLeft,
  PieChartIcon,
  UserCheck,
  AlertTriangle,
  UserX,
  Users,
  PlayCircle,
  StopCircle,
  RefreshCw,
  QrCode,
  Trash2,
  Award,
  Download,
  Loader2,
  ChevronRight, // Ensure ChevronRight is imported for SidebarButton
  X,            // Added for close function
} from "lucide-react";

export default function ViewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, logout } = useAuth();
  const { toast } = useToast();

  const eventId = parseInt(searchParams.get("id") || "0");

  // Responsive Sidebar States from code 2
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Handle Responsive Sidebar behavior from code 2
  useEffect(() => {
    if (!token) router.push("/login");
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [token, router]);

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
    startTime: "",
    endTime: "",
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
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Attendance state
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [showAttendanceList, setShowAttendanceList] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Start event state
  const [startEventLoading, setStartEventLoading] = useState(false);
  const [startEventMessage, setStartEventMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // End event state
  const [endEventLoading, setEndEventLoading] = useState(false);
  const [endEventMessage, setEndEventMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [endEventDialogOpen, setEndEventDialogOpen] = useState(false);
  const [endEventConfirmText, setEndEventConfirmText] = useState("");

  // Delete event state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Announcement state
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementResult, setAnnouncementResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Certificate download state
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Tab state for controlling which tab is active
  const [activeTab, setActiveTab] = useState("details");
  
  
  const safeCost = useMemo(() => {
    const n = Number(event?.cost);
    return Number.isFinite(n) ? n : 0;
  }, [event?.cost]);


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
          startTime: data.start_time || "",
          endTime: data.end_time || "",
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

  // Check-in state (for admins and all registered users)
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // Check if user has already checked in when event data changes
  useEffect(() => {
    if (!event?.is_registered) {
      setHasCheckedIn(false);
      return;
    }

    // Use registration_status from event if available (check as string to avoid type issues)
    const registrationStatus = event.registration_status as string | undefined;
    if (registrationStatus === "attended") {
      setHasCheckedIn(true);
      return;
    }

    // For admins, also check participants list for more accurate status
    if (isAdmin && eventId) {
      const checkUserAttendance = async () => {
        try {
          const data = await getEventParticipants(eventId);
          const currentUserParticipant = data.participants?.find(
            (p: any) => p.user.id === user?.id
          );
          if (currentUserParticipant?.status === "attended") {
            setHasCheckedIn(true);
          } else {
            setHasCheckedIn(false);
          }
        } catch (err) {
          // Silently fail - not critical, will rely on registration_status
          console.error("Error checking attendance:", err);
        }
      };
      checkUserAttendance();
    } else {
      // For non-admins, rely on registration_status
      setHasCheckedIn(registrationStatus === "attended");
    }
  }, [
    eventId,
    user?.id,
    event?.is_registered,
    event?.registration_status,
    isAdmin,
  ]);

  const handleUpdate = async () => {
    if (!eventId) return;

    // Prevent updating completed events
    if (event?.status === "Completed") {
      toast({
        title: "Cannot Edit",
        description: "Completed events cannot be edited.",
        variant: "destructive",
      });
      setEditing(false);
      return;
    }

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
        start_time: formData.startTime || undefined,
        end_time: formData.endTime || undefined,
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

  
  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  const handleViewParticipants = async () => {
    if (!eventId) {
      toast({
        title: "Error",
        description: "Event ID is missing",
        variant: "destructive",
      });
      return;
    }

    setLoadingParticipants(true);
    setError(""); // Clear any previous errors
    try {
      const data = await getEventParticipants(eventId);
      setParticipants(data.participants || []);

      // Check if current user has already checked in
      const currentUserParticipant = data.participants?.find(
        (p: any) => p.user.id === user?.id
      );
      if (currentUserParticipant?.status === "attended") {
        setHasCheckedIn(true);
      }

      // Switch to users tab to show participants
      setActiveTab("users");

      // Show success message if participants loaded
      if (data.participants && data.participants.length > 0) {
        toast({
          title: "Participants Loaded",
          description: `Found ${data.participants.length} participant(s)`,
        });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Failed to load participants. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Failed to load participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Load participants when users tab is accessed (admin)
  useEffect(() => {
    if (isAdmin && eventId) {
      handleViewParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, isAdmin]);

  const handleCheckIn = async () => {
    if (!checkInCode.trim()) {
      setCheckInMessage({
        type: "error",
        text: "Please enter the attendance code",
      });
      return;
    }

    setCheckInLoading(true);
    setCheckInMessage(null);

    try {
      await checkInToEvent(checkInCode.trim(), "Code");
      setCheckInMessage({
        type: "success",
        text: "Attendance marked successfully!",
      });
      setHasCheckedIn(true);
      setCheckInCode("");

      // Refresh event data and participants
      if (eventId) {
        const data = await getEventById(eventId);
        setEvent(data);
        handleViewParticipants();
      }

      toast({
        title: "Check-in Successful",
        description: "Your attendance has been recorded.",
      });
    } catch (err: any) {
      setCheckInMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to check in",
      });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleStartAttendance = async () => {
    if (!eventId) return;

    setAttendanceLoading(true);
    setAttendanceMessage(null);

    try {
      await startAttendance(eventId);
      setAttendanceMessage({
        type: "success",
        text: "Attendance started! Share the code with participants.",
      });

      // Refresh event data to get the code
      const data = await getEventById(eventId);
      setEvent(data);
      setShowAttendanceList(true);
      handleRefreshAttendance();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Failed to start attendance";
      setAttendanceMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleStopAttendance = async () => {
    if (!eventId) return;

    setAttendanceLoading(true);
    setAttendanceMessage(null);

    try {
      await stopAttendance(eventId);
      setAttendanceMessage({
        type: "success",
        text: "Attendance stopped successfully.",
      });

      // Refresh event data
      const data = await getEventById(eventId);
      setEvent(data);
      setShowAttendanceList(false);
    } catch (err: any) {
      setAttendanceMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to stop attendance",
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleRefreshAttendance = async () => {
    if (!eventId) return;

    try {
      const data = await getAttendanceList(eventId);
      setAttendanceList(data.attendance_list || []);
    } catch (err: any) {
      console.error("Failed to refresh attendance:", err);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!eventId || !announcementSubject || !announcementMessage) {
      setAnnouncementResult({
        type: "error",
        text: "Please fill in both subject and message",
      });
      return;
    }

    setAnnouncementLoading(true);
    setAnnouncementResult(null);

    try {
      const result = await sendEventAnnouncement(
        eventId,
        announcementSubject,
        announcementMessage,
        sendEmail
      );
      setAnnouncementResult({
        type: "success",
        text: `Announcement sent to ${result.sent} participant(s)${
          result.failed > 0 ? ` (${result.failed} failed)` : ""
        }`,
      });
      setAnnouncementSubject("");
      setAnnouncementMessage("");
    } catch (err: any) {
      setAnnouncementResult({
        type: "error",
        text: err.response?.data?.error || "Failed to send announcement",
      });
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleStartEvent = async () => {
    if (!eventId) return;

    setStartEventLoading(true);
    setStartEventMessage(null);

    try {
      const updatedEvent = await startEvent(eventId);
      setEvent(updatedEvent);
      setStartEventMessage({
        type: "success",
        text: "Event started successfully! The event status has been changed to 'Open'.",
      });

      toast({
        title: "Event Started",
        description: "The event status has been changed to 'Open'.",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to start event";

      setStartEventMessage({
        type: "error",
        text: errorMessage,
      });

      toast({
        title: "Event Not Started",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setStartEventLoading(false);
    }
  };

  const handleEndEvent = async () => {
    if (!eventId) return;

    // Validate confirmation text
    if (endEventConfirmText !== "CLOSE") {
      setEndEventMessage({
        type: "error",
        text: 'Please type "CLOSE" (in capitals) to confirm',
      });
      return;
    }

    setEndEventLoading(true);
    setEndEventMessage(null);

    try {
      const updatedEvent = await endEvent(eventId);
      setEvent(updatedEvent);
      setEndEventMessage({
        type: "success",
        text: "Event ended successfully. Certificates are now available for download.",
      });
      setEndEventDialogOpen(false);
      setEndEventConfirmText("");

      toast({
        title: "Event Ended",
        description: "The event has been marked as completed.",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to end event";
      setEndEventMessage({
        type: "error",
        text: errorMessage,
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setEndEventLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId) return;

    setDeleting(true);

    try {
      await deleteEvent(eventId);
      toast({
        title: "Event Deleted",
        description: "Event has been deleted successfully.",
        variant: "default",
      });
      // Redirect to events list after successful deletion
      router.push("/event");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Failed to delete event";
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Handle certificate download
  const handleDownloadCertificate = async () => {
    if (!eventId) return;
    
    setDownloadingCertificate(true);
    try {
      await downloadCertificate(eventId);
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download certificate",
        variant: "destructive",
      });
    } finally {
      setDownloadingCertificate(false);
    }
  };

  // Simple status badge styling (must be before any early returns to satisfy hooks rules)
  const statusConfig = useMemo(() => {
    const base =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border";
    if (!event) return { text: "", className: `${base} border-slate-600` };

    switch (event.status) {
      case "Upcoming":
        return {
          text: "Upcoming",
          className: `${base} bg-indigo-900/40 border-indigo-500/70 text-indigo-200`,
        };
      case "Open":
        return {
          text: "Open",
          className: `${base} bg-emerald-900/40 border-emerald-500/70 text-emerald-200`,
        };
      case "Completed":
        return {
          text: "Completed",
          className: `${base} bg-slate-800 border-slate-500 text-slate-200`,
        };
      default:
        return {
          text: event.status,
          className: `${base} bg-slate-800 border-slate-500 text-slate-200`,
        };
    }
  }, [event]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      
      {/* 1. LOGOUT MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Logout Confirmation</h3>
              <p className="mb-6 text-slate-400">Are you sure you want to end your session?</p>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MOBILE SIDEBAR OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[45] lg:hidden backdrop-blur-md transition-all duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* 3. SIDEBAR */}
      <aside
        className={`fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col shrink-0 overflow-hidden
        ${sidebarOpen 
            ? "translate-x-0 w-full sm:w-80 lg:w-64 opacity-100 visible" 
            : "-translate-x-full lg:translate-x-0 w-0 lg:w-0 opacity-0 invisible pointer-events-none"}`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0 h-[73px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white rounded-xl p-2 shadow-md flex items-center justify-center w-10 h-10 shrink-0">
              <img src="/iem-logo.jpg" alt="Logo" className="object-contain w-full h-full" />
            </div>
            {sidebarOpen && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="text-base font-extrabold tracking-wide">IEM Connect</div>
                <div className="text-xs text-slate-400 font-medium">Admin Portal</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
              <X size={28}/>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarButton open={sidebarOpen} icon={<PieChartIcon size={20} />} label="Dashboard" onClick={() => router.push("/dashboard")} />
          <SidebarButton open={sidebarOpen} icon={<UserCheck size={20} />} label="Admin Panel" onClick={() => router.push("/admin/admin_panel")} />
          <SidebarButton open={sidebarOpen} icon={<FileText size={20} />} label="Reports" onClick={() => router.push("/admin/reports")} />
          <SidebarButton open={sidebarOpen} icon={<Calendar size={20} />} label="Events" onClick={() => router.push("/event")} active />
          <SidebarButton open={sidebarOpen} icon={<CheckSquare size={20} />} label="Attendance" onClick={() => router.push("/attendance")} />
          <SidebarButton open={sidebarOpen} icon={<Settings size={20} />} label="Settings" onClick={() => router.push("/settings")} />
          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton open={sidebarOpen} icon={<LogOut size={20} />} label="Logout" onClick={() => setIsLogoutModalOpen(true)} variant="destructive" />
          </div>
        </nav>
      </aside>

      {/* 4. MAIN LAYOUT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* HEADER */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-3 sticky top-0 z-40 bg-slate-900/60 backdrop-blur-md border-b border-white/10 shadow-xl shrink-0 h-[73px]">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <Menu size={24}/>
            </button>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-white truncate">View Event</h2>
              <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 truncate">Event Details & Information</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 ml-4">
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">{user.role}</div>
              </div>
              <UserAvatar size="sm" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLogoutModalOpen(true)}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors h-9 w-9 shrink-0"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA - ORIGINAL CODE LOGIC REMAINS HERE */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
          
          <Button
            onClick={() => router.push("/event")}
            className="mb-6 p-2 rounded hover:bg-slate-800 text-white flex items-center gap-2"
          >
            <ArrowLeft size={20} className="text-white" />
            <span>Back to events</span>
          </Button>

          {loading ? (
            <div className="text-center py-16 text-slate-500">
              Loading event...
            </div>
          ) : error ? (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : !event ? (
            <div className="text-center py-16 text-slate-500">
              Event not found
            </div>
          ) : (
            <>
              {/* HERO SUMMARY CARD */}
              <Card className="mb-8 bg-gradient-to-br from-slate-900/90 via-slate-800 to-slate-900 border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />

                <CardContent className="pt-6 relative">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={statusConfig.className}>
                          {statusConfig.text}
                        </span>
                        {event.attendance_status === "Active" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 border border-emerald-500/60 px-3 py-1 text-xs font-semibold text-emerald-200">
                            <CheckSquare size={14} />
                            Attendance Open
                          </span>
                        )}
                        {event.status === "Completed" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/40 border border-amber-500/60 px-3 py-1 text-xs font-semibold text-amber-200">
                            <Award size={14} />
                            Certificates Available
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {event.title}
                      </h1>
                      {event.description && (
                        <p className="max-w-3xl text-sm text-slate-300">
                          {event.description}
                        </p>
                      )}

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar size={16} className="text-indigo-400" />
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-100">
                              Schedule
                            </p>
                            <p>
                              {new Date(
                                event.start_date
                              ).toLocaleDateString()}
                              {event.end_date !== event.start_date &&
                                ` - ${new Date(
                                  event.end_date
                                ).toLocaleDateString()}`}
                            </p>
                            {(event.start_time || event.end_time) && (
                              <p className="text-xs text-slate-400">
                                {event.start_time && `Start: ${event.start_time}`}
                                {event.start_time && event.end_time && " • "}
                                {event.end_time && `End: ${event.end_time}`}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <Users size={16} className="text-indigo-400" />
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-100">
                              Participants
                            </p>
                            <p>
                              {event.participant_count || 0} registered
                              {event.targeted_participants &&
                                ` / ${event.targeted_participants} target`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <Award size={16} className="text-indigo-400" />
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-100">
                              Cost & Eligibility
                            </p>
                            <p>
                              {safeCost > 0 ? `RM ${safeCost.toFixed(2)}` : "Free"}
                            </p>
                            <p className="text-xs text-slate-400">
                              Organized by {event.director_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isAdmin && (
                      <div className="w-full md:w-72 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-4 shadow-inner">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Your Status
                        </p>
                        {event.is_registered ? (
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-900/40 border border-green-500/70 px-3 py-1 text-xs font-semibold text-green-200">
                            <UserCheck size={14} />
                            Registered
                          </div>
                        ) : (
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200">
                            <UserX size={14} />
                            Not Registered
                          </div>
                        )}

                        <p className="text-xs text-slate-400 mb-3">
                          {event.status === "Completed"
                            ? "This event has ended. Thank you for your interest!"
                            : event.is_registered
                            ? "You can still unregister before the event starts if needed."
                            : "Secure your spot by registering now."}
                        </p>

                        {event.status !== "Completed" && (
                          <Button
                            onClick={
                              event.is_registered
                                ? handleUnregister
                                : handleRegister
                            }
                            disabled={registering}
                            className={`w-full gap-2 ${
                              event.is_registered
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                          >
                            {event.is_registered ? (
                              <>
                                <UserX size={16} />
                                {registering
                                  ? "Unregistering..."
                                  : "Unregister"}
                              </>
                            ) : (
                              <>
                                <UserCheck size={16} />
                                {registering
                                  ? "Registering..."
                                  : "Register Now"}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList
                  className={`grid w-full mb-6 bg-slate-900/80 border border-slate-700 rounded-xl shadow-inner ${
                    isAdmin ? "grid-cols-4" : "grid-cols-1"
                  }`}
                >
                  <TabsTrigger
                    value="details"
                    className="flex items-center justify-center gap-2 text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <FileText size={16} />
                    <span>Event Details</span>
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger
                      value="users"
                      className="flex items-center justify-center gap-2 text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      <Users size={16} />
                      <span>Registered Users</span>
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger
                      value="notifications"
                      className="flex items-center justify-center gap-2 text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      <Bell size={16} />
                      <span>Notifications</span>
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger
                      value="attendance"
                      className="flex items-center justify-center gap-2 text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      <CheckSquare size={16} />
                      <span>Attendance</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* EVENT DETAILS TAB */}
                <TabsContent value="details" className="space-y-6">
                  {event.status === "Completed" && (
                    <Card className="bg-gradient-to-r from-emerald-900/60 via-slate-800 to-slate-800 border border-emerald-600/70 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center border border-emerald-500/70">
                              <CheckCircle
                                size={20}
                                className="text-emerald-300"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-emerald-900/70 text-emerald-200 rounded-full text-xs font-semibold border border-emerald-500/70">
                                Event Completed
                              </span>
                              <span className="px-3 py-1 bg-slate-900/70 text-slate-200 rounded-full text-xs font-semibold border border-slate-600">
                                Certificates Available
                              </span>
                            </div>
                            <p className="text-sm text-slate-100 mb-3">
                              This event has been completed. Registration and
                              check-in are closed, but participants can still
                              download their certificates.
                            </p>
                            
                            {/* Certificate Download Button */}
                            {event.is_registered && (event as any).registration_status === "attended" && (
                              <Button
                                onClick={handleDownloadCertificate}
                                disabled={downloadingCertificate}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {downloadingCertificate ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download size={16} />
                                    Download Certificate
                                  </>
                                )}
                              </Button>
                            )}
                            {event.is_registered && (event as any).registration_status !== "attended" && (
                              <p className="text-sm text-amber-300">
                                ⚠️ You were registered but did not check in. Certificates are only available for participants who attended.
                              </p>
                            )}
                            {!event.is_registered && (
                              <p className="text-sm text-slate-400">
                                You were not registered for this event.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {registrationMessage && (
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        registrationMessage.type === "success"
                          ? "bg-green-900/50 border border-green-700 text-green-300"
                          : "bg-red-900/50 border border-red-700 text-red-300"
                      }`}
                    >
                      {registrationMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-6">
                    <div className="space-y-6">
                      {isAdmin && event.status === "Upcoming" && (
                        <Card className="bg-slate-800 shadow-lg border border-slate-600">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-400">
                              <PlayCircle size={20} />
                              Start Event
                            </CardTitle>
                            <CardDescription className="text-green-500">
                              Change event status from 'Upcoming' to 'Open'
                              when the event time arrives
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {startEventMessage && (
                              <div
                                className={`px-4 py-3 rounded-lg ${
                                  startEventMessage.type === "success"
                                    ? "bg-green-900/50 border border-green-700 text-green-300"
                                    : "bg-red-900/50 border border-red-700 text-red-300"
                                }`}
                              >
                                {startEventMessage.text}
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="bg-slate-900/70 p-4 rounded-lg border border-green-700/60">
                                <p className="text-sm text-slate-300 mb-2">
                                  <strong>Event Schedule:</strong>
                                </p>
                                <div className="space-y-1 text-sm text-slate-300">
                                  <p>
                                    <strong>Date:</strong>{" "}
                                    {new Date(
                                      event.start_date
                                    ).toLocaleDateString()}
                                    {event.end_date !== event.start_date &&
                                      ` - ${new Date(
                                        event.end_date
                                      ).toLocaleDateString()}`}
                                  </p>
                                  {event.start_time && (
                                    <p>
                                      <strong>Start Time:</strong>{" "}
                                      {event.start_time}
                                    </p>
                                  )}
                                  {event.end_time && (
                                    <p>
                                      <strong>End Time:</strong>{" "}
                                      {event.end_time}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <Button
                                onClick={handleStartEvent}
                                disabled={startEventLoading}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <PlayCircle size={18} className="mr-2" />
                                {startEventLoading
                                  ? "Starting Event..."
                                  : "Start Event"}
                              </Button>
                              <p className="text-xs text-slate-400 text-center">
                                The event can only be started when the current
                                time is within the scheduled time window.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {isAdmin && event.status === "Open" && (
                        <Card className="bg-slate-800 shadow-lg border border-slate-600">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-400">
                              <StopCircle size={20} />
                              End Event
                            </CardTitle>
                            <CardDescription className="text-red-500">
                              Change event status from 'Open' to 'Completed'.
                              This will make certificates available for
                              download.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {endEventMessage && (
                              <div
                                className={`px-4 py-3 rounded-lg ${
                                  endEventMessage.type === "success"
                                    ? "bg-green-900/50 border border-green-700 text-green-300"
                                    : "bg-red-900/50 border border-red-700 text-red-300"
                                }`}
                              >
                                {endEventMessage.text}
                              </div>
                            )}

                            <AlertDialog
                              open={endEventDialogOpen}
                              onOpenChange={setEndEventDialogOpen}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  className="w-full bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    setEndEventConfirmText("");
                                    setEndEventMessage(null);
                                  }}
                                >
                                  <StopCircle size={18} className="mr-2" />
                                  End Event
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-800 text-white border-slate-600">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    End Event
                                  </AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div>
                                      <p className="text-slate-300">
                                        Are you sure you want to end this
                                        event? This action will:
                                      </p>
                                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-slate-400">
                                        <li>
                                          Change the event status to 'Completed'
                                        </li>
                                        <li>
                                          Make certificates available for
                                          download to all participants who
                                          attended
                                        </li>
                                        <li>
                                          Prevent further attendance check-ins
                                          for this event
                                        </li>
                                      </ul>
                                      <p className="mt-3 font-semibold text-red-400">
                                        This action cannot be undone.
                                      </p>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">
                                      Type{" "}
                                      <span className="font-mono">CLOSE</span>{" "}
                                      to confirm:
                                    </label>
                                    <Input
                                      value={endEventConfirmText}
                                      onChange={(e) => {
                                        setEndEventConfirmText(e.target.value);
                                        setEndEventMessage(null);
                                      }}
                                      placeholder="Type CLOSE"
                                      disabled={endEventLoading}
                                      className="font-mono bg-slate-900 border-slate-600 text-white placeholder-slate-500"
                                    />
                                    {endEventConfirmText &&
                                      endEventConfirmText !== "CLOSE" && (
                                        <p className="text-sm text-red-400 mt-1">
                                          Please type "CLOSE" exactly to
                                          confirm
                                        </p>
                                      )}
                                  </div>
                                  {endEventMessage && (
                                    <div
                                      className={`px-3 py-2 rounded border ${
                                        endEventMessage.type === "error"
                                          ? "bg-red-900/50 text-red-300 border-red-700"
                                          : "bg-green-900/50 text-green-300 border-green-700"
                                      }`}
                                    >
                                      {endEventMessage.text}
                                    </div>
                                  )}
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    disabled={endEventLoading}
                                    onClick={() => {
                                      setEndEventConfirmText("");
                                      setEndEventMessage(null);
                                    }}
                                    className="bg-slate-700 text-white hover:bg-slate-600"
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleEndEvent}
                                    disabled={
                                      endEventLoading ||
                                      endEventConfirmText !== "CLOSE"
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {endEventLoading ? "Ending..." : "End Event"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <p className="text-xs text-slate-400 text-center">
                              Ending the event will mark it as completed and
                              enable certificate downloads for all participants
                              who attended.
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      <Card className="bg-slate-800 shadow border border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <UserCheck size={18} className="text-indigo-400" />
                            Director Information
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Details of the event director
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField
                            label="Full Name"
                            editable={editing}
                            value={formData.directorName}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                directorName: e.target.value,
                              })
                            }
                          />
                          <InputField
                            label="Matric Number"
                            editable={editing}
                            value={formData.matric}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                matric: e.target.value,
                              })
                            }
                          />
                          <InputField
                            label="Phone Number"
                            editable={editing}
                            value={formData.phone}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                          <InputField
                            label="Email Address"
                            editable={editing}
                            value={formData.email}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800 shadow border border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <FileText size={18} className="text-indigo-400" />
                            Event Information
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Complete event details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField
                            label="Event Title"
                            editable={editing}
                            value={formData.title}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            className="md:col-span-2"
                          />

                          <div className="md:col-span-2">
                            <span className="text-sm font-medium text-slate-300">
                              Description
                            </span>
                            {editing ? (
                              <Textarea
                                value={formData.description}
                                onChange={(e:any) =>
                                  setFormData({
                                    ...formData,
                                    description: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <div className="mt-1 px-3 py-2 rounded-md bg-slate-900/70 border border-slate-700 text-sm text-slate-100 min-h-[44px] flex items-center">
                                {event.description || (
                                  <span className="text-slate-500">
                                    No description provided
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <InputField
                            label="Cost (RM)"
                            editable={editing}
                            value={formData.cost}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                cost: e.target.value,
                              })
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
                          {editing && (
                            <PosterField
                              poster={event.poster_url}
                              editable={editing}
                              onChange={(e: any) =>
                                setNewPoster(e.target.files?.[0] || null)
                              }
                            />
                          )}

                          <InputField
                            label="Date From"
                            type="date"
                            editable={editing}
                            value={formData.startDate}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                startDate: e.target.value,
                              })
                            }
                          />
                          <InputField
                            label="Date Until"
                            type="date"
                            editable={editing}
                            value={formData.endDate}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              })
                            }
                          />
                          <InputField
                            label="Start Time"
                            type="time"
                            editable={editing}
                            value={formData.startTime}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                startTime: e.target.value,
                              })
                            }
                          />
                          <InputField
                            label="End Time"
                            type="time"
                            editable={editing}
                            value={formData.endTime}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="bg-slate-800 shadow border border-slate-600">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white">
                            <Users size={20} className="text-indigo-400" />
                            Event Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                Registered
                              </p>
                              <p className="text-2xl font-bold text-indigo-400">
                                {event.participant_count || 0}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {event.targeted_participants
                                  ? `Target ${event.targeted_participants}`
                                  : "No target set"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                Event Status
                              </p>
                              <p className="text-sm mb-2">
                                <span className={statusConfig.className}>
                                  {statusConfig.text}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">
                                Attendance:{" "}
                                <span className="font-medium text-slate-200">
                                  {event.attendance_status}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="mt-2">
                            <p className="text-sm text-slate-400 mb-2">
                              Your Status
                            </p>
                            {event.is_registered ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-semibold border border-green-700">
                                  ✓ Registered
                                </span>
                                {hasCheckedIn && (
                                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-semibold border border-blue-700 flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    Attended
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                Not registered
                              </span>
                            )}
                          </div>

                          {event.status !== "Completed" && (
                            <div className="mt-6 pt-4 border-t border-slate-700">
                              {event.is_registered ? (
                                <Button
                                  onClick={handleUnregister}
                                  disabled={registering}
                                  variant="destructive"
                                  className="w-full gap-2 bg-red-600 hover:bg-red-700"
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

                          {isAdmin && (
                            <div className="mt-6 pt-4 border-t border-slate-700">
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

                      {isAdmin && (
                        <Card className="bg-slate-800 border border-slate-600 shadow">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                              <Settings
                                size={18}
                                className="text-indigo-400"
                              />
                              Admin Actions
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                              Manage this event
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-4">
                              {event.status !== "Completed" ? (
                                <Button
                                  className="w-full px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
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
                              ) : (
                                <div className="text-xs text-slate-400 italic">
                                  Completed events cannot be edited
                                </div>
                              )}

                              <div className="flex gap-3">
                                <Button className="flex-1 px-6 py-2 bg-slate-700 text-white hover:bg-slate-600">
                                  Generate Report
                                </Button>

                                <AlertDialog
                                  open={deleteDialogOpen}
                                  onOpenChange={setDeleteDialogOpen}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      className="flex-1 px-6 py-2 gap-2 bg-red-600 hover:bg-red-700"
                                      disabled={deleting}
                                    >
                                      <Trash2 size={18} />
                                      Delete Event
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-slate-800 text-white border-slate-600">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">
                                        Delete Event
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-slate-400">
                                        Are you sure you want to delete "
                                        {event?.title}"?
                                        {event?.status === "Completed" && (
                                          <span className="block mt-2 text-red-400 font-semibold">
                                            Warning: This is a completed event.
                                            Deleting it will permanently remove
                                            all historical data, including
                                            attendance records and participant
                                            information.
                                          </span>
                                        )}
                                        This action cannot be undone and will
                                        permanently remove the event, all
                                        registrations, and attendance records.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        disabled={deleting}
                                        className="bg-slate-700 text-white hover:bg-slate-600"
                                      >
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={handleDeleteEvent}
                                        disabled={deleting}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleting
                                          ? "Deleting..."
                                          : "Delete Event"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="users" className="space-y-6">
                    <Card className="bg-slate-800 shadow border border-slate-600">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Users size={20} className="text-indigo-400" />
                          Registered Participants
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Total: {participants.length} participant(s)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingParticipants ? (
                          <p className="text-center text-slate-400 py-8">
                            Loading participants...
                          </p>
                        ) : participants.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-slate-400 mb-4">
                              No participants registered yet.
                            </p>
                            <Button
                              onClick={handleViewParticipants}
                              className="gap-2 bg-purple-600 hover:bg-purple-700"
                              disabled={loadingParticipants}
                            >
                              <Users size={18} />
                              Load Participants
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-sm text-slate-400">
                                Showing {participants.length} participant(s)
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleViewParticipants}
                                className="gap-2 bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
                              >
                                <RefreshCw size={14} className="mr-2" />
                                Refresh
                              </Button>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                              {participants.map(
                                (participant: any, index: number) => (
                                  <div
                                    key={participant.id}
                                    className="p-4 border border-slate-700 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-3">
                                          <span className="font-semibold text-slate-400">
                                            #{index + 1}
                                          </span>
                                          <h4 className="font-semibold text-white">
                                            {participant.user.name}
                                          </h4>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                              participant.status ===
                                              "registered"
                                                ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                                                : participant.status ===
                                                  "attended"
                                                ? "bg-blue-900/40 text-blue-300 border border-blue-700"
                                                : "bg-slate-700 text-slate-300 border border-slate-500"
                                            }`}
                                          >
                                            {participant.status}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-300 mt-2">
                                          <p>
                                            <span className="font-medium text-slate-500">
                                              Email:
                                            </span>{" "}
                                            {participant.user.email}
                                          </p>
                                          <p>
                                            <span className="font-medium text-slate-500">
                                              Matric:
                                            </span>{" "}
                                            {participant.user.matric_number}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {isAdmin && (
                  <TabsContent value="notifications" className="space-y-6">
                    <Card className="bg-slate-800 shadow-lg border border-slate-600">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-400">
                          <Bell size={20} />
                          Send Announcement
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Notify all registered participants
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {announcementResult && (
                          <div className={`px-4 py-3 rounded-lg border ${announcementResult.type === "success" ? "bg-green-900/50 text-green-300 border-green-700" : "bg-red-900/50 text-red-300 border-red-700"}`}>
                            {announcementResult.text}
                          </div>
                        )}
                        <div className="space-y-3">
                          <Input
                            placeholder="Announcement subject..."
                            value={announcementSubject}
                            onChange={(e) => setAnnouncementSubject(e.target.value)}
                            className="w-full bg-slate-900 border-slate-600 text-white placeholder-slate-500"
                          />
                          <Textarea
                            placeholder="Type your announcement message here..."
                            value={announcementMessage}
                            onChange={(e:any) => setAnnouncementMessage(e.target.value)}
                            rows={6}
                          />
                          <Button onClick={handleSendAnnouncement} disabled={announcementLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                            {announcementLoading ? "Sending..." : `Send to Participants (${event.participant_count || 0})`}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {isAdmin && (
                  <TabsContent value="attendance" className="space-y-6">
                    <Card className="bg-slate-800 shadow-lg border border-slate-600">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-400">
                          <CheckSquare size={20} />
                          Attendance Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 text-center">
                        {attendanceMessage && (
                          <div className={`px-4 py-3 rounded-lg border ${attendanceMessage.type === "success" ? "bg-green-900/50 text-green-300 border-green-700" : "bg-red-900/50 text-red-300 border-red-700"}`}>
                            {attendanceMessage.text}
                          </div>
                        )}
                        <div className="flex gap-4 justify-center">
                          {event.attendance_status === "Pending" && (
                            <Button onClick={handleStartAttendance} className="bg-green-600 hover:bg-green-700 w-full max-w-xs h-12 text-lg font-bold">Start Session</Button>
                          )}
                          {event.attendance_status === "Active" && (
                            <Button onClick={handleStopAttendance} variant="destructive" className="w-full max-w-xs h-12 text-lg font-bold">Stop Session</Button>
                          )}
                        </div>
                        {event.attendance_status === "Active" && event.attendance_code && (
                          <div className="flex flex-col items-center gap-6 pt-6 border-t border-slate-700">
                            <div className="bg-white p-4 rounded-xl">
                              <QRCodeSVG value={`${window.location.origin}/attendance?code=${event.attendance_code}`} size={200} />
                            </div>
                            <div className="text-4xl font-mono font-black text-indigo-400 tracking-widest">{event.attendance_code}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

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
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {editable ? (
        <Input
          type={type}
          value={value}
          onChange={onChange}
          className="mt-1 bg-slate-900 border-slate-600 text-white placeholder-slate-500"
        />
      ) : (
        <div className="mt-1 px-3 py-2 rounded-md bg-slate-900/70 border border-slate-700 text-sm text-slate-100 min-h-[44px] flex items-center">
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function FileField({ label, file, editable, onChange }: any) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {editable ? (
        <Input type="file" className="mt-2 bg-slate-900 border-slate-600 text-white" onChange={onChange} />
      ) : file ? (
        <p className="text-blue-400 underline text-sm block mt-2">File Uploaded</p>
      ) : (
        <p className="text-slate-500 text-sm mt-2">No file</p>
      )}
    </div>
  );
}

function PosterField({ poster, editable, onChange }: any) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-300">Poster</span>
      {editable ? (
        <Input type="file" accept="image/*" className="mt-2 bg-slate-900 border-slate-600 text-white" onChange={onChange} />
      ) : poster ? (
        <p className="text-slate-400 text-sm mt-1 italic">Poster Image Loaded</p>
      ) : (
        <p className="text-slate-500 text-sm mt-1">No poster</p>
      )}
    </div>
  );
}
function SidebarButton({ icon, label, open, active, onClick, variant }: any) {
  const isDestructive = variant === 'destructive';

  // If the sidebar is closed, show only the icon
  if (!open) {
    return (
      <button 
        onClick={onClick} 
        className={`w-full flex items-center justify-center py-4 transition-all ${active ? "text-indigo-400" : "text-slate-400"}`}
      >
        <div className="w-6 h-6 shrink-0">{icon}</div>
      </button>
    );
  }

  // If the sidebar is open, show icon and label
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-4 lg:py-3 rounded-lg text-base lg:text-sm transition-all duration-200 font-medium whitespace-nowrap
      ${active ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" : 
        isDestructive ? "text-rose-300 hover:bg-rose-900/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">{icon}</div>
      <span className="truncate">{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}