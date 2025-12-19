"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getFeedbackSummary,
  getEventsWithFeedback,
  getEventFeedback,
  exportFeedbackCSV,
  FeedbackSummary,
  EventWithFeedback,
  EventFeedbackResponse,
} from "@/lib/feedback-api";
import {
  Star,
  Download,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  ChevronLeft,
  BarChart3,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

/**
 * Admin Feedback Dashboard
 * Displays feedback analytics, summary reports, and individual feedback entries.
 */
export default function FeedbackDashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [events, setEvents] = useState<EventWithFeedback[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [eventFeedback, setEventFeedback] = useState<EventFeedbackResponse | null>(null);
  const [loadingEventFeedback, setLoadingEventFeedback] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      toast({
        title: "Access Denied",
        description: "Admin privileges required.",
        variant: "destructive",
      });
    }
  }, [user, token, router, toast]);

  // Fetch initial data
  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchData();
    }
  }, [token, user]);

  // Fetch event feedback when selection changes
  useEffect(() => {
    if (selectedEventId && selectedEventId !== "all") {
      fetchEventFeedback(parseInt(selectedEventId));
    } else {
      setEventFeedback(null);
    }
  }, [selectedEventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, eventsData] = await Promise.all([
        getFeedbackSummary(),
        getEventsWithFeedback(),
      ]);
      setSummary(summaryData);
      setEvents(eventsData.events);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load feedback data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventFeedback = async (eventId: number) => {
    setLoadingEventFeedback(true);
    try {
      const data = await getEventFeedback(eventId);
      setEventFeedback(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load event feedback",
        variant: "destructive",
      });
    } finally {
      setLoadingEventFeedback(false);
    }
  };

  const handleExport = async () => {
    if (!selectedEventId || selectedEventId === "all") {
      toast({
        title: "Select an Event",
        description: "Please select a specific event to export feedback.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      await exportFeedbackCSV(parseInt(selectedEventId));
      toast({
        title: "Export Complete",
        description: "Feedback CSV has been downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export feedback",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-600"
            }
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return "text-green-400";
    if (rating >= 3.5) return "text-yellow-400";
    if (rating >= 2.5) return "text-orange-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-900 text-white">
        <AdminSidebar activePage="feedback" />
        <div className="flex-1 min-h-screen">
          <div className="px-8 py-12">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-400">Loading feedback data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <AdminSidebar activePage="feedback" />
      <div className="flex-1 min-h-screen">
        <div className="px-8 py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-2 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft size={16} className="mr-1" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white">Feedback Reports</h1>
            <p className="text-slate-400 mt-1">
              View and analyze participant feedback for events
            </p>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <MessageSquare size={16} />
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {summary?.total_feedback || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Star size={16} />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${getRatingColor(summary?.overall_average_rating || 0)}`}>
                {summary?.overall_average_rating?.toFixed(1) || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Calendar size={16} />
                Events with Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {summary?.events_with_feedback || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <TrendingUp size={16} />
                5-Star Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">
                {summary?.rating_distribution?.[5] || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        {summary && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 size={20} />
                Rating Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = summary.rating_distribution?.[rating] || 0;
                  const percentage =
                    summary.total_feedback > 0
                      ? (count / summary.total_feedback) * 100
                      : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-white font-medium">{rating}</span>
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-slate-400 w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Filter & Export */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Event Feedback</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">
                      All Events (Summary View)
                    </SelectItem>
                    {events.map((event) => (
                      <SelectItem
                        key={event.id}
                        value={event.id.toString()}
                        className="text-white hover:bg-slate-700"
                      >
                        {event.title} ({event.feedback_count} feedback)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEventId !== "all" && (
                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEventId === "all" ? (
              // Events with feedback table
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Event</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400 text-center">Feedback Count</TableHead>
                    <TableHead className="text-slate-400 text-center">Avg Rating</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                        No feedback data available yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id} className="border-slate-700">
                        <TableCell className="text-white font-medium">
                          {event.title}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {new Date(event.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-slate-700 text-white">
                            {event.feedback_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {event.average_rating ? (
                            <span className={`font-bold ${getRatingColor(event.average_rating)}`}>
                              {event.average_rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEventId(event.id.toString())}
                            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : loadingEventFeedback ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-400">Loading feedback...</span>
              </div>
            ) : eventFeedback ? (
              <div className="space-y-6">
                {/* Event Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-400">Total Responses</p>
                    <p className="text-2xl font-bold text-white">
                      {eventFeedback.stats.total_feedback}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Average Rating</p>
                    <p className={`text-2xl font-bold ${getRatingColor(eventFeedback.stats.average_rating)}`}>
                      {eventFeedback.stats.average_rating.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Event Status</p>
                    <Badge className="mt-1 bg-slate-600">{eventFeedback.event.status}</Badge>
                  </div>
                </div>

                {/* Individual Feedback */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Participant</TableHead>
                      <TableHead className="text-slate-400">Faculty</TableHead>
                      <TableHead className="text-slate-400">Rating</TableHead>
                      <TableHead className="text-slate-400">Comment</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventFeedback.feedback.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                          No feedback submitted yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      eventFeedback.feedback.map((fb) => (
                        <TableRow key={fb.id} className="border-slate-700">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{fb.user_name}</p>
                              <p className="text-xs text-slate-500">{fb.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {fb.user_faculty || "-"}
                          </TableCell>
                          <TableCell>{renderStars(fb.rating)}</TableCell>
                          <TableCell className="text-slate-300 max-w-md">
                            <p className="line-clamp-2">{fb.comment || "-"}</p>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Top Rated Events */}
        {summary && summary.top_rated_events.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp size={20} />
                Top Rated Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Rank</TableHead>
                    <TableHead className="text-slate-400">Event</TableHead>
                    <TableHead className="text-slate-400 text-center">Avg Rating</TableHead>
                    <TableHead className="text-slate-400 text-center">Responses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.top_rated_events.map((event, index) => (
                    <TableRow key={event.event_id} className="border-slate-700">
                      <TableCell className="text-white font-bold">
                        #{index + 1}
                      </TableCell>
                      <TableCell className="text-white">{event.title}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getRatingColor(event.avg_rating)}`}>
                          {event.avg_rating.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-slate-400">
                        {event.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
