package com.vaxcare.grpc.common;

import com.vaxcare.common.enums.Gender;
import io.grpc.Status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public final class GrpcProtoSupport {

    public static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    public static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    public static final DateTimeFormatter ISO_TIME = DateTimeFormatter.ISO_LOCAL_TIME;

    private GrpcProtoSupport() {}

    public static String s(String v) {
        return v == null ? "" : v;
    }

    public static long nz(Long v) {
        return v == null ? 0L : v;
    }

    public static int nz(Integer v) {
        return v == null ? 0 : v;
    }

    public static String now() {
        return java.time.LocalDateTime.now().format(ISO_DATE_TIME);
    }

    public static String emptyToNull(String v) {
        return (v == null || v.isEmpty()) ? null : v;
    }

    public static LocalDate requireDate(String value, String fieldName) {
        if (value == null || value.isEmpty()) {
            throw Status.INVALID_ARGUMENT
                    .withDescription(fieldName + " is required (yyyy-MM-dd)")
                    .asRuntimeException();
        }
        try {
            return LocalDate.parse(value, ISO_DATE);
        } catch (DateTimeParseException e) {
            throw Status.INVALID_ARGUMENT
                    .withDescription(fieldName + " must be yyyy-MM-dd, got: " + value)
                    .asRuntimeException();
        }
    }

    public static LocalDate optionalDate(String value, String fieldName) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(value, ISO_DATE);
        } catch (DateTimeParseException e) {
            throw Status.INVALID_ARGUMENT
                    .withDescription(fieldName + " must be yyyy-MM-dd, got: " + value)
                    .asRuntimeException();
        }
    }

    public static LocalTime optionalTime(String value, String fieldName) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        String t = value.length() == 5 ? value + ":00" : value;
        try {
            return LocalTime.parse(t, ISO_TIME);
        } catch (DateTimeParseException e) {
            throw Status.INVALID_ARGUMENT
                    .withDescription(fieldName + " must be HH:mm or HH:mm:ss, got: " + value)
                    .asRuntimeException();
        }
    }

    public static LocalTime requireTime(String value, String fieldName) {
        LocalTime t = optionalTime(value, fieldName);
        if (t == null) {
            throw Status.INVALID_ARGUMENT
                    .withDescription(fieldName + " is required (HH:mm)")
                    .asRuntimeException();
        }
        return t;
    }

    public static Gender optionalGender(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return Gender.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("gender must be one of: MALE, FEMALE, OTHER")
                    .asRuntimeException();
        }
    }

    public static void requireNonBlank(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw Status.INVALID_ARGUMENT
                    .withDescription(fieldName + " is required")
                    .asRuntimeException();
        }
    }
}
