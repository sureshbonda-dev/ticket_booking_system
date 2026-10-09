package com.cinema.booking_service.service;

import com.cinema.booking_service.dto.BookingDtos.TicketResponse;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
public class TicketPdfService {

    private static final DateTimeFormatter SHOWTIME_FORMAT = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm 'UTC'").withZone(ZoneOffset.UTC);

    public byte[] create(TicketResponse ticket) {
        try {
            ByteArrayOutputStream qrBytes = new ByteArrayOutputStream();
            BitMatrix qr = new MultiFormatWriter().encode(ticket.ticketCode(), BarcodeFormat.QR_CODE, 260, 260);
            MatrixToImageWriter.writeToStream(qr, "PNG", qrBytes);

            try (PDDocument document = new PDDocument(); ByteArrayOutputStream pdfBytes = new ByteArrayOutputStream()) {
                PDPage page = new PDPage(new PDRectangle(298.27f, 420.94f));
                document.addPage(page);
                PDImageXObject qrImage = PDImageXObject.createFromByteArray(document, qrBytes.toByteArray(), "ticket-qr.png");
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16,
                            24, 390, "CINEMA BOOKING TICKET");
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11,
                            24, 355, "Booking: " + ticket.bookingReference());
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10,
                            24, 330, "Showtime ID: " + ticket.showtimeId());
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10,
                            24, 310, "Starts: " + SHOWTIME_FORMAT.format(ticket.showtimeStartsAt()));
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10,
                            24, 290, "Seat IDs: " + ticket.seatIds());
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10,
                            24, 270, "Total: " + ticket.amount().toPlainString());
                    drawLine(content, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8,
                            24, 245, "Scan the QR code at the cinema for ticket verification.");
                    content.drawImage(qrImage, 79, 45, 140, 140);
                }
                document.save(pdfBytes);
                return pdfBytes.toByteArray();
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Could not generate the ticket PDF.", exception);
        }
    }

    private void drawLine(PDPageContentStream content, PDType1Font font, float size,
                          float x, float y, String text) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
    }
}
