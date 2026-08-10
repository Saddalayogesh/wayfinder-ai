package com.tripplanner.export;

import org.openpdf.text.Chunk;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Font;
import org.openpdf.text.FontFactory;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.pdf.PdfWriter;
import org.openpdf.text.pdf.draw.LineSeparator;
import com.tripplanner.trip.dto.CostBreakdown;
import com.tripplanner.trip.dto.ItineraryItemResponse;
import com.tripplanner.trip.dto.TripDayResponse;
import com.tripplanner.trip.dto.TripResponse;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Renders a {@link TripResponse} into a printable PDF using OpenPDF
 * (the maintained LGPL fork of iText 2.x). The output is an in-memory byte
 * array — the controller streams it to the client.
 */
@Service
public class PdfExportService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH);
    private static final NumberFormat MONEY = NumberFormat.getCurrencyInstance(Locale.US);

    private static final Font H1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(0x0f, 0x17, 0x2a));
    private static final Font SUB = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(0x64, 0x74, 0x8b));
    private static final Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(0x43, 0x38, 0xca));
    private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(0x33, 0x41, 0x55));
    private static final Font BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(0x0f, 0x17, 0x2a));
    private static final Font MUTED = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(0x94, 0xa3, 0xb8));

    public byte[] renderTripPdf(TripResponse trip) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            Document document = new Document(PageSize.A4, 48, 48, 48, 48);
            PdfWriter.getInstance(document, out);
            document.open();
            writeHeader(document, trip);
            writeBudget(document, trip.cost());
            writeItinerary(document, trip);
            document.close();
        } catch (DocumentException e) {
            // Rendering is entirely in-memory; only programmer errors land here.
            throw new IllegalStateException("Failed to render trip PDF", e);
        }
        return out.toByteArray();
    }

    private void writeHeader(Document document, TripResponse trip) throws DocumentException {
        Paragraph title = new Paragraph(trip.title(), H1);
        title.setSpacingAfter(6);
        document.add(title);

        String travelers = trip.travelers() != null
                ? (trip.travelers() == 1 ? "1 traveler" : trip.travelers() + " travelers")
                : "—";
        Paragraph sub = new Paragraph(String.format("%s · %s – %s · %s · Budget %s",
                trip.destination(),
                trip.startDate().format(DATE_FMT),
                trip.endDate().format(DATE_FMT),
                travelers,
                money(trip.budget())), SUB);
        document.add(sub);

        Paragraph rule = new Paragraph();
        rule.add(new Chunk(new LineSeparator()));
        rule.setSpacingAfter(14);
        document.add(rule);
    }

    private void writeBudget(Document document, CostBreakdown cost) throws DocumentException {
        document.add(new Paragraph("Budget summary", H2));
        if (cost == null) {
            document.add(new Paragraph("No cost data available.", MUTED));
            document.add(space());
            return;
        }
        document.add(line("Estimated total", money(cost.estimatedTotal())));
        document.add(line("Remaining", cost.remaining() == null ? "—" : money(cost.remaining())));
        java.util.Map<String, BigDecimal> byCategory = cost.breakdown();
        if (byCategory != null) {
            for (String category : new String[]{"accommodation", "food", "activities", "transport"}) {
                BigDecimal value = byCategory.get(category);
                if (value != null && value.signum() > 0) {
                    document.add(line("  " + category, money(value)));
                }
            }
        }
        document.add(space());
    }

    private void writeItinerary(Document document, TripResponse trip) throws DocumentException {
        document.add(new Paragraph("Itinerary", H2));
        if (trip.days().isEmpty()) {
            document.add(new Paragraph("No days planned yet.", MUTED));
            return;
        }
        for (TripDayResponse day : trip.days()) {
            Paragraph dayHeading = new Paragraph(String.format("Day %d — %s",
                    day.dayNumber(), day.date().format(DATE_FMT)), BOLD);
            dayHeading.setSpacingBefore(10);
            dayHeading.setSpacingAfter(4);
            document.add(dayHeading);

            if (day.items().isEmpty()) {
                document.add(new Paragraph("No places planned.", MUTED));
                continue;
            }
            for (ItineraryItemResponse item : day.items()) {
                StringBuilder name = new StringBuilder()
                        .append(item.sequenceOrder()).append(". ")
                        .append(item.placeName());
                if (item.estimatedCost() != null || item.visitDuration() != null) {
                    name.append("  —");
                    if (item.estimatedCost() != null) {
                        name.append("  ").append(money(item.estimatedCost()));
                    }
                    if (item.visitDuration() != null) {
                        name.append("  ·  ").append(duration(item.visitDuration()));
                    }
                }
                Paragraph itemLine = new Paragraph(name.toString(), BODY);
                itemLine.setIndentationLeft(12);
                itemLine.setSpacingAfter(3);
                document.add(itemLine);

                if (item.description() != null && !item.description().isBlank()) {
                    Paragraph desc = new Paragraph(item.description(), MUTED);
                    desc.setIndentationLeft(12);
                    desc.setSpacingAfter(5);
                    document.add(desc);
                }
            }
        }
    }

    private Paragraph line(String label, String value) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + ":  ", BODY));
        p.add(new Chunk(value, BOLD));
        p.setSpacingAfter(3);
        return p;
    }

    private Paragraph space() {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(6);
        return p;
    }

    private static String money(BigDecimal value) {
        if (value == null) {
            return "—";
        }
        return MONEY.format(value);
    }

    /** "90" -> "1h 30m", "45" -> "45m". */
    private static String duration(Integer minutes) {
        if (minutes == null || minutes <= 0) {
            return "—";
        }
        int hours = minutes / 60;
        int mins = minutes % 60;
        if (hours == 0) {
            return mins + "m";
        }
        return mins == 0 ? hours + "h" : hours + "h " + mins + "m";
    }
}
