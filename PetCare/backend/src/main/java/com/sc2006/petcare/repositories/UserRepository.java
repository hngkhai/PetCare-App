package com.sc2006.petcare.repositories;

import java.util.HashMap;
import java.util.concurrent.ExecutionException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.models.ArticleModel;
import com.sc2006.petcare.models.PetModel;
import com.sc2006.petcare.models.UserModel;

@Repository
public class UserRepository {

    private final CollectionReference userCollection;

    @Autowired
    public UserRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.userCollection = dbFireStore.collection("User");
    }

    @Autowired
    private Firestore dbFireStore;

    // Save user and return the DocumentReference
    public DocumentReference saveUser(UserModel user) {
        try {
            // Save the user to Firestore with Firebase UID as the document ID
            ApiFuture<WriteResult> future = userCollection.document(user.getId()).set(user);

            // Get the result (blocking call)
            WriteResult result = future.get(); // This may throw InterruptedException or ExecutionException

            // Return the DocumentReference for the saved user
            return userCollection.document(user.getId());
        } catch (InterruptedException e) {
            // Handle interruption (e.g., if the thread is interrupted while waiting)
            Thread.currentThread().interrupt(); // Restore the interrupted status
            throw new RuntimeException("Thread was interrupted while saving user in Firestore", e);
        } catch (ExecutionException e) {
            // Handle any execution exceptions that occurred during the write
            throw new RuntimeException("Failed to save user in Firestore: " + e.getCause().getMessage(), e);
        } catch (Exception e) {
            // Handle any other unexpected exceptions
            throw new RuntimeException("Failed to save user in Firestore: " + e.getMessage(), e);
        }
    }

    public DocumentReference getUserDocReferenceByUserId(String userId) {
        return userCollection.document(userId);
    }

    public UserModel getUserById(String userId) {
        try {
            DocumentReference docRef = userCollection.document(userId);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                return document.toObject(UserModel.class);
            } else {
                return null;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve user from Firestore", e);
        }
    }

    public UserModel getUserByUserId(String userId) throws ExecutionException, InterruptedException {
        DocumentReference userRef = dbFireStore.collection("User").document(userId);

        // Fetch the document snapshot
        ApiFuture<DocumentSnapshot> future = userRef.get();
        DocumentSnapshot document = future.get();

        // If the document exists, return the ArticleModel, otherwise return null
        if (document.exists()) {
            return document.toObject(UserModel.class);
        } else {
            System.out.println("User with ID " + userId + " does not exist.");
            return null;
        }
    }

    public String updateUser(UserModel userModel, String userId) {
        Map<String, Object> updateFields = new HashMap<>();
        updateFields.put("userName", userModel.getUserName());
        updateFields.put("address", userModel.getAddress());
        updateFields.put("phoneNumber", userModel.getPhoneNumber());
        updateFields.put("profilePicUrl", userModel.getProfilePicUrl());

        DocumentReference docRef = dbFireStore.collection("User").document(userId);

        try {
            docRef.update(updateFields).get();
            return "User updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user", e);
        }
    }

}
