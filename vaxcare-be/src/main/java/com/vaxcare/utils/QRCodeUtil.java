package com.vaxcare.utils;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

public final class QRCodeUtil {

    private static final int DEFAULT_SIZE = 300;

    private QRCodeUtil() {
    }

    /** Sinh token duy nhất dùng làm nội dung QR + lưu vào cột appointments.qr_code. */
    public static String generateToken() {
        return "VAXCARE-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }

    /** Sinh ảnh QR PNG từ nội dung, trả về chuỗi Base64 kèm tiền tố data URI để FE render trực tiếp bằng thẻ <img>. */
    public static String generateQRCodeBase64(String content) {
        return generateQRCodeBase64(content, DEFAULT_SIZE);
    }

    public static String generateQRCodeBase64(String content, int size) {
        try {
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 1);

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);

            String base64 = Base64.getEncoder().encodeToString(outputStream.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Không thể sinh mã QR Code", e);
        }
    }
}
