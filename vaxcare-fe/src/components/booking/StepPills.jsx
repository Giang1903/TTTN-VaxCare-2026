const STEPS = [
  { n: 1, label: 'Chọn vắc xin' },
  { n: 2, label: 'Chọn cơ sở' },
  { n: 3, label: 'Ngày & giờ' },
  { n: 4, label: 'Xác nhận' },
];

// ============ STEP PILLS ============
export default function StepPills({ current }) {
  return (
    <div className="steps" id="stepPills">
      {STEPS.map((s) => (
        <div
          key={s.n}
          className={`step-pill${current === s.n ? ' active' : current > s.n ? ' done' : ''}`}
          data-step={s.n}
        >
          <span className="num">{s.n}</span> {s.label}
        </div>
      ))}
    </div>
  );
}
