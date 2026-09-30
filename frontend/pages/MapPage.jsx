import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, Loader2 } from "lucide-react";
import api from "../services/api.js";
import ComplaintsMap from "../pages/ComplaintsMap.jsx";

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get("/complaints");
        setComplaints(res.data.complaints || []);
      } catch (err) {
        console.error("Could not load complaints for map", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f3ee] text-stone-600">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
        Loading Live Map...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="text-lg font-bold text-emerald-950">
                CleanCity Live Map
              </span>
            </div>
          </div>
          <Link
            to="/home"
            className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <ComplaintsMap complaints={complaints} />
      </main>
    </div>
  );
}
