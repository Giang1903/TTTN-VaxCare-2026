import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as adminService from "../../services/adminService";

const Icon = ({ d, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d={d} />
  </svg>
);

function formatCount(n) {
  if (n == null || Number.isNaN(n)) return null;
  const num = Number(n);
  if (num >= 1000) {
    const k = num / 1000;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "k";
  }
  return String(num);
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    facilities: null,
    staff: null,
    users: null,
    lowStock: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [facs, staff, users] = await Promise.all([
          adminService.getFacilitiesAdmin().catch(() => []),
          adminService.listStaff().catch(() => []),
          adminService.listUsers().catch(() => []),
        ]);
        if (cancelled) return;
        const facList = facs || [];
        setCounts({
          facilities: facList.length,
          staff: (staff || []).length,
          users: (users || []).length,
          lowStock: null,
        });
      } catch {
        /* badge optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = user?.fullName || user?.email || "Quản trị viên";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "AD";

  const navSections = useMemo(
    () => [
      {
        label: "Tổng quan",
        items: [
          {
            to: "/admin",
            end: true,
            label: "Bảng điều khiển",
            icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
          },
          {
            to: "/admin/reports",
            label: "Báo cáo hệ thống",
            icon: "M3 3v18h18M8 17V10M13 17V6M18 17v-4",
          },
        ],
      },
      {
        label: "Tổ chức",
        items: [
          {
            to: "/admin/facilities",
            label: "Cơ sở tiêm chủng",
            icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
            count: formatCount(counts.facilities),
          },
          {
            to: "/admin/staff",
            label: "Nhân viên y tế",
            icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
            count: formatCount(counts.staff),
          },
          {
            to: "/admin/users",
            label: "Người dùng",
            icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
            count: formatCount(counts.users),
          },
        ],
      },
      {
        label: "Danh mục",
        items: [
          {
            to: "/admin/vaccines",
            label: "Vắc xin & phác đồ",
            icon: "M11 2 3 10l3 3 8-8-3-3ZM8.5 9.5 15 16M5 19l1.5-4L15 6.5 17.5 9 9 17.5 5 19Z",
          },
          {
            to: "/admin/inventory",
            label: "Kho & lô toàn mạng",
            icon: "M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5",
          },
          {
            to: "/admin/pricing",
            label: "Bảng giá",
            icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
          },
        ],
      },
      {
        label: "Hệ thống",
        items: [
          // {
          //   to: "/admin/config",
          //   label: "Cấu hình",
          //   icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
          // },
          {
            to: "/admin/audit",
            label: "Nhật ký audit",
            icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
          },
        ],
      },
    ],
    [counts]
  );

  function handleLogout(e) {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <a href="/admin" className="sidebar-brand">
        <span className="mark">
          <img
            src="/logo.png"
            alt="VaxCare logo"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </span>
        <span>
          <div className="name">VaxCare</div>
          <div className="tag">Admin Console</div>
        </span>
      </a>

      <div className="role-pill">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <div className="fp-name">Toàn hệ thống</div>
          <div className="fp-sub">Quyền: ADMIN</div>
        </div>
      </div>

      <nav className="side-nav">
        {navSections.map((sec) => (
          <div key={sec.label}>
            <div className="nav-label">{sec.label}</div>
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                <Icon d={item.icon} />
                {item.label}
                {item.count != null && item.count !== "" && (
                  <span className={`count${item.alert ? " alert" : ""}`}>
                    {item.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="staff-chip">
          <div className="av">{initials}</div>
          <div className="who">
            <div className="n">{fullName}</div>
            <div className="r">{user?.email || "ADMIN"}</div>
          </div>
        </div>
        <button type="button" className="logout-link" onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}