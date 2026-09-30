import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Recycle,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api.js";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-3 pl-11 text-sm text-stone-900 shadow-sm " +
  "placeholder:text-stone-400 transition-all duration-200 " +
  "hover:border-stone-300 hover:bg-white " +
  "focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-700/15 " +
  "disabled:bg-stone-100 disabled:text-stone-500";

function Field({ label, id, icon: Icon, ...inputProps }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium tracking-wide text-stone-600"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
        )}
        <input id={id} name={id} className={inputClass} {...inputProps} />
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email.trim() || !formData.password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.data && response.data.success) {
        const user = response.data.user;
        const role = user?.role ? user.role.toLowerCase() : "citizen";

        setSuccess(
          `Welcome back, ${user.name} (${role}). Taking you to your dashboard...`,
        );
        setFormData((prev) => ({ ...prev, password: "" }));

        // Route admins directly to /admin, others to /home
        const targetRoute = role === "admin" ? "/admin" : "/home";

        setTimeout(() => {
          navigate(targetRoute, { replace: true });
        }, 600);
      } else {
        setError(
          response.data?.message || "Login failed. Please check credentials.",
        );
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError("Network error. Unable to connect to the CleanCity server.");
      } else {
        setError("An unexpected error occurred while logging in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || Boolean(success);

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      {/* Left panel */}
      <aside className="relative hidden w-[46%] overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-lime-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-emerald-50 xl:p-14">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <Leaf className="h-5 w-5 text-lime-300" />
            </span>
            <span className="text-2xl font-semibold tracking-tight">
              CleanCity
            </span>
          </div>

          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-100/90">
              Civic reporting
            </p>
            <h2 className="max-w-md text-[2.6rem] font-semibold leading-[1.15] tracking-tight">
              Pick up where your last report left off.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-emerald-100/80">
              Check the status of your complaints, or manage pickups if you are
              part of the collection team.
            </p>

            <ul className="mt-10 space-y-3">
              {[
                { icon: MapPin, text: "Pin issues in your neighbourhood" },
                {
                  icon: Recycle,
                  text: "Track collection from report to pickup",
                },
                { icon: ShieldCheck, text: "Role-based access for every team" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-emerald-50/95 backdrop-blur-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-300/15 text-lime-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-emerald-100/60">
            Your neighbourhood, your reports.
          </p>
        </div>
      </aside>

      {/* Form */}
      <main className="relative flex flex-1 items-start justify-center px-4 py-10 sm:px-8 lg:items-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" />

        <div className="relative w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-stone-900">
              CleanCity
            </span>
          </div>

          <div className="rounded-3xl border border-stone-200/80 bg-white/80 p-7 shadow-[0_24px_80px_-32px_rgba(28,25,23,0.35)] backdrop-blur-md sm:p-8">
            <h1 className="text-[1.7rem] font-semibold tracking-tight text-stone-900">
              Log in
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              New to CleanCity?{" "}
              <Link
                to="/register"
                className="font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition hover:text-emerald-950 hover:decoration-emerald-950"
              >
                Create an account
              </Link>
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <fieldset className="space-y-4" disabled={disabled}>
                <Field
                  label="Email"
                  id="email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[13px] font-medium tracking-wide text-stone-600"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                      aria-hidden="true"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Your password"
                      required
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={disabled}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(6,95,70,0.8)] transition hover:bg-emerald-900 hover:shadow-[0_14px_28px_-10px_rgba(6,95,70,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/50 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400">
            Secure access for citizens, collectors, and admins.
          </p>
        </div>
      </main>
    </div>
  );
}