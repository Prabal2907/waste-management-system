import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  AlertCircle,
  Eye,
  Navigation,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from "lucide-react";

// Safe coordinate extractor handling all backend formats
export const extractCoordinates = (complaint) => {
  if (!complaint) return null;

  // Format 1: location.latitude and location.longitude
  if (
    complaint.location?.latitude !== undefined &&
    complaint.location?.longitude !== undefined
  ) {
    const lat = parseFloat(complaint.location.latitude);
    const lng = parseFloat(complaint.location.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng];
    }
  }

  // Format 2: GeoJSON coordinates [longitude, latitude]
  if (
    Array.isArray(complaint.location?.coordinates) &&
    complaint.location.coordinates.length >= 2
  ) {
    const lng = parseFloat(complaint.location.coordinates[0]);
    const lat = parseFloat(complaint.location.coordinates[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return [lat, lng];
    }
  }

  // Format 3: Direct latitude and longitude fields
  if (complaint.latitude !== undefined && complaint.longitude !== undefined) {
    const lat = parseFloat(complaint.latitude);
    const lng = parseFloat(complaint.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng];
    }
  }

  return null;
};

// Status Colors
const statusColors = {
  pending: "#f59e0b", // Amber
  verified: "#0284c7", // Sky
  assigned: "#6366f1", // Indigo
  "in-progress": "#ea580c", // Orange
  resolved: "#059669", // Emerald
  rejected: "#e11d48", // Rose
};

// Custom SVG Pin Maker (with special highlight for Collector's assigned tasks)
const createStatusPin = (status, isMyTask = false) => {
  const color = statusColors[status?.toLowerCase()] || "#059669";

  const pinHtml = isMyTask
    ? `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing Ring for Assigned Task -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          background-color: rgba(99, 102, 241, 0.35);
          border-radius: 50%;
          animation: pulse 1.8s infinite ease-out;
        "></div>

        <!-- Pin Head -->
        <div style="
          width: 34px;
          height: 34px;
          background-color: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(0,0,0,0.45);
          border: 3px solid #facc15; /* Gold border for collector task */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">
          <!-- Star/Dot icon inside pin -->
          <div style="
            width: 10px;
            height: 10px;
            background-color: #facc15;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `
    : `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <div style="
          width: 9px;
          height: 9px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `;

  return L.divIcon({
    className: isMyTask ? "collector-assigned-pin" : "custom-map-pin",
    html: pinHtml,
    iconSize: isMyTask ? [44, 44] : [30, 30],
    iconAnchor: isMyTask ? [22, 38] : [15, 30],
    popupAnchor: [0, -32],
  });
};

// Auto-adjust map bounds to fit markers
function MapAutoBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !markers || markers.length === 0) return;

    try {
      const bounds = L.latLngBounds(markers.map((m) => m.coords));
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    } catch (err) {
      console.error("Could not fit map bounds:", err);
    }
  }, [map, markers]);

  return null;
}

export default function ComplaintsMap({
  complaints = [],
  currentUserId,
  userRole,
  onSelectComplaint,
}) {
  // Try retrieving user ID from localStorage if not explicitly passed
  const activeUserId = useMemo(() => {
    if (currentUserId) return currentUserId;
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      return savedUser._id || savedUser.id || null;
    } catch {
      return null;
    }
  }, [currentUserId]);

  // Parse valid coordinates and identify collector assignments
  const { mapMarkers, unmappedCount, myTasksCount } = useMemo(() => {
    const valid = [];
    let invalid = 0;
    let myCount = 0;

    complaints.forEach((c) => {
      const coords = extractCoordinates(c);
      if (coords) {
        const assignedId =
          c.assignedTo?._id ||
          c.assignedTo ||
          c.collectorId ||
          c.assignedCollector;
        const isMyTask =
          Boolean(activeUserId) &&
          (assignedId === activeUserId || assignedId?._id === activeUserId);

        if (isMyTask) myCount++;

        valid.push({
          complaint: c,
          coords,
          isMyTask,
          icon: createStatusPin(c.status, isMyTask),
        });
      } else {
        invalid++;
      }
    });

    return { mapMarkers: valid, unmappedCount: invalid, myTasksCount: myCount };
  }, [complaints, activeUserId]);

  // Default fallback center
  const defaultCenter = [26.4499, 80.3319];

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(28,25,23,0.4)]">
      {/* Map Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight text-stone-900">
              <MapPin className="h-4 w-4 text-emerald-800" />
              Live Waste Reports Map
            </h2>
            {myTasksCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-300">
                <Sparkles className="h-3 w-3 text-amber-600" />
                {myTasksCount} Assigned to You
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time geospatial distribution of reported citizen issues &
            assigned pickups.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {myTasksCount > 0 && (
            <div className="flex items-center gap-1.5 font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <span className="h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-amber-400" />
              Your Tasks
            </div>
          )}

          {Object.entries(statusColors).map(([st, col]) => (
            <div
              key={st}
              className="flex items-center gap-1.5 capitalize text-stone-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: col }}
              />
              {st}
            </div>
          ))}

          {unmappedCount > 0 && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
              {unmappedCount} without GPS
            </span>
          )}
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative h-[480px] w-full bg-stone-100">
        <MapContainer
          center={mapMarkers.length > 0 ? mapMarkers[0].coords : defaultCenter}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapMarkers.length > 0 && <MapAutoBounds markers={mapMarkers} />}

          {mapMarkers.map(({ complaint: c, coords, icon, isMyTask }) => (
            <Marker key={c._id} position={coords} icon={icon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-1.5 text-stone-900 w-[240px] sm:w-[260px]">
                  {/* Assigned to collector banner */}
                  {isMyTask && (
                    <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                      <UserCheck className="h-3.5 w-3.5" />
                      Assigned to You
                    </div>
                  )}

                  {/* Header: ID + Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                    <span className="text-[10px] font-bold uppercase text-stone-400">
                      #{c._id?.slice(-6) || "REPORT"}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize text-white"
                      style={{
                        backgroundColor:
                          statusColors[c.status?.toLowerCase()] || "#059669",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Waste Photo thumbnail if available */}
                  {(c.imageUrl || c.image) && (
                    <img
                      src={c.imageUrl || c.image}
                      alt={c.title || "Waste issue"}
                      className="mt-2 h-24 w-full rounded-lg object-cover border border-stone-200"
                    />
                  )}

                  {/* Title & Category */}
                  <h4 className="mt-1.5 text-sm font-semibold leading-snug">
                    {c.title || "Waste Report"}
                  </h4>

                  <div className="mt-1.5 space-y-1 text-xs text-stone-600">
                    <p>
                      <strong className="text-stone-700">Category:</strong>{" "}
                      {c.category?.replace("_", " ") || "General"}
                    </p>
                    {c.priority && (
                      <p>
                        <strong className="text-stone-700">Priority:</strong>{" "}
                        <span
                          className={`font-semibold ${
                            c.priority === "high" || c.priority === "urgent"
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </p>
                    )}
                    <p className="line-clamp-2">
                      <strong className="text-stone-700">Address:</strong>{" "}
                      {c.address ||
                        `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`}
                    </p>
                  </div>

                  {/* Actions for Collector & User */}
                  <div className="mt-3 flex gap-2">
                    {/* Direct Google Maps Navigation */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-stone-50 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      <Navigation className="h-3.5 w-3.5 text-emerald-800" />
                      Navigate
                    </a>

                    <button
                      type="button"
                      onClick={() => onSelectComplaint && onSelectComplaint(c)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-800 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Empty state */}
        {mapMarkers.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 p-4 text-center backdrop-blur-[2px]">
            <AlertCircle className="h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm font-medium text-stone-700">
              No geolocated complaints available right now.
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              When reports with coordinates are submitted or assigned, they will
              appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}