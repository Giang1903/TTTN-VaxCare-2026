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

        Map<Long, Vaccine> vaccineCache = new java.util.HashMap<>();

        return batchRepository.sumStockGroupByVaccine(facilityId).stream()
                .map(row -> {
                    Long vaccineId = (Long) row[0];
                    Long totalStock = (Long) row[1];
                    Vaccine vaccine = vaccineCache.computeIfAbsent(vaccineId, this::findVaccineOrThrow);

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

    // ===================== HELPERS =====================

    /**
     * Tự động chuyển các lô đã quá hạn nhưng vẫn đang AVAILABLE sang EXPIRED, đồng thời chuyển
     * các lô đã bán/dùng hết (stockQuantity <= 0) sang DEPLETED - đảm bảo số liệu tồn kho luôn
     * phản ánh đúng thực tế mỗi khi tra cứu, do project chưa có Scheduler (task đó ở ngày 31/08).
     */
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
