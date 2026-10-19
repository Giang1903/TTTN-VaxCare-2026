package com.vaxcare.grpc.appointment;

import com.vaxcare.feature.appointment.dto.AppointmentRequest;
import com.vaxcare.feature.appointment.dto.AppointmentSlotResponse;
import com.vaxcare.feature.appointment.dto.CancelAppointmentRequest;
import com.vaxcare.feature.appointment.dto.QrCodeResponse;
import com.vaxcare.feature.appointment.dto.RescheduleRequest;
import com.vaxcare.feature.appointment.service.AppointmentService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class AppointmentGrpcService extends AppointmentServiceGrpc.AppointmentServiceImplBase {

    private final AppointmentService appointmentService;

    @Override
    public void getAvailableSlots(AvailableSlotsRequest request,
                                  StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            if (request.getFacilityId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("facility_id is required").asRuntimeException();
            }
            var date = GrpcProtoSupport.requireDate(request.getDate(), "date");
            List<AppointmentSlotResponse> slots =
                    appointmentService.getAvailableSlots(request.getFacilityId(), date);

            AvailableSlotsResponse.Builder list = AvailableSlotsResponse.newBuilder();
            for (AppointmentSlotResponse s : slots) {
                list.addSlots(AppointmentSlot.newBuilder()
                        .setTimeSlot(s.getTimeSlot() != null
                                ? s.getTimeSlot().format(GrpcProtoSupport.ISO_TIME) : "")
                        .setAvailableCapacity(GrpcProtoSupport.nz(s.getAvailableCount()))
                        .setMaxCapacity(GrpcProtoSupport.nz(s.getCapacity()))
                        .setAvailable(s.getFull() == null || !s.getFull())
                        .build());
            }
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy danh sách khung giờ trống thành công")
                    .setSlots(list.build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getMyAppointments(com.vaxcare.grpc.common.Empty request,
                                  StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            List<com.vaxcare.feature.appointment.dto.AppointmentResponse> list =
                    appointmentService.getMyAppointments(userId);
            AppointmentListResponse.Builder builder = AppointmentListResponse.newBuilder();
            list.forEach(a -> builder.addAppointments(toProto(a)));
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy danh sách lịch hẹn thành công")
                    .setList(builder.build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getAppointmentById(GetAppointmentRequest request,
                                   StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            com.vaxcare.feature.appointment.dto.AppointmentResponse a =
                    appointmentService.getAppointmentById(request.getId(), userId);
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy chi tiết lịch hẹn thành công")
                    .setAppointment(toProto(a))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getQrCode(GetAppointmentRequest request,
                          StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            QrCodeResponse qr = appointmentService.getQrCode(request.getId(), userId);
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy mã QR lịch hẹn thành công")
                    .setQr(com.vaxcare.grpc.appointment.QrCodeResponse.newBuilder()
                            .setQrCode(GrpcProtoSupport.s(qr.getQrCodeToken()))
                            .setAppointmentCode(qr.getAppointmentId() != null
                                    ? String.valueOf(qr.getAppointmentId()) : "")
                            .setQrCodeImageBase64(GrpcProtoSupport.s(qr.getQrCodeImageBase64()))
                            .build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void bookAppointment(BookAppointmentRequest request,
                                StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getFacilityId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("facility_id is required").asRuntimeException();
            }
            if (request.getVaccineId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("vaccine_id is required").asRuntimeException();
            }

            AppointmentRequest dto = new AppointmentRequest();
            dto.setFacilityId(request.getFacilityId());
            dto.setVaccineId(request.getVaccineId());
            dto.setAppointmentDate(GrpcProtoSupport.requireDate(request.getAppointmentDate(), "appointment_date"));
            dto.setTimeSlot(GrpcProtoSupport.requireTime(request.getTimeSlot(), "time_slot"));
            dto.setNote(GrpcProtoSupport.emptyToNull(request.getNote()));

            com.vaxcare.feature.appointment.dto.AppointmentResponse a =
                    appointmentService.bookAppointment(userId, dto);
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Đặt lịch hẹn thành công")
                    .setAppointment(toProto(a))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void cancelAppointment(com.vaxcare.grpc.appointment.CancelAppointmentRequest request,
                                  StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            CancelAppointmentRequest dto = new CancelAppointmentRequest();
            dto.setReason(GrpcProtoSupport.emptyToNull(request.getReason()));

            com.vaxcare.feature.appointment.dto.AppointmentResponse a =
                    appointmentService.cancelAppointment(request.getId(), userId, dto);
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Hủy lịch hẹn thành công")
                    .setAppointment(toProto(a))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void rescheduleAppointment(RescheduleAppointmentRequest request,
                                      StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            RescheduleRequest dto = new RescheduleRequest();
            dto.setAppointmentDate(GrpcProtoSupport.requireDate(request.getAppointmentDate(), "appointment_date"));
            dto.setTimeSlot(GrpcProtoSupport.requireTime(request.getTimeSlot(), "time_slot"));

            com.vaxcare.feature.appointment.dto.AppointmentResponse a =
                    appointmentService.rescheduleAppointment(request.getId(), userId, dto);
            responseObserver.onNext(AppointmentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Đổi lịch hẹn thành công")
                    .setAppointment(toProto(a))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private AppointmentResponse toProto(com.vaxcare.feature.appointment.dto.AppointmentResponse a) {
        return AppointmentResponse.newBuilder()
                .setAppointmentId(GrpcProtoSupport.nz(a.getAppointmentId()))
                .setUserId(GrpcProtoSupport.nz(a.getUserId()))
                .setUserFullName(GrpcProtoSupport.s(a.getUserFullName()))
                .setFacilityId(GrpcProtoSupport.nz(a.getFacilityId()))
                .setFacilityName(GrpcProtoSupport.s(a.getFacilityName()))
                .setUserPhone(GrpcProtoSupport.s(a.getUserPhone()))
                .setVaccineId(GrpcProtoSupport.nz(a.getVaccineId()))
                .setVaccineName(GrpcProtoSupport.s(a.getVaccineName()))
                .setStaffId(GrpcProtoSupport.nz(a.getStaffId()))
                .setStaffName(GrpcProtoSupport.s(a.getStaffName()))
                .setPrice(a.getPrice() != null ? a.getPrice().toPlainString() : "0")
                .setRecommendedByAi(Boolean.TRUE.equals(a.getRecommendedByAi()))
                .setPredictionId(GrpcProtoSupport.nz(a.getPredictionId()))
                .setAppointmentDate(a.getAppointmentDate() != null
                        ? a.getAppointmentDate().format(GrpcProtoSupport.ISO_DATE) : "")
                .setTimeSlot(a.getTimeSlot() != null
                        ? a.getTimeSlot().format(GrpcProtoSupport.ISO_TIME) : "")
                .setStatus(a.getStatus() != null ? a.getStatus().name() : "")
                .setQrCode(GrpcProtoSupport.s(a.getQrCode()))
                .setNote(GrpcProtoSupport.s(a.getNote()))
                .setCreatedAt(a.getCreatedAt() != null
                        ? a.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                .setPaymentStatus(a.getPaymentStatus() != null ? a.getPaymentStatus().name() : "")
                .setPaid(Boolean.TRUE.equals(a.getPaid()))
                .setCancelledAt(a.getCancelledAt() != null
                        ? a.getCancelledAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                .setCancellationReason(GrpcProtoSupport.s(a.getCancellationReason()))
                .setFreeRebook(Boolean.TRUE.equals(a.getFreeRebook()))
                .setFreeRebookMessage(GrpcProtoSupport.s(a.getFreeRebookMessage()))
                .setVaccinationResult(a.getVaccinationResult() != null
                        ? a.getVaccinationResult().name() : "")
                .setVaccinationDetailId(GrpcProtoSupport.nz(a.getVaccinationDetailId()))
                .setHasCertificate(Boolean.TRUE.equals(a.getHasCertificate()))
                .build();
    }
}
