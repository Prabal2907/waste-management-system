import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Recycle,
  ShieldCheck,
  User,
} from "lucide-react";
import api from "../services/api.js";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 shadow-sm " +
  "placeholder:text-stone-400 transition-all duration-200 " +
  "hover:border-stone-300 hover:bg-white " +
  "focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-700/15 " +
  "disabled:bg-stone-100 disabled:text-stone-500";

// Defined outside Register so inputs don't lose focus on every re-render
function Field({ label, id, optional, icon: Icon, ...inputProps }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium tracking-wide text-stone-600"
      >
        {label}
        {optional && (
          <span className="font-normal text-stone-400"> (optional)</span>
        )}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          name={id}
          className={`${inputClass} ${Icon ? "pl-11" : ""}`}
          {...inputProps}
        />
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Address fields match the backend User model
    houseNo: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // { latitude, longitude } or null
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Ask the browser for the user's current position
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError(
          "Could not get your location. Allow location access in your browser and try again.",
        );
        setLocating(false);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation (matches backend rules)
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.phone.trim()
    ) {
      setError("Name, email, phone number and password are required.");
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }

    if (!/^\+?\d{10,15}$/.test(formData.phone.trim())) {
      setError("Enter a valid phone number (10 to 15 digits).");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      setError("Pincode must be 6 digits.");
      return;
    }

    setLoading(true);

    try {
      // Build the address object, keeping only the fields the user filled in
      const address = Object.fromEntries(
        Object.entries({
          houseNo: formData.houseNo.trim(),
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        }).filter(([, value]) => value),
      );

      // confirmPassword is never sent to the backend
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      };

      if (Object.keys(address).length > 0) payload.address = address;
      if (coords) payload.location = coords;

      const response = await api.post("/auth/register", payload);

      if (response.data && response.data.success) {
        setSuccess("Account created. Redirecting you to log in...");

        // Clear sensitive fields from state
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError("Network error. Unable to connect to the CleanCity server.");
      } else {
        setError("An unexpected error occurred during registration.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || Boolean(success);

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      {/* Left panel: visible on large screens only */}
      <aside className="relative hidden w-[42%] overflow-hidden lg:flex">
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
              Join the neighbourhood
            </p>
            <h2 className="max-w-md text-[2.45rem] font-semibold leading-[1.15] tracking-tight">
              Report a problem. Watch it get cleaned up.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-emerald-100/80">
              Log overflowing bins and illegal dumping in your area, then follow
              each complaint until a collector marks it resolved.
            </p>

            <ul className="mt-10 space-y-3">
              {[
                { icon: MapPin, text: "Pin issues from your street" },
                { icon: Recycle, text: "Follow every pickup to resolved" },
                { icon: ShieldCheck, text: "A free account for citizens" },
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
      <main className="relative flex flex-1 items-start justify-center px-4 py-8 sm:px-8 lg:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" />

        <div className="relative w-full max-w-lg">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-lime-300">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-stone-900">
              CleanCity
            </span>
          </div>

          <div className="rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-32px_rgba(28,25,23,0.35)] backdrop-blur-md sm:p-8">
            <h1 className="text-[1.7rem] font-semibold tracking-tight text-stone-900">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition hover:text-emerald-950 hover:decoration-emerald-950"
              >
                Log in
              </Link>
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-8" noValidate>
              {/* Account details */}
              <fieldset className="space-y-4" disabled={disabled}>
                <legend className="mb-2 text-base font-semibold text-stone-900">
                  Your details
                </legend>

                <Field
                  label="Full name"
                  id="name"
                  icon={User}
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Prabal Dwivedi"
                  required
                />
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
                <Field
                  label="Phone number"
                  id="phone"
                  icon={Phone}
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Password"
                    id="password"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    required
                  />
                  <Field
                    label="Confirm password"
                    id="confirmPassword"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 accent-emerald-800"
                  />
                  Show passwords
                </label>
              </fieldset>

              {/* Address */}
              <fieldset className="space-y-4" disabled={disabled}>
                <legend className="mb-2 text-base font-semibold text-stone-900">
                  Address{" "}
                  <span className="text-sm font-normal text-stone-400">
                    (optional)
                  </span>
                </legend>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="House no."
                    id="houseNo"
                    type="text"
                    value={formData.houseNo}
                    onChange={handleChange}
                    placeholder="12/A"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Street"
                      id="street"
                      type="text"
                      autoComplete="address-line1"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Mall Road"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="City"
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Kanpur"
                  />
                  <Field
                    label="State"
                    id="state"
                    type="text"
                    autoComplete="address-level1"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Uttar Pradesh"
                  />
                  <Field
                    label="Pincode"
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="208001"
                  />
                </div>
              </fieldset>

              {/* Location */}
              <fieldset disabled={disabled}>
                <legend className="mb-1 text-base font-semibold text-stone-900">
                  Location{" "}
                  <span className="text-sm font-normal text-stone-400">
                    (optional)
                  </span>
                </legend>
                <p className="mb-3 text-sm text-stone-500">
                  Saving your location helps us match complaints to your area.
                </p>

                {coords ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <span>
                      Saved: {coords.latitude.toFixed(5)},{" "}
                      {coords.longitude.toFixed(5)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCoords(null)}
                      className="font-medium underline underline-offset-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 disabled:opacity-60"
                  >
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-800" />
                    )}
                    {locating
                      ? "Finding your location..."
                      : "Use my current location"}
                  </button>
                )}
              </fieldset>

              <button
                type="submit"
                disabled={disabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(6,95,70,0.8)] transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}