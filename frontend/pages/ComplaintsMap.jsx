import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, AlertCircle, Eye, CheckCircle2 } from "lucide-react";

// Safe coordinate extractor handling all common formats
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
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
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

// Custom SVG Pin Maker
const createStatusPin = (status) => {
  const color = statusColors[status] || "#059669";
  const svgHtml = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background-color: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-map-pin",
    html: svgHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Auto-adjust map bounds to include all markers
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

export default function ComplaintsMap({ complaints = [], onSelectComplaint }) {
  // Parse valid map markers and invalid markers
  const { mapMarkers, unmappedCount } = useMemo(() => {
    const valid = [];
    let invalid = 0;

    complaints.forEach((c) => {
      const coords = extractCoordinates(c);
      if (coords) {
        valid.push({
          complaint: c,
          coords,
          icon: createStatusPin(c.status),
        });
      } else {
        invalid++;
      }
    });

    return { mapMarkers: valid, unmappedCount: invalid };
  }, [complaints]);

  // Default center if no complaints have coordinates (Kanpur / Default Central India)
  const defaultCenter = [26.4499, 80.3319];

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(28,25,23,0.4)]">
      {/* Map Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 font-semibold tracking-tight text-stone-900">
            <MapPin className="h-4 w-4 text-emerald-800" />
            Live Waste Reports Map
          </h2>
          <p className="text-xs text-stone-500">
            Real-time geospatial distribution of complaints across the city.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
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
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              {unmappedCount} without GPS
            </span>
          )}
        </div>
      </div>

      {/* Leaflet Map Body */}
      <div className="relative h-[420px] w-full bg-stone-100">
        <MapContainer
          center={mapMarkers.length > 0 ? mapMarkers[0].coords : defaultCenter}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          {/* OpenStreetMap TileLayer (100% Free & Open Source) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto bounds fitter */}
          {mapMarkers.length > 0 && <MapAutoBounds markers={mapMarkers} />}

          {/* Report Markers */}
          {mapMarkers.map(({ complaint: c, coords, icon }) => (
            <Marker key={c._id} position={coords} icon={icon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-1 text-stone-900">
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5">
                    <span className="text-[10px] font-bold uppercase text-stone-400">
                      ID: {c._id.slice(-6)}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize text-white"
                      style={{
                        backgroundColor: statusColors[c.status] || "#059669",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="mt-1.5 text-sm font-semibold leading-tight">
                    {c.title}
                  </h4>

                  <p className="mt-1 text-xs text-stone-600">
                    <strong className="text-stone-700">Category:</strong>{" "}
                    {c.category?.replace("_", " ")}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-stone-600">
                    <strong className="text-stone-700">Address:</strong>{" "}
                    {c.address}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-400">
                    {new Date(c.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  <button
                    type="button"
                    onClick={() => onSelectComplaint && onSelectComplaint(c)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-800 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {mapMarkers.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 p-4 text-center backdrop-blur-[2px]">
            <AlertCircle className="h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm font-medium text-stone-700">
              No geolocated complaints found.
            </p>
            <p className="text-xs text-stone-400">
              When citizens submit reports with GPS coordinates, they will
              appear here live.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
