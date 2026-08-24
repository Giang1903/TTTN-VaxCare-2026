package com.vaxcare.feature.auth.service;

import com.vaxcare.common.enums.AccountStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.auth.dto.*;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.HealthProfile;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.auth.repository.UserRepository;
import com.vaxcare.feature.notification.service.EmailService;
import com.vaxcare.security.JwtTokenProvider;
import com.vaxcare.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuthService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Transactional
    public AccountResponse register(RegisterRequest request) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng!");
        }

        // Create Account
        String token = UUID.randomUUID().toString().replace("-", "");
        Account account = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.USER)
                .status(AccountStatus.INACTIVE)
                .verificationToken(token)
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        // Create User
        User user = User.builder()
                .account(account)
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .address(request.getAddress())
                .build();

        // Create HealthProfile
        HealthProfile healthProfile = HealthProfile.builder()
                .user(user)
                .note("Khởi tạo hồ sơ sức khỏe mới")
                .build();

        user.setHealthProfile(healthProfile);
        account.setUser(user);

        Account savedAccount = accountRepository.save(account);

        emailService.sendVerificationEmail(
                savedAccount.getEmail(),
                savedAccount.getUser().getFullName(),
                token
        );

        return AccountResponse.builder()
                .accountId(savedAccount.getAccountId())
                .email(savedAccount.getEmail())
                .phone(savedAccount.getPhone())
                .role(savedAccount.getRole())
                .status(savedAccount.getStatus())
                .avatarUrl(savedAccount.getAvatarUrl())
                .fullName(savedAccount.getUser().getFullName())
                .createdAt(savedAccount.getCreatedAt())
                .build();
    }

    /**
     * Kích hoạt tài khoản bằng token trong email.
     */
    @Transactional
    public void verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Token xác nhận không hợp lệ.");
        }
        Account account = accountRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Link xác nhận không hợp lệ hoặc đã được sử dụng."));

        if (account.getStatus() == AccountStatus.ACTIVE) {
            // Đã kích hoạt rồi — idempotent
            account.setVerificationToken(null);
            account.setVerificationTokenExpiresAt(null);
            accountRepository.save(account);
            return;
        }

        if (account.getVerificationTokenExpiresAt() != null
                && account.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Link xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email.");
        }

        account.setStatus(AccountStatus.ACTIVE);
        account.setVerificationToken(null);
        account.setVerificationTokenExpiresAt(null);
        accountRepository.save(account);
    }

    /**
     * Gửi lại email xác nhận nếu tài khoản còn INACTIVE.
     */
    @Transactional
    public void resendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email không được để trống.");
        }
        Account account = accountRepository.findByEmail(email.trim().toLowerCase())
                .or(() -> accountRepository.findByEmail(email.trim()))
                .orElse(null);

        // Không lộ thông tin email có tồn tại hay không
        if (account == null || account.getStatus() == AccountStatus.ACTIVE) {
            return;
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        account.setVerificationToken(token);
        account.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        accountRepository.save(account);

        String fullName = account.getUser() != null ? account.getUser().getFullName() : null;
        emailService.sendVerificationEmail(account.getEmail(), fullName, token);
    }

    public AuthResponse login(LoginRequest request) {
        // Báo rõ nếu chưa kích hoạt email
        accountRepository.findByEmail(request.getEmail()).ifPresent(acc -> {
            if (acc.getStatus() == AccountStatus.INACTIVE) {
                throw new BadRequestException(
                        "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và bấm link xác nhận.");
            }
            if (acc.getStatus() == AccountStatus.SUSPENDED) {
                throw new BadRequestException("Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
            }
        });

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (DisabledException e) {
            throw new BadRequestException(
                    "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và bấm link xác nhận.");
        } catch (AuthenticationException e) {
            throw new BadRequestException("Email hoặc mật khẩu không đúng.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Account account = accountRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userPrincipal.getId()));

        String fullName = "";
        if (account.getRole() == Role.USER && account.getUser() != null) {
            fullName = account.getUser().getFullName();
        } else if (account.getRole() == Role.ADMIN && account.getAdmin() != null) {
            fullName = account.getAdmin().getFullName();
        } else if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            fullName = account.getMedicalStaff().getFullName();
        }

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accountId(account.getAccountId())
                .email(account.getEmail())
                .fullName(fullName)
                .role(account.getRole())
                .build();
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        if (tokenProvider.validateToken(refreshToken)) {
            Long userId = tokenProvider.getUserIdFromJWT(refreshToken);
            Account account = accountRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));

            UserPrincipal userPrincipal = UserPrincipal.create(account);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userPrincipal, null, userPrincipal.getAuthorities());

            String newAccessToken = tokenProvider.generateToken(authentication);
            String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

            return TokenRefreshResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .build();
        } else {
            throw new BadRequestException("Refresh token không hợp lệ hoặc đã hết hạn");
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .userId(account.getAccountId())
                .email(account.getEmail())
                .phone(account.getPhone())
                .avatarUrl(account.getAvatarUrl());

        if (account.getRole() == Role.USER && account.getUser() != null) {
            User user = account.getUser();
            builder.fullName(user.getFullName())
                    .dateOfBirth(user.getDateOfBirth())
                    .gender(user.getGender())
                    .address(user.getAddress());

            if (user.getHealthProfile() != null) {
                HealthProfile hp = user.getHealthProfile();
                builder.height(hp.getHeight())
                        .weight(hp.getWeight())
                        .medicalHistory(hp.getMedicalHistory())
                        .allergies(hp.getAllergies())
                        .healthNote(hp.getNote());
            }
        } else if (account.getRole() == Role.ADMIN && account.getAdmin() != null) {
            builder.fullName(account.getAdmin().getFullName());
        } else if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            builder.fullName(account.getMedicalStaff().getFullName());
        }

        return builder.build();
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));

        if (request.getPhone() != null) {
            account.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            account.setAvatarUrl(request.getAvatarUrl());
        }

        if (account.getRole() == Role.USER && account.getUser() != null) {
            User user = account.getUser();
            if (request.getFullName() != null) {
                user.setFullName(request.getFullName());
            }
            if (request.getDateOfBirth() != null) {
                user.setDateOfBirth(request.getDateOfBirth());
            }
            if (request.getGender() != null) {
                user.setGender(request.getGender());
            }
            if (request.getAddress() != null) {
                user.setAddress(request.getAddress());
            }

            HealthProfile hp = user.getHealthProfile();
            if (hp == null) {
                hp = new HealthProfile();
                hp.setUser(user);
                user.setHealthProfile(hp);
            }
            if (request.getHeight() != null) {
                hp.setHeight(request.getHeight());
            }
            if (request.getWeight() != null) {
                hp.setWeight(request.getWeight());
            }
            if (request.getMedicalHistory() != null) {
                hp.setMedicalHistory(request.getMedicalHistory());
            }
            if (request.getAllergies() != null) {
                hp.setAllergies(request.getAllergies());
            }
            if (request.getHealthNote() != null) {
                hp.setNote(request.getHealthNote());
            }
        } else if (account.getRole() == Role.ADMIN && account.getAdmin() != null) {
            if (request.getFullName() != null) {
                account.getAdmin().setFullName(request.getFullName());
            }
        } else if (account.getRole() == Role.MEDICAL_STAFF && account.getMedicalStaff() != null) {
            if (request.getFullName() != null) {
                account.getMedicalStaff().setFullName(request.getFullName());
            }
        }

        accountRepository.save(account);
        return getProfile(userId);
    }
}