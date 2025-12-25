import api from "./api";

// Types
export type FacultyDistribution = Record<string, number>;

export interface UsersInsights {
  total_users: number;
  last_month_total_users: number;
  growth_percent: number;
  faculty_distribution: FacultyDistribution;
  pending_approvals: number;
}

export interface EventOperations {
  status_funnel: { Upcoming: number; Open: number; Completed: number };
  total_events_held: number;
}

export interface AttendanceEngagement {
  total_attendees: number;
  total_registrations: number;
  participation_rate: number;
  method_split: { QR: number; Code: number; Manual: number };
  top_performers: Array<{
    user: {
      id: number;
      name: string;
      email: string;
      matric_number: string;
      membership_number: string;
      faculty: string;
    };
    attendance_count: number;
  }>;
}

export type AttendanceByFaculty = Record<string, number>;

export interface TrendPoint {
  month: string; // YYYY-MM
  registrations: number;
  attendees: number;
}

export interface RecentActivityItem {
  type: "user_registered" | "user_checked_in";
  id: string;
  user: { id: number; name: string; email: string; faculty: string };
  event?: { id: number; title: string } | null;
  method?: "QR" | "Code" | "Manual";
  timestamp: string;
}

export interface TopEventItem {
  event: { id: number; title: string; start_date?: string; end_date?: string };
  attendance_count: number;
}

// API calls
export const getUsersInsights = async (): Promise<UsersInsights> => {
  const res = await api.get("/reports/users-insights");
  return res.data;
};

export const getEventOperations = async (): Promise<EventOperations> => {
  const res = await api.get("/reports/event-operations");
  return res.data;
};

export const getAttendanceEngagement = async (): Promise<AttendanceEngagement> => {
  const res = await api.get("/reports/attendance-engagement");
  return res.data;
};

export const getAttendanceByFaculty = async (): Promise<AttendanceByFaculty> => {
  const res = await api.get("/reports/attendance-by-faculty");
  return res.data.attendance_by_faculty;
};

export const getRegistrationsVsAttendance = async (
  months = 6
): Promise<TrendPoint[]> => {
  const res = await api.get("/reports/registrations-vs-attendance", { params: { months } });
  return res.data.trend;
};

export const getRecentActivity = async (): Promise<RecentActivityItem[]> => {
  const res = await api.get("/reports/recent-activity");
  return res.data.recent_activity;
};

export const getTopEvents = async (): Promise<TopEventItem[]> => {
  const res = await api.get("/reports/top-events");
  return res.data.top_events;
};

// Feedback Analytics Types
export interface FeedbackSummary {
  total_feedback: number;
  overall_average_rating: number;
  events_with_feedback: number;
  rating_distribution: Record<string, number>;
  top_rated_events: Array<{
    event_id: number;
    title: string;
    avg_rating: number;
    count: number;
  }>;
  recent_feedback: Array<{
    id: number;
    event_id: number;
    event_title: string;
    user_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
}

export interface EventFeedbackStats {
  event: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  stats: {
    total_feedback: number;
    average_rating: number;
    rating_distribution: Record<string, number>;
  };
  feedback: Array<{
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_faculty: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
}

// Feedback Analytics API calls
export const getFeedbackSummary = async (): Promise<FeedbackSummary> => {
  const res = await api.get("/feedback/reports/summary");
  return res.data;
};

export const getEventFeedbackStats = async (eventId: number): Promise<EventFeedbackStats> => {
  const res = await api.get(`/feedback/event/${eventId}`);
  return res.data;
};