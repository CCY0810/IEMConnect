import api from "./api";

// ============================================
// Types
// ============================================

export interface Feedback {
  id: number;
  event_id: number;
  event_title?: string;
  event_date?: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface FeedbackSubmission {
  event_id: number;
  rating: number;
  comment?: string;
}

export interface CanSubmitResponse {
  can_submit: boolean;
  reason: string | null;
  feedback_id?: number;
}

export interface EventFeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
}

export interface EventFeedbackResponse {
  event: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  stats: EventFeedbackStats;
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

export interface EventWithFeedback {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  feedback_count: number;
  average_rating: number | null;
}

// ============================================
// User API Functions
// ============================================

/**
 * Submit feedback for an event
 */
export const submitFeedback = async (
  data: FeedbackSubmission
): Promise<{ message: string; feedback: Feedback }> => {
  const response = await api.post("/feedback", data);
  return response.data;
};

/**
 * Get current user's feedback history
 */
export const getMyFeedback = async (): Promise<{ feedback: Feedback[] }> => {
  const response = await api.get("/feedback/my-feedback");
  return response.data;
};

/**
 * Check if user can submit feedback for an event
 */
export const canSubmitFeedback = async (
  eventId: number
): Promise<CanSubmitResponse> => {
  const response = await api.get(`/feedback/can-submit/${eventId}`);
  return response.data;
};

// ============================================
// Admin API Functions
// ============================================

/**
 * Get all feedback for an event (admin only)
 */
export const getEventFeedback = async (
  eventId: number
): Promise<EventFeedbackResponse> => {
  const response = await api.get(`/feedback/event/${eventId}`);
  return response.data;
};

/**
 * Get feedback summary/reports (admin only)
 */
export const getFeedbackSummary = async (
  startDate?: string,
  endDate?: string
): Promise<FeedbackSummary> => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  const queryString = params.toString();
  const url = queryString ? `/feedback/reports/summary?${queryString}` : "/feedback/reports/summary";
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Get all events with feedback stats (admin only)
 */
export const getEventsWithFeedback = async (): Promise<{
  events: EventWithFeedback[];
}> => {
  const response = await api.get("/feedback/events-with-feedback");
  return response.data;
};

/**
 * Export feedback as CSV (admin only)
 * Downloads the CSV file directly
 */
export const exportFeedbackCSV = async (eventId: number): Promise<void> => {
  const response = await api.get(`/feedback/export/${eventId}`, {
    responseType: "blob",
  });
  
  // Create download link
  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers["content-disposition"];
  let filename = `feedback_${eventId}.csv`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
