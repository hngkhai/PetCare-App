package com.sc2006.petcare.DTO;

import org.springframework.web.multipart.MultipartFile;
import lombok.Data;

@Data
public class UserDetailsUpdateDTO {
    private String id; // Firestore document ID
    private String userName;
    private String email;
    private String address;
    private int phoneNumber;
    private String status;
    private MultipartFile profilePicUrl; // File upload for profile picture
}
