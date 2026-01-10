package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.ImproveTextRequest;
import com.codewithola.tradelynkapi.dtos.response.ImproveTextResponse;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AITextImprovementService {

    private final OpenAiService openAiService;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    /**
     * Improve text using OpenAI GPT-4o-mini
     * This is a cost-effective solution for text enhancement
     */
    public ImproveTextResponse improveText(ImproveTextRequest request) {
        log.info("🤖 Improving {} text: '{}'", request.getType(),
                request.getText().substring(0, Math.min(50, request.getText().length())));

        try {
            // Build the prompt based on type
            String systemPrompt = buildSystemPrompt(request.getType());
            String userPrompt = buildUserPrompt(request.getText(), request.getType());

            // Create messages
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userPrompt));

            // Create completion request
            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(messages)
                    .temperature(0.7)  // Balanced creativity
                    .maxTokens(200)    // Enough for bio/tagline
                    .build();

            // Call OpenAI API
            var completion = openAiService.createChatCompletion(completionRequest);
            String improvedText = completion.getChoices().get(0).getMessage().getContent().trim();

            // Remove quotes if AI added them
            improvedText = improvedText.replaceAll("^\"|\"$", "");

            log.info("✅ Text improved successfully. Original: {} chars, Improved: {} chars",
                    request.getText().length(), improvedText.length());

            // Build response
            return ImproveTextResponse.builder()
                    .originalText(request.getText())
                    .improvedText(improvedText)
                    .type(request.getType())
                    .originalLength(request.getText().length())
                    .improvedLength(improvedText.length())
                    .build();

        } catch (Exception e) {
            log.error("❌ Error improving text with OpenAI: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to improve text. Please try again.");
        }
    }

    /**
     * Build system prompt based on text type
     */
    private String buildSystemPrompt(String type) {
        if ("bio".equals(type)) {
            return "You are a professional copywriter helping student sellers create compelling store bios. " +
                    "Your task is to improve their bio while keeping their voice authentic. " +
                    "Rules: " +
                    "1. Keep it between 50-500 characters " +
                    "2. Fix grammar and spelling errors " +
                    "3. Make it engaging and trustworthy " +
                    "4. Keep the core message intact " +
                    "5. Use simple, conversational language " +
                    "6. Don't add false claims " +
                    "7. Return ONLY the improved text, no explanations";
        } else { // tagline
            return "You are a professional copywriter helping users sellers create catchy store taglines. " +
                    "Your task is to improve their tagline while keeping it short and punchy. " +
                    "Rules: " +
                    "1. Keep it between 10-100 characters " +
                    "2. Fix grammar and spelling errors " +
                    "3. Make it catchy and memorable " +
                    "4. Keep the core message intact " +
                    "5. Use simple, active language " +
                    "6. Don't add false claims " +
                    "7. Return ONLY the improved tagline, no explanations";
        }
    }

    /**
     * Build user prompt
     */
    private String buildUserPrompt(String text, String type) {
        if ("bio".equals(type)) {
            return "Improve this store bio: \"" + text + "\"";
        } else { // tagline
            return "Improve this store tagline: \"" + text + "\"";
        }
    }

    /**
     * Check if AI service is available (for health checks)
     */
    public boolean isServiceAvailable() {
        try {
            // Simple test request
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), "Hi"));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(messages)
                    .maxTokens(5)
                    .build();

            openAiService.createChatCompletion(request);
            return true;
        } catch (Exception e) {
            log.error("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }
}