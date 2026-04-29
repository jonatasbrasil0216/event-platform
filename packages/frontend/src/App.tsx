import { Link, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { BrowseEventsPage } from "./pages/BrowseEventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventFormPage } from "./pages/EventFormPage";
import { LoginPage } from "./pages/LoginPage";
import { MyEventsPage } from "./pages/MyEventsPage";
import { MyRegistrationsPage } from "./pages/MyRegistrationsPage";
import { SignupPage } from "./pages/SignupPage";
import { useAuthStore } from "./stores/auth";

const HomePage = () => (
  <main className="container">
    <section className="hero">
      <p className="eyebrow">Event Platform</p>
      <h1>Discover events worth showing up for.</h1>
      <p className="hero-copy">
        A responsive event experience for attendees and organizers. Start by creating an account.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/signup">
          Create account
        </Link>
        <Link className="btn btn-secondary" to="/login">
          Sign in
        </Link>
      </div>
    </section>
  </main>
);

export const App = () => {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="app-shell">
      <header className={`top-nav ${user ? "auth-nav" : ""}`}>
        {user ? (
          <>
            <div className="mobile-nav-row">
              <button
                aria-label="Open menu"
                className="icon-btn only-mobile"
                onClick={() => setMenuOpen((prev) => !prev)}
                type="button"
              >
                <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M4 12H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M4 17H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </button>
              <Link className="brand brand-centered" to="/">
                EventHub
              </Link>
              <button className="avatar-btn" onClick={() => clearAuth()} title="Logout" type="button">
                {initials}
              </button>
            </div>
            <div className="desktop-nav-row">
              <Link className="brand" to="/">
                EventHub
              </Link>
              <nav className="nav-links">
                <Link to="/">Browse</Link>
                {user.role === "attendee" && <Link to="/registrations/mine">My registrations</Link>}
                {user.role === "organizer" && <Link to="/organizer/events">My events</Link>}
              </nav>
              <button className="avatar-btn" onClick={() => clearAuth()} title="Logout" type="button">
                {initials}
              </button>
            </div>
            {menuOpen && (
              <nav className="mobile-drawer">
                <Link onClick={() => setMenuOpen(false)} to="/">
                  Browse
                </Link>
                {user.role === "attendee" && (
                  <Link onClick={() => setMenuOpen(false)} to="/registrations/mine">
                    My registrations
                  </Link>
                )}
                {user.role === "organizer" && (
                  <Link onClick={() => setMenuOpen(false)} to="/organizer/events">
                    My events
                  </Link>
                )}
                <button className="drawer-logout" onClick={() => clearAuth()} type="button">
                  Logout
                </button>
              </nav>
            )}
          </>
        ) : (
          <>
            <Link className="brand" to="/">
              Event Platform
            </Link>
            <nav className="nav-links">
              <Link to="/">Browse</Link>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </nav>
          </>
        )}
      </header>
      <Routes>
        <Route path="/" element={user ? <BrowseEventsPage /> : <HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/organizer/events" element={<MyEventsPage />} />
        <Route path="/events/new" element={<EventFormPage />} />
        <Route path="/events/:id/edit" element={<EventFormPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/registrations/mine" element={<MyRegistrationsPage />} />
      </Routes>
    </div>
  );
};
