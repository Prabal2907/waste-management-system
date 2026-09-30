import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Home as HomeIcon,
  Leaf,
  Loader2,
  LogOut,
  Search,
  Truck,
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
const CLOSED = ["resolved", "rejected"];
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
const barColor = {
  pending: "bg-amber-500",
  verified: "bg-sky-500",
  assigned: "bg-indigo-500",
  "in-progress": "bg-orange-500",
  resolved: "bg-emerald-600",
  rejected: "bg-rose-500",
};
const priorityStyle = {
  high: "text-rose-700",
  medium: "text-amber-700",
  low: "text-stone-500",
};
const priorityRank = { high: 0, medium: 1, low: 2 };
const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-700/15";
const cardClass =
  "rounded-2xl border border-stone-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(28,25,23,0.4)]";

const errMsg = (err, fallback) => err.response?.data?.message || fallback;

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-stone-200/80 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-900"
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
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle[status] || "bg-stone-100 text-stone-800"}`}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <div className="mt-0.5 text-sm text-stone-600">{label}</div>
          <div className="mt-1 text-xs text-stone-400">{hint}</div>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function BarList({ title, rows, total }) {
  return (
    <div className={`${cardClass} p-5`}>
      <h3 className="mb-4 font-semibold tracking-tight">{title}</h3>
      <ul className="space-y-3">
        {rows.map(([label, count, color]) => (
          <li key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="capitalize text-stone-700">{label}</span>
              <span className="text-stone-500">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const flash = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.get("/auth/me");
        const currentUser = me.data.user;
        if (currentUser?.role?.toLowerCase() !== "admin") {
          navigate("/home", { replace: true });
          return;
        }
        setUser(currentUser);
        const [list, cols] = await Promise.all([
          api.get("/complaints"),
          api.get("/users/collectors"),
        ]);
        setComplaints(list.data.complaints || []);
        setCollectors(cols.data.collectors || []);
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

  const applyUpdate = (c) => {
    setComplaints((prev) => prev.map((x) => (x._id === c._id ? c : x)));
    setSelected((s) => (s && s._id === c._id ? c : s));
    setAssigning(null);
  };

  const run = async (request, okMessage) => {
    try {
      const res = await request();
      applyUpdate(res.data.complaint);
      flash(okMessage);
    } catch (err) {
      flash(errMsg(err, "Something went wrong."), "error");
    }
  };

  const updateStatus = (id, status) =>
    run(
      () => api.patch(`/complaints/${id}/status`, { status }),
      `Status set to ${status}`,
    );
  const assign = (id, collectorId) =>
    run(
      () => api.patch(`/complaints/${id}/assign`, { collectorId }),
      "Complaint assigned",
    );

  const stats = useMemo(() => {
    const count = (fn) => complaints.filter(fn).length;
    const resolved = count((c) => c.status === "resolved");
    return {
      total: complaints.length,
      unassigned: count((c) => !c.assignedTo && !CLOSED.includes(c.status)),
      active: count((c) => ["assigned", "in-progress"].includes(c.status)),
      resolved,
      rate: complaints.length
        ? Math.round((resolved / complaints.length) * 100)
        : 0,
    };
  }, [complaints]);

  const statusRows = STATUSES.map((s) => [
    s,
    complaints.filter((c) => c.status === s).length,
    barColor[s],
  ]);
  const categoryRows = Object.entries(CATEGORIES).map(([key, label]) => [
    label,
    complaints.filter((c) => c.category === key).length,
    "bg-emerald-700",
  ]);

  const queue = useMemo(
    () =>
      complaints
        .filter((c) => !c.assignedTo && !CLOSED.includes(c.status))
        .sort(
          (a, b) =>
            priorityRank[a.priority] - priorityRank[b.priority] ||
            new Date(a.createdAt) - new Date(b.createdAt),
        )
        .slice(0, 5),
    [complaints],
  );

  const workload = useMemo(
    () =>
      collectors.map((col) => {
        const mine = complaints.filter((c) => c.assignedTo?._id === col._id);
        return {
          ...col,
          active: mine.filter((c) => !CLOSED.includes(c.status)).length,
          done: mine.filter((c) => c.status === "resolved").length,
        };
      }),
    [collectors, complaints],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        (statusFilter === "all" || c.status === statusFilter) &&
        (categoryFilter === "all" || c.category === categoryFilter) &&
        (priorityFilter === "all" || c.priority === priorityFilter) &&
        (!q ||
          c.title?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.reportedBy?.name?.toLowerCase().includes(q)),
    );
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f3ee] text-stone-600">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
        Loading admin dashboard...
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900">
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "error" ? "bg-rose-700" : "bg-emerald-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-emerald-950">
              CleanCity
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm transition hover:bg-stone-100"
            >
              <HomeIcon className="h-4 w-4" />
              User View
            </Link>
            <span className="hidden text-sm font-medium sm:inline">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm hover:bg-stone-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Assign collectors, track progress, and close out complaints.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total complaints"
            value={stats.total}
            hint="All time"
            icon={ClipboardList}
            tone="bg-emerald-900"
          />
          <StatCard
            label="Need a collector"
            value={stats.unassigned}
            hint="Open and unassigned"
            icon={FolderOpen}
            tone="bg-amber-600"
          />
          <StatCard
            label="In the field"
            value={stats.active}
            hint="Assigned or in progress"
            icon={Truck}
            tone="bg-indigo-600"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            hint={`${stats.rate}% resolution rate`}
            icon={CheckCircle2}
            tone="bg-emerald-600"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BarList
            title="Complaints by status"
            rows={statusRows}
            total={stats.total}
          />
          <BarList
            title="Complaints by category"
            rows={categoryRows}
            total={stats.total}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Needs attention */}
          <section className={`${cardClass} p-5`}>
            <h2 className="font-semibold tracking-tight">Needs a collector</h2>
            <p className="mb-3 text-sm text-stone-500">
              Highest priority and oldest first.
            </p>
            {queue.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                Every open complaint has a collector.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {queue.map((c) => (
                  <li
                    key={c._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {c.title}
                      </div>
                      <div className="truncate text-xs text-stone-500">
                        <span
                          className={`font-medium capitalize ${priorityStyle[c.priority] || "text-stone-500"}`}
                        >
                          {c.priority}
                        </span>{" "}
                        &middot; {c.address}
                      </div>
                    </div>
                    <button
                      onClick={() => setAssigning(c)}
                      className="shrink-0 rounded-xl bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-900"
                    >
                      Assign
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Collector workload */}
          <section className={`${cardClass} p-5`}>
            <h2 className="font-semibold tracking-tight">Collector workload</h2>
            <p className="mb-3 text-sm text-stone-500">
              Open jobs per active collector.
            </p>
            {workload.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                No active collectors yet. Change a user's role to collector in
                the database.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {workload.map((col) => (
                  <li
                    key={col._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {col.name}
                      </div>
                      <div className="truncate text-xs text-stone-500">
                        {col.phone}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <span className="font-semibold">{col.active}</span> open
                      <div className="text-xs text-stone-500">
                        {col.done} resolved
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* All complaints table */}
        <section className={`${cardClass} p-5`}>
          <h2 className="font-semibold tracking-tight">All complaints</h2>

          <div className="mb-4 mt-3 grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, address, reporter"
                className={`${inputClass} pl-10`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORIES).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              {complaints.length === 0
                ? "No complaints have been reported yet."
                : "No complaints match your filters."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-stone-200 text-xs text-stone-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Complaint</th>
                    <th className="pb-2 pr-3 font-medium">Reporter</th>
                    <th className="pb-2 pr-3 font-medium">Priority</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Collector</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td className="py-3 pr-3">
                        <div className="max-w-[260px] truncate font-medium">
                          {c.title}
                        </div>
                        <div className="max-w-[260px] truncate text-xs text-stone-500">
                          {CATEGORIES[c.category] || c.category} &middot;{" "}
                          {c.address}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-stone-600">
                        {c.reportedBy?.name || "Unknown"}
                      </td>
                      <td
                        className={`py-3 pr-3 text-xs font-medium capitalize ${priorityStyle[c.priority] || "text-stone-500"}`}
                      >
                        {c.priority}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 pr-3 text-stone-600">
                        {c.assignedTo?.name || "Not assigned"}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelected(c)}
                            className="rounded-xl border border-stone-200 px-3 py-1.5 hover:bg-stone-100"
                          >
                            View
                          </button>
                          {!CLOSED.includes(c.status) && (
                            <button
                              onClick={() => setAssigning(c)}
                              className="rounded-xl bg-emerald-800 px-3 py-1.5 font-medium text-white hover:bg-emerald-900"
                            >
                              {c.assignedTo ? "Reassign" : "Assign"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Details Modal */}
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
              className={`text-xs font-medium capitalize ${priorityStyle[selected.priority] || "text-stone-500"}`}
            >
              {selected.priority} priority
            </span>
          </div>
          <p className="text-sm leading-relaxed">{selected.description}</p>
          <dl className="mt-4 space-y-1 text-sm text-stone-600">
            <div>
              Category: {CATEGORIES[selected.category] || selected.category}
            </div>
            <div>Address: {selected.address}</div>
            <div>Reported: {new Date(selected.createdAt).toLocaleString()}</div>
            {selected.reportedBy && (
              <div>
                Reporter: {selected.reportedBy.name} (
                {selected.reportedBy.phone})
              </div>
            )}
            <div>
              Collector:{" "}
              {selected.assignedTo
                ? `${selected.assignedTo.name} (${selected.assignedTo.phone})`
                : "Not assigned yet"}
            </div>
          </dl>
          <div className="mt-5 border-t border-stone-200 pt-4">
            <h3 className="mb-2 text-sm font-semibold">Update status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={selected.status === s}
                  onClick={() => updateStatus(selected._id, s)}
                  className="rounded-xl border border-stone-200 px-3 py-1.5 text-sm capitalize transition hover:bg-stone-100 disabled:border-emerald-800 disabled:bg-emerald-800 disabled:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
            {!CLOSED.includes(selected.status) && (
              <button
                onClick={() => setAssigning(selected)}
                className="mt-4 w-full rounded-xl bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                {selected.assignedTo
                  ? "Reassign collector"
                  : "Assign collector"}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Assign Modal */}
      {assigning && (
        <Modal title="Assign a collector" onClose={() => setAssigning(null)}>
          <p className="mb-3 text-sm text-stone-600">{assigning.title}</p>
          {workload.length === 0 ? (
            <p className="text-sm text-stone-600">
              No active collectors yet. Change a user's role to collector in the
              database.
            </p>
          ) : (
            <ul className="space-y-2">
              {workload.map((col) => (
                <li key={col._id}>
                  <button
                    onClick={() => assign(assigning._id, col._id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm transition hover:border-emerald-700 hover:bg-emerald-50"
                  >
                    <span>
                      <span className="block font-medium">{col.name}</span>
                      <span className="text-xs text-stone-500">
                        {col.phone}
                      </span>
                    </span>
                    <span className="text-xs text-stone-500">
                      {col.active} open
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}