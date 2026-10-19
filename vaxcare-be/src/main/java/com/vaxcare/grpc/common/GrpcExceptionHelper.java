package com.vaxcare.grpc.common;

import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;

import java.time.format.DateTimeParseException;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;

@Slf4j

public final class GrpcExceptionHelper {

    private GrpcExceptionHelper() {}

    public static StatusRuntimeException toStatusException(Throwable e) {
        Throwable root = unwrap(e);
        Status status = mapStatus(root);
        String description = root.getMessage() != null && !root.getMessage().isBlank()
                ? root.getMessage()
                : status.getCode().name();
        return status.withDescription(description).withCause(root).asRuntimeException();
    }

    public static <T> void handle(StreamObserver<T> observer, Throwable e) {
        Throwable root = unwrap(e);
        Status status = mapStatus(root);
        if (status.getCode() == Status.Code.INTERNAL || status.getCode() == Status.Code.UNKNOWN) {
            log.error("gRPC internal error: {}", root.getMessage(), root);
        } else {
            log.warn("gRPC client/error status {}: {}", status.getCode(), root.getMessage());
        }
        observer.onError(toStatusException(e));
    }

    public static Throwable unwrap(Throwable e) {
        Throwable t = e;
        int depth = 0;
        while (t.getCause() != null && depth++ < 8) {
            if (t instanceof CompletionException
                    || t instanceof ExecutionException
                    || (t.getClass() == RuntimeException.class)) {
                t = t.getCause();
            } else {
                break;
            }
        }
        return t;
    }

    public static Status mapStatus(Throwable e) {
        Throwable t = unwrap(e);

        if (t instanceof StatusRuntimeException sre) {
            return sre.getStatus();
        }

        if (t instanceof BadRequestException) {
            return Status.INVALID_ARGUMENT;
        }
        if (t instanceof ResourceNotFoundException) {
            return Status.NOT_FOUND;
        }
        if (t instanceof UnauthorizedException) {
            return Status.UNAUTHENTICATED;
        }

        if (t instanceof BadCredentialsException) {
            return Status.UNAUTHENTICATED;
        }
        if (t instanceof DisabledException || t instanceof LockedException) {
            return Status.PERMISSION_DENIED;
        }
        if (t instanceof AccessDeniedException) {
            return Status.PERMISSION_DENIED;
        }
        if (t instanceof AuthenticationException) {
            return Status.UNAUTHENTICATED;
        }

        if (t instanceof DateTimeParseException
                || t instanceof java.time.DateTimeException
                || t instanceof NumberFormatException
                || t instanceof IllegalArgumentException) {
            return Status.INVALID_ARGUMENT;
        }
        if (t instanceof IllegalStateException) {
            return Status.FAILED_PRECONDITION;
        }

        String name = t.getClass().getSimpleName();
        String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";

        if (name.contains("BadRequest") || name.contains("Validation")
                || name.contains("MethodArgumentNotValid") || name.contains("ConstraintViolation")) {
            return Status.INVALID_ARGUMENT;
        }
        if (name.contains("NotFound") || name.contains("NoSuchElement")) {
            return Status.NOT_FOUND;
        }
        if (name.contains("Unauthorized") || name.contains("Jwt")
                || (msg.contains("token") && (msg.contains("invalid") || msg.contains("expired") || msg.contains("missing")))) {
            return Status.UNAUTHENTICATED;
        }
        if (name.contains("AccessDenied") || name.contains("Forbidden") || name.contains("AuthorizationDenied")) {
            return Status.PERMISSION_DENIED;
        }
        if (name.contains("Conflict") || name.contains("Duplicate") || name.contains("DataIntegrity")) {
            return Status.ALREADY_EXISTS;
        }
        if (name.contains("IllegalState")) {
            return Status.FAILED_PRECONDITION;
        }

        return Status.INTERNAL;
    }
}
