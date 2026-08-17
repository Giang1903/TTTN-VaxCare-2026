import { useState } from 'react';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import StepPills from '../../components/booking/StepPills';
import StepVaccine from '../../components/booking/StepVaccine';
import StepFacility from '../../components/booking/StepFacility';
import StepDateTime from '../../components/booking/StepDateTime';
import StepConfirm from '../../components/booking/StepConfirm';
import BookingSummary from '../../components/booking/BookingSummary';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [vaccine, setVaccine] = useState(null);
  const [facility, setFacility] = useState(null);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [agree, setAgree] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  function goStep(n) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectVaccine(v) {
    setVaccine(v);
  }

  function handleSelectFacility(f) {
    setFacility(f);
  }

  function handleSelectDate(d) {
    setDate(d);
    setSlot(null);
  }

  function handleSelectSlot(t) {
    setSlot(t);
  }

  function handleConfirm() {
    const code =
      'VX-2026-' +
      (date ? date.label.replace(/\//g, '').slice(0, 4) : '0000') +
      '-' +
      (slot ? slot.replace(':', '') : '0000');
    setBookingCode(code);
    setSuccess(true);
  }

  return (
    <>
      <SlimPageHero currentLabel="Đặt lịch tiêm" />

      <div className="wrap booking-page">
        <div className="booking-head">
          <div>
            <h1>Đặt lịch tiêm chủng</h1>
            <p>Chọn vắc xin, cơ sở và khung giờ phù hợp — AI gợi ý chỗ trống tối ưu.</p>
          </div>
        </div>

        <StepPills current={success ? 5 : step} />

        <div className="booking-layout">
          <div className="book-panel">
            <StepVaccine
              active={step === 1}
              selectedId={vaccine?.id}
              onSelect={handleSelectVaccine}
              onNext={() => goStep(2)}
            />
            <StepFacility
              active={step === 2}
              selectedId={facility?.id}
              onSelect={handleSelectFacility}
              onBack={() => goStep(1)}
              onNext={() => goStep(3)}
            />
            <StepDateTime
              active={step === 3}
              facilityName={facility?.name}
              date={date}
              slot={slot}
              onSelectDate={handleSelectDate}
              onSelectSlot={handleSelectSlot}
              onBack={() => goStep(2)}
              onNext={() => goStep(4)}
            />
            <StepConfirm
              active={step === 4}
              agree={agree}
              onAgreeChange={setAgree}
              onBack={() => {
                setSuccess(false);
                goStep(3);
              }}
              onConfirm={handleConfirm}
              success={success}
              bookingCode={bookingCode}
            />
          </div>

          <BookingSummary vaccine={vaccine} facility={facility} date={date} slot={slot} step={step} />
        </div>
      </div>
    </>
  );
}
