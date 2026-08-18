import { useMemo, useState } from 'react';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const BATCHES = {
  'BCG-2026-002': {
    vax: 'BCG (Bacille Calmette–Guérin)',
    stock: '210 liều',
    mfg: '01/12/2025',
    exp: '01/12/2027',
    imp: '10/02/2026',
    price: '180.000₫ / liều',
    status: 'AVAILABLE',
  },
  'HPV-2026-G9A': {
    vax: 'HPV (Gardasil 9)',
    stock: '48 liều',
    mfg: '01/07/2025',
    exp: '01/07/2027',
    imp: '08/01/2026',
    price: '1.550.000₫ / liều',
    status: 'AVAILABLE · Tồn thấp',
  },
  'HBV-2026-A1': {
    vax: 'Viêm gan B',
    stock: '420 liều',
    mfg: '15/10/2025',
    exp: '15/10/2027',
    imp: '20/01/2026',
    price: '280.000₫ / liều',
    status: 'AVAILABLE',
  },
  'DTAP-2026-01': {
    vax: 'DTaP',
    stock: '240 liều',
    mfg: '01/09/2025',
    exp: '01/09/2027',
    imp: '10/01/2026',
    price: '420.000₫ / liều',
    status: 'AVAILABLE',
  },
  'MMR-2026-01': {
    vax: 'MMR',
    stock: '320 liều',
    mfg: '10/10/2025',
    exp: '10/10/2027',
    imp: '22/01/2026',
    price: '280.000₫ / liều',
    status: 'AVAILABLE',
  },
  'FLU-2026-A': {
    vax: 'Cúm mùa (Influenza)',
    stock: '580 liều',
    mfg: '01/03/2026',
    exp: '31/12/2026',
    imp: '01/04/2026',
    price: '380.000₫ / liều',
    status: 'AVAILABLE · HSD mùa',
  },
  'PCV-2026-01': {
    vax: 'Phế cầu (Pneumococcal)',
    stock: '130 liều',
    mfg: '01/08/2025',
    exp: '01/08/2027',
    imp: '05/01/2026',
    price: '980.000₫ / liều',
    status: 'AVAILABLE',
  },
  'VAR-2026-01': {
    vax: 'Thủy đậu (Varicella)',
    stock: '160 liều',
    mfg: '15/09/2025',
    exp: '15/09/2027',
    imp: '12/01/2026',
    price: '720.000₫ / liều',
    status: 'AVAILABLE',
  },
};

const ROWS = [
  {
    batch: 'BCG-2026-002',
    name: 'BCG',
    cat: 'Trẻ sơ sinh · Bệnh lao',
    stock: 210,
    fill: 42,
    fillClass: 'danger',
    exp: '01/12/2027',
    tag: 'danger',
    tagLabel: 'Ưu tiên dùng trước',
    f: 'expiring low',
    rowClass: 'danger-row',
  },
  {
    batch: 'HPV-2026-G9A',
    name: 'HPV (Gardasil 9)',
    cat: 'Thanh thiếu niên · Ung thư CTC',
    stock: 48,
    fill: 28,
    fillClass: 'warn',
    exp: '01/07/2027',
    tag: 'warn',
    tagLabel: 'Tồn thấp',
    f: 'low',
    rowClass: 'alert-row',
  },
  {
    batch: 'HBV-2026-A1',
    name: 'Viêm gan B',
    cat: 'Trẻ sơ sinh · HBV',
    stock: 420,
    fill: 70,
    fillClass: 'ok',
    exp: '15/10/2027',
    tag: 'ok',
    tagLabel: 'Đủ hàng',
    f: 'ok',
  },
  {
    batch: 'DTAP-2026-01',
    name: 'DTaP',
    cat: 'Trẻ em · Bạch hầu–Ho gà–Uốn ván',
    stock: 240,
    fill: 55,
    fillClass: 'ok',
    exp: '01/09/2027',
    tag: 'ok',
    tagLabel: 'Đủ hàng',
    f: 'ok',
  },
  {
    batch: 'MMR-2026-01',
    name: 'MMR',
    cat: 'Trẻ em · Sởi–Quai bị–Rubella',
    stock: 320,
    fill: 64,
    fillClass: 'ok',
    exp: '10/10/2027',
    tag: 'ok',
    tagLabel: 'Đủ hàng',
    f: 'ok',
  },
  {
    batch: 'FLU-2026-A',
    name: 'Cúm mùa',
    cat: 'Mùa vụ · Influenza',
    stock: 580,
    fill: 72,
    fillClass: 'ok',
    exp: '31/12/2026',
    tag: 'info',
    tagLabel: 'HSD mùa này',
    f: 'ok',
  },
  {
    batch: 'PCV-2026-01',
    name: 'Phế cầu',
    cat: 'Trẻ em · Pneumococcal',
    stock: 130,
    fill: 45,
    fillClass: 'ok',
    exp: '01/08/2027',
    tag: 'ok',
    tagLabel: 'Đủ hàng',
    f: 'ok',
  },
  {
    batch: 'VAR-2026-01',
    name: 'Thủy đậu',
    cat: 'Trẻ em · Varicella',
    stock: 160,
    fill: 40,
    fillClass: 'ok',
    exp: '15/09/2027',
    tag: 'ok',
    tagLabel: 'Đủ hàng',
    f: 'ok',
  },
];

export default function StaffInventoryPage() {
  const { toast, showToast } = useStaffToast();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [detailBatch, setDetailBatch] = useState(null);

  const filtered = useMemo(() => {
    return ROWS.filter((r) => {
      if (tab !== 'all' && !r.f.includes(tab)) return false;
      if (q && !`${r.name} ${r.batch} ${r.cat}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tab, q]);

  const openDetail = (batch) => setDetailBatch(batch);
  const closeDetail = () => setDetailBatch(null);
  const detail = detailBatch ? BATCHES[detailBatch] : null;

  return (
    <>
      <StaffTopbar
        title="Kho vắc xin"
        subtitle="Tồn kho · Lô · Cảnh báo hết hạn"
        searchPlaceholder="Tìm vắc xin, mã lô..."
        searchValue={q}
        onSearchChange={setQ}
      />

      <div className="staff-content">
        <section className="kpi-row cols-4">
          <div className="kpi c1">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5" />
                </svg>
              </span>
            </div>
            <div className="num">2.108</div>
            <div className="lbl">Tổng liều tồn</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
            </div>
            <div className="num">1</div>
            <div className="lbl">Tồn thấp</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
            </div>
            <div className="num">1</div>
            <div className="lbl">Ưu tiên FEFO</div>
          </div>
          <div className="kpi c4">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4" />
                </svg>
              </span>
            </div>
            <div className="num">8</div>
            <div className="lbl">Loại vắc xin đang mở</div>
          </div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'low', label: 'Tồn thấp' },
              { key: 'expiring', label: 'Sắp hết hạn' },
              { key: 'ok', label: 'Đủ hàng' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <button type="button" className="btn outline" onClick={() => showToast('Đang xuất báo cáo tồn kho (CSV/Excel demo)…', 'ok')}>
              Xuất báo cáo
            </button>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Danh sách lô vắc xin</h3>
                <div className="sub">inventory_id = 1 · Ngưỡng cảnh báo: 50 liều</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vắc xin</th>
                    <th>Mã lô</th>
                    <th>Tồn</th>
                    <th>Hạn dùng</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.batch}
                      className={r.rowClass || ''}
                      style={{ cursor: 'pointer' }}
                      onDoubleClick={() => openDetail(r.batch)}
                    >
                      <td>
                        <div className="vax-name">{r.name}</div>
                        <div className="vax-cat">{r.cat}</div>
                      </td>
                      <td>
                        <span className="mono">{r.batch}</span>
                      </td>
                      <td>
                        <div className="stock-bar">
                          <div className="stock-track">
                            <div className={`stock-fill ${r.fillClass}`} style={{ width: `${r.fill}%` }} />
                          </div>
                          <span className="stock-num">{r.stock}</span>
                        </div>
                      </td>
                      <td>{r.exp}</td>
                      <td>
                        <span className={`tag ${r.tag}`}>{r.tagLabel}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="row-btn outline" onClick={() => openDetail(r.batch)}>
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Cảnh báo cần xử lý</h3>
                  <div className="sub">Từ dashboard &amp; AI dự báo</div>
                </div>
              </div>
              <div className="mini-body">
                <div className="alert-item">
                  <span className="alert-ic danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">BCG-2026-002 sắp hết hạn tương đối</div>
                    <div className="d">HSD 01/12/2027 · còn 210 liều · ưu tiên FEFO</div>
                    <span className="tag danger" style={{ marginTop: 6 }}>
                      Ưu tiên sử dụng trước
                    </span>
                  </div>
                </div>
                <div className="alert-item">
                  <span className="alert-ic warn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">HPV tồn kho thấp</div>
                    <div className="d">Còn 48 liều · AI dự báo cần nhập trong 5 ngày</div>
                    <span className="tag warn" style={{ marginTop: 6 }}>
                      Cảnh báo tồn kho
                    </span>
                  </div>
                </div>
                <div className="alert-item">
                  <span className="alert-ic info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">Cúm mùa — mùa cao điểm</div>
                    <div className="d">Dự báo nhu cầu tăng 25% 2 tuần tới</div>
                    <span className="tag info" style={{ marginTop: 6 }}>
                      AI forecast
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Ngưỡng &amp; cấu hình</h3>
                  <div className="sub">Cơ sở Phú Nhuận</div>
                </div>
              </div>
              <div className="mini-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--gray-500)' }}>Ngưỡng cảnh báo tồn</span>
                  <strong>50 liều</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`staff-overlay${detailBatch ? ' open' : ''}`} onClick={closeDetail} />
      <div className={`staff-modal${detailBatch ? ' open' : ''}`} role="dialog">
        <div className="modal-head">
          <div>
            <h3>Chi tiết lô vắc xin</h3>
            <div className="sub">{detailBatch || '—'} · VaxCare Phú Nhuận</div>
          </div>
          <button type="button" className="modal-close" onClick={closeDetail} aria-label="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {detail && (
          <div className="modal-body">
            <div className="d-row">
              <span className="lbl">Vắc xin</span>
              <span className="val">{detail.vax}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Mã lô</span>
              <span className="val mono">{detailBatch}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Tồn kho</span>
              <span className="val">{detail.stock}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Ngày sản xuất</span>
              <span className="val">{detail.mfg}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Hạn dùng</span>
              <span className="val">{detail.exp}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Ngày nhập</span>
              <span className="val">{detail.imp}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Giá nhập (ước tính)</span>
              <span className="val">{detail.price}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Trạng thái</span>
              <span className="val">{detail.status}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Cơ sở</span>
              <span className="val">VaxCare Phú Nhuận</span>
            </div>
          </div>
        )}
        <div className="modal-foot">
          <button type="button" className="btn outline" onClick={closeDetail}>
            Đóng
          </button>
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
