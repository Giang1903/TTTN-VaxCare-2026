package com.vaxcare.grpc.admin;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.feature.auth.dto.AdminAccountDetailResponse;
import com.vaxcare.feature.auth.dto.AdminAccountItemResponse;
import com.vaxcare.feature.auth.dto.CreateAdminAccountRequest;
import com.vaxcare.feature.auth.dto.UpdateStaffRequest;
import com.vaxcare.feature.auth.service.AdminAccountService;
import com.vaxcare.feature.auth.service.AdminUserService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

@GrpcService
@RequiredArgsConstructor
public class AdminAccountGrpcService extends AdminAccountServiceGrpc.AdminAccountServiceImplBase {

    private final AdminAccountService adminAccountService;
    private final AdminUserService adminUserService;

    @Override
    public void listUsers(com.vaxcare.grpc.common.Empty request,
                          StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            List<AdminAccountItemResponse> list = adminAccountService.listByRole(Role.USER);
            respondList(responseObserver, "Lấy danh sách người dùng thành công", list);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void listStaff(com.vaxcare.grpc.common.Empty request,
                          StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            List<AdminAccountItemResponse> list = adminAccountService.listByRole(Role.MEDICAL_STAFF);
            respondList(responseObserver, "Lấy danh sách nhân viên y tế thành công", list);
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void searchAccounts(SearchAccountsRequest request,
                               StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            Role role = parseRole(request.getRole());
            AccountStatus status = parseStatus(request.getStatus());
            String keyword = GrpcProtoSupport.emptyToNull(request.getKeyword());
            // AdminUserService.searchUsers returns AccountResponse list — map via getUserDetail-style fields
            var accounts = adminUserService.searchUsers(role, status, keyword);
            AdminAccountList.Builder lb = AdminAccountList.newBuilder();
            for (var a : accounts) {
                lb.addItems(AdminAccountItem.newBuilder()
                        .setAccountId(GrpcProtoSupport.nz(a.getAccountId()))
                        .setEmail(GrpcProtoSupport.s(a.getEmail()))
                        .setPhone(GrpcProtoSupport.s(a.getPhone()))
                        .setRole(a.getRole() != null ? a.getRole().name() : "")
                        .setStatus(a.getStatus() != null ? a.getStatus().name() : "")
                        .setFullName(GrpcProtoSupport.s(a.getFullName()))
                        .setAvatarUrl(GrpcProtoSupport.s(a.getAvatarUrl()))
                        .setCreatedAt(a.getCreatedAt() != null
                                ? a.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                        .build());
            }
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy danh sách tài khoản thành công")
                    .setList(lb.build()).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getAccountDetail(AccountIdRequest request,
                                 StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            requireId(request.getId());
            AdminAccountDetailResponse d = adminUserService.getUserDetail(request.getId());
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy chi tiết tài khoản thành công")
                    .setDetail(toDetail(d)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void createStaff(CreateStaffRequest request,
                            StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            GrpcProtoSupport.requireNonBlank(request.getEmail(), "email");
            GrpcProtoSupport.requireNonBlank(request.getPassword(), "password");
            GrpcProtoSupport.requireNonBlank(request.getFullName(), "full_name");
            GrpcProtoSupport.requireNonBlank(request.getStaffCode(), "staff_code");
            if (request.getFacilityId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("facility_id is required").asRuntimeException();
            }

            com.vaxcare.feature.auth.dto.CreateStaffRequest dto =
                    new com.vaxcare.feature.auth.dto.CreateStaffRequest();
            dto.setEmail(request.getEmail().trim());
            dto.setPassword(request.getPassword());
            dto.setPhone(GrpcProtoSupport.emptyToNull(request.getPhone()));
            dto.setFullName(request.getFullName().trim());
            dto.setStaffCode(request.getStaffCode().trim());
            dto.setSpecialty(GrpcProtoSupport.emptyToNull(request.getSpecialty()));
            dto.setFacilityId(request.getFacilityId());

            AdminAccountItemResponse item = adminAccountService.createStaff(dto);
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Tạo nhân viên y tế thành công")
                    .setItem(toItem(item)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void createAdmin(CreateAdminRequest request,
                            StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            GrpcProtoSupport.requireNonBlank(request.getEmail(), "email");
            GrpcProtoSupport.requireNonBlank(request.getPassword(), "password");
            GrpcProtoSupport.requireNonBlank(request.getFullName(), "full_name");
            CreateAdminAccountRequest dto = CreateAdminAccountRequest.builder()
                    .email(request.getEmail().trim())
                    .password(request.getPassword())
                    .fullName(request.getFullName().trim())
                    .phone(GrpcProtoSupport.emptyToNull(request.getPhone()))
                    .adminLevel(GrpcProtoSupport.emptyToNull(request.getAdminLevel()))
                    .build();
            var a = adminUserService.createAdminAccount(dto);
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Tạo tài khoản quản trị viên thành công")
                    .setItem(AdminAccountItem.newBuilder()
                            .setAccountId(GrpcProtoSupport.nz(a.getAccountId()))
                            .setEmail(GrpcProtoSupport.s(a.getEmail()))
                            .setPhone(GrpcProtoSupport.s(a.getPhone()))
                            .setRole(a.getRole() != null ? a.getRole().name() : "")
                            .setStatus(a.getStatus() != null ? a.getStatus().name() : "")
                            .setFullName(GrpcProtoSupport.s(a.getFullName()))
                            .setAvatarUrl(GrpcProtoSupport.s(a.getAvatarUrl()))
                            .setCreatedAt(a.getCreatedAt() != null
                                    ? a.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                            .build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void updateAccountStatus(UpdateAccountStatusRequest request,
                                    StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            requireId(request.getId());
            AccountStatus status = parseStatusRequired(request.getStatus());
            AdminAccountItemResponse item = adminAccountService.updateStatus(request.getId(), status);
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Cập nhật trạng thái tài khoản thành công")
                    .setItem(toItem(item)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void setPassword(SetPasswordRequest request,
                            StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            requireId(request.getId());
            GrpcProtoSupport.requireNonBlank(request.getNewPassword(), "new_password");
            adminAccountService.setPassword(request.getId(), request.getNewPassword());
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Đặt lại mật khẩu thành công")
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void updateStaff(com.vaxcare.grpc.admin.UpdateStaffRequest request,
                            StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            requireId(request.getStaffId());
            GrpcProtoSupport.requireNonBlank(request.getFullName(), "full_name");
            GrpcProtoSupport.requireNonBlank(request.getStaffCode(), "staff_code");
            UpdateStaffRequest dto = new UpdateStaffRequest();
            dto.setFullName(request.getFullName().trim());
            dto.setStaffCode(request.getStaffCode().trim());
            dto.setSpecialty(GrpcProtoSupport.emptyToNull(request.getSpecialty()));
            dto.setPhone(GrpcProtoSupport.emptyToNull(request.getPhone()));
            dto.setFacilityId(request.getFacilityId() == 0 ? null : request.getFacilityId());
            AdminAccountDetailResponse d = adminUserService.updateStaff(request.getStaffId(), dto);
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Cập nhật thông tin nhân viên thành công")
                    .setDetail(toDetail(d)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void updateStaffFacility(UpdateStaffFacilityRequest request,
                                    StreamObserver<AdminAccountApiResponse> responseObserver) {
        try {
            GrpcAuthHelper.requireAdmin();
            requireId(request.getStaffId());
            if (request.getFacilityId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("facility_id is required").asRuntimeException();
            }
            AdminAccountDetailResponse d =
                    adminUserService.updateStaffFacility(request.getStaffId(), request.getFacilityId());
            responseObserver.onNext(AdminAccountApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Chuyển cơ sở tiêm chủng cho nhân viên thành công")
                    .setDetail(toDetail(d)).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private void respondList(StreamObserver<AdminAccountApiResponse> obs, String msg,
                             List<AdminAccountItemResponse> list) {
        AdminAccountList.Builder lb = AdminAccountList.newBuilder();
        list.forEach(i -> lb.addItems(toItem(i)));
        obs.onNext(AdminAccountApiResponse.newBuilder()
                .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                .setMessage(msg).setList(lb.build()).build());
        obs.onCompleted();
    }

    private static AdminAccountItem toItem(AdminAccountItemResponse a) {
        return AdminAccountItem.newBuilder()
                .setAccountId(GrpcProtoSupport.nz(a.getAccountId()))
                .setEmail(GrpcProtoSupport.s(a.getEmail()))
                .setPhone(GrpcProtoSupport.s(a.getPhone()))
                .setRole(a.getRole() != null ? a.getRole().name() : "")
                .setStatus(a.getStatus() != null ? a.getStatus().name() : "")
                .setFullName(GrpcProtoSupport.s(a.getFullName()))
                .setAvatarUrl(GrpcProtoSupport.s(a.getAvatarUrl()))
                .setCreatedAt(a.getCreatedAt() != null
                        ? a.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                .setGender(a.getGender() != null ? a.getGender().name() : "")
                .setDateOfBirth(a.getDateOfBirth() != null
                        ? a.getDateOfBirth().format(GrpcProtoSupport.ISO_DATE) : "")
                .setAddress(GrpcProtoSupport.s(a.getAddress()))
                .setStaffCode(GrpcProtoSupport.s(a.getStaffCode()))
                .setSpecialty(GrpcProtoSupport.s(a.getSpecialty()))
                .setFacilityId(GrpcProtoSupport.nz(a.getFacilityId()))
                .setFacilityName(GrpcProtoSupport.s(a.getFacilityName()))
                .build();
    }

    private static AdminAccountDetail toDetail(AdminAccountDetailResponse d) {
        return AdminAccountDetail.newBuilder()
                .setAccountId(GrpcProtoSupport.nz(d.getAccountId()))
                .setEmail(GrpcProtoSupport.s(d.getEmail()))
                .setPhone(GrpcProtoSupport.s(d.getPhone()))
                .setRole(d.getRole() != null ? d.getRole().name() : "")
                .setStatus(d.getStatus() != null ? d.getStatus().name() : "")
                .setAvatarUrl(GrpcProtoSupport.s(d.getAvatarUrl()))
                .setFullName(GrpcProtoSupport.s(d.getFullName()))
                .setCreatedAt(d.getCreatedAt() != null
                        ? d.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                .setUpdatedAt(d.getUpdatedAt() != null
                        ? d.getUpdatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                .setDateOfBirth(d.getDateOfBirth() != null
                        ? d.getDateOfBirth().format(GrpcProtoSupport.ISO_DATE) : "")
                .setGender(d.getGender() != null ? d.getGender().name() : "")
                .setAddress(GrpcProtoSupport.s(d.getAddress()))
                .setStaffCode(GrpcProtoSupport.s(d.getStaffCode()))
                .setSpecialty(GrpcProtoSupport.s(d.getSpecialty()))
                .setFacilityId(GrpcProtoSupport.nz(d.getFacilityId()))
                .setFacilityName(GrpcProtoSupport.s(d.getFacilityName()))
                .setAdminLevel(GrpcProtoSupport.s(d.getAdminLevel()))
                .build();
    }

    private static void requireId(long id) {
        if (id <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("id is required").asRuntimeException();
        }
    }

    private static Role parseRole(String s) {
        if (s == null || s.isEmpty()) return null;
        try {
            return Role.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw Status.INVALID_ARGUMENT.withDescription("invalid role").asRuntimeException();
        }
    }

    private static AccountStatus parseStatus(String s) {
        if (s == null || s.isEmpty()) return null;
        return parseStatusRequired(s);
    }

    private static AccountStatus parseStatusRequired(String s) {
        if (s == null || s.isEmpty()) {
            throw Status.INVALID_ARGUMENT.withDescription("status is required").asRuntimeException();
        }
        try {
            return AccountStatus.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw Status.INVALID_ARGUMENT.withDescription("invalid account status").asRuntimeException();
        }
    }
}
