import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
  X,
} from "lucide-react";

/**
 * Derives notifications from the collector's assigned complaints.
 */
export default function CollectorNotifications({
  user,
  complaints,
  onSelectComplaint,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  const storageKey =
    user?._id || user?.id
      ? `collector_read_notifs_${user._id || user.id}`
      : null;

  // Load read notifications from localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReadIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Could not load read notifications from localStorage", e);
    }
  }, [storageKey]);

  // Persist read notifications
  const markAsRead = (notifId) => {
    if (!storageKey) return;
    setReadIds((prev) => {
      if (prev.includes(notifId)) return prev;
      const updated = [...prev, notifId];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Could not save read notification", e);
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    if (!storageKey) return;
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch (e) {
      console.error("Could not save all read notifications", e);
    }
  };

  // Derive notifications from complaints list
  const notifications = useMemo(() => {
    if (!complaints || !Array.isArray(complaints)) return [];

    const list = [];

    complaints.forEach((c) => {
      const timestamp = new Date(c.updatedAt || c.createdAt).getTime();

      // 1. Newly Assigned Notification
      if (c.status === "assigned") {
        list.push({
          id: `assigned_${c._id}`,
          complaintId: c._id,
          complaint: c,
          title: "New Task Assigned",
          message: `You were assigned to: "${c.title}" at ${c.address}`,
          type: "assignment",
          priority: c.priority,
          time: c.updatedAt || c.createdAt,
          timestamp,
          icon: FolderOpen,
          iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
        });
      }

      // 2. High Priority Warning
      if (
        c.priority === "high" &&
        c.status !== "resolved" &&
        c.status !== "rejected"
      ) {
        list.push({
          id: `high_priority_${c._id}`,
          complaintId: c._id,
          complaint: c,
          title: "High Priority Task",
          message: `Urgent pickup required at ${c.address}: "${c.title}"`,
          type: "urgent",
          priority: c.priority,
          time: c.createdAt,
          timestamp: timestamp + 1, // slight offset to order properly
          icon: AlertTriangle,
          iconColor: "text-rose-600 bg-rose-50 border-rose-100",
        });
      }

      // 3. In-Progress Task
      if (c.status === "in-progress") {
        list.push({
          id: `progress_${c._id}`,
          complaintId: c._id,
          complaint: c,
          title: "Task In Progress",
          message: `Active task in progress: "${c.title}". Update status when completed.`,
          type: "progress",
          priority: c.priority,
          time: c.updatedAt || c.createdAt,
          timestamp,
          icon: Clock,
          iconColor: "text-amber-600 bg-amber-50 border-amber-100",
        });
      }

      // 4. Resolved Task Log
      if (c.status === "resolved") {
        list.push({
          id: `resolved_${c._id}`,
          complaintId: c._id,
          complaint: c,
          title: "Task Resolved",
          message: `Complaint "${c.title}" has been marked resolved.`,
          type: "resolved",
          priority: c.priority,
          time: c.updatedAt || c.createdAt,
          timestamp,
          icon: CheckCircle2,
          iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
        });
      }
    });

    // Sort newest first
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [complaints]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !readIds.includes(n.id));
    }
    return notifications;
  }, [notifications, filter, readIds]);

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (onSelectComplaint && notif.complaint) {
      onSelectComplaint(notif.complaint);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-emerald-600 hover:bg-stone-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown / Popover */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-4 top-16 z-40 mx-auto max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-96">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900">
                  Task Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-200/60 hover:text-stone-900"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Read all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-stone-100 px-4 pt-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`border-b-2 pb-2 text-xs font-medium transition ${
                  filter === "all"
                    ? "border-emerald-800 text-emerald-900"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`ml-4 border-b-2 pb-2 text-xs font-medium transition ${
                  filter === "unread"
                    ? "border-emerald-800 text-emerald-900"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="max-h-[380px] divide-y divide-stone-100 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-stone-500">
                  {filter === "unread"
                    ? "You have caught up with all notifications!"
                    : "No task notifications available yet."}
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const Icon = notif.icon;
                  const isRead = readIds.includes(notif.id);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group flex cursor-pointer items-start gap-3 p-3.5 text-left transition hover:bg-emerald-50/50 ${
                        !isRead ? "bg-emerald-50/30" : "bg-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${notif.iconColor}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-semibold text-stone-900">
                            {notif.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-stone-400">
                            {new Date(notif.time).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">
                          {notif.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium capitalize text-stone-600">
                            {notif.complaint.category.replace("_", " ")}
                          </span>
                          {!isRead && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              Unread
                            </span>
                          )}
                        </div>
                      </div>

                      {!isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          title="Mark as read"
                          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-stone-400 opacity-0 transition hover:bg-stone-200 group-hover:opacity-100"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 bg-stone-50/60 p-2.5 text-center">
              <p className="text-[11px] text-stone-500">
                Clicking a notification opens the complaint details.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}