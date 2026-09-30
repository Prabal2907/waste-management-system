import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Leaf,
  Loader2,
  LogOut,
  MapPin,
  Search,
  X,
} from "lucide-react";
import api from "../services/api.js";

const STATUSES = [
  "pending",
  "verified",
  "assigned",
  "in-progress",
  "resolved",
  "rejected",
];
const COLLECTOR_STATUSES = ["in-progress", "resolved"];
const CATEGORIES = {
  garbage: "Garbage",
  illegal_dumping: "Illegal dumping",
  overflowing_bin: "Overflowing bin",
  dead_animal: "Dead animal",
  other: "Other",
};
const statusStyle = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-sky-100 text-sky-800",
  assigned: "bg-indigo-100 text-indigo-800",
  "in-progress": "bg-orange-100 text-orange-800",
  resolved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};
const priorityStyle = {
  high: "text-rose-700",
  medium: "text-amber-700",
  low: "text-stone-500",
};
const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm " +
  "placeholder:text-stone-400 transition " +
  "focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-700/15";

const errMsg = (err, fallback) => err.response?.data?.message || fallback;

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-stone-200/80 bg-white p-6 shadow-[0_32px_80px_-24px_rgba(28,25,23,0.45)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle[status]}`}
    >
      {status}
    </span>
  );
}

function CreateForm({ onSubmit, onError }) {
  const [f, setF] = useState({
    title: "",
    description: "",
    category: "garbage",
    address: "",
    image: "",
    latitude: "",
    longitude: "",
  });
  const set = (e) => setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  const useMyLocation = () => {
    if (!navigator.geolocation)
      return onError("Your browser does not support location access.");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setF((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        })),
      () => onError("Could not get your location. Enter it manually."),
    );
  };

  const submit = (e) => {
    e.preventDefault();
    const latitude = parseFloat(f.latitude);
    const longitude = parseFloat(f.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude))
      return onError("Add the location of the problem.");
    onSubmit({
      title: f.title.trim(),
      description: f.description.trim(),
      category: f.category,
      address: f.address.trim(),
      image: f.image.trim() || undefined,
      location: { latitude, longitude },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <input
        name="title"
        value={f.title}
        onChange={set}
        required
        minLength={3}
        placeholder="What is the problem?"
        className={inputClass}
      />
      <textarea
        name="description"
        value={f.description}
        onChange={set}
        required
        minLength={10}
        rows={3}
        placeholder="Describe it (at least 10 characters)"
        className={inputClass}
      />
      <select
        name="category"
        value={f.category}
        onChange={set}
        className={inputClass}
      >
        {Object.entries(CATEGORIES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        name="address"
        value={f.address}
        onChange={set}
        required
        placeholder="Street address"
        className={inputClass}
      />
      <input
        name="image"
        value={f.image}
        onChange={set}
        placeholder="Photo URL (optional)"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="latitude"
          value={f.latitude}
          onChange={set}
          placeholder="Latitude"
          className={inputClass}
        />
        <input
          name="longitude"
          value={f.longitude}
          onChange={set}
          placeholder="Longitude"
          className={inputClass}
        />
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 underline underline-offset-2"
      >
        <MapPin className="h-3.5 w-3.5" />
        Use my current location
      </button>
      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-800 py-2.5 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(6,95,70,0.8)] transition hover:bg-emerald-900"
      >
        Submit complaint
      </button>
    </form>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [creating, setCreating] = useState(false);

  const flash = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load the user, then their complaints
  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.get("/auth/me");
        const u = me.data.user;
        setUser(u);

        const list = await api.get(
          u.role === "admin" ? "/complaints" : "/complaints/my",
        );
        setComplaints(list.data.complaints);

        if (u.role === "admin") {
          const res = await api.get("/users/collectors");
          setCollectors(res.data.collectors);
        }
      } catch (err) {
        if (err.response?.status === 401) navigate("/login", { replace: true });
        else setPageError(errMsg(err, "Could not load data from the server."));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const replaceComplaint = (c) =>
    setComplaints((prev) => prev.map((x) => (x._id === c._id ? c : x)));

  // One helper for every API action
  const run = async (request, okMessage, onDone) => {
    try {
      const res = await request();
      onDone(res.data.complaint);
      flash(okMessage);
    } catch (err) {
      flash(errMsg(err, "Something went wrong."), "error");
    }
  };

  const updateStatus = (id, status) =>
    run(
      () => api.patch(`/complaints/${id}/status`, { status }),
      `Status set to ${status}`,
      (c) => {
        replaceComplaint(c);
        setSelected(c);
      },
    );

  const assign = (id, collectorId) =>
    run(
      () => api.patch(`/complaints/${id}/assign`, { collectorId }),
      "Complaint assigned",
      (c) => {
        replaceComplaint(c);
        setAssigning(null);
      },
    );

  const create = (payload) =>
    run(
      () => api.post("/complaints", payload),
      "Complaint submitted",
      (c) => {
        setComplaints((prev) => [c, ...prev]);
        setCreating(false);
      },
    );

  const stats = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const rejected = complaints.filter((c) => c.status === "rejected").length;
    return {
      total: complaints.length,
      resolved,
      open: complaints.length - resolved - rejected,
    };
  }, [complaints]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        (statusFilter === "all" || c.status === statusFilter) &&
        (!q ||
          c.title.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)),
    );
  }, [complaints, search, statusFilter]);

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f3ee] text-stone-600">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
        Loading your dashboard...
      </div>
    );

  if (pageError)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f3ee] px-4 text-center">
        <p className="text-red-700">{pageError}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Try again
        </button>
      </div>
    );

  const heading = {
    citizen: "Your reports",
    collector: "Complaints assigned to you",
    admin: "All complaints",
  }[user.role];

  const statMeta = [
    ["Total", stats.total, ClipboardList, "from-emerald-900 to-teal-800"],
    ["Open", stats.open, FolderOpen, "from-amber-600 to-orange-700"],
    ["Resolved", stats.resolved, CheckCircle2, "from-emerald-600 to-lime-700"],
  ];

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === "error" ? "bg-rose-700" : "bg-emerald-800"}`}
        >
          {toast.message}
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-emerald-950">
              CleanCity
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user.role === "citizen" && (
              <button
                onClick={() => setCreating(true)}
                className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(6,95,70,0.8)] transition hover:bg-emerald-900"
              >
                Report waste
              </button>
            )}
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs capitalize text-stone-500">
                {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm transition hover:bg-stone-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-800/80">
          Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {heading}
        </h1>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {statMeta.map(([label, value, Icon, gradient]) => (
            <div
              key={label}
              className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_16px_40px_-28px_rgba(28,25,23,0.4)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {value}
                  </div>
                  <div className="text-sm text-stone-500">{label}</div>
                </div>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or address"
              className={`${inputClass} pl-10`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputClass} sm:w-48`}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center text-stone-600">
            {complaints.length === 0
              ? user.role === "citizen"
                ? "You have not reported anything yet. Use Report waste to file your first complaint."
                : "Nothing here yet."
              : "No complaints match your filters."}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <article
                key={c._id}
                className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(28,25,23,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-24px_rgba(28,25,23,0.45)]"
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.title}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={c.status} />
                    <span
                      className={`text-xs font-medium capitalize ${priorityStyle[c.priority]}`}
                    >
                      {c.priority} priority
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold tracking-tight">
                    {c.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                    {c.description}
                  </p>
                  <p className="mt-3 text-xs text-stone-500">
                    {CATEGORIES[c.category]} &middot; {c.address}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {c.assignedTo
                      ? `Assigned to ${c.assignedTo.name}`
                      : "Not assigned yet"}
                  </p>
                  <div className="mt-4 flex gap-2 pt-1">
                    <button
                      onClick={() => setSelected(c)}
                      className="rounded-xl border border-stone-200 px-3 py-1.5 text-sm transition hover:bg-stone-100"
                    >
                      Details
                    </button>
                    {user.role === "admin" &&
                      !["resolved", "rejected"].includes(c.status) && (
                        <button
                          onClick={() => setAssigning(c)}
                          className="rounded-xl bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-900"
                        >
                          {c.assignedTo ? "Reassign" : "Assign"}
                        </button>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Details */}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          {selected.image && (
            <img
              src={selected.image}
              alt={selected.title}
              className="mb-4 h-48 w-full rounded-2xl object-cover"
            />
          )}
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={selected.status} />
            <span
              className={`text-xs font-medium capitalize ${priorityStyle[selected.priority]}`}
            >
              {selected.priority} priority
            </span>
          </div>
          <p className="text-sm leading-relaxed">{selected.description}</p>
          <dl className="mt-4 space-y-1 text-sm text-stone-600">
            <div>Category: {CATEGORIES[selected.category]}</div>
            <div>Address: {selected.address}</div>
            <div>Reported: {new Date(selected.createdAt).toLocaleString()}</div>
            {user.role !== "citizen" && selected.reportedBy && (
              <div>
                Reporter: {selected.reportedBy.name} (
                {selected.reportedBy.phone})
              </div>
            )}
            <div>
              Collector:{" "}
              {selected.assignedTo
                ? selected.assignedTo.name
                : "Not assigned yet"}
            </div>
          </dl>

          {(user.role === "admin" || user.role === "collector") && (
            <div className="mt-5 border-t border-stone-200 pt-4">
              <h3 className="mb-2 text-sm font-semibold">Update status</h3>
              <div className="flex flex-wrap gap-2">
                {(user.role === "admin" ? STATUSES : COLLECTOR_STATUSES).map(
                  (s) => (
                    <button
                      key={s}
                      disabled={selected.status === s}
                      onClick={() => updateStatus(selected._id, s)}
                      className="rounded-xl border border-stone-200 px-3 py-1.5 text-sm capitalize transition hover:bg-stone-100 disabled:border-emerald-800 disabled:bg-emerald-800 disabled:text-white"
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Assign */}
      {assigning && (
        <Modal title="Assign a collector" onClose={() => setAssigning(null)}>
          <p className="mb-3 text-sm text-stone-600">{assigning.title}</p>
          {collectors.length === 0 ? (
            <p className="text-sm text-stone-600">
              No active collectors yet. Change a user's role to collector in the
              database.
            </p>
          ) : (
            <ul className="space-y-2">
              {collectors.map((col) => (
                <li key={col._id}>
                  <button
                    onClick={() => assign(assigning._id, col._id)}
                    className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm transition hover:border-emerald-700 hover:bg-emerald-50"
                  >
                    <div className="font-medium">{col.name}</div>
                    <div className="text-xs text-stone-500">{col.phone}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {/* Create */}
      {creating && (
        <Modal
          title="Report a waste problem"
          onClose={() => setCreating(false)}
        >
          <CreateForm onSubmit={create} onError={(m) => flash(m, "error")} />
        </Modal>
      )}
    </div>
  );
}