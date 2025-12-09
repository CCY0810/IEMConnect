"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from "@/lib/notification-api";
import { Bell, CheckCheck, X, ArrowLeft, Trash2, CheckCircle } from "lucide-react"; // Added CheckCircle for visual confirmation
import NotificationBell from "@/components/NotificationBell";

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return past.toLocaleDateString();
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [token, router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(100, 0);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  if (!user) return null;

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return (
    // APPLY DARK BACKGROUND
    <div className="min-h-screen bg-slate-900 text-white">
      {/* HEADER: Dark and Sticky */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Bell size={24} className="text-indigo-400" />
                Notifications
              </h1>
              <p className="text-sm text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                variant="outline"
                // APPLY DARK BUTTON STYLES
                className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white"
              >
                <CheckCheck size={16} />
                {markingAll ? "Marking..." : "Mark all as read"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-center py-20 text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          // APPLY DARK CARD STYLES for 'No notifications'
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardContent className="py-20 text-center">
              <Bell size={48} className="mx-auto mb-4 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No notifications
              </h3>
              <p className="text-slate-400">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {unreadNotifications.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Unread ({unreadNotifications.length})
                </h2>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </div>
              </div>
            )}

            {notifications.filter((n) => n.is_read).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Read ({notifications.filter((n) => n.is_read).length})
                </h2>
                <div className="space-y-3">
                  {notifications
                    .filter((n) => n.is_read)
                    .map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const isUnread = !notification.is_read;
  
  return (
    <Card
      // APPLY DARK CARD STYLES: Use different backgrounds for visual hierarchy
      className={`shadow-md transition-all duration-200 hover:shadow-lg hover:bg-slate-700 ${
        isUnread 
          ? "bg-slate-700 border-l-4 border-l-indigo-400 border-slate-600" // Brighter, left border cue
          : "bg-slate-800 border border-slate-700" // Darker, less prominent
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => {
              if (isUnread) {
                onMarkAsRead(notification.id);
              }
            }}
          >
            <div className="flex items-start gap-3">
              {isUnread && (
                // CHECKMARK ICON for UNREAD status visual indicator
                <div className="h-4 w-4 text-indigo-400 mt-1 flex-shrink-0">
                  <CheckCircle size={16} />
                </div>
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-1 ${
                    isUnread
                      ? "text-white"
                      : "text-slate-300"
                  }`}
                >
                  {notification.title}
                </h3>
                <p className="text-sm text-slate-400 mb-2">
                  {notification.message}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTimeAgo(notification.created_at)}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            // APPLY DARK ICON/HOVER STYLES
            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event when deleting
              onDelete(notification.id);
            }}
            title="Delete notification"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}