package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.response.ContentModerationResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class ContentModerationService {

    // Prohibited keywords list - case insensitive
    private static final List<String> PROHIBITED_KEYWORDS = Arrays.asList(
            // Drugs and substances
            "drug", "drugs", "weed", "marijuana", "cannabis", "cocaine", "heroin",
            "meth", "mdma", "ecstasy", "lsd", "prescription",

            // Weapons
            "gun", "guns", "weapon", "weapons", "firearm", "firearms", "rifle",
            "pistol", "ammunition", "ammo", "explosive", "bomb",

            // Alcohol (if not allowed)
            "alcohol", "liquor", "vodka", "whiskey", "beer", "wine",

            // Adult content
            "porn", "xxx", "sex", "nude", "naked", "adult content",

            // Illegal activities
            "counterfeit", "fake id", "stolen", "hacked", "pirated",

            // Scam indicators
            "get rich quick", "make money fast", "guaranteed income",
            "work from home scam", "pyramid scheme",

            // Offensive
            "scam", "fraud", "cheat"
    );

    /**
     * Validate item content for prohibited keywords
     * @param title - Item title
     * @param description - Item description
     * @return ContentModerationResult with allowed status and flagged words
     */
    public ContentModerationResult validateItemContent(String title, String description) {
        log.info("Validating content for prohibited keywords");

        List<String> flaggedWords = new ArrayList<>();

        // Combine title and description for checking
        String content = (title + " " + description).toLowerCase();

        // Check for prohibited keywords
        for (String keyword : PROHIBITED_KEYWORDS) {
            if (content.contains(keyword.toLowerCase())) {
                flaggedWords.add(keyword);
            }
        }

        boolean allowed = flaggedWords.isEmpty();

        if (!allowed) {
            log.warn("Content validation failed. Flagged words: {}", flaggedWords);
        } else {
            log.info("Content validation passed");
        }

        return ContentModerationResult.builder()
                .allowed(allowed)
                .message(allowed ? "Content approved" : "Content contains prohibited keywords")
                .flaggedWords(flaggedWords)
                .build();
    }

    /**
     * Check if text contains any prohibited keywords
     * @param text - Text to check
     * @return true if text is clean, false if contains prohibited words
     */
    public boolean isContentClean(String text) {
        if (text == null || text.isEmpty()) {
            return true;
        }

        String lowerText = text.toLowerCase();

        for (String keyword : PROHIBITED_KEYWORDS) {
            if (lowerText.contains(keyword.toLowerCase())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get list of all prohibited keywords (for admin reference)
     * @return List of prohibited keywords
     */
    public List<String> getProhibitedKeywords() {
        return new ArrayList<>(PROHIBITED_KEYWORDS);
    }
}
