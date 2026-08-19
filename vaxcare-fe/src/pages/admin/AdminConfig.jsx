import { useState } from 'react';
import Topbar from '../components/layout/Topbar';
import { useToast } from '../components/ui/Toast';

const INITIAL = [
  { key: 'site_name', value: 'VaxCare', desc: 'Tên hệ thống hiển thị' },
  { key: 'default_currency', value: 'VND', desc: 'Đơn vị tiền tệ' },
  { key: 'qr_code_prefix', value: 'VXC', desc: 'Tiền tố mã QR lịch hẹn / chứng nhận' },
  { key: 'booking_advance_days', value: '30', desc: 'Số ngày được phép đặt lịch trước' },
  { key: 'default_observe_minutes', value: '30', desc: 'Thời gian quan sát sau tiêm (phút)' },
  { key: 'inventory_alert_threshold', value: '50', desc: 'Ngưỡng cảnh báo tồn kho mặc định (liều)' },
  { key: 'support_email', value: 'support@vaxcare.vn', desc: 'Email hỗ trợ kỹ thuật' },
  { key: 'support_hotline', value: '1900-xxxx', desc: 'Hotline hỗ trợ' },
];

export default function Config() {
  const showToast = useToast();
  const [cfgs, setCfgs] = useState(() => JSON.parse(JSON.stringify(INITIAL)));
  const defaults = INITIAL;

  const updateValue = (i, value) => {
    setCfgs((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], value };
      return next;
    });
  };

  const saveAll = () => {
    showToast(`Đã lưu ${cfgs.length} cấu hình hệ thống`, 'ok');
  };

  const reset = () => {
    setCfgs(JSON.parse(JSON.stringify(defaults)));
    showToast('Đã khôi phục giá trị mặc định', 'ok');
  };

  return (
    <>
      <Topbar title="Cấu hình hệ thống" subtitle="Thứ Ba, 18/08/2026 · system_configs" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2" />
                </svg>
              </span>
            </div>
            <div className="num">8</div>
            <div className="lbl">Tham số cấu hình</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
            <div className="num">OK</div>
            <div className="lbl">Trạng thái hệ thống</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
            </div>
            <div className="num">VXC</div>
            <div className="lbl">QR prefix</div>
          </div>
          <div className="kpi c4">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
            <div className="num">VND</div>
            <div className="lbl">Tiền tệ</div>
          </div>
        </section>

        <div className="toolbar">
          <div className="toolbar-right" style={{ marginLeft: 0 }}>
            <button className="btn outline" type="button" onClick={reset}>
              Khôi phục mặc định
            </button>
            <button className="btn primary" type="button" onClick={saveAll}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Lưu tất cả
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>system_configs</h3>
              <div className="sub">Thay đổi áp dụng toàn hệ thống · ghi audit_logs</div>
            </div>
          </div>
          <div className="panel-body" style={{ padding: '16px 22px 22px' }}>
            {cfgs.map((c, i) => (
              <div className="cfg-card" key={c.key}>
                <div className="ck">{c.key}</div>
                <div className="cd">{c.desc}</div>
                <div className="cv">
                  <input value={c.value} onChange={(e) => updateValue(i, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Gợi ý vận hành</h3>
              <div className="sub">Không lưu trong DB — chỉ hiển thị</div>
            </div>
          </div>
          <div className="panel-body" style={{ fontSize: '13.5px', color: 'var(--gray-700)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 10 }}>
              • <strong>booking_advance_days</strong>: số ngày tối đa người dân được đặt trước (hiện 30).
            </p>
            <p style={{ marginBottom: 10 }}>
              • <strong>qr_code_prefix</strong>: tiền tố mã QR lịch hẹn / chứng nhận (VXC-…).
            </p>
            <p style={{ marginBottom: 10 }}>
              • <strong>alert_threshold</strong> (theo inventory từng cơ sở): ngưỡng cảnh báo tồn thấp — mặc định 50 liều.
            </p>
            <p>
              • Thay đổi cấu hình nên ghi nhật ký trong <code>audit_logs</code>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
