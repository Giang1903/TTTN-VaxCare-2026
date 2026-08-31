import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUnreadCount } from "../../services/notificationService";

// ============ NAVBAR (LOGGED IN) ============
export default function LoggedInNavbar({ onOpenMobileNav }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.fullName || user?.email || "Người dùng";
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Khi đang ở trang /notifications, số chưa đọc đã được mark-all → 0
    if (pathname === "/notifications") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnread(0);
      return () => {
        cancelled = true;
      };
    }
    getUnreadCount()
      .then((n) => {
        if (!cancelled) setUnread(Number(n) || 0);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // eslint-disable-next-line no-unused-vars
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const links = [
    { to: "/dashboard", label: "Tổng quan", match: (p) => p === "/dashboard" },
    {
      to: "/appointments",
      label: "Lịch tiêm",
      match: (p) => p === "/appointments",
    },
    { to: "/record", label: "Hồ sơ", match: (p) => p === "/record" },
    {
      to: "/vaccines",
      label: "Vắc xin",
      match: (p) => p === "/vaccines" || p.startsWith("/vaccines/"),
    },
    {
      to: "/facilities",
      label: "Cơ sở",
      match: (p) => p === "/facilities" || p.startsWith("/facilities/"),
    },
  ];

  const notifActive = pathname === "/notifications";

  return (
    <header className="navbar">
      <div className="wrap">
        <div className="nav-left">
          <button
            type="button"
            className="nav-menu-btn"
            title="Menu"
            aria-label="Mở menu"
            onClick={onOpenMobileNav}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <Link to="/dashboard" className="logo">
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare logo" />
          </span>
          VaxCare
        </Link>

        <nav className="nav-menu">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={l.match(pathname) ? "active" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link to="/booking" className="btn btn-primary btn-sm">
            Đặt lịch ngay
          </Link>

          <div className="user-menu" id="userMenu">
            <span className="user-name">{userName}</span>
          </div>
          <button
            className="hamburger"
            style={{ display: "none" }}
            aria-hidden="true"
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <Link
            to="/notifications"
            title="Thông báo"
            aria-label="Thông báo"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 999,
              color: notifActive ? "#0284c7" : "#475569",
              background: notifActive
                ? "rgba(14, 165, 233, 0.1)"
                : "transparent",
              transition: "background 0.15s, color 0.15s",
              textDecoration: "none",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: "16px",
                  textAlign: "center",
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}