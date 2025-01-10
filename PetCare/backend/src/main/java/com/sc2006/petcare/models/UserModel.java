package com.sc2006.petcare.models;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.Data;

@Data
public class UserModel {
    @DocumentId
    private String id; // Firestore document ID
    private String userName;
    private String email;
    private String address;
    private int phoneNumber;
    private String status;
    private String profilePicUrl; // Profile picture URL stored in Firestore
}
