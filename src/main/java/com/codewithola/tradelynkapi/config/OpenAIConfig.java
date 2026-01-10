package com.codewithola.tradelynkapi.config;

import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class OpenAIConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.timeout:30000}")
    private int timeout;

    @Bean
    public OpenAiService openAiService() {
        return new OpenAiService(apiKey, Duration.ofMillis(timeout));
    }
}