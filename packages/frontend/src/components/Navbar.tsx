import type { User } from "@event-platform/shared";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar = ({ user, onLogout }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const initials = user?.name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".avatar-menu-wrap")) {
        setAvatarMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
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
              <Menu size={20} strokeWidth={1.8} />
            </button>
            <Link className="brand brand-centered" to="/">
              EventHub
            </Link>
            <div className="avatar-menu-wrap">
              <button
                className="avatar-btn"
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                title="Open user menu"
                type="button"
              >
                {initials}
              </button>
              {avatarMenuOpen && (
                <div className="avatar-menu">
                  <button className="avatar-menu-item" onClick={onLogout} type="button">
                    Log out
                  </button>
                </div>
              )}
            </div>
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
            <div className="avatar-menu-wrap">
              <button
                className="avatar-btn"
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                title="Open user menu"
                type="button"
              >
                {initials}
              </button>
              {avatarMenuOpen && (
                <div className="avatar-menu">
                  <button className="avatar-menu-item" onClick={onLogout} type="button">
                    Log out
                  </button>
                </div>
              )}
            </div>
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
              <button className="drawer-logout" onClick={onLogout} type="button">
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
  );
};
