package com.vaxcare.grpc.staff;

import com.vaxcare.common.enums.AppointmentStatus;
import com.vaxcare.feature.appointment.service.StaffAppointmentService;
import com.vaxcare.grpc.appointment.AppointmentApiResponse;
import com.vaxcare.grpc.appointment.AppointmentListResponse;
import com.vaxcare.grpc.appointment.AppointmentResponse;
import com.vaxcare.feature.auth.repository.MedicalStaffRepository;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.LocalDate;
import java.util.List;

@GrpcService
@RequiredArgsConstructor
public class StaffAppointmentGrpcService extends StaffAppointmentServiceGrpc.StaffAppointmentServiceImplBase {

    private final StaffAppointmentService staffAppointmentService;
    private final MedicalStaffRepository medicalStaffRepository;

    @Override
    public void searchAppointments(SearchAppointmentsRequest request,
                                   StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            Long facilityId = request.getFacilityId() == 0 ? null : request.getFacilityId();
            if (facilityId != null) {
                GrpcAuthHelper.requireFacilityAccess(facilityId, medicalStaffRepository);
            }
            LocalDate date = GrpcProtoSupport.optionalDate(request.getDate(), "date");
            AppointmentStatus status = parseStatus(request.getStatus());
            String keyword = GrpcProtoSupport.emptyToNull(request.getKeyword());
            boolean paidOnly = request.getPaidOnly();

            List<com.vaxcare.feature.appointment.dto.AppointmentResponse> list =
                    staffAppointmentService.searchAppointments(
                            accountId, facilityId, date, status, keyword, paidOnly);

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
    public void confirmAppointment(AppointmentIdRequest request,
                                   StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            requireId(request.getId());
            var a = staffAppointmentService.confirmAppointment(request.getId(), accountId);
            respondAppointment(responseObserver, "Xác nhận lịch hẹn thành công", a);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void checkin(CheckinRequest request,
                        StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcProtoSupport.requireNonBlank(request.getQrCode(), "qr_code");
            var a = staffAppointmentService.checkin(request.getQrCode().trim(), accountId);
            respondAppointment(responseObserver, "Check-in thành công", a);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void completeVaccination(AppointmentIdRequest request,
                                    StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            requireId(request.getId());
            var a = staffAppointmentService.completeVaccination(request.getId(), accountId);
            respondAppointment(responseObserver, "Hoàn tất tiêm chủng thành công, đã cập nhật tồn kho", a);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void updateNote(UpdateNoteRequest request,
                           StreamObserver<AppointmentApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            requireId(request.getId());
            String note = GrpcProtoSupport.emptyToNull(request.getNote());
            var a = staffAppointmentService.updateNote(request.getId(), note, accountId);
            respondAppointment(responseObserver, "Đã lưu ghi chú lịch hẹn", a);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private void respondAppointment(StreamObserver<AppointmentApiResponse> obs,
                                    String message,
                                    com.vaxcare.feature.appointment.dto.AppointmentResponse a) {
        obs.onNext(AppointmentApiResponse.newBuilder()
                .setTimestamp(GrpcProtoSupport.now())
                .setStatus(200)
                .setMessage(message)
                .setAppointment(toProto(a))
                .build());
        obs.onCompleted();
    }

    private static void requireId(long id) {
        if (id <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
        }
    }

    private static AppointmentStatus parseStatus(String s) {
        if (s == null || s.isEmpty()) return null;
        try {
            return AppointmentStatus.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("status must be a valid AppointmentStatus name")
                    .asRuntimeException();
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
