package com.vaxcare.grpc.vaccination;

import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.feature.vaccination.dto.RecordVaccinationRequest;
import com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse;
import com.vaxcare.feature.vaccination.dto.VaccinationHistoryResponse;
import com.vaxcare.feature.vaccination.service.VaccinationService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
@RequiredArgsConstructor
public class VaccinationGrpcService extends VaccinationServiceGrpc.VaccinationServiceImplBase {

    private final VaccinationService vaccinationService;

    @Override
    public void getMyHistory(com.vaxcare.grpc.common.Empty request,
                             StreamObserver<VaccinationApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            VaccinationHistoryResponse history = vaccinationService.getHistoryByUserId(userId, userId);
            responseObserver.onNext(VaccinationApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy lịch sử tiêm chủng thành công")
                    .setHistory(toProto(history))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getHistoryByUserId(GetHistoryByUserRequest request,
                                   StreamObserver<VaccinationApiResponse> responseObserver) {
        try {
            Long currentId = GrpcAuthHelper.requireUserId();
            if (request.getUserId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("user_id is required").asRuntimeException();
            }
            VaccinationHistoryResponse history =
                    vaccinationService.getHistoryByUserId(request.getUserId(), currentId);
            responseObserver.onNext(VaccinationApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy lịch sử tiêm chủng thành công")
                    .setHistory(toProto(history))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void recordVaccination(com.vaxcare.grpc.vaccination.RecordVaccinationRequest request,
                                  StreamObserver<VaccinationApiResponse> responseObserver) {
        try {
            Long staffId = GrpcAuthHelper.requireStaffOrAdminId();
            if (request.getAppointmentId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("appointment_id is required").asRuntimeException();
            }
            RecordVaccinationRequest dto = new RecordVaccinationRequest();
            dto.setAppointmentId(request.getAppointmentId());
            if (request.getDoseNumber() > 0) {
                dto.setDoseNumber(request.getDoseNumber());
            }
            if (request.getInjectionDate() != null && !request.getInjectionDate().isBlank()) {
                dto.setInjectionDate(GrpcProtoSupport.requireDate(request.getInjectionDate(), "injection_date"));
            }
            if (request.getResult() != null && !request.getResult().isBlank()) {
                try {
                    dto.setResult(VaccinationResult.valueOf(request.getResult().trim().toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    throw Status.INVALID_ARGUMENT.withDescription("invalid result").asRuntimeException();
                }
            }
            if (request.getNote() != null && !request.getNote().isBlank()) {
                dto.setNote(request.getNote());
            }
            VaccinationDetailResponse detail = vaccinationService.recordVaccination(dto, staffId);
            responseObserver.onNext(VaccinationApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Ghi nhận kết quả tiêm chủng thành công")
                    .setDetail(toDetailProto(detail))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private VaccinationDetail toDetailProto(VaccinationDetailResponse d) {
        return VaccinationDetail.newBuilder()
                .setDetailId(GrpcProtoSupport.nz(d.getDetailId()))
                .setHistoryId(GrpcProtoSupport.nz(d.getHistoryId()))
                .setAppointmentId(GrpcProtoSupport.nz(d.getAppointmentId()))
                .setVaccineId(GrpcProtoSupport.nz(d.getVaccineId()))
                .setVaccineName(GrpcProtoSupport.s(d.getVaccineName()))
                .setBatchId(GrpcProtoSupport.nz(d.getBatchId()))
                .setBatchNumber(GrpcProtoSupport.s(d.getBatchNumber()))
                .setFacilityId(GrpcProtoSupport.nz(d.getFacilityId()))
                .setFacilityName(GrpcProtoSupport.s(d.getFacilityName()))
                .setStaffId(GrpcProtoSupport.nz(d.getStaffId()))
                .setStaffName(GrpcProtoSupport.s(d.getStaffName()))
                .setDoseNumber(GrpcProtoSupport.nz(d.getDoseNumber()))
                .setRequiredDoses(GrpcProtoSupport.nz(d.getRequiredDoses()))
                .setInjectionDate(d.getInjectionDate() != null
                        ? d.getInjectionDate().format(GrpcProtoSupport.ISO_DATE) : "")
                .setResult(d.getResult() != null ? d.getResult().name() : "")
                .setNote(GrpcProtoSupport.s(d.getNote()))
                .setCertificateCode(GrpcProtoSupport.s(d.getCertificateCode()))
                .setCreatedAt(d.getCreatedAt() != null
                        ? d.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                .build();
    }

private com.vaxcare.grpc.vaccination.VaccinationHistoryResponse toProto(VaccinationHistoryResponse h) {
        com.vaxcare.grpc.vaccination.VaccinationHistoryResponse.Builder b =
                com.vaxcare.grpc.vaccination.VaccinationHistoryResponse.newBuilder()
                        .setHistoryId(GrpcProtoSupport.nz(h.getHistoryId()))
                        .setUserId(GrpcProtoSupport.nz(h.getUserId()))
                        .setUserFullName(GrpcProtoSupport.s(h.getUserFullName()))
                        .setTotalDoses(GrpcProtoSupport.nz(h.getTotalDoses()));
        if (h.getDetails() != null) {
            for (VaccinationDetailResponse d : h.getDetails()) {
                b.addDetails(VaccinationDetail.newBuilder()
                        .setDetailId(GrpcProtoSupport.nz(d.getDetailId()))
                        .setHistoryId(GrpcProtoSupport.nz(d.getHistoryId()))
                        .setAppointmentId(GrpcProtoSupport.nz(d.getAppointmentId()))
                        .setVaccineId(GrpcProtoSupport.nz(d.getVaccineId()))
                        .setVaccineName(GrpcProtoSupport.s(d.getVaccineName()))
                        .setBatchId(GrpcProtoSupport.nz(d.getBatchId()))
                        .setBatchNumber(GrpcProtoSupport.s(d.getBatchNumber()))
                        .setFacilityId(GrpcProtoSupport.nz(d.getFacilityId()))
                        .setFacilityName(GrpcProtoSupport.s(d.getFacilityName()))
                        .setStaffId(GrpcProtoSupport.nz(d.getStaffId()))
                        .setStaffName(GrpcProtoSupport.s(d.getStaffName()))
                        .setDoseNumber(GrpcProtoSupport.nz(d.getDoseNumber()))
                        .setRequiredDoses(GrpcProtoSupport.nz(d.getRequiredDoses()))
                        .setInjectionDate(d.getInjectionDate() != null
                                ? d.getInjectionDate().format(GrpcProtoSupport.ISO_DATE) : "")
                        .setResult(d.getResult() != null ? d.getResult().name() : "")
                        .setNote(GrpcProtoSupport.s(d.getNote()))
                        .setCertificateCode(GrpcProtoSupport.s(d.getCertificateCode()))
                        .setCreatedAt(d.getCreatedAt() != null
                                ? d.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                        .build());
            }
        }
        return b.build();
    }
}
