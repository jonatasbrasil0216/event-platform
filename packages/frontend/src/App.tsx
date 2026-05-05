import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { Navbar } from "./components/navbar";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { BrowseEventsPage } from "./pages/browse-events";
import { EventDetailPage } from "./pages/event-detail";
import { EventFormPage } from "./pages/event-form";
import { HomePage } from "./pages/home";
import { MyEventsPage } from "./pages/my-events";
import { MyRegistrationsPage } from "./pages/my-registrations";
import { useAuthStore } from "./stores/auth";

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
