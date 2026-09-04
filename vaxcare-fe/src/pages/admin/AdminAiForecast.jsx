import { useCallback, useEffect, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { useToast } from '../../components/ui/Toast';
import * as adminService from '../../services/adminService';

function formatDateVN(iso) {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

export default function AdminAiForecast() {
  const showToast = useToast();
  const [facilities, setFacilities] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Load facilities & vaccines list on mount
  useEffect(() => {
    (async () => {
      try {
        const [facList, vaxList] = await Promise.all([
          adminService.getFacilitiesAdmin().catch(() => []),
          adminService.getVaccinesAdmin().catch(() => []),
        ]);
        const mappedFacs = (facList || []).map(adminService.mapFacilityToUi);
        const mappedVax = (vaxList || []).map(adminService.mapVaccineToUi);
        setFacilities(mappedFacs);
        setVaccines(mappedVax);

        if (mappedFacs.length > 0) setSelectedFacility(String(mappedFacs[0].id));
        if (mappedVax.length > 0) setSelectedVaccine(String(mappedVax[0].id));
      } catch (err) {
        showToast(err.message || 'Lỗi tải danh mục cơ sở/vắc xin', 'error');
      }
    })();
  }, [showToast]);

  const loadForecasts = useCallback(async () => {
    if (!selectedVaccine || !selectedFacility) return;
    setLoading(true);
    try {
      const res = await adminService.getAiForecasts(selectedVaccine, selectedFacility);
      setForecasts(res || []);
    } catch (err) {
      showToast(err.message || 'Chưa có dữ liệu dự báo cho cặp vắc xin & cơ sở này', 'info');
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFacility, selectedVaccine, showToast]);

  useEffect(() => {
    if (selectedFacility && selectedVaccine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadForecasts();
    }
  }, [selectedFacility, selectedVaccine, loadForecasts]);

  const handleRunForecast = async () => {
    setRunning(true);
    try {
      const res = await adminService.runAiForecastManual();
      const count = res?.updatedCombos ?? 0;
      showToast(`Đã chạy dự báo nhu cầu thành công! Cập nhật ${count} cặp vắc xin-cơ sở.`, 'success');
      await loadForecasts();
    } catch (err) {
      showToast(err.message || 'Lỗi khi kích hoạt AI Forecast', 'error');
    } finally {
      setRunning(false);
    }
  };

  const totalPredicted = forecasts.reduce((acc, f) => acc + (f.predictedQuantity || 0), 0);
  const avgConfidence = forecasts.length
    ? Math.round((forecasts.reduce((acc, f) => acc + (f.confidenceLevel || 0), 0) / forecasts.length) * 100)
    : 95;
  const currentModelVersion = forecasts[0]?.modelVersion || 'v1.1-XGBoost';

  const currentVaccineObj = vaccines.find((v) => String(v.id) === String(selectedVaccine));
  const currentFacilityObj = facilities.find((f) => String(f.id) === String(selectedFacility));

  return (
    <>
      <Topbar
        title="Dự báo tồn kho & Nhu cầu (AI 2)"
        subtitle="Mô hình AI dự báo lượng nhu cầu tiêu thụ vắc xin để tối ưu tồn kho và nhập hàng"
      />

      <div className="admin-page-content" style={{ padding: '24px' }}>
        {/* KPI Cards */}
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="kpi c1" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', padding: '16px 20px' }}>
            <div className="top" style={{ color: 'var(--sub, #64748b)', fontSize: '13px', marginBottom: '6px' }}>
              Tổng lượng dự báo nhu cầu
            </div>
            <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              {totalPredicted} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>liều</span>
            </div>
            <div className="lbl" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Theo chu kỳ dự báo đã chọn
            </div>
          </div>

          <div className="kpi c2" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', padding: '16px 20px' }}>
            <div className="top" style={{ color: 'var(--sub, #64748b)', fontSize: '13px', marginBottom: '6px' }}>
              Độ tin cậy mô hình AI
            </div>
            <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {avgConfidence}%
            </div>
            <div className="lbl" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Dựa trên lịch sử tiêu thụ thực tế
            </div>
          </div>

          <div className="kpi c3" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', padding: '16px 20px' }}>
            <div className="top" style={{ color: 'var(--sub, #64748b)', fontSize: '13px', marginBottom: '6px' }}>
              Phiên bản AI Model
            </div>
            <div className="num" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary, #0284c7)' }}>
              {currentModelVersion}
            </div>
            <div className="lbl" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              XGBoost / Falling Back Heuristic
            </div>
          </div>
        </div>

        {/* Filters & Action Bar */}
        <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--card-bg, #fff)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Cơ sở tiêm chủng:
              </label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '220px' }}
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Loại vắc xin:
              </label>
              <select
                value={selectedVaccine}
                onChange={(e) => setSelectedVaccine(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '220px' }}
              >
                {vaccines.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.full || v.manufacturer})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunForecast}
            disabled={running}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary, #0284c7)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: running ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {running ? 'Đang chạy AI Engine...' : 'Chạy lại AI Forecast toàn mạng'}
          </button>
        </div>

        {/* Forecast Table Card */}
        <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Lịch sử & Kết quả Dự báo: {currentVaccineObj?.name || 'Vắc xin'} tại {currentFacilityObj?.name || 'Cơ sở'}
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {forecasts.length} chu kỳ được dự báo
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Đang tải kết quả dự báo tồn kho từ AI Engine...
            </div>
          ) : forecasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h4 style={{ margin: '0 0 6px', color: '#334155', fontWeight: 700 }}>Chưa có dữ liệu dự báo cho cặp này</h4>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', maxWidth: '480px', marginInline: 'auto' }}>
                Cặp vắc xin <strong>{currentVaccineObj?.name}</strong> tại <strong>{currentFacilityObj?.name}</strong> chưa có đủ mốc lịch sử tiêm hoặc chưa được tính toán trong phiên dự báo định kỳ.
              </p>
              <button
                type="button"
                onClick={handleRunForecast}
                disabled={running}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Kích hoạt AI Forecast ngay
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>#ID</th>
                    <th style={{ padding: '12px 16px' }}>Từ ngày</th>
                    <th style={{ padding: '12px 16px' }}>Đến ngày</th>
                    <th style={{ padding: '12px 16px' }}>Dự báo (Liều)</th>
                    <th style={{ padding: '12px 16px' }}>Thực tế (Liều)</th>
                    <th style={{ padding: '12px 16px' }}>Độ tin cậy</th>
                    <th style={{ padding: '12px 16px' }}>Mô hình AI</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f) => (
                    <tr key={f.forecastId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>#{f.forecastId}</td>
                      <td style={{ padding: '12px 16px' }}>{formatDateVN(f.forecastPeriodStart)}</td>
                      <td style={{ padding: '12px 16px' }}>{formatDateVN(f.forecastPeriodEnd)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
                        {f.predictedQuantity} liều
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {f.actualQuantity != null ? `${f.actualQuantity} liều` : <span style={{ color: '#94a3b8' }}>Chưa có data</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: '#d1fae5', color: '#047857' }}>
                          {f.confidenceLevel ? `${Math.round(f.confidenceLevel * 100)}%` : '95%'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                        {f.modelVersion || 'v1.1-XGBoost'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}