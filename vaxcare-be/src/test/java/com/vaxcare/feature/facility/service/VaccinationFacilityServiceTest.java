package com.vaxcare.feature.facility.service;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.facility.dto.FacilityRequest;
import com.vaxcare.feature.facility.dto.FacilityResponse;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test thuần Mockito cho VaccinationFacilityService.
 * Không cần Spring context / DB thật -> chạy nhanh, phù hợp CI.
 */
@ExtendWith(MockitoExtension.class)
class VaccinationFacilityServiceTest {

    @Mock
    private VaccinationFacilityRepository facilityRepository;

    @InjectMocks
    private VaccinationFacilityService facilityService;

    private VaccinationFacility sampleFacility;

    @BeforeEach
    void setUp() {
        sampleFacility = VaccinationFacility.builder()
                .facilityId(1L)
                .facilityName("Trung tâm Y tế Quận 1")
                .address("123 Lê Lợi, Q1")
                .phone("028-1234567")
                .openingTime(LocalTime.of(8, 0))
                .closingTime(LocalTime.of(17, 0))
                .capacityPerSlot(20)
                .status(ActiveStatus.ACTIVE)
                .build();
    }

    // ---------- createFacility ----------

    @Test
    void createFacility_success() {
        FacilityRequest request = FacilityRequest.builder()
                .facilityName("  Trung tâm Y tế Quận 3  ")
                .openingTime(LocalTime.of(8, 0))
                .closingTime(LocalTime.of(17, 0))
                .capacityPerSlot(15)
                .build();

        when(facilityRepository.existsByFacilityNameIgnoreCase("Trung tâm Y tế Quận 3")).thenReturn(false);
        when(facilityRepository.save(any(VaccinationFacility.class)))
                .thenAnswer(invocation -> {
                    VaccinationFacility f = invocation.getArgument(0);
                    f.setFacilityId(2L);
                    return f;
                });

        FacilityResponse response = facilityService.createFacility(request);

        assertThat(response.getFacilityId()).isEqualTo(2L);
        assertThat(response.getFacilityName()).isEqualTo("Trung tâm Y tế Quận 3");
        assertThat(response.getStatus()).isEqualTo(ActiveStatus.ACTIVE);

        ArgumentCaptor<VaccinationFacility> captor = ArgumentCaptor.forClass(VaccinationFacility.class);
        verify(facilityRepository).save(captor.capture());
        assertThat(captor.getValue().getFacilityName()).isEqualTo("Trung tâm Y tế Quận 3");
    }

    @Test
    void createFacility_blankName_throwsBadRequest() {
        FacilityRequest request = FacilityRequest.builder().facilityName("   ").build();

        assertThatThrownBy(() -> facilityService.createFacility(request))
                .isInstanceOf(BadRequestException.class);

        verify(facilityRepository, never()).save(any());
    }

    @Test
    void createFacility_duplicateName_throwsBadRequest() {
        FacilityRequest request = FacilityRequest.builder().facilityName("Trung tâm Y tế Quận 1").build();
        when(facilityRepository.existsByFacilityNameIgnoreCase("Trung tâm Y tế Quận 1")).thenReturn(true);

        assertThatThrownBy(() -> facilityService.createFacility(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Đã tồn tại");

        verify(facilityRepository, never()).save(any());
    }

    @Test
    void createFacility_closingTimeBeforeOpeningTime_throwsBadRequest() {
        FacilityRequest request = FacilityRequest.builder()
                .facilityName("Cơ sở test")
                .openingTime(LocalTime.of(17, 0))
                .closingTime(LocalTime.of(8, 0))
                .build();
        when(facilityRepository.existsByFacilityNameIgnoreCase(anyString())).thenReturn(false);

        assertThatThrownBy(() -> facilityService.createFacility(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Giờ đóng cửa");

        verify(facilityRepository, never()).save(any());
    }

    @Test
    void createFacility_defaultsCapacityTo10WhenNull() {
        FacilityRequest request = FacilityRequest.builder().facilityName("Cơ sở mặc định").build();
        when(facilityRepository.existsByFacilityNameIgnoreCase(anyString())).thenReturn(false);
        when(facilityRepository.save(any(VaccinationFacility.class))).thenAnswer(inv -> inv.getArgument(0));

        FacilityResponse response = facilityService.createFacility(request);

        assertThat(response.getCapacityPerSlot()).isEqualTo(10);
    }

    // ---------- getFacilityById ----------

    @Test
    void getFacilityById_notFound_throwsResourceNotFound() {
        when(facilityRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> facilityService.getFacilityById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getFacilityById_found_returnsMappedResponse() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        FacilityResponse response = facilityService.getFacilityById(1L);

        assertThat(response.getFacilityId()).isEqualTo(1L);
        assertThat(response.getFacilityName()).isEqualTo("Trung tâm Y tế Quận 1");
    }

    // ---------- updateFacility ----------

    @Test
    void updateFacility_partialUpdate_onlyChangesProvidedFields() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));
        when(facilityRepository.save(any(VaccinationFacility.class))).thenAnswer(inv -> inv.getArgument(0));

        FacilityRequest request = FacilityRequest.builder()
                .capacityPerSlot(30)
                .build();

        FacilityResponse response = facilityService.updateFacility(1L, request);

        assertThat(response.getCapacityPerSlot()).isEqualTo(30);
        // Các field khác giữ nguyên
        assertThat(response.getFacilityName()).isEqualTo("Trung tâm Y tế Quận 1");
        assertThat(response.getAddress()).isEqualTo("123 Lê Lợi, Q1");
    }

    @Test
    void updateFacility_duplicateNameWithOtherFacility_throwsBadRequest() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));
        when(facilityRepository.existsByFacilityNameIgnoreCaseAndFacilityIdNot("Trung tâm Y tế Quận 3", 1L))
                .thenReturn(true);

        FacilityRequest request = FacilityRequest.builder().facilityName("Trung tâm Y tế Quận 3").build();

        assertThatThrownBy(() -> facilityService.updateFacility(1L, request))
                .isInstanceOf(BadRequestException.class);

        verify(facilityRepository, never()).save(any());
    }

    @Test
    void updateFacility_invalidTimeRangeAfterMerge_throwsBadRequest() {
        // sampleFacility có opening=08:00; request chỉ đổi closing về 07:00 -> vô lý
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        FacilityRequest request = FacilityRequest.builder()
                .closingTime(LocalTime.of(7, 0))
                .build();

        assertThatThrownBy(() -> facilityService.updateFacility(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Giờ đóng cửa");
    }

    // ---------- deleteFacility (soft delete) ----------

    @Test
    void deleteFacility_setsStatusInactive() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));
        when(facilityRepository.save(any(VaccinationFacility.class))).thenAnswer(inv -> inv.getArgument(0));

        facilityService.deleteFacility(1L);

        assertThat(sampleFacility.getStatus()).isEqualTo(ActiveStatus.INACTIVE);
        verify(facilityRepository, times(1)).save(sampleFacility);
    }

    @Test
    void deleteFacility_alreadyInactive_throwsBadRequest() {
        sampleFacility.setStatus(ActiveStatus.INACTIVE);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        assertThatThrownBy(() -> facilityService.deleteFacility(1L))
                .isInstanceOf(BadRequestException.class);

        verify(facilityRepository, never()).save(any());
    }

    @Test
    void deleteFacility_notFound_throwsResourceNotFound() {
        when(facilityRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> facilityService.deleteFacility(404L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- reactivateFacility ----------

    @Test
    void reactivateFacility_fromInactive_setsActive() {
        sampleFacility.setStatus(ActiveStatus.INACTIVE);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));
        when(facilityRepository.save(any(VaccinationFacility.class))).thenAnswer(inv -> inv.getArgument(0));

        FacilityResponse response = facilityService.reactivateFacility(1L);

        assertThat(response.getStatus()).isEqualTo(ActiveStatus.ACTIVE);
    }

    @Test
    void reactivateFacility_alreadyActive_throwsBadRequest() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        assertThatThrownBy(() -> facilityService.reactivateFacility(1L))
                .isInstanceOf(BadRequestException.class);

        verify(facilityRepository, never()).save(any());
    }

    // ---------- getActiveFacilities / getAllFacilities ----------

    @Test
    void getActiveFacilities_onlyReturnsActiveStatus() {
        when(facilityRepository.findByStatus(ActiveStatus.ACTIVE)).thenReturn(List.of(sampleFacility));

        List<FacilityResponse> result = facilityService.getActiveFacilities();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(ActiveStatus.ACTIVE);
    }

    @Test
    void getAllFacilities_returnsEverythingRegardlessOfStatus() {
        VaccinationFacility inactive = VaccinationFacility.builder()
                .facilityId(2L)
                .facilityName("Cơ sở đã đóng")
                .status(ActiveStatus.INACTIVE)
                .build();
        when(facilityRepository.findAll()).thenReturn(List.of(sampleFacility, inactive));

        List<FacilityResponse> result = facilityService.getAllFacilities();

        assertThat(result).hasSize(2);
    }
}
