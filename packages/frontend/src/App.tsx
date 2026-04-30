import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { BrowseEventsPage } from "./pages/BrowseEventsPage";
import { Navbar } from "./components/Navbar";
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
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";
  const loginRedirect = `/login?next=${encodeURIComponent(location.pathname)}`;

  const protectedElement = (
    element: ReactElement,
    requiredRole?: "organizer" | "attendee"
  ): ReactElement => {
    if (!user) {
      return <Navigate replace to={loginRedirect} />;
    }
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate replace to="/" />;
    }
    return element;
  };

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar onLogout={clearAuth} user={user} />}
      <Routes>
        <Route path="/" element={user ? <BrowseEventsPage /> : <HomePage />} />
        <Route path="/login" element={user ? <Navigate replace to="/" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate replace to="/" /> : <SignupPage />} />
        <Route path="/organizer/events" element={protectedElement(<MyEventsPage />, "organizer")} />
        <Route path="/events/new" element={protectedElement(<EventFormPage />, "organizer")} />
        <Route path="/events/:id/edit" element={protectedElement(<EventFormPage />, "organizer")} />
        <Route path="/events/:id" element={protectedElement(<EventDetailPage />)} />
        <Route path="/registrations/mine" element={protectedElement(<MyRegistrationsPage />, "attendee")} />
      </Routes>
    </div>
  );
};
