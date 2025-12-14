package com.codewithola.tradelynkapi.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.database-url}")
    private String databaseUrl;

    @Value("${firebase.credentials-base64:}")
    private String credentialsBase64;

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    public FirebaseApp initializeFirebase() throws IOException {
        log.info("Initializing Firebase Admin SDK");

        try {
            InputStream serviceAccount;

            // Priority 1: Use base64 credentials if provided
            if (credentialsBase64 != null && !credentialsBase64.isEmpty()) {
                log.info("Loading Firebase credentials from base64 environment variable");
                byte[] decodedBytes = Base64.getDecoder().decode(credentialsBase64);
                serviceAccount = new ByteArrayInputStream(decodedBytes);
            }
            // Priority 2: Use file path if base64 not provided
            else if (credentialsPath != null && !credentialsPath.isEmpty()) {
                log.info("Loading Firebase credentials from file path: {}", credentialsPath);

                if (credentialsPath.startsWith("classpath:")) {
                    String path = credentialsPath.replace("classpath:", "");
                    serviceAccount = getClass().getClassLoader().getResourceAsStream(path);

                    if (serviceAccount == null) {
                        throw new IOException("Firebase config file not found in classpath: " + path);
                    }
                } else {
                    serviceAccount = new FileInputStream(credentialsPath);
                }
            }
            // No credentials provided
            else {
                throw new IllegalStateException(
                        "Firebase credentials not configured. Please set either " +
                                "FIREBASE_CREDENTIALS_BASE64 or FIREBASE_CREDENTIALS_PATH environment variable"
                );
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl(databaseUrl)
                    .build();

            FirebaseApp app = FirebaseApp.initializeApp(options);

            log.info("Firebase Admin SDK initialized successfully");
            return app;
        } catch (Exception e) {
            log.error("Failed to initialize Firebase", e);
            throw e;
        }
    }

    @Bean
    public FirebaseDatabase firebaseDatabase(FirebaseApp firebaseApp) {
        log.info("Initializing Firebase Realtime Database");
        return FirebaseDatabase.getInstance(firebaseApp);
    }

    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        log.info("Initializing Firebase Cloud Messaging");
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}