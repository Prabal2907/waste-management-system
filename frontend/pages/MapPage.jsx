import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Leaf,
  Loader2,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api.js";
import ComplaintsMap from "../pages/ComplaintsMap.jsx";

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'assigned'
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Get logged-in user info (from localStorage or Auth Context)
  useEffect(() => {
    const userStr = localStorage.getItem("user"); // Adjust key based on your auth implementation
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        // Default to "assigned" view if the logged in user is a collector/worker
        if (user.role === "collector" || user.role === "worker") {
          setFilterMode("assigned");
        }
      } catch (e) {
        console.error("Failed to parse user info", e);
      }
    }
  }, []);

  // 2. Fetch reported issues / assigned tasks
  const fetchComplaints = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      // You can either fetch all and filter in frontend, or pass query params like /complaints?collectorId=...
      const res = await api.get("/complaints");
      const fetchedComplaints = res.data.complaints || res.data || [];
      setComplaints(fetchedComplaints);
    } catch (err) {
      console.error("Could not load complaints for map", err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const isCollector =
    currentUser?.role === "collector" || currentUser?.role === "worker";

  // 3. Filter complaints based on user selection or role
  const displayedComplaints = complaints.filter((item) => {
    // Ensure item has valid GPS coordinates
    const hasCoordinates =
      (item.latitude && item.longitude) ||
      (item.location?.coordinates && item.location.coordinates.length === 2);

    if (!hasCoordinates) return false;

    if (filterMode === "assigned" && isCollector && currentUser) {
      const assignedId =
        item.assignedTo?._id || item.assignedTo || item.collectorId;
      return assignedId === currentUser._id || assignedId === currentUser.id;
    }

    return true;
  });

  const assignedCount = complaints.filter((item) => {
    const assignedId =
      item.assignedTo?._id || item.assignedTo || item.collectorId;
    return (
      currentUser &&
      (assignedId === currentUser._id || assignedId === currentUser.id)
    );
  }).length;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f3ee] text-stone-600">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-800" />
        <p className="text-sm font-medium">Loading Live Complaints Map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300 shadow-sm">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <span className="text-lg font-bold text-emerald-950">
                  CleanCity Live Map
                </span>
                {isCollector && (
                  <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    Collector Portal
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchComplaints(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              title="Refresh Map Data"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              to="/home"
              className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-4">
        {/* Collector Filter Controls */}
        {isCollector && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <Filter className="h-4 w-4 text-emerald-800" />
              <span>Filter View:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode("assigned")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition ${
                  filterMode === "assigned"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                My Assigned Tasks ({assignedCount})
              </button>

              <button
                onClick={() => setFilterMode("all")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition ${
                  filterMode === "all"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                All City Issues ({complaints.length})
              </button>
            </div>
          </div>
        )}

        {/* Map Component */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <ComplaintsMap
            complaints={displayedComplaints}
            currentUserId={currentUser?._id || currentUser?.id}
            userRole={currentUser?.role}
          />
        </div>
      </main>
    </div>
  );
}