package com.vaxcare.grpc.vaccine;

import com.vaxcare.feature.vaccine.dto.VaccineCategoryResponse;
import com.vaxcare.feature.vaccine.dto.VaccineResponse;
import com.vaxcare.feature.vaccine.service.VaccineCategoryService;
import com.vaxcare.feature.vaccine.dto.PriceListResponse;
import com.vaxcare.feature.vaccine.service.PriceListService;
import com.vaxcare.feature.vaccine.service.VaccineService;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

@GrpcService
@RequiredArgsConstructor
public class VaccineGrpcService extends VaccineServiceGrpc.VaccineServiceImplBase {

    private final VaccineService vaccineService;
    private final PriceListService priceListService;
    private final VaccineCategoryService categoryService;

    @Override
    public void searchVaccines(SearchVaccinesRequest request, StreamObserver<VaccineApiResponse> responseObserver) {
        try {
            Long categoryId = request.getCategoryId() == 0 ? null : request.getCategoryId();
            String keyword = GrpcProtoSupport.emptyToNull(request.getKeyword());
            Integer ageMonths = request.getAgeMonths() == 0 ? null : request.getAgeMonths();
            Long facilityId = request.getFacilityId() == 0 ? null : request.getFacilityId();

            List<VaccineResponse> list = vaccineService.searchVaccines(categoryId, keyword, ageMonths, facilityId);
            VaccineListResponse.Builder lb = VaccineListResponse.newBuilder();
            list.forEach(v -> lb.addVaccines(toProto(v)));

            responseObserver.onNext(VaccineApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Tra cứu vắc xin thành công")
                    .setList(lb.build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getVaccineById(GetVaccineRequest request, StreamObserver<VaccineApiResponse> responseObserver) {
        try {
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            Long facilityId = request.getFacilityId() == 0 ? null : request.getFacilityId();
            VaccineResponse v = vaccineService.getVaccineById(request.getId(), facilityId);
            responseObserver.onNext(VaccineApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy chi tiết vắc xin thành công")
                    .setVaccine(toProto(v))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getAllCategories(com.vaxcare.grpc.common.Empty request,
                                 StreamObserver<VaccineApiResponse> responseObserver) {
        try {
            List<VaccineCategoryResponse> cats = categoryService.getAllCategories();
            VaccineCategoryListResponse.Builder cb = VaccineCategoryListResponse.newBuilder();
            for (VaccineCategoryResponse c : cats) {
                cb.addCategories(com.vaxcare.grpc.vaccine.VaccineCategoryResponse.newBuilder()
                        .setCategoryId(GrpcProtoSupport.nz(c.getCategoryId()))
                        .setCategoryName(GrpcProtoSupport.s(c.getCategoryName()))
                        .setDescription(GrpcProtoSupport.s(c.getDescription()))
                        .build());
            }
            responseObserver.onNext(VaccineApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy danh mục vắc xin thành công")
                    .setCategories(cb.build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private com.vaxcare.grpc.vaccine.VaccineResponse toProto(VaccineResponse v) {
        return com.vaxcare.grpc.vaccine.VaccineResponse.newBuilder()
                .setVaccineId(GrpcProtoSupport.nz(v.getVaccineId()))
                .setCategoryId(GrpcProtoSupport.nz(v.getCategoryId()))
                .setCategoryName(GrpcProtoSupport.s(v.getCategoryName()))
                .setVaccineName(GrpcProtoSupport.s(v.getVaccineName()))
                .setManufacturer(GrpcProtoSupport.s(v.getManufacturer()))
                .setTargetDisease(GrpcProtoSupport.s(v.getTargetDisease()))
                .setRequiredDoses(GrpcProtoSupport.nz(v.getRequiredDoses()))
                .setDoseIntervalDays(GrpcProtoSupport.nz(v.getDoseIntervalDays()))
                .setDescription(GrpcProtoSupport.s(v.getDescription()))
                .setImageUrl(GrpcProtoSupport.s(v.getImageUrl()))
                .setAverageRating(v.getAverageRating() != null ? v.getAverageRating().toPlainString() : "")
                .setTotalBookings(GrpcProtoSupport.nz(v.getTotalBookings()))
                .setStatus(v.getStatus() != null ? v.getStatus().name() : "")
                .setCurrentPrice(v.getCurrentPrice() != null ? v.getCurrentPrice().toPlainString() : "")
                .build();
    }

    @Override
    public void getCurrentPrices(GetCurrentPricesRequest request,
                                 StreamObserver<VaccineApiResponse> responseObserver) {
        try {
            Long vaccineId = request.getVaccineId() == 0 ? null : request.getVaccineId();
            Long facilityId = request.getFacilityId() == 0 ? null : request.getFacilityId();
            var list = priceListService.getCurrentPrices(vaccineId, facilityId);
            PriceListData.Builder prices = PriceListData.newBuilder();
            for (PriceListResponse r : list) {
                prices.addPrices(PriceItem.newBuilder()
                        .setPriceListId(GrpcProtoSupport.nz(r.getPriceListId()))
                        .setVaccineId(GrpcProtoSupport.nz(r.getVaccineId()))
                        .setVaccineName(GrpcProtoSupport.s(r.getVaccineName()))
                        .setFacilityId(GrpcProtoSupport.nz(r.getFacilityId()))
                        .setFacilityName(GrpcProtoSupport.s(r.getFacilityName()))
                        .setPrice(r.getPrice() != null ? r.getPrice().toPlainString() : "")
                        .setEffectiveDate(r.getEffectiveDate() != null
                                ? r.getEffectiveDate().format(GrpcProtoSupport.ISO_DATE) : "")
                        .setExpiryDate(r.getExpiryDate() != null
                                ? r.getExpiryDate().format(GrpcProtoSupport.ISO_DATE) : "")
                        .setStatus(r.getStatus() != null ? r.getStatus().name() : "")
                        .build());
            }
            responseObserver.onNext(VaccineApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy bảng giá hiện hành thành công")
                    .setPrices(prices.build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

}
