package com.vaxcare.feature.vaccine.service;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.vaccine.dto.VaccineRequest;
import com.vaxcare.feature.vaccine.dto.VaccineResponse;
import com.vaxcare.feature.vaccine.entity.PriceList;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.entity.VaccineCategory;
import com.vaxcare.feature.vaccine.repository.PriceListRepository;
import com.vaxcare.feature.vaccine.repository.VaccineCategoryRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VaccineService {

    private final VaccineRepository vaccineRepository;
    private final VaccineCategoryRepository vaccineCategoryRepository;
    private final PriceListRepository priceListRepository;

    /**
     * Tra cứu vắc xin (public), lọc theo danh mục / đối tượng, từ khóa tên và độ tuổi (tháng tuổi).
     * "Đối tượng" (trẻ em / người lớn / phụ nữ mang thai...) được thể hiện qua VaccineCategory,
     * nên dùng chung tham số categoryId để lọc.
     *
     * @param categoryId danh mục / đối tượng (nullable)
     * @param keyword    từ khóa tên vắc xin (nullable)
     * @param ageMonths  độ tuổi tra cứu, tính theo tháng (nullable)
     * @param facilityId cơ sở để lấy giá ưu tiên theo cơ sở (nullable)
     */
    @Transactional(readOnly = true)
    public List<VaccineResponse> searchVaccines(Long categoryId, String keyword, Integer ageMonths, Long facilityId) {
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return vaccineRepository.searchVaccines(categoryId, normalizedKeyword, ageMonths).stream()
                .map(vaccine -> mapToResponse(vaccine, facilityId))
                .toList();
    }

    @Transactional(readOnly = true)
    public VaccineResponse getVaccineById(Long vaccineId, Long facilityId) {
        Vaccine vaccine = findVaccineOrThrow(vaccineId);
        return mapToResponse(vaccine, facilityId);
    }

    private Vaccine findVaccineOrThrow(Long vaccineId) {
        return vaccineRepository.findById(vaccineId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vắc xin có ID: " + vaccineId));
    }

    // ===================== ADMIN =====================

    @Transactional(readOnly = true)
    public List<VaccineResponse> getAllVaccinesForAdmin() {
        return vaccineRepository.findAll().stream()
                .map(vaccine -> mapToResponse(vaccine, null))
                .toList();
    }

    @Transactional
    public VaccineResponse createVaccine(VaccineRequest request) {
        String vaccineName = normalizeName(request.getVaccineName());
        if (vaccineName.isEmpty()) {
            throw new BadRequestException("Tên vắc xin không được để trống");
        }
        if (vaccineRepository.existsByVaccineNameIgnoreCase(vaccineName)) {
            throw new BadRequestException("Đã tồn tại vắc xin với tên: " + vaccineName);
        }

        VaccineCategory category = resolveCategory(request.getCategoryId());

        Vaccine vaccine = Vaccine.builder()
                .category(category)
                .vaccineName(vaccineName)
                .manufacturer(request.getManufacturer())
                .targetDisease(request.getTargetDisease())
                .requiredDoses(request.getRequiredDoses() != null ? request.getRequiredDoses() : 1)
                .doseIntervalDays(request.getDoseIntervalDays())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .status(request.getStatus() != null ? request.getStatus() : ActiveStatus.ACTIVE)
                .build();

        return mapToResponse(vaccineRepository.save(vaccine), null);
    }

    @Transactional
    public VaccineResponse updateVaccine(Long vaccineId, VaccineRequest request) {
        Vaccine vaccine = findVaccineOrThrow(vaccineId);

        if (request.getVaccineName() != null) {
            String vaccineName = normalizeName(request.getVaccineName());
            if (vaccineName.isEmpty()) {
                throw new BadRequestException("Tên vắc xin không được để trống");
            }
            if (vaccineRepository.existsByVaccineNameIgnoreCaseAndVaccineIdNot(vaccineName, vaccineId)) {
                throw new BadRequestException("Đã tồn tại vắc xin với tên: " + vaccineName);
            }
            vaccine.setVaccineName(vaccineName);
        }
        if (request.getCategoryId() != null) {
            vaccine.setCategory(resolveCategory(request.getCategoryId()));
        }
        if (request.getManufacturer() != null) {
            vaccine.setManufacturer(request.getManufacturer());
        }
        if (request.getTargetDisease() != null) {
            vaccine.setTargetDisease(request.getTargetDisease());
        }
        if (request.getRequiredDoses() != null) {
            vaccine.setRequiredDoses(request.getRequiredDoses());
        }
        if (request.getDoseIntervalDays() != null) {
            vaccine.setDoseIntervalDays(request.getDoseIntervalDays());
        }
        if (request.getDescription() != null) {
            vaccine.setDescription(request.getDescription());
        }
        if (request.getImageUrl() != null) {
            vaccine.setImageUrl(request.getImageUrl());
        }
        if (request.getStatus() != null) {
            vaccine.setStatus(request.getStatus());
        }

        return mapToResponse(vaccineRepository.save(vaccine), null);
    }

    @Transactional
    public void deactivateVaccine(Long vaccineId) {
        Vaccine vaccine = findVaccineOrThrow(vaccineId);
        if (vaccine.getStatus() == ActiveStatus.INACTIVE) {
            throw new BadRequestException("Vắc xin này đã ở trạng thái vô hiệu hóa");
        }
        vaccine.setStatus(ActiveStatus.INACTIVE);
        vaccineRepository.save(vaccine);
    }

    @Transactional
    public VaccineResponse reactivateVaccine(Long vaccineId) {
        Vaccine vaccine = findVaccineOrThrow(vaccineId);
        if (vaccine.getStatus() == ActiveStatus.ACTIVE) {
            throw new BadRequestException("Vắc xin này đang hoạt động");
        }
        vaccine.setStatus(ActiveStatus.ACTIVE);
        return mapToResponse(vaccineRepository.save(vaccine), null);
    }

    private VaccineCategory resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return vaccineCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục vắc xin có ID: " + categoryId));
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    private VaccineResponse mapToResponse(Vaccine vaccine, Long facilityId) {
        BigDecimal currentPrice = resolveCurrentPrice(vaccine.getVaccineId(), facilityId);

        return VaccineResponse.builder()
                .vaccineId(vaccine.getVaccineId())
                .categoryId(vaccine.getCategory() != null ? vaccine.getCategory().getCategoryId() : null)
                .categoryName(vaccine.getCategory() != null ? vaccine.getCategory().getCategoryName() : null)
                .vaccineName(vaccine.getVaccineName())
                .manufacturer(vaccine.getManufacturer())
                .targetDisease(vaccine.getTargetDisease())
                .requiredDoses(vaccine.getRequiredDoses())
                .doseIntervalDays(vaccine.getDoseIntervalDays())
                .description(vaccine.getDescription())
                .imageUrl(vaccine.getImageUrl())
                .averageRating(vaccine.getAverageRating())
                .totalBookings(vaccine.getTotalBookings())
                .status(vaccine.getStatus())
                .currentPrice(currentPrice)
                .build();
    }

    /**
     * Ưu tiên giá riêng của cơ sở (nếu có), nếu không thì lấy giá chung.
     * Danh sách trả về từ repository đã ORDER BY facility DESC NULLS LAST -> phần tử đầu là giá phù hợp nhất.
     */
    private BigDecimal resolveCurrentPrice(Long vaccineId, Long facilityId) {
        List<PriceList> prices = priceListRepository.findActivePrices(vaccineId, facilityId, LocalDate.now());
        return prices.stream()
                .findFirst()
                .map(PriceList::getPrice)
                .orElse(null);
    }
}