package com.vaxcare.grpc.inventory;

import com.vaxcare.common.enums.BatchStatus;
import com.vaxcare.feature.inventory.dto.AlertThresholdRequest;
import com.vaxcare.feature.inventory.dto.StockSummaryResponse;
import com.vaxcare.feature.inventory.dto.VaccineBatchRequest;
import com.vaxcare.feature.inventory.dto.VaccineBatchResponse;
import com.vaxcare.feature.auth.repository.MedicalStaffRepository;
import com.vaxcare.feature.inventory.service.InventoryService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.math.BigDecimal;
import java.util.List;

@GrpcService
@RequiredArgsConstructor
public class InventoryGrpcService extends InventoryServiceGrpc.InventoryServiceImplBase {

    private final InventoryService inventoryService;
    private final MedicalStaffRepository medicalStaffRepository;

    @Override
    public void getStockSummary(FacilityIdRequest request,
                                StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcAuthHelper.requireFacilityAccess(request.getFacilityId(), medicalStaffRepository);
            List<StockSummaryResponse> list =
                    inventoryService.getStockSummary(request.getFacilityId(), accountId);
            okStock(responseObserver, "Lấy tồn kho theo cơ sở thành công", list);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getLowStockAlerts(FacilityIdRequest request,
                                  StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcAuthHelper.requireFacilityAccess(request.getFacilityId(), medicalStaffRepository);
            List<StockSummaryResponse> list =
                    inventoryService.getLowStockAlerts(request.getFacilityId(), accountId);
            okStock(responseObserver, "Lấy danh sách cảnh báo tồn kho thấp thành công", list);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getExpiringSoon(ExpiringSoonRequest request,
                                StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcAuthHelper.requireFacilityAccess(request.getFacilityId(), medicalStaffRepository);
            int days = request.getWithinDays() > 0 ? request.getWithinDays() : 30;
            List<VaccineBatchResponse> list =
                    inventoryService.getExpiringSoon(request.getFacilityId(), days, accountId);
            okBatches(responseObserver, "Lấy danh sách lô vắc xin sắp hết hạn thành công", list);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void updateAlertThreshold(UpdateAlertThresholdRequest request,
                                     StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcAuthHelper.requireFacilityAccess(request.getFacilityId(), medicalStaffRepository);
            if (request.getAlertThreshold() < 0) {
                throw Status.INVALID_ARGUMENT.withDescription("alert_threshold must be >= 0").asRuntimeException();
            }
            AlertThresholdRequest dto = new AlertThresholdRequest();
            dto.setAlertThreshold(request.getAlertThreshold());
            inventoryService.updateAlertThreshold(request.getFacilityId(), dto, accountId);
            responseObserver.onNext(InventoryApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Cập nhật ngưỡng cảnh báo tồn kho thành công").build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void importBatch(ImportBatchRequest request,
                            StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcAuthHelper.requireFacilityAccess(request.getFacilityId(), medicalStaffRepository);
            if (request.getVaccineId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("vaccine_id is required").asRuntimeException();
            }
            GrpcProtoSupport.requireNonBlank(request.getBatchNumber(), "batch_number");
            if (request.getImportedQuantity() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("imported_quantity must be > 0").asRuntimeException();
            }

            VaccineBatchRequest dto = new VaccineBatchRequest();
            dto.setFacilityId(request.getFacilityId());
            dto.setVaccineId(request.getVaccineId());
            dto.setBatchNumber(request.getBatchNumber().trim());
            dto.setManufactureDate(GrpcProtoSupport.optionalDate(request.getManufactureDate(), "manufacture_date"));
            dto.setExpiryDate(GrpcProtoSupport.requireDate(request.getExpiryDate(), "expiry_date"));
            dto.setImportedQuantity(request.getImportedQuantity());
            if (request.getImportPrice() != null && !request.getImportPrice().isEmpty()) {
                try {
                    dto.setImportPrice(new BigDecimal(request.getImportPrice()));
                } catch (NumberFormatException e) {
                    throw Status.INVALID_ARGUMENT.withDescription("import_price must be a number").asRuntimeException();
                }
            }
            dto.setImportDate(GrpcProtoSupport.optionalDate(request.getImportDate(), "import_date"));

            VaccineBatchResponse b = inventoryService.importBatch(dto, accountId);
            responseObserver.onNext(InventoryApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Nhập lô vắc xin thành công")
                    .setBatch(toBatch(b)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void listBatches(ListBatchesRequest request,
                            StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            GrpcAuthHelper.requireFacilityAccess(request.getFacilityId(), medicalStaffRepository);
            Long vaccineId = request.getVaccineId() == 0 ? null : request.getVaccineId();
            BatchStatus status = parseBatchStatus(request.getStatus());
            List<VaccineBatchResponse> list =
                    inventoryService.getBatches(request.getFacilityId(), vaccineId, status, accountId);
            okBatches(responseObserver, "Lấy danh sách lô vắc xin thành công", list);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getBatchById(BatchIdRequest request,
                             StreamObserver<InventoryApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            if (request.getId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
            }
            VaccineBatchResponse b = inventoryService.getBatchById(request.getId(), accountId);
            responseObserver.onNext(InventoryApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy chi tiết lô vắc xin thành công")
                    .setBatch(toBatch(b)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private void okStock(StreamObserver<InventoryApiResponse> obs, String msg, List<StockSummaryResponse> list) {
        obs.onNext(InventoryApiResponse.newBuilder()
                .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                .setMessage(msg).setStockList(toStockList(list)).build());
        obs.onCompleted();
    }

    private void okBatches(StreamObserver<InventoryApiResponse> obs, String msg, List<VaccineBatchResponse> list) {
        VaccineBatchList.Builder bl = VaccineBatchList.newBuilder();
        list.forEach(b -> bl.addBatches(toBatch(b)));
        obs.onNext(InventoryApiResponse.newBuilder()
                .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                .setMessage(msg).setBatchList(bl.build()).build());
        obs.onCompleted();
    }


    private static BatchStatus parseBatchStatus(String s) {
        if (s == null || s.isEmpty()) return null;
        try {
            return BatchStatus.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw Status.INVALID_ARGUMENT.withDescription("invalid batch status").asRuntimeException();
        }
    }

    private static StockSummaryList toStockList(List<StockSummaryResponse> list) {
        StockSummaryList.Builder b = StockSummaryList.newBuilder();
        for (StockSummaryResponse s : list) {
            b.addItems(StockSummaryItem.newBuilder()
                    .setFacilityId(GrpcProtoSupport.nz(s.getFacilityId()))
                    .setFacilityName(GrpcProtoSupport.s(s.getFacilityName()))
                    .setVaccineId(GrpcProtoSupport.nz(s.getVaccineId()))
                    .setVaccineName(GrpcProtoSupport.s(s.getVaccineName()))
                    .setTotalStock(GrpcProtoSupport.nz(s.getTotalStock()))
                    .setAlertThreshold(GrpcProtoSupport.nz(s.getAlertThreshold()))
                    .setIsLowStock(Boolean.TRUE.equals(s.getIsLowStock()))
                    .build());
        }
        return b.build();
    }

    private static VaccineBatchData toBatch(VaccineBatchResponse b) {
        return VaccineBatchData.newBuilder()
                .setBatchId(GrpcProtoSupport.nz(b.getBatchId()))
                .setInventoryId(GrpcProtoSupport.nz(b.getInventoryId()))
                .setFacilityId(GrpcProtoSupport.nz(b.getFacilityId()))
                .setVaccineId(GrpcProtoSupport.nz(b.getVaccineId()))
                .setVaccineName(GrpcProtoSupport.s(b.getVaccineName()))
                .setBatchNumber(GrpcProtoSupport.s(b.getBatchNumber()))
                .setManufactureDate(b.getManufactureDate() != null
                        ? b.getManufactureDate().format(GrpcProtoSupport.ISO_DATE) : "")
                .setExpiryDate(b.getExpiryDate() != null
                        ? b.getExpiryDate().format(GrpcProtoSupport.ISO_DATE) : "")
                .setImportedQuantity(GrpcProtoSupport.nz(b.getImportedQuantity()))
                .setStockQuantity(GrpcProtoSupport.nz(b.getStockQuantity()))
                .setImportPrice(b.getImportPrice() != null ? b.getImportPrice().toPlainString() : "")
                .setImportDate(b.getImportDate() != null
                        ? b.getImportDate().format(GrpcProtoSupport.ISO_DATE) : "")
                .setStatus(b.getStatus() != null ? b.getStatus().name() : "")
                .build();
    }
}
