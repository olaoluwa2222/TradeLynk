package com.codewithola.tradelynkapi;

import com.codewithola.tradelynkapi.dtos.requests.WaitlistRequest;
import com.codewithola.tradelynkapi.dtos.response.WaitlistResponse;
import com.codewithola.tradelynkapi.entity.Waitlist;
import com.codewithola.tradelynkapi.repositories.WaitlistRepository;
import com.codewithola.tradelynkapi.services.WaitlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WaitlistService
 * Tests email normalization, duplicate detection, and database operations
 */
@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock
    private WaitlistRepository waitlistRepository;

    @InjectMocks
    private WaitlistService waitlistService;

    private WaitlistRequest validRequest;
    private Waitlist savedWaitlist;
    private UUID testUUID;

    @BeforeEach
    void setUp() {
        testUUID = UUID.randomUUID();

        validRequest = WaitlistRequest.builder()
                .email("test@example.com")
                .source("go.tradelynk.app")
                .build();

        savedWaitlist = Waitlist.builder()
                .id(testUUID)
                .email("test@example.com")
                .source("go.tradelynk.app")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    void testAddToWaitlist_Success_NewEmail() {
        // Arrange
        when(waitlistRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.empty());
        when(waitlistRepository.save(any(Waitlist.class)))
                .thenReturn(savedWaitlist);

        // Act
        WaitlistResponse response = waitlistService.addToWaitlist(validRequest);

        // Assert
        assertNotNull(response);
        assertFalse(response.getIsDuplicate());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(testUUID, response.getId());

        // Verify repository calls
        verify(waitlistRepository, times(1)).findByEmailIgnoreCase("test@example.com");
        verify(waitlistRepository, times(1)).save(any(Waitlist.class));
    }

    @Test
    void testAddToWaitlist_Duplicate_ExistingEmail() {
        // Arrange
        when(waitlistRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.of(savedWaitlist));

        // Act
        WaitlistResponse response = waitlistService.addToWaitlist(validRequest);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsDuplicate());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(testUUID, response.getId());

        // Verify save was NOT called for duplicates
        verify(waitlistRepository, times(1)).findByEmailIgnoreCase("test@example.com");
        verify(waitlistRepository, never()).save(any(Waitlist.class));
    }

    @Test
    void testAddToWaitlist_EmailNormalization_LowercaseAndTrim() {
        // Arrange
        WaitlistRequest requestWithWhitespace = WaitlistRequest.builder()
                .email("  TEST@EXAMPLE.COM  ")
                .source("go.tradelynk.app")
                .build();

        when(waitlistRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.empty());
        when(waitlistRepository.save(any(Waitlist.class)))
                .thenReturn(savedWaitlist);

        // Act
        WaitlistResponse response = waitlistService.addToWaitlist(requestWithWhitespace);

        // Assert
        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());

        // Verify that repository was called with normalized email
        verify(waitlistRepository).findByEmailIgnoreCase("test@example.com");
    }

    @Test
    void testAddToWaitlist_DefaultSource_WhenNotProvided() {
        // Arrange
        WaitlistRequest requestWithoutSource = WaitlistRequest.builder()
                .email("test@example.com")
                .build();

        Waitlist expectedSave = Waitlist.builder()
                .id(testUUID)
                .email("test@example.com")
                .source("go.tradelynk.app")
                .createdAt(OffsetDateTime.now())
                .build();

        when(waitlistRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.empty());
        when(waitlistRepository.save(any(Waitlist.class)))
                .thenReturn(expectedSave);

        // Act
        WaitlistResponse response = waitlistService.addToWaitlist(requestWithoutSource);

        // Assert
        assertEquals("go.tradelynk.app", response.getSource());
        verify(waitlistRepository, times(1)).save(any(Waitlist.class));
    }

    @Test
    void testIsEmailOnWaitlist_Exists() {
        // Arrange
        when(waitlistRepository.existsByEmailIgnoreCase("test@example.com"))
                .thenReturn(true);

        // Act
        boolean exists = waitlistService.isEmailOnWaitlist("test@example.com");

        // Assert
        assertTrue(exists);
        verify(waitlistRepository, times(1)).existsByEmailIgnoreCase("test@example.com");
    }

    @Test
    void testGetWaitlistCount() {
        // Arrange
        when(waitlistRepository.count()).thenReturn(42L);

        // Act
        long count = waitlistService.getWaitlistCount();

        // Assert
        assertEquals(42L, count);
        verify(waitlistRepository, times(1)).count();
    }
}

