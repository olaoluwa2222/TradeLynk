package com.codewithola.tradelynkapi.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.messaging.FirebaseMessaging; // ✅ ADD THIS
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.database-url}")
    private String databaseUrl;

    @Value("${firebase.credentials-path:classpath:firebase-config.json}")
    private String configPath;

    @Bean
    public FirebaseApp initializeFirebase() throws IOException {
        log.info("Initializing Firebase Admin SDK");

        try {
            // Load Firebase credentials from JSON file
            InputStream serviceAccount;

            if (configPath.startsWith("classpath:")) {
                // Load from classpath (resources folder)
                String path = configPath.replace("classpath:", "");
                serviceAccount = getClass().getClassLoader().getResourceAsStream(path);

                if (serviceAccount == null) {
                    throw new IOException("Firebase config file not found in classpath: " + path);
                }
            } else {
                // Load from file system
                serviceAccount = new FileInputStream(configPath);
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

    // ✅ ADD THIS NEW BEAN
    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        log.info("Initializing Firebase Cloud Messaging");
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}