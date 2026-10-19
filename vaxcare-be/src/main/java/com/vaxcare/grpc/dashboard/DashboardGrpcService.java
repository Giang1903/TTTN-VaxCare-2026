package com.vaxcare.grpc.dashboard;

import com.vaxcare.feature.dashboard.dto.AdminDashboardResponse;
import com.vaxcare.feature.dashboard.dto.AppointmentStatusCount;
import com.vaxcare.feature.dashboard.dto.ExpiringBatchItem;
import com.vaxcare.feature.dashboard.dto.ReactionSeverityCount;
import com.vaxcare.feature.dashboard.dto.RevenuePoint;
import com.vaxcare.feature.dashboard.dto.StaffDashboardResponse;
import com.vaxcare.feature.dashboard.dto.StockVsForecastItem;
import com.vaxcare.feature.dashboard.dto.VaccinationResultCount;
import com.vaxcare.feature.dashboard.dto.VaccineStockItem;
import com.vaxcare.feature.dashboard.service.DashboardService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.LocalDate;

@GrpcService
@RequiredArgsConstructor
public class DashboardGrpcService extends DashboardServiceGrpc.DashboardServiceImplBase {

    private final DashboardService dashboardService;

    @Override
    public void getStaffDashboard(StaffDashboardRequest request,
                                  StreamObserver<DashboardApiResponse> responseObserver) {
        try {
            Long accountId = GrpcAuthHelper.requireStaffOrAdminId();
            Long facilityId = request.getFacilityId() == 0 ? null : request.getFacilityId();
            LocalDate date = GrpcProtoSupport.optionalDate(request.getDate(), "date");
            StaffDashboardResponse d = dashboardService.getStaffDashboard(accountId, facilityId, date);

            StaffDashboardData.Builder data = StaffDashboardData.newBuilder()
                    .setFacilityId(GrpcProtoSupport.nz(d.getFacilityId()))
                    .setFacilityName(GrpcProtoSupport.s(d.getFacilityName()))
                    .setDate(d.getDate() != null ? d.getDate().format(GrpcProtoSupport.ISO_DATE) : "")
                    .setTotalVaccinationsToday(d.getTotalVaccinationsToday())
                    .setUnresolvedReactionsCount(d.getUnresolvedReactionsCount());

            if (d.getAppointmentsToday() != null) {
                for (AppointmentStatusCount c : d.getAppointmentsToday()) {
                    data.addAppointmentsToday(StatusCount.newBuilder()
                            .setStatus(c.getStatus() != null ? c.getStatus().name() : "")
                            .setCount(c.getCount()).build());
                }
            }
            if (d.getVaccinationsTodayByResult() != null) {
                for (VaccinationResultCount c : d.getVaccinationsTodayByResult()) {
                    data.addVaccinationsTodayByResult(ResultCount.newBuilder()
                            .setResult(c.getResult() != null ? c.getResult().name() : "")
                            .setCount(c.getCount()).build());
                }
            }
            if (d.getInventorySummary() != null) {
                for (VaccineStockItem i : d.getInventorySummary()) {
                    data.addInventorySummary(com.vaxcare.grpc.dashboard.VaccineStockItem.newBuilder()
                            .setVaccineId(GrpcProtoSupport.nz(i.getVaccineId()))
                            .setVaccineName(GrpcProtoSupport.s(i.getVaccineName()))
                            .setStockQuantity(i.getStockQuantity())
                            .setLowStock(i.isLowStock()).build());
                }
            }
            if (d.getExpiringSoonBatches() != null) {
                for (ExpiringBatchItem e : d.getExpiringSoonBatches()) {
                    data.addExpiringSoonBatches(com.vaxcare.grpc.dashboard.ExpiringBatchItem.newBuilder()
                            .setBatchId(GrpcProtoSupport.nz(e.getBatchId()))
                            .setVaccineName(GrpcProtoSupport.s(e.getVaccineName()))
                            .setBatchNumber(GrpcProtoSupport.s(e.getBatchNumber()))
                            .setExpiryDate(e.getExpiryDate() != null
                                    ? e.getExpiryDate().format(GrpcProtoSupport.ISO_DATE) : "")
                            .setStockQuantity(e.getStockQuantity()).build());
                }
            }
            if (d.getUnresolvedReactionsBySeverity() != null) {
                for (ReactionSeverityCount c : d.getUnresolvedReactionsBySeverity()) {
                    data.addUnresolvedReactionsBySeverity(SeverityCount.newBuilder()
                            .setSeverity(c.getSeverity() != null ? c.getSeverity().name() : "")
                            .setCount(c.getCount()).build());
                }
            }

            responseObserver.onNext(DashboardApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy dashboard nhân viên y tế thành công")
                    .setStaff(data.build()).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getAdminDashboard(AdminDashboardRequest request,
                                  StreamObserver<DashboardApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            LocalDate from = GrpcProtoSupport.optionalDate(request.getFrom(), "from");
            LocalDate to = GrpcProtoSupport.optionalDate(request.getTo(), "to");
            AdminDashboardResponse d = dashboardService.getAdminDashboard(from, to);

            AdminDashboardData.Builder data = AdminDashboardData.newBuilder()
                    .setFrom(d.getFrom() != null ? d.getFrom().format(GrpcProtoSupport.ISO_DATE) : "")
                    .setTo(d.getTo() != null ? d.getTo().format(GrpcProtoSupport.ISO_DATE) : "")
                    .setTotalUsers(d.getTotalUsers())
                    .setTotalMedicalStaff(d.getTotalMedicalStaff())
                    .setTotalActiveFacilities(d.getTotalActiveFacilities())
                    .setTotalActiveVaccines(d.getTotalActiveVaccines())
                    .setTotalRevenue(d.getTotalRevenue() != null ? d.getTotalRevenue().toPlainString() : "0")
                    .setTotalVaccinations(d.getTotalVaccinations());

            if (d.getRevenueTrend() != null) {
                for (RevenuePoint p : d.getRevenueTrend()) {
                    data.addRevenueTrend(com.vaxcare.grpc.dashboard.RevenuePoint.newBuilder()
                            .setPeriod(GrpcProtoSupport.s(p.getPeriod()))
                            .setAmount(p.getAmount() != null ? p.getAmount().toPlainString() : "0")
                            .build());
                }
            }
            if (d.getAppointmentsByStatus() != null) {
                for (AppointmentStatusCount c : d.getAppointmentsByStatus()) {
                    data.addAppointmentsByStatus(StatusCount.newBuilder()
                            .setStatus(c.getStatus() != null ? c.getStatus().name() : "")
                            .setCount(c.getCount()).build());
                }
            }
            if (d.getStockVsForecast() != null) {
                for (StockVsForecastItem i : d.getStockVsForecast()) {
                    data.addStockVsForecast(com.vaxcare.grpc.dashboard.StockVsForecastItem.newBuilder()
                            .setVaccineId(GrpcProtoSupport.nz(i.getVaccineId()))
                            .setVaccineName(GrpcProtoSupport.s(i.getVaccineName()))
                            .setCurrentStock(i.getCurrentStock())
                            .setAiForecastedDemand(i.getAiForecastedDemand() != null ? i.getAiForecastedDemand() : 0)
                            .setNote(GrpcProtoSupport.s(i.getNote()))
                            .build());
                }
            }

            responseObserver.onNext(DashboardApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy dashboard quản trị thành công")
                    .setAdmin(data.build()).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }
}