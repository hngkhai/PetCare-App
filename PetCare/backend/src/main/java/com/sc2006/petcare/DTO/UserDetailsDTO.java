package com.sc2006.petcare.DTO;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class UserDetailsDTO {
    private String id; // For Firestore document ID
    private String userName;
    private String email;
    private String password;
    private String address;
    private int phoneNumber;
    private String status;
    private String profilePicUrl; // Should be a URL, not a MultipartFile
}
