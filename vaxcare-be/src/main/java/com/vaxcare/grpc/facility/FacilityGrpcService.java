package com.vaxcare.grpc.facility;

import com.vaxcare.feature.facility.dto.FacilityResponse;
import com.vaxcare.feature.facility.service.VaccinationFacilityService;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

@GrpcService
@RequiredArgsConstructor
public class FacilityGrpcService extends FacilityServiceGrpc.FacilityServiceImplBase {

    private final VaccinationFacilityService facilityService;

    @Override
    public void listFacilities(ListFacilitiesRequest request, StreamObserver<FacilityApiResponse> responseObserver) {
        try {
            List<FacilityResponse> list;
            String message;
            if (request.getVaccineId() != 0) {
                list = facilityService.getActiveFacilitiesWithVaccine(request.getVaccineId());
                message = "Lấy danh sách cơ sở còn vắc xin thành công";
            } else {
                list = facilityService.getActiveFacilities();
                message = "Lấy danh sách cơ sở tiêm chủng thành công";
            }
            FacilityListResponse.Builder lb = FacilityListResponse.newBuilder();
            for (FacilityResponse f : list) {
                lb.addFacilities(toProto(f));
            }
            responseObserver.onNext(FacilityApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage(message)
                    .setList(lb.build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getFacilityById(GetFacilityRequest request, StreamObserver<FacilityApiResponse> responseObserver) {
        try {
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            FacilityResponse f = facilityService.getFacilityById(request.getId());
            responseObserver.onNext(FacilityApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy chi tiết cơ sở tiêm chủng thành công")
                    .setFacility(toProto(f))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private FacilityData toProto(FacilityResponse f) {
        return FacilityData.newBuilder()
                .setFacilityId(GrpcProtoSupport.nz(f.getFacilityId()))
                .setFacilityName(GrpcProtoSupport.s(f.getFacilityName()))
                .setAddress(GrpcProtoSupport.s(f.getAddress()))
                .setPhone(GrpcProtoSupport.s(f.getPhone()))
                .setOpeningTime(f.getOpeningTime() != null
                        ? f.getOpeningTime().format(GrpcProtoSupport.ISO_TIME) : "")
                .setClosingTime(f.getClosingTime() != null
                        ? f.getClosingTime().format(GrpcProtoSupport.ISO_TIME) : "")
                .setCapacityPerSlot(GrpcProtoSupport.nz(f.getCapacityPerSlot()))
                .setImageUrl(GrpcProtoSupport.s(f.getImageUrl()))
                .setStatus(f.getStatus() != null ? f.getStatus().name() : "")
                .build();
    }
}
