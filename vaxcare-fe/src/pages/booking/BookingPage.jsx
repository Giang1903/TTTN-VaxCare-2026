import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import StepPills from '../../components/booking/StepPills';
import StepVaccine from '../../components/booking/StepVaccine';
import StepFacility from '../../components/booking/StepFacility';
import StepDateTime from '../../components/booking/StepDateTime';
import StepConfirm from '../../components/booking/StepConfirm';
import BookingSummary from '../../components/booking/BookingSummary';
import { bookAppointment, createVnpayPayment } from '../../services/appointmentService';
import { getVaccineById } from '../../services/vaccineService';
import { getFacilityById } from '../../services/facilityService';

const DOWS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

function buildDateObj(iso) {
  if (!iso) return null;
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return {
    key: `${yyyy}-${mm}-${dd}`,
    iso: `${yyyy}-${mm}-${dd}`,
    label: `${dd}/${mm}/${yyyy}`,
    dow: DOWS[d.getDay()],
    dom: d.getDate(),
    moy: MONTHS[d.getMonth()],
  };
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
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
  const [prefillDone, setPrefillDone] = useState(false);

  // Prefill từ AI gợi ý: /booking?vaccineId=&facilityId=&date=&time=
  useEffect(() => {
    if (prefillDone) return;
    const vaccineId = searchParams.get('vaccineId');
    const facilityId = searchParams.get('facilityId');
    const dateIso = searchParams.get('date');
    const time = searchParams.get('time');
    if (!vaccineId && !facilityId && !dateIso && !time) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefillDone(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let nextStep = 1;
        if (vaccineId) {
          const v = await getVaccineById(vaccineId);
          if (cancelled || !v) return;
          setVaccine({
            id: v.vaccineId,
            name: v.vaccineName,
            title: v.vaccineName,
            desc: v.targetDisease ? `Phòng: ${v.targetDisease}` : v.manufacturer || '',
            price: v.price,
          });
          nextStep = 2;
        }
        if (facilityId) {
          const f = await getFacilityById(facilityId);
          if (cancelled || !f) {
            if (!cancelled) {
              setStep(nextStep);
              setPrefillDone(true);
            }
            return;
          }
          setFacility({
            id: f.facilityId,
            name: f.facilityName,
            title: f.facilityName,
            desc: f.address || '',
          });
          nextStep = 3;
        }
        if (dateIso) {
          const dObj = buildDateObj(dateIso);
          if (dObj) {
            setDate(dObj);
            nextStep = 3;
          }
        }
        if (time) {
          setSlot(String(time).slice(0, 5));
          if (dateIso && facilityId && vaccineId) nextStep = 4;
        }
        if (!cancelled) {
          setStep(nextStep);
          setPrefillDone(true);
        }
      } catch {
        if (!cancelled) setPrefillDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, prefillDone]);

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