package com.vaxcare.feature.inventory.service;

import com.vaxcare.common.enums.BatchStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import com.vaxcare.feature.inventory.dto.AlertThresholdRequest;
import com.vaxcare.feature.inventory.dto.StockSummaryResponse;
import com.vaxcare.feature.inventory.dto.VaccineBatchRequest;
import com.vaxcare.feature.inventory.dto.VaccineBatchResponse;
import com.vaxcare.feature.inventory.entity.VaccineBatch;
import com.vaxcare.feature.inventory.entity.VaccineInventory;
import com.vaxcare.feature.inventory.repository.VaccineBatchRepository;
import com.vaxcare.feature.inventory.repository.VaccineInventoryRepository;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class InventoryService {

    private final VaccineInventoryRepository inventoryRepository;
    private final VaccineBatchRepository batchRepository;
    private final VaccinationFacilityRepository facilityRepository;
    private final VaccineRepository vaccineRepository;

    // ===================== NHẬP LÔ VẮC XIN =====================

    @Transactional
    public VaccineBatchResponse importBatch(VaccineBatchRequest request) {
        VaccinationFacility facility = findFacilityOrThrow(request.getFacilityId());
        Vaccine vaccine = findVaccineOrThrow(request.getVaccineId());

        if (request.getManufactureDate() != null && request.getExpiryDate().isBefore(request.getManufactureDate())) {
            throw new BadRequestException("Ngày hết hạn phải sau ngày sản xuất");
        }
        if (!request.getExpiryDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("Không thể nhập lô vắc xin đã hết hạn hoặc hết hạn ngay hôm nay");
        }

        VaccineInventory inventory = getOrCreateInventory(facility);

        VaccineBatch batch = VaccineBatch.builder()
                .inventory(inventory)
                .vaccine(vaccine)
                .batchNumber(request.getBatchNumber())
                .manufactureDate(request.getManufactureDate())
                .expiryDate(request.getExpiryDate())
                .importedQuantity(request.getImportedQuantity())
                .stockQuantity(request.getImportedQuantity())
                .importPrice(request.getImportPrice())
                .importDate(request.getImportDate() != null ? request.getImportDate() : LocalDate.now())
                .status(BatchStatus.AVAILABLE)
                .build();

        return mapBatchToResponse(batchRepository.save(batch));
    }

    // ===================== XEM DANH SÁCH LÔ =====================

    @Transactional
    public List<VaccineBatchResponse> getBatches(Long facilityId, Long vaccineId, BatchStatus status) {
        findFacilityOrThrow(facilityId);
        syncExpiredBatches();
        return batchRepository.searchBatches(facilityId, vaccineId, status).stream()
                .map(this::mapBatchToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VaccineBatchResponse getBatchById(Long batchId) {
        return mapBatchToResponse(findBatchOrThrow(batchId));
    }

    // ===================== TỒN KHO & CẢNH BÁO =====================

    @Transactional
    public List<StockSummaryResponse> getStockSummary(Long facilityId) {
        VaccinationFacility facility = findFacilityOrThrow(facilityId);
        syncExpiredBatches();

        VaccineInventory inventory = inventoryRepository.findByFacility_FacilityId(facilityId).orElse(null);
        int alertThreshold = inventory != null ? inventory.getAlertThreshold() : 50;

        List<Object[]> rows = batchRepository.sumStockGroupByVaccine(facilityId);

        // Gom hết vaccineId cần tra rồi load 1 lần duy nhất (thay vì 1 query/vaccine trong vòng lặp)
        List<Long> vaccineIds = rows.stream().map(row -> (Long) row[0]).toList();
        Map<Long, Vaccine> vaccineCache = vaccineRepository.findAllById(vaccineIds).stream()
                .collect(java.util.stream.Collectors.toMap(Vaccine::getVaccineId, v -> v));

        return rows.stream()
                .map(row -> {
                    Long vaccineId = (Long) row[0];
                    Long totalStock = (Long) row[1];
                    Vaccine vaccine = vaccineCache.get(vaccineId);
                    if (vaccine == null) {
                        throw new ResourceNotFoundException("Không tìm thấy vắc xin có ID: " + vaccineId);
                    }

                    return StockSummaryResponse.builder()
                            .facilityId(facility.getFacilityId())
                            .facilityName(facility.getFacilityName())
                            .vaccineId(vaccineId)
                            .vaccineName(vaccine.getVaccineName())
                            .totalStock(totalStock.intValue())
                            .alertThreshold(alertThreshold)
                            .isLowStock(totalStock.intValue() <= alertThreshold)
                            .build();
                })
                .toList();
    }

    @Transactional
    public List<StockSummaryResponse> getLowStockAlerts(Long facilityId) {
        return getStockSummary(facilityId).stream()
                .filter(StockSummaryResponse::getIsLowStock)
                .toList();
    }

    @Transactional
    public List<VaccineBatchResponse> getExpiringSoon(Long facilityId, int withinDays) {
        findFacilityOrThrow(facilityId);
        syncExpiredBatches();

        if (withinDays < 0) {
            throw new BadRequestException("Số ngày tra cứu không được âm");
        }

        LocalDate today = LocalDate.now();
        LocalDate untilDate = today.plusDays(withinDays);

        return batchRepository.findExpiringSoon(facilityId, today, untilDate).stream()
                .map(this::mapBatchToResponse)
                .toList();
    }

    @Transactional
    public void updateAlertThreshold(Long facilityId, AlertThresholdRequest request) {
        VaccinationFacility facility = findFacilityOrThrow(facilityId);
        VaccineInventory inventory = getOrCreateInventory(facility);
        inventory.setAlertThreshold(request.getAlertThreshold());
        inventoryRepository.save(inventory);
    }

    // ===================== TRỪ KHO TỰ ĐỘNG KHI HOÀN TẤT TIÊM CHỦNG =====================

    @Transactional
    public void deductStockForVaccination(Long facilityId, Long vaccineId, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Số lượng liều cần trừ kho phải lớn hơn 0");
        }

        // Khoá ghi (PESSIMISTIC_WRITE) trên các lô liên quan để tránh 2 giao dịch song song
        // cùng đọc số tồn cũ rồi cùng ghi đè, dẫn tới trừ kho sai khi nhiều Staff thao tác cùng lúc.
        List<VaccineBatch> batches = batchRepository.findAvailableBatchesForUpdate(facilityId, vaccineId, LocalDate.now());

        int remaining = quantity;
        for (VaccineBatch batch : batches) {
            if (remaining <= 0) {
                break;
            }
            int deductFromThisBatch = Math.min(batch.getStockQuantity(), remaining);
            batch.setStockQuantity(batch.getStockQuantity() - deductFromThisBatch);
            if (batch.getStockQuantity() <= 0) {
                batch.setStatus(BatchStatus.DEPLETED);
            }
            remaining -= deductFromThisBatch;
        }

        if (remaining > 0) {
            // Ném exception => @Transactional tự động rollback toàn bộ thay đổi ở các lô đã trừ dở
            // dang, đồng thời rollback luôn cả việc cập nhật trạng thái lịch hẹn ở service gọi nó.
            throw new BadRequestException(
                    "Không đủ tồn kho vắc xin tại cơ sở để hoàn tất tiêm chủng (còn thiếu " + remaining + " liều)");
        }

        batchRepository.saveAll(batches);
    }

    // ===================== HELPERS =====================

    private void syncExpiredBatches() {
        batchRepository.markExpiredBatches(LocalDate.now());
    }

    private VaccineInventory getOrCreateInventory(VaccinationFacility facility) {
        return inventoryRepository.findByFacility_FacilityId(facility.getFacilityId())
                .orElseGet(() -> inventoryRepository.save(
                        VaccineInventory.builder().facility(facility).alertThreshold(50).build()));
    }

    private VaccinationFacility findFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ sở tiêm chủng có ID: " + facilityId));
    }

    private Vaccine findVaccineOrThrow(Long vaccineId) {
        return vaccineRepository.findById(vaccineId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vắc xin có ID: " + vaccineId));
    }

    private VaccineBatch findBatchOrThrow(Long batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lô vắc xin có ID: " + batchId));
    }

    private VaccineBatchResponse mapBatchToResponse(VaccineBatch batch) {
        // Nếu batch vừa bị đánh dấu DEPLETED do stockQuantity = 0 (cập nhật ở logic trừ kho ngày 28/08),
        // status ở đây vẫn phản ánh đúng vì chỉ đọc lại từ DB sau khi đã syncExpiredBatches().
        return VaccineBatchResponse.builder()
                .batchId(batch.getBatchId())
                .inventoryId(batch.getInventory().getInventoryId())
                .facilityId(batch.getInventory().getFacility().getFacilityId())
                .vaccineId(batch.getVaccine().getVaccineId())
                .vaccineName(batch.getVaccine().getVaccineName())
                .batchNumber(batch.getBatchNumber())
                .manufactureDate(batch.getManufactureDate())
                .expiryDate(batch.getExpiryDate())
                .importedQuantity(batch.getImportedQuantity())
                .stockQuantity(batch.getStockQuantity())
                .importPrice(batch.getImportPrice())
                .importDate(batch.getImportDate())
                .status(batch.getStatus())
                .build();
    }
}
