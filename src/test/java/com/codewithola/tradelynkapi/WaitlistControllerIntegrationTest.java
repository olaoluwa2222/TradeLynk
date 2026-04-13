package com.codewithola.tradelynkapi;

import com.codewithola.tradelynkapi.dtos.requests.WaitlistRequest;
import com.codewithola.tradelynkapi.repositories.WaitlistRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Waitlist Controller
 * Tests the full flow from HTTP request to database persistence
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WaitlistControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WaitlistRepository waitlistRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Clear waitlist before each test
        waitlistRepository.deleteAll();
    }

    @Test
    void testAddToWaitlist_Success_NewEmail() throws Exception {
        // Arrange
        WaitlistRequest request = WaitlistRequest.builder()
                .email("newuser@example.com")
                .source("go.tradelynk.app")
                .build();

        String requestBody = objectMapper.writeValueAsString(request);

        // Act
        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.data.isDuplicate").value(false))
                .andReturn();

        // Assert - verify data was saved to database
        assertThat(waitlistRepository.count()).isEqualTo(1);
        assertThat(waitlistRepository.findByEmailIgnoreCase("newuser@example.com")).isPresent();
    }

    @Test
    void testAddToWaitlist_Duplicate_ExistingEmail() throws Exception {
        // Arrange - add first email
        WaitlistRequest firstRequest = WaitlistRequest.builder()
                .email("duplicate@example.com")
                .source("go.tradelynk.app")
                .build();

        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        // Act - try to add same email again
        WaitlistRequest duplicateRequest = WaitlistRequest.builder()
                .email("duplicate@example.com")
                .source("go.tradelynk.app")
                .build();

        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isDuplicate").value(true))
                .andReturn();

        // Assert - only one record in database
        assertThat(waitlistRepository.count()).isEqualTo(1);
    }

    @Test
    void testAddToWaitlist_InvalidEmail_Returns400() throws Exception {
        // Arrange
        WaitlistRequest invalidRequest = WaitlistRequest.builder()
                .email("not-an-email")
                .source("go.tradelynk.app")
                .build();

        String requestBody = objectMapper.writeValueAsString(invalidRequest);

        // Act
        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());

        // Assert - no record created
        assertThat(waitlistRepository.count()).isEqualTo(0);
    }

    @Test
    void testAddToWaitlist_CaseInsensitivity() throws Exception {
        // Arrange - add email with uppercase
        WaitlistRequest firstRequest = WaitlistRequest.builder()
                .email("TEST@EXAMPLE.COM")
                .source("go.tradelynk.app")
                .build();

        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        // Act - try to add same email with lowercase
        WaitlistRequest secondRequest = WaitlistRequest.builder()
                .email("test@example.com")
                .source("go.tradelynk.app")
                .build();

        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isDuplicate").value(true));

        // Assert - only one record, normalized to lowercase
        assertThat(waitlistRepository.count()).isEqualTo(1);
        assertThat(waitlistRepository.findByEmailIgnoreCase("test@example.com"))
                .isPresent()
                .get()
                .extracting("email")
                .isEqualTo("test@example.com");
    }

    @Test
    void testAddToWaitlist_WhitespaceNormalization() throws Exception {
        // Arrange
        WaitlistRequest requestWithWhitespace = WaitlistRequest.builder()
                .email("  user@example.com  ")
                .source("go.tradelynk.app")
                .build();

        // Act
        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestWithWhitespace)))
                .andExpect(status().isCreated());

        // Assert - email stored without whitespace
        assertThat(waitlistRepository.count()).isEqualTo(1);
        assertThat(waitlistRepository.findByEmailIgnoreCase("user@example.com"))
                .isPresent()
                .get()
                .extracting("email")
                .isEqualTo("user@example.com");
    }

    @Test
    void testAddToWaitlist_DefaultSource() throws Exception {
        // Arrange
        WaitlistRequest requestWithoutSource = WaitlistRequest.builder()
                .email("nosource@example.com")
                .build();

        // Act
        mockMvc.perform(post("/api/v1/waitlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestWithoutSource)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.source").value("go.tradelynk.app"));

        // Assert
        assertThat(waitlistRepository.findByEmailIgnoreCase("nosource@example.com"))
                .isPresent()
                .get()
                .extracting("source")
                .isEqualTo("go.tradelynk.app");
    }

    @Test
    void testHealthCheck_Endpoint() throws Exception {
        // Add some waitlist entries
        for (int i = 0; i < 3; i++) {
            WaitlistRequest request = WaitlistRequest.builder()
                    .email("user" + i + "@example.com")
                    .source("go.tradelynk.app")
                    .build();

            mockMvc.perform(post("/api/v1/waitlist")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)));
        }

        // Act
        mockMvc.perform(get("/api/v1/waitlist/health")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalSignups").value(3));
    }
}

