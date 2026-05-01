import type { User } from "@event-platform/shared";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

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
      if (!event.target.closest(`.${styles.avatarMenuWrap}`)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className={styles.topNav}>
      {user ? (
        <>
          <div className={styles.mobileNavRow}>
            <button
              aria-label="Open menu"
              className={`${styles.iconBtn} only-mobile`}
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>
            <Link className={`${styles.brand} ${styles.brandCentered}`} to="/">
              EventHub
            </Link>
            <div className={styles.avatarMenuWrap}>
              <button
                className={styles.avatarBtn}
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                title="Open user menu"
                type="button"
              >
                {initials}
              </button>
              {avatarMenuOpen && (
                <div className={styles.avatarMenu}>
                  <button className={styles.avatarMenuItem} onClick={onLogout} type="button">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={styles.desktopNavRow}>
            <Link className={styles.brand} to="/">
              EventHub
            </Link>
            <nav className={styles.navLinks}>
              <Link to="/">Browse</Link>
              {user.role === "attendee" && <Link to="/registrations/mine">My registrations</Link>}
              {user.role === "organizer" && <Link to="/organizer/events">My events</Link>}
            </nav>
            <div className={styles.avatarMenuWrap}>
              <button
                className={styles.avatarBtn}
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                title="Open user menu"
                type="button"
              >
                {initials}
              </button>
              {avatarMenuOpen && (
                <div className={styles.avatarMenu}>
                  <button className={styles.avatarMenuItem} onClick={onLogout} type="button">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
          {menuOpen && (
            <nav className={styles.mobileDrawer}>
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
              <button className={styles.drawerLogout} onClick={onLogout} type="button">
                Logout
              </button>
            </nav>
          )}
        </>
      ) : (
        <>
          <Link className={styles.brand} to="/">
            Event Platform
          </Link>
          <nav className={styles.navLinks}>
            <Link to="/">Browse</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </nav>
        </>
      )}
    </header>
  );
};
