import { useEffect, useMemo, useState } from "react";
import api from "./api/api";
import "./App.css";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "hall", label: "Halls" },
  { value: "equipment", label: "Equipment" },
  { value: "room", label: "Rooms" },
  { value: "other", label: "Other" },
];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const localInput = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("campusdesk_user") || "null")
  );
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    const onLogout = () => {
      setUser(null);
      if (window.location.pathname !== "/login") {
        window.history.pushState({}, "", "/login");
        setRoute("/login");
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("campusdesk:logout", onLogout);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("campusdesk:logout", onLogout);
    };
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const login = (token, nextUser) => {
    localStorage.setItem("campusdesk_token", token);
    localStorage.setItem("campusdesk_user", JSON.stringify(nextUser));
    setUser(nextUser);
    navigate("/resources");
  };

  const logout = () => {
    localStorage.removeItem("campusdesk_token");
    localStorage.removeItem("campusdesk_user");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    if (!user && route !== "/login") {
      navigate("/login");
    }
  }, [user, route]);

  useEffect(() => {
    if (user && route === "/login") navigate("/resources");
  }, [user, route]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  let content;

  if (route === "/resources") {
    content = <ResourcesPage navigate={navigate} />;
  } else if (route.startsWith("/resources/")) {
    const id = Number(route.split("/")[2]);
    content = <ResourceDetailsPage resourceId={id} navigate={navigate} />;
  } else if (route === "/my-bookings") {
    content = <MyBookingsPage />;
  } else if (route === "/admin") {
    content =
      user.role === "ADMIN" ? (
        <AdminPage />
      ) : (
        <AccessDenied navigate={navigate} />
      );
  } else {
    content = <ResourcesPage navigate={navigate} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("/resources")}>
          <span className="brand-mark">C</span>
          <span>CampusDesk</span>
        </button>

        <nav>
          <button
            className={route.startsWith("/resources") ? "nav-active" : ""}
            onClick={() => navigate("/resources")}
          >
            Resources
          </button>
          <button
            className={route === "/my-bookings" ? "nav-active" : ""}
            onClick={() => navigate("/my-bookings")}
          >
            My bookings
          </button>
          {user.role === "ADMIN" && (
            <button
              className={route === "/admin" ? "nav-active" : ""}
              onClick={() => navigate("/admin")}
            >
              Admin
            </button>
          )}
        </nav>

        <div className="account">
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === "ADMIN" ? "Administrator" : "Student"}</span>
          </div>
          <button className="button ghost small" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="page">{content}</main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [step, setStep] = useState("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((v) => v - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      const response = await api.post("/auth/send-otp", { name, email });
      setStep("otp");
      setCooldown(30);
      setMessage(
        response.data.developmentMode
          ? "OTP generated. Check the server terminal for the 6-digit code."
          : "OTP sent to your email."
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      const response = await api.post("/auth/verify-otp", {
        name,
        email,
        otp,
      });
      onLogin(response.data.token, response.data.user);
    } catch (error) {
      setMessage(getErrorMessage(error));
      setErrors(error.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <span className="brand-mark">C</span>
          CampusDesk
        </div>
        <p className="eyebrow">LNMIIT CAMPUS RESOURCES</p>
        <h1>{step === "email" ? "Welcome!!" : "Check your OTP."}</h1>
        <p className="login-copy">
          {step === "email"
            ? "We will send you a one-time verification code."
            : `Enter the 6-digit code generated for ${email}.`}
        </p>

        {step === "email" ? (
          <form onSubmit={requestOtp} className="form">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>

            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your_roll_number@lnmiit.ac.in"
                type="email"
                autoComplete="email"
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </label>

            <button className="button primary wide" disabled={loading}>
              {loading ? "Sending..." : "Continue with email"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="form">
            <label>
              Verification code
              <input
                className="otp-input"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                inputMode="numeric"
                autoFocus
              />
              {errors.otp && <span className="field-error">{errors.otp}</span>}
            </label>

            <button className="button primary wide" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify and sign in"}
            </button>

            <div className="resend-row">
              <span>{cooldown ? `Resend available in ${cooldown}s` : "Didn't get a code?"}</span>
              <button
                type="button"
                className="link-button"
                disabled={cooldown > 0 || loading}
                onClick={requestOtp}
              >
                Resend OTP
              </button>
            </div>

            <button
              type="button"
              className="link-button back-link"
              onClick={() => {
                setStep("email");
                setMessage("");
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}

function ResourcesPage({ navigate }) {
  const [resources, setResources] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, limit: 9 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const fetchResources = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/resources", {
          params: { search, category, page, limit: 9 },
        });
        if (!cancelled) {
          setResources(response.data.data);
          setMeta(response.data);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResources();
    return () => {
      cancelled = true;
    };
  }, [search, category, page]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">CAMPUS RESOURCE DIRECTORY</p>
          <h1>Find a place or piece of equipment.</h1>
          <p>Check availability before you book. Every confirmed slot is protected against overlaps.</p>
        </div>
        <div className="stat-card">
          <strong>{meta.total}</strong>
          <span>available resources</span>
        </div>
      </section>

      <section className="toolbar">
        <input
          className="search-input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search halls, equipment, rooms..."
        />
        <div className="filter-row">
          {CATEGORIES.map((item) => (
            <button
              key={item.value || "all"}
              className={category === item.value ? "filter active" : "filter"}
              onClick={() => {
                setCategory(item.value);
                setPage(1);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : resources.length === 0 ? (
        <EmptyState title="No resources found" text="Try a different search or category." />
      ) : (
        <>
          <div className="resource-grid">
            {resources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <div className="resource-card-top">
                  <span className="category-badge">{resource.category}</span>
                  <span className="active-dot">Available</span>
                </div>
                <h2>{resource.name}</h2>
                <p>{resource.description}</p>
                <div className="resource-meta">
                  <span>{resource.location}</span>
                  <span>{resource.openTime} – {resource.closeTime}</span>
                </div>
                <button
                  className="button secondary wide"
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  View availability
                </button>
              </article>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}

function ResourceDetailsPage({ resourceId, navigate }) {
  const [resource, setResource] = useState(null);
  const [date, setDate] = useState(tomorrow());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [conflict, setConflict] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const user = JSON.parse(localStorage.getItem("campusdesk_user") || "null");

  useEffect(() => {
    const loadResource = async () => {
      try {
        const response = await api.get(`/resources/${resourceId}`);
        setResource(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadResource();
  }, [resourceId]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!resource) return;
      setBookingError("");
      try {
        const response = await api.get(`/bookings/resource/${resourceId}`, {
          params: { date },
        });
        setBookings(response.data);
      } catch (err) {
        setBookingError(getErrorMessage(err));
      }
    };
    loadBookings();
  }, [resource, resourceId, date]);

  const slots = useMemo(() => {
    if (!resource) return [];
    const [openH, openM] = resource.openTime.split(":").map(Number);
    const [closeH, closeM] = resource.closeTime.split(":").map(Number);
    const result = [];
    const start = openH * 60 + openM;
    const end = closeH * 60 + closeM;

    for (let minute = start; minute < end; minute += 30) {
      const h = Math.floor(minute / 60);
      const m = minute % 60;
      result.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    return result;
  }, [resource]);

  const slotDate = (time) => new Date(`${date}T${time}:00`);

  const isBooked = (time) => {
    const start = slotDate(time);
    const end = new Date(start.getTime() + 30 * 60000);
    return bookings.some(
      (b) => new Date(b.startTime) < end && new Date(b.endTime) > start
    );
  };

  const bookingOwner = (time) => {
    const start = slotDate(time);
    const end = new Date(start.getTime() + 30 * 60000);
    return bookings.some(
      (b) =>
        b.userId === user?.id &&
        new Date(b.startTime) < end &&
        new Date(b.endTime) > start
    );
  };

  const selectSlot = (time) => {
    if (isBooked(time)) return;
    const start = slotDate(time);
    const end = new Date(start.getTime() + 60 * 60000);
    const [closeH, closeM] = resource.closeTime.split(":").map(Number);
    const closeDate = new Date(`${date}T${String(closeH).padStart(2, "0")}:${String(closeM).padStart(2, "0")}:00`);
    const finalEnd = end > closeDate ? new Date(start.getTime() + 30 * 60000) : end;
    setStartTime(localInput(start));
    setEndTime(localInput(finalEnd));
    setBookingError("");
    setFieldErrors({});
    setConflict(null);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingLoading(true);
    setBookingError("");
    setFieldErrors({});
    setConflict(null);

    try {
      await api.post("/bookings", {
        resourceId,
        startTime,
        endTime,
        purpose,
      });
      setPurpose("");
      setStartTime("");
      setEndTime("");
      const response = await api.get(`/bookings/resource/${resourceId}`, {
        params: { date },
      });
      setBookings(response.data);
      setBookingError("");
    } catch (err) {
      setBookingError(getErrorMessage(err));
      setFieldErrors(err.response?.data?.errors || {});
      setConflict(err.response?.data?.conflict || null);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!resource) return null;

  return (
    <>
      <button className="back-button" onClick={() => navigate("/resources")}>
        ← Back to resources
      </button>

      <section className="detail-heading">
        <div>
          <span className="category-badge">{resource.category}</span>
          <h1>{resource.name}</h1>
          <p>{resource.description} · {resource.location}</p>
        </div>
        <div className="hours">
          <span>Open hours</span>
          <strong>{resource.openTime} – {resource.closeTime}</strong>
        </div>
      </section>

      <section className="availability-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AVAILABILITY</p>
            <h2>Choose a day</h2>
          </div>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {bookingError && !startTime && <div className="error-banner">{bookingError}</div>}
        {bookingError && startTime && (
          <div className="error-banner">
            <strong>{bookingError}</strong>
            {fieldErrors.startTime && <span>{fieldErrors.startTime}</span>}
            {fieldErrors.endTime && <span>{fieldErrors.endTime}</span>}
          </div>
        )}

        <div className="legend">
          <span><i className="legend-free" /> Free</span>
          <span><i className="legend-booked" /> Booked</span>
          <span><i className="legend-own" /> Your booking</span>
        </div>

        <div className="timeline">
          {slots.map((time) => {
            const booked = isBooked(time);
            const own = bookingOwner(time);
            return (
              <button
                key={time}
                disabled={booked || slotDate(time) <= new Date()}
                className={`slot ${booked ? "booked" : "free"} ${own ? "own" : ""}`}
                onClick={() => selectSlot(time)}
              >
                <strong>{time}</strong>
                <span>{booked ? (own ? "Your booking" : "Booked") : "Free"}</span>
              </button>
            );
          })}
        </div>

        {conflict && (
          <div className="conflict-note">
            <strong>Clashing booking:</strong>{" "}
            {formatDateTime(conflict.startTime)} – {formatTime(conflict.endTime)}
            {" · "}{conflict.purpose}
          </div>
        )}
      </section>

      <section className="booking-panel" id="booking-form">
        <div>
          <p className="eyebrow">RESERVE THIS RESOURCE</p>
          <h2>Make a booking</h2>
          <p>Bookings must be 30 minutes to 4 hours and must stay inside the resource's opening hours.</p>
        </div>

        <form onSubmit={submitBooking} className="booking-form">
          <label>
            Start
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            {fieldErrors.startTime && <span className="field-error">{fieldErrors.startTime}</span>}
          </label>

          <label>
            End
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            {fieldErrors.endTime && <span className="field-error">{fieldErrors.endTime}</span>}
          </label>

          <label className="full">
            Purpose
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Robotics club meeting"
            />
            {fieldErrors.purpose && <span className="field-error">{fieldErrors.purpose}</span>}
          </label>

          <button className="button primary" disabled={bookingLoading}>
            {bookingLoading ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      </section>
    </>
  );
}

function MyBookingsPage() {
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rollback, setRollback] = useState(null);

  const tabs = [
    ["", "All"],
    ["CONFIRMED", "Confirmed"],
    ["CANCELLED", "Cancelled"],
    ["COMPLETED", "Completed"],
  ];

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/bookings/me", {
        params: { status: status || undefined, page: 1, limit: 50 },
      });
      setBookings(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const cancel = async (booking) => {
    const previous = bookings;
    setRollback(previous);
    setBookings((items) => items.filter((item) => item.id !== booking.id));

    try {
      await api.patch(`/bookings/${booking.id}/cancel`);
    } catch (err) {
      setBookings(rollback || previous);
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <section className="page-heading compact">
        <div>
          <p className="eyebrow">YOUR CAMPUS RESERVATIONS</p>
          <h1>My bookings</h1>
          <p>Keep track of upcoming reservations and their current status.</p>
        </div>
      </section>

      <div className="filter-row booking-tabs">
        {tabs.map(([value, label]) => (
          <button
            key={value || "all"}
            className={status === value ? "filter active" : "filter"}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings here" text="Your reservations will appear on this page." />
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <article className="booking-card" key={booking.id}>
              <div>
                <span className={`status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
                <h2>{booking.resource.name}</h2>
                <p>{booking.resource.location}</p>
                <p className="booking-time">
                  {formatDateTime(booking.startTime)} – {formatTime(booking.endTime)}
                </p>
                <p>{booking.purpose}</p>
              </div>
              {booking.status === "CONFIRMED" && (
                <button className="button danger" onClick={() => cancel(booking)}>
                  Cancel
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function AdminPage() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    name: "",
    description: "",
    location: "",
    category: "hall",
    openTime: "09:00",
    closeTime: "21:00",
  });
  const [bookingStatus, setBookingStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [resourceResponse, bookingResponse] = await Promise.all([
        api.get("/resources", { params: { page: 1, limit: 50 } }),
        api.get("/admin/bookings", {
          params: { page: 1, limit: 50, status: bookingStatus || undefined },
        }),
      ]);
      setResources(resourceResponse.data.data);
      setBookings(bookingResponse.data.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bookingStatus]);

  const saveResource = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.patch(`/resources/${editingId}`, resourceForm);
      } else {
        await api.post("/resources", resourceForm);
      }
      setEditingId(null);
      setResourceForm({
        name: "",
        description: "",
        location: "",
        category: "hall",
        openTime: "09:00",
        closeTime: "21:00",
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const editResource = (resource) => {
    setEditingId(resource.id);
    setResourceForm({
      name: resource.name,
      description: resource.description,
      location: resource.location,
      category: resource.category,
      openTime: resource.openTime,
      closeTime: resource.closeTime,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const softDelete = async (id) => {
    if (!window.confirm("Deactivate this resource? Existing bookings are preserved.")) return;
    try {
      await api.delete(`/resources/${id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <section className="page-heading compact">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Manage CampusDesk</h1>
          <p>Create and update resources, then review all campus bookings.</p>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="admin-grid">
        <div className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">{editingId ? "EDIT RESOURCE" : "NEW RESOURCE"}</p>
              <h2>{editingId ? "Update resource" : "Add resource"}</h2>
            </div>
          </div>

          <form className="form" onSubmit={saveResource}>
            <label>Name<input value={resourceForm.name} onChange={(e) => setResourceForm({...resourceForm, name:e.target.value})} required /></label>
            <label>Description<input value={resourceForm.description} onChange={(e) => setResourceForm({...resourceForm, description:e.target.value})} required /></label>
            <label>Location<input value={resourceForm.location} onChange={(e) => setResourceForm({...resourceForm, location:e.target.value})} required /></label>
            <label>Category
              <select value={resourceForm.category} onChange={(e) => setResourceForm({...resourceForm, category:e.target.value})}>
                <option value="hall">Hall</option>
                <option value="equipment">Equipment</option>
                <option value="room">Room</option>
                <option value="other">Other</option>
              </select>
            </label>
            <div className="two-col">
              <label>Opens<input type="time" value={resourceForm.openTime} onChange={(e) => setResourceForm({...resourceForm, openTime:e.target.value})} required /></label>
              <label>Closes<input type="time" value={resourceForm.closeTime} onChange={(e) => setResourceForm({...resourceForm, closeTime:e.target.value})} required /></label>
            </div>
            <div className="button-row">
              <button className="button primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Create resource"}</button>
              {editingId && <button type="button" className="button ghost" onClick={() => setEditingId(null)}>Cancel edit</button>}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">ACTIVE RESOURCES</p>
              <h2>Resource inventory</h2>
            </div>
          </div>
          {loading ? <LoadingState /> : (
            <div className="admin-resource-list">
              {resources.map((resource) => (
                <div className="admin-resource" key={resource.id}>
                  <div>
                    <strong>{resource.name}</strong>
                    <span>{resource.category} · {resource.location}</span>
                  </div>
                  <div className="button-row">
                    <button className="button ghost small" onClick={() => editResource(resource)}>Edit</button>
                    <button className="button danger small" onClick={() => softDelete(resource.id)}>Deactivate</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel admin-bookings">
        <div className="section-head">
          <div>
            <p className="eyebrow">BOOKING OVERSIGHT</p>
            <h2>All bookings</h2>
          </div>
          <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        {bookings.length === 0 ? <EmptyState title="No bookings" text="No bookings match this filter." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Resource</th><th>User</th><th>When</th><th>Purpose</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.resource.name}</td>
                    <td>{booking.user.name}<br /><small>{booking.user.email}</small></td>
                    <td>{formatDateTime(booking.startTime)}<br />{formatTime(booking.endTime)}</td>
                    <td>{booking.purpose}</td>
                    <td><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="button ghost small" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button className="button ghost small" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}

function LoadingState() {
  return <div className="state-card"><div className="spinner" /><strong>Loading...</strong><span>Fetching the latest CampusDesk data.</span></div>;
}

function EmptyState({ title, text }) {
  return <div className="state-card"><strong>{title}</strong><span>{text}</span></div>;
}

function ErrorState({ message }) {
  return <div className="state-card error-state"><strong>Something went wrong</strong><span>{message}</span></div>;
}

function AccessDenied({ navigate }) {
  return (
    <div className="state-card error-state">
      <strong>403 — Admin access required</strong>
      <span>Your account does not have permission to open this page.</span>
      <button className="button secondary" onClick={() => navigate("/resources")}>Back to resources</button>
    </div>
  );
}

export default App;
