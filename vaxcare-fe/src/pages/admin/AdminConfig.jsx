// import { useCallback, useEffect, useState } from 'react';
// import Topbar from '../../components/layout/Topbar';
// import { useToast } from '../../components/ui/Toast';
// import * as adminService from '../../services/adminService';

// export default function Config() {
//   const showToast = useToast();
//   const [cfgs, setCfgs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await adminService.listConfigs();
//       setCfgs(
//         (data || []).map((c) => ({
//           key: c.key,
//           value: c.value ?? '',
//           desc: c.description || '',
//         }))
//       );
//     } catch (err) {
//       showToast(err.message || 'Không tải được cấu hình', 'error');
//       setCfgs([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [showToast]);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     load();
//   }, [load]);

//   const updateValue = (i, value) => {
//     setCfgs((prev) => {
//       const next = [...prev];
//       next[i] = { ...next[i], value };
//       return next;
//     });
//   };

//   const saveAll = async () => {
//     setSaving(true);
//     try {
//       await adminService.saveConfigsBatch(
//         cfgs.map((c) => ({ key: c.key, value: c.value, description: c.desc }))
//       );
//       showToast('Đã lưu cấu hình', 'ok');
//       await load();
//     } catch (err) {
//       showToast(err.message || 'Lưu thất bại', 'error');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       <Topbar title="Cấu hình hệ thống" subtitle="system_configs · vận hành" />
//       <div className="content">
//         <div className="panel">
//           <div className="panel-head">
//             <div>
//               <h3>Tham số hệ thống</h3>
//               <div className="sub">{loading ? 'Đang tải…' : `${cfgs.length} khóa`}</div>
//             </div>
//             <button type="button" className="btn primary" onClick={saveAll} disabled={saving || loading}>
//               {saving ? 'Đang lưu…' : 'Lưu tất cả'}
//             </button>
//           </div>
//           <div className="panel-body">
//             {cfgs.length === 0 && !loading ? (
//               <p style={{ color: 'var(--gray-500)' }}>Chưa có cấu hình trong DB. Seed bảng system_configs hoặc thêm key mới phía BE.</p>
//             ) : (
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Key</th>
//                     <th>Giá trị</th>
//                     <th>Mô tả</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {cfgs.map((c, i) => (
//                     <tr key={c.key}>
//                       <td className="mono">{c.key}</td>
//                       <td>
//                         <input
//                           className="input"
//                           value={c.value}
//                           onChange={(e) => updateValue(i, e.target.value)}
//                           style={{ width: '100%', maxWidth: 280 }}
//                         />
//                       </td>
//                       <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{c.desc || '—'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>

//         <div className="panel" style={{ marginTop: 16 }}>
//           <div className="panel-head">
//             <div>
//               <h3>Ghi chú vận hành</h3>
//               <div className="sub">Thay đổi được ghi audit_logs</div>
//             </div>
//           </div>
//           <div className="panel-body" style={{ fontSize: '13.5px', color: 'var(--gray-700)', lineHeight: 1.6 }}>
//             <p style={{ marginBottom: 10 }}>
//               • <strong>booking_advance_days</strong>: số ngày tối đa người dân được đặt trước.
//             </p>
//             <p style={{ marginBottom: 10 }}>
//               • <strong>qr_code_prefix</strong>: tiền tố mã QR lịch hẹn / chứng nhận.
//             </p>
//             <p>
//               • Cập nhật cấu hình sẽ ghi nhật ký trong <code>audit_logs</code>.
//             </p>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }