package com.vaxcare.grpc.auth;

import com.vaxcare.feature.auth.dto.AccountResponse;
import com.vaxcare.feature.auth.dto.AuthResponse;
import com.vaxcare.feature.auth.dto.LoginRequest;
import com.vaxcare.feature.auth.dto.RegisterRequest;
import com.vaxcare.feature.auth.dto.TokenRefreshRequest;
import com.vaxcare.feature.auth.dto.TokenRefreshResponse;
import com.vaxcare.feature.auth.service.AuthService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import com.vaxcare.security.UserPrincipal;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {

    private final AuthService authService;

    @Override
    public void register(com.vaxcare.grpc.auth.RegisterRequest request,
                         StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getEmail(), "email");
            GrpcProtoSupport.requireNonBlank(request.getPassword(), "password");
            GrpcProtoSupport.requireNonBlank(request.getFullName(), "full_name");

            RegisterRequest dto = new RegisterRequest();
            dto.setEmail(request.getEmail().trim());
            dto.setPassword(request.getPassword());
            dto.setFullName(request.getFullName().trim());
            dto.setPhone(GrpcProtoSupport.emptyToNull(request.getPhone()));
            dto.setDateOfBirth(GrpcProtoSupport.optionalDate(request.getDateOfBirth(), "date_of_birth"));
            dto.setGender(GrpcProtoSupport.optionalGender(request.getGender()));
            dto.setAddress(GrpcProtoSupport.emptyToNull(request.getAddress()));

            AccountResponse account = authService.register(dto);
            responseObserver.onNext(successAccount(
                    "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.", account));
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void login(com.vaxcare.grpc.auth.LoginRequest request,
                      StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getEmail(), "email");
            GrpcProtoSupport.requireNonBlank(request.getPassword(), "password");

            LoginRequest dto = new LoginRequest();
            dto.setEmail(request.getEmail().trim());
            dto.setPassword(request.getPassword());

            AuthResponse auth = authService.login(dto);
            responseObserver.onNext(successAuth("Đăng nhập thành công", auth));
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void verifyEmail(VerifyEmailRequest request, StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getToken(), "token");
            authService.verifyEmail(request.getToken());
            responseObserver.onNext(AuthApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.")
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void resendVerification(ResendVerificationRequest request,
                                   StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getEmail(), "email");
            authService.resendVerification(request.getEmail().trim());
            responseObserver.onNext(AuthApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Nếu email tồn tại và chưa kích hoạt, hệ thống đã gửi lại link xác nhận.")
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request,
                               StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getEmail(), "email");
            authService.forgotPassword(request.getEmail().trim());
            responseObserver.onNext(AuthApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.")
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void resetPassword(ResetPasswordRequest request,
                              StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getToken(), "token");
            GrpcProtoSupport.requireNonBlank(request.getNewPassword(), "new_password");
            authService.resetPassword(request.getToken(), request.getNewPassword());
            responseObserver.onNext(AuthApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Đặt lại mật khẩu thành công.")
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void refreshToken(com.vaxcare.grpc.auth.TokenRefreshRequest request,
                             StreamObserver<AuthApiResponse> responseObserver) {
        try {
            GrpcProtoSupport.requireNonBlank(request.getRefreshToken(), "refresh_token");
            TokenRefreshRequest dto = new TokenRefreshRequest();
            dto.setRefreshToken(request.getRefreshToken());
            TokenRefreshResponse token = authService.refreshToken(dto);
            responseObserver.onNext(AuthApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now())
                    .setStatus(200)
                    .setMessage("Làm mới token thành công")
                    .setToken(com.vaxcare.grpc.auth.TokenRefreshResponse.newBuilder()
                            .setAccessToken(GrpcProtoSupport.s(token.getAccessToken()))
                            .setRefreshToken(GrpcProtoSupport.s(token.getRefreshToken()))
                            .setTokenType(token.getTokenType() != null ? token.getTokenType() : "Bearer")
                            .build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getMe(com.vaxcare.grpc.common.Empty request,
                      StreamObserver<AuthApiResponse> responseObserver) {
        try {
            UserPrincipal principal = GrpcAuthHelper.requirePrincipal();
            // Principal chỉ có id/email/status/authorities — map những gì có sẵn
            AccountResponse account = AccountResponse.builder()
                    .accountId(principal.getId())
                    .email(principal.getEmail())
                    .status(principal.getStatus())
                    .build();
            responseObserver.onNext(successAccount("Lấy thông tin tài khoản thành công", account));
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    private AuthApiResponse successAccount(String message, AccountResponse a) {
        return AuthApiResponse.newBuilder()
                .setTimestamp(GrpcProtoSupport.now())
                .setStatus(200)
                .setMessage(message)
                .setAccount(com.vaxcare.grpc.auth.AccountResponse.newBuilder()
                        .setAccountId(GrpcProtoSupport.nz(a.getAccountId()))
                        .setEmail(GrpcProtoSupport.s(a.getEmail()))
                        .setFullName(GrpcProtoSupport.s(a.getFullName()))
                        .setRole(a.getRole() != null ? a.getRole().name() : "")
                        .setStatus(a.getStatus() != null ? a.getStatus().name() : "")
                        .setEmailVerified(false)
                        .setCreatedAt(a.getCreatedAt() != null
                                ? a.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                        .build())
                .build();
    }

    private AuthApiResponse successAuth(String message, AuthResponse a) {
        return AuthApiResponse.newBuilder()
                .setTimestamp(GrpcProtoSupport.now())
                .setStatus(200)
                .setMessage(message)
                .setAuth(com.vaxcare.grpc.auth.AuthResponse.newBuilder()
                        .setAccessToken(GrpcProtoSupport.s(a.getAccessToken()))
                        .setRefreshToken(GrpcProtoSupport.s(a.getRefreshToken()))
                        .setTokenType(a.getTokenType() != null ? a.getTokenType() : "Bearer")
                        .setAccountId(GrpcProtoSupport.nz(a.getAccountId()))
                        .setEmail(GrpcProtoSupport.s(a.getEmail()))
                        .setFullName(GrpcProtoSupport.s(a.getFullName()))
                        .setRole(a.getRole() != null ? a.getRole().name() : "")
                        .build())
                .build();
    }
}
