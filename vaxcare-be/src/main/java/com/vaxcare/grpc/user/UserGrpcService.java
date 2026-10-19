package com.vaxcare.grpc.user;

import com.vaxcare.feature.auth.dto.UserProfileRequest;
import com.vaxcare.feature.auth.dto.UserProfileResponse;
import com.vaxcare.feature.auth.service.UserService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
@RequiredArgsConstructor
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    private final UserService userService;

    @Override
    public void getProfile(com.vaxcare.grpc.common.Empty request, StreamObserver<UserApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            UserProfileResponse profile = userService.getProfile(userId);
            responseObserver.onNext(UserApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Lấy thông tin hồ sơ thành công")
                    .setProfile(toProto(profile))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void updateProfile(UpdateProfileRequest request, StreamObserver<UserApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            UserProfileRequest dto = new UserProfileRequest();
            dto.setFullName(request.getFullName().isEmpty() ? null : request.getFullName());
            dto.setPhone(GrpcProtoSupport.emptyToNull(request.getPhone()));
            dto.setDateOfBirth(GrpcProtoSupport.optionalDate(request.getDateOfBirth(), "date_of_birth"));
            dto.setGender(GrpcProtoSupport.optionalGender(request.getGender()));
            dto.setAddress(GrpcProtoSupport.emptyToNull(request.getAddress()));
            dto.setAvatarUrl(GrpcProtoSupport.emptyToNull(request.getAvatarUrl()));

            UserProfileResponse profile = userService.updateProfile(userId, dto);
            responseObserver.onNext(UserApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Cập nhật thông tin hồ sơ thành công")
                    .setProfile(toProto(profile))
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private UserProfileData toProto(UserProfileResponse p) {
        return UserProfileData.newBuilder()
                .setUserId(GrpcProtoSupport.nz(p.getUserId()))
                .setEmail(GrpcProtoSupport.s(p.getEmail()))
                .setPhone(GrpcProtoSupport.s(p.getPhone()))
                .setFullName(GrpcProtoSupport.s(p.getFullName()))
                .setDateOfBirth(p.getDateOfBirth() != null
                        ? p.getDateOfBirth().format(GrpcProtoSupport.ISO_DATE) : "")
                .setGender(p.getGender() != null ? p.getGender().name() : "")
                .setAddress(GrpcProtoSupport.s(p.getAddress()))
                .setAvatarUrl(GrpcProtoSupport.s(p.getAvatarUrl()))
                .setRole(p.getRole() != null ? p.getRole().name() : "")
                .setHeight(p.getHeight() != null ? p.getHeight().toPlainString() : "")
                .setWeight(p.getWeight() != null ? p.getWeight().toPlainString() : "")
                .setMedicalHistory(GrpcProtoSupport.s(p.getMedicalHistory()))
                .setAllergies(GrpcProtoSupport.s(p.getAllergies()))
                .setHealthNote(GrpcProtoSupport.s(p.getHealthNote()))
                .setFacilityId(GrpcProtoSupport.nz(p.getFacilityId()))
                .setFacilityName(GrpcProtoSupport.s(p.getFacilityName()))
                .setStaffCode(GrpcProtoSupport.s(p.getStaffCode()))
                .setSpecialty(GrpcProtoSupport.s(p.getSpecialty()))
                .build();
    }
}
