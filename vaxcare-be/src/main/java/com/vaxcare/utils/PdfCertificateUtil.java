package com.vaxcare.utils;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

public final class PdfCertificateUtil {

    private static final String FONT_REGULAR_PATH = "/fonts/Roboto-Regular.ttf";
    private static final String FONT_BOLD_PATH = "/fonts/Roboto-Bold.ttf";

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private PdfCertificateUtil() {
    }

    public record CertificateData(
            String certificateCode,
            String userFullName,
            java.time.LocalDate dateOfBirth,
            String gender,
            String vaccineName,
            String manufacturer,
            Integer doseNumber,
            java.time.LocalDate injectionDate,
            String facilityName,
            String facilityAddress,
            String staffName,
            String batchNumber
    ) {
    }

    public static byte[] generate(CertificateData data) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDFont fontRegular = loadFont(document, FONT_REGULAR_PATH);
            PDFont fontBold = loadFont(document, FONT_BOLD_PATH);

            float pageWidth = PDRectangle.A4.getWidth();
            float margin = 50;
            float y = PDRectangle.A4.getHeight() - 60;

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // ----- Tiêu đề -----
                y = drawCenteredText(cs, fontBold, 20, "CHỨNG NHẬN TIÊM CHỦNG", pageWidth, y);
                y -= 4;
                y = drawCenteredText(cs, fontRegular, 11, "VACCINATION CERTIFICATE", pageWidth, y);
                y -= 10;
                y = drawCenteredText(cs, fontRegular, 10, "Hệ thống VaxCare", pageWidth, y);
                y -= 25;

                // ----- Đường kẻ ngang -----
                cs.setLineWidth(1f);
                cs.moveTo(margin, y);
                cs.lineTo(pageWidth - margin, y);
                cs.stroke();
                y -= 30;

                float labelX = margin;
                float valueX = margin + 160;
                float lineHeight = 24;

                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Mã chứng nhận:", nullSafe(data.certificateCode()));
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Họ và tên:", nullSafe(data.userFullName()));
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Ngày sinh:", data.dateOfBirth() != null ? data.dateOfBirth().format(DATE_FMT) : "—");
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Giới tính:", nullSafe(data.gender()));

                y -= 10;
                cs.setLineWidth(0.5f);
                cs.moveTo(margin, y);
                cs.lineTo(pageWidth - margin, y);
                cs.stroke();
                y -= 25;

                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Vắc xin:", nullSafe(data.vaccineName()));
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Nhà sản xuất:", nullSafe(data.manufacturer()));
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Mũi số:", data.doseNumber() != null ? String.valueOf(data.doseNumber()) : "—");
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Ngày tiêm:", data.injectionDate() != null ? data.injectionDate().format(DATE_FMT) : "—");
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Số lô vắc xin:", nullSafe(data.batchNumber()));

                y -= 10;
                cs.setLineWidth(0.5f);
                cs.moveTo(margin, y);
                cs.lineTo(pageWidth - margin, y);
                cs.stroke();
                y -= 25;

                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Cơ sở tiêm chủng:", nullSafe(data.facilityName()));
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Địa chỉ:", nullSafe(data.facilityAddress()));
                y = drawRow(cs, fontBold, fontRegular, labelX, valueX, y, lineHeight,
                        "Người thực hiện:", nullSafe(data.staffName()));

                // ----- QR code xác thực -----
                byte[] qrPng = QRCodeUtil.generateQRCodePng("VAXCARE-CERT:" + data.certificateCode(), 220);
                PDImageXObject qrImage = PDImageXObject.createFromByteArray(document, qrPng, "qr");
                float qrSize = 110;
                float qrX = pageWidth - margin - qrSize;
                float qrY = 90;
                cs.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(qrX, qrY - 12);
                cs.showText("Quét mã để xác thực chứng nhận");
                cs.endText();

                // ----- Ghi chú cuối trang -----
                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(margin, 60);
                cs.showText("Chứng nhận này được hệ thống VaxCare tự động sinh ra và có giá trị tra cứu điện tử.");
                cs.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Không thể sinh file PDF chứng nhận tiêm chủng", e);
        }
    }

    private static PDFont loadFont(PDDocument document, String classpathTtfPath) throws IOException {
        try (InputStream is = PdfCertificateUtil.class.getResourceAsStream(classpathTtfPath)) {
            if (is == null) {
                throw new IllegalStateException(
                        "Không tìm thấy font tại classpath:" + classpathTtfPath
                                + " — vui lòng tải font Unicode TTF (vd: Roboto) từ Google Fonts và đặt vào"
                                + " src/main/resources/fonts/ (xem PdfCertificateUtil để biết tên file cần thiết)");
            }
            return PDType0Font.load(document, is);
        }
    }

    private static float drawRow(PDPageContentStream cs, PDFont fontBold, PDFont fontRegular,
                                  float labelX, float valueX, float y, float lineHeight,
                                  String label, String value) throws IOException {
        cs.beginText();
        cs.setFont(fontBold, 11);
        cs.newLineAtOffset(labelX, y);
        cs.showText(label);
        cs.endText();

        cs.beginText();
        cs.setFont(fontRegular, 11);
        cs.newLineAtOffset(valueX, y);
        cs.showText(value != null ? value : "—");
        cs.endText();

        return y - lineHeight;
    }

    private static float drawCenteredText(PDPageContentStream cs, PDFont font, float fontSize,
                                           String text, float pageWidth, float y) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = (pageWidth - textWidth) / 2;
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - fontSize;
    }

    private static String nullSafe(String s) {
        return (s == null || s.isBlank()) ? "—" : s;
    }
}
