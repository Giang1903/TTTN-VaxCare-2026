import { useState } from 'react';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import StepPills from '../../components/booking/StepPills';
import StepVaccine from '../../components/booking/StepVaccine';
import StepFacility from '../../components/booking/StepFacility';
import StepDateTime from '../../components/booking/StepDateTime';
import StepConfirm from '../../components/booking/StepConfirm';
import BookingSummary from '../../components/booking/BookingSummary';
import { bookAppointment, createVnpayPayment } from '../../services/appointmentService';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [vaccine, setVaccine] = useState(null);
  const [facility, setFacility] = useState(null);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [agree, setAgree] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function goStep(n) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectVaccine(v) {
    setVaccine(v);
    // Đổi vắc xin → bỏ chọn cơ sở/ngày/giờ cũ (có thể không còn phù hợp)
    setFacility(null);
    setDate(null);
    setSlot(null);
  }

  function handleSelectFacility(f) {
    setFacility(f);
    setDate(null);
    setSlot(null);
  }

  function handleSelectDate(d) {
    setDate(d);
    setSlot(null);
  }

  function handleSelectSlot(t) {
    setSlot(t);
  }

  async function handleConfirm() {
    if (!vaccine?.id || !facility?.id || !date?.iso || !slot) {
      setSubmitError('Thiếu thông tin đặt lịch. Vui lòng quay lại kiểm tra.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const timeSlot = slot.length === 5 ? `${slot}:00` : slot;
      const result = await bookAppointment({
        facilityId: facility.id,
        vaccineId: vaccine.id,
        appointmentDate: date.iso,
        timeSlot,
      });
      const appointmentId = result?.appointmentId;
      const code =
        result?.qrCode ||
        (appointmentId != null ? `VX-${appointmentId}` : null) ||
        `VX-${date.iso.replace(/-/g, '')}-${slot.replace(':', '')}`;
      setBookingCode(code);

      const isFreeRebook =
        result?.freeRebook === true ||
        Number(result?.price) === 0 ||
        String(result?.status || '').toUpperCase() === 'CONFIRMED';

      // Đặt lại miễn phí sau FAILED → không gọi VNPay
      if (isFreeRebook) {
        if (result?.freeRebookMessage) {
          setSubmitError(''); // clear
          // hiện message trên success view qua bookingCode note
          setBookingCode(
            (code ? code + ' · ' : '') + (result.freeRebookMessage || 'Đặt lại miễn phí — không cần thanh toán')
          );
        }
        setSuccess(true);
        return;
      }

      // Thanh toán VNPay (lịch thường)
      if (appointmentId) {
        try {
          const pay = await createVnpayPayment(appointmentId);
          if (pay?.paymentUrl) {
            window.location.href = pay.paymentUrl;
            return;
          }
        } catch (payErr) {
          setSubmitError(
            (payErr.message || 'Không tạo được link thanh toán.') +
              ' Lịch đã được tạo — bạn có thể thanh toán sau trong mục Lịch hẹn.'
          );
        }
      }
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Đặt lịch thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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
              vaccineId={vaccine?.id}
              selectedId={facility?.id}
              onSelect={(f) => {
                if (f == null) {
                  setFacility(null);
                  setDate(null);
                  setSlot(null);
                  return;
                }
                handleSelectFacility(f);
              }}
              onBack={() => goStep(1)}
              onNext={() => goStep(3)}
            />
            <StepDateTime
              active={step === 3}
              facilityId={facility?.id}
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
                setSubmitError('');
                goStep(3);
              }}
              onConfirm={handleConfirm}
              success={success}
              bookingCode={bookingCode}
              submitting={submitting}
              submitError={submitError}
            />
          </div>

          <BookingSummary
            vaccine={vaccine}
            facility={facility}
            date={date}
            slot={slot}
            step={step}
          />
        </div>
      </div>
    </>
  );
}