import { useState } from "react";
import { downloadCertificate } from "../../services/vaccinationService";

export default function CertificateSidebar({
  profile,
  recordCode,
  updatedAt,
  certificates = [],
}) {
  const code =
    recordCode || (profile?.userId != null ? `VC-${profile.userId}` : "—");
  const updated = updatedAt || "—";
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  async function handleDownloadLatest() {
    const list = certificates || [];
    if (!list.length) {
      setMsg("Chưa có mũi tiêm để cấp chứng nhận.");
      return;
    }
    const latest = [...list].sort((a, b) =>
      String(b.injectionDate || "").localeCompare(
        String(a.injectionDate || ""),
      ),
    )[0];
    if (!latest?.detailId) {
      setMsg("Không tìm thấy mã mũi tiêm.");
      return;
    }
    setBusyId(latest.detailId);
    setMsg("");
    try {
      await downloadCertificate(latest.detailId);
    } catch (e) {
      setMsg(e.message || "Tải PDF thất bại");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="record-sidebar">
      <div className="cert-card">
        <h3>Chứng nhận điện tử</h3>
        <p
          style={{
            fontSize: "13px",
            color: "var(--gray-500)",
            marginBottom: "12px",
          }}
        >
          Tải PDF chứng nhận từng mũi tiêm đã ghi nhận trên hệ thống.
        </p>
        <div className="cert-id">
          Mã hồ sơ: <strong>{code}</strong>
        </div>
        <div className="cert-valid">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
          Cập nhật {updated}
        </div>
        {msg && (
          <p className="form-error" style={{ marginTop: 10, fontSize: 13 }}>
            {msg}
          </p>
        )}
        <div className="cert-btns" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadLatest}
            disabled={!!busyId}
          >
            {busyId ? "Đang tải…" : "Tải chứng nhận mới nhất"}
          </button>
        </div>
        {certificates?.length > 0 && (
          <ul
            style={{
              marginTop: 14,
              paddingLeft: 0,
              listStyle: "none",
              fontSize: 13,
            }}
          >
            {certificates.slice(0, 5).map((c) => (
              <li
                key={c.detailId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <span>
                  {c.vaccineName || "Mũi tiêm"}
                  {c.doseNumber != null ? ` · Mũi ${c.doseNumber}` : ""}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "2px 8px", fontSize: 12 }}
                  disabled={busyId === c.detailId}
                  onClick={async () => {
                    setBusyId(c.detailId);
                    setMsg("");
                    try {
                      await downloadCertificate(c.detailId);
                    } catch (e) {
                      setMsg(e.message || "Tải PDF thất bại");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
