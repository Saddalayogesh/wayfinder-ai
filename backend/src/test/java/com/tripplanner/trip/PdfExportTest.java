package com.tripplanner.trip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PDF export: the owner gets a streamed application/pdf attachment containing
 * the itinerary; other users get 403; anonymous gets 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PdfExportTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void ownerExportsPdfWithContentDispositionAttachment() throws Exception {
        String tokenA = register("pdf.alice@example.com");

        long tripId = createTripWithItinerary(tokenA);

        MvcResult export = mockMvc.perform(get("/api/trips/" + tripId + "/export/pdf")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("trip-" + tripId + ".pdf")))
                .andReturn();

        byte[] pdf = export.getResponse().getContentAsByteArray();

        // A real PDF: header magic + non-trivial body.
        assertThat(pdf.length).isGreaterThan(500);
        assertThat(new String(pdf, 0, 5, java.nio.charset.StandardCharsets.ISO_8859_1))
                .isEqualTo("%PDF-");

        // The extracted text contains the destination, the day heading, the
        // itinerary items, and the budget — proving the document has content.
        String text = extractText(pdf);
        assertThat(text)
                .contains("Kyoto")
                .contains("Day 1")
                .contains("Kinkaku-ji")
                .contains("Nishiki Market")
                .contains("Budget summary");
    }

    private static String extractText(byte[] pdf) throws java.io.IOException {
        org.openpdf.text.pdf.PdfReader reader = new org.openpdf.text.pdf.PdfReader(pdf);
        try {
            // OpenPDF 3.x: instance-based text extraction.
            return new org.openpdf.text.pdf.parser.PdfTextExtractor(reader).getTextFromPage(1);
        } finally {
            reader.close();
        }
    }

    @Test
    void otherUserCannotExportOthersTripPdf() throws Exception {
        String tokenA = register("pdf.alice2@example.com");
        String tokenB = register("pdf.bob2@example.com");
        long tripId = createTripWithItinerary(tokenA);

        mockMvc.perform(get("/api/trips/" + tripId + "/export/pdf")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.status").value(403));
    }

    @Test
    void exportRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/trips/1/export/pdf"))
                .andExpect(status().isUnauthorized());
    }

    // --- Helpers ----------------------------------------------------------------

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"PDF Tester","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private long createTripWithItinerary(String token) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/trips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Kyoto Highlights",
                                  "destination": "Kyoto",
                                  "startDate": "2026-09-01",
                                  "endDate": "2026-09-02",
                                  "travelers": 2,
                                  "budget": 800.00,
                                  "travelStyle": "CULTURAL",
                                  "days": [
                                    {
                                      "dayNumber": 1,
                                      "date": "2026-09-01",
                                      "items": [
                                        {"placeName": "Kinkaku-ji", "estimatedCost": 8, "visitDuration": 90},
                                        {"placeName": "Nishiki Market", "description": "Street food", "estimatedCost": 30, "visitDuration": 120}
                                      ]
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();
    }
}
