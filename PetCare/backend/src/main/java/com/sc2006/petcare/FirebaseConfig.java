package com.sc2006.petcare;

import java.io.IOException;
import java.io.InputStream;

import javax.annotation.PostConstruct;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

@Configuration
public class FirebaseConfig {
    private GoogleCredentials credentials;

    @PostConstruct
    public void initializeFirebaseApp() {
        try {
            System.out.println("Starting Firebase initialization...");

            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("petcarePrivateKey.json");
            if (serviceAccount == null) {
                System.err.println("Service account file not found!");
                throw new RuntimeException("Service account file not found in classpath.");
            }
            System.out.println("Service account file found successfully.");

            this.credentials = GoogleCredentials.fromStream(serviceAccount);
            System.out.println("Credentials loaded successfully: " + credentials.toString());
            serviceAccount.close();

            if (FirebaseApp.getApps().isEmpty()) {
                System.out.println("Initializing new Firebase instance...");
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(this.credentials)
                        .setDatabaseUrl("https://petcare-1d07f-default-rtdb.firebaseio.com")
                        .setStorageBucket("petcare-1d07f.appspot.com")
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase initialized successfully!");
            } else {
                System.out.println("Firebase already initialized.");
            }
        } catch (IOException e) {
            System.err.println("Firebase initialization error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error initializing Firebase: " + e.getMessage(), e);
        }
    }

    @Bean
    public Firestore getFirestore() {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("Firestore initialized successfully!");
            return firestore;
        } catch (Exception e) {
            System.err.println("Error initializing Firestore: " + e.getMessage());
            throw new RuntimeException("Error initializing Firestore", e);
        }
    }

    @Bean
    public Storage getStorage() {
        try {
            Storage storage = StorageOptions.newBuilder()
                    .setCredentials(credentials)
                    .build()
                    .getService();
            System.out.println("Storage initialized successfully!");
            return storage;
        } catch (Exception e) {
            System.err.println("Error initializing Storage: " + e.getMessage());
            throw new RuntimeException("Error initializing Storage", e);
        }
    }
}