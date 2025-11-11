package com.codewithola.tradelynkapi.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.FirebaseDatabase;
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
        return FirebaseDatabase.getInstance(firebaseApp);
    }
}

/*
 * FIREBASE REALTIME DATABASE STRUCTURE:
 *
 * /chats
 *   /{chatId}
 *     itemId: 123
 *     buyerId: 456
 *     sellerId: 789
 *     itemTitle: "iPhone 14 Pro"
 *     itemImageUrl: "https://..."
 *     createdAt: 1698765432000
 *     lastMessageAt: 1698765500000
 *     lastMessage: "Is this still available?"
 *
 *     /messages
 *       /{messageId}
 *         senderId: 456
 *         senderName: "John Doe"
 *         content: "Hello, is this still available?"
 *         imageUrls: ["https://...", "https://..."]
 *         timestamp: 1698765432000
 *         read: false
 *
 * /userChats
 *   /{userId}
 *     /{chatId}: true
 *
 * FIREBASE SECURITY RULES (Add to Firebase Console):
 *
 * {
 *   "rules": {
 *     "chats": {
 *       "$chatId": {
 *         ".read": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid)",
 *         ".write": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid)",
 *         "messages": {
 *           ".read": "auth != null",
 *           ".write": "auth != null"
 *         }
 *       }
 *     },
 *     "userChats": {
 *       "$userId": {
 *         ".read": "auth != null && auth.uid == $userId",
 *         ".write": "auth != null && auth.uid == $userId"
 *       }
 *     }
 *   }
 * }
 */
