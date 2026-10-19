package com.vaxcare.grpc.common;

import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.repository.MedicalStaffRepository;
import com.vaxcare.grpc.interceptor.GrpcAuthInterceptor;
import com.vaxcare.security.UserPrincipal;
import io.grpc.Status;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public final class GrpcAuthHelper {

    private GrpcAuthHelper() {}

    public static UserPrincipal requirePrincipal() {
        UserPrincipal principal = GrpcAuthInterceptor.USER_PRINCIPAL_KEY.get();
        if (principal == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal p) {
                principal = p;
            }
        }
        if (principal == null) {
            throw Status.UNAUTHENTICATED
                    .withDescription("Missing or invalid token")
                    .asRuntimeException();
        }
        return principal;
    }

    public static Long requireUserId() {
        return requirePrincipal().getId();
    }

    public static UserPrincipal requireStaffOrAdmin() {
        UserPrincipal p = requirePrincipal();
        if (!hasAnyRole(p, "ROLE_MEDICAL_STAFF", "ROLE_ADMIN")) {
            throw Status.PERMISSION_DENIED
                    .withDescription("Requires MEDICAL_STAFF or ADMIN role")
                    .asRuntimeException();
        }
        return p;
    }

    public static Long requireStaffOrAdminId() {
        return requireStaffOrAdmin().getId();
    }

    public static UserPrincipal requireAdmin() {
        UserPrincipal p = requirePrincipal();
        if (!hasAnyRole(p, "ROLE_ADMIN")) {
            throw Status.PERMISSION_DENIED
                    .withDescription("Requires ADMIN role")
                    .asRuntimeException();
        }
        return p;
    }

    public static Long requireAdminId() {
        return requireAdmin().getId();
    }

    /**
     * ADMIN: mọi facility.
     * MEDICAL_STAFF: chỉ facility được gán trong medical_staff.
     */
    public static void requireFacilityAccess(long facilityId, MedicalStaffRepository medicalStaffRepository) {
        if (facilityId <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("facility_id is required").asRuntimeException();
        }
        UserPrincipal principal = requirePrincipal();
        if (hasAnyRole(principal, "ROLE_ADMIN")) {
            return;
        }
        if (!hasAnyRole(principal, "ROLE_MEDICAL_STAFF")) {
            throw Status.PERMISSION_DENIED
                    .withDescription("Không có quyền truy cập dữ liệu cơ sở")
                    .asRuntimeException();
        }
        MedicalStaff staff = medicalStaffRepository.findById(principal.getId())
                .orElseThrow(() -> Status.PERMISSION_DENIED
                        .withDescription("Không tìm thấy hồ sơ nhân viên")
                        .asRuntimeException());
        if (staff.getFacility() == null
                || staff.getFacility().getFacilityId() == null
                || !staff.getFacility().getFacilityId().equals(facilityId)) {
            throw Status.PERMISSION_DENIED
                    .withDescription("Staff chỉ được truy cập dữ liệu cơ sở của mình")
                    .asRuntimeException();
        }
    }

    private static boolean hasAnyRole(UserPrincipal p, String... roles) {
        if (p.getAuthorities() == null) return false;
        for (GrantedAuthority a : p.getAuthorities()) {
            for (String role : roles) {
                if (role.equals(a.getAuthority())) return true;
            }
        }
        return false;
    }
}
