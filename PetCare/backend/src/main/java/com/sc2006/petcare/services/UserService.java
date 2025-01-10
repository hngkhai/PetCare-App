package com.sc2006.petcare.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.google.cloud.firestore.DocumentReference;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.sc2006.petcare.DTO.UserDetailsDTO;
import com.sc2006.petcare.DTO.UserDetailsUpdateDTO;
import com.sc2006.petcare.models.UserModel;
import com.sc2006.petcare.repositories.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private FirebaseService firebaseService;

    public String registerUser(UserDetailsDTO userDTO) {
        // Check if the email is already used
        try {
            // Try to get the user by email
            UserRecord existingUser = FirebaseAuth.getInstance().getUserByEmail(userDTO.getEmail());
            if (existingUser != null) {
                // Return a message if the email is already in use
                return "Email already in use.";
            }
        } catch (FirebaseAuthException e) {
            // If the user does not exist, FirebaseAuthException will be thrown
            // This is expected if the email is not already used, so we do nothing here
        }

        // Register user in Firebase Authentication
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(userDTO.getEmail())
                .setPassword(userDTO.getPassword())
                .setDisplayName(userDTO.getUserName());

        try {
            // Create user in Firebase Authentication
            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
            System.out.println("User created: " + userRecord.getUid());

            // Prepare user data for Firestore
            UserModel user = new UserModel();
            user.setId(userRecord.getUid());
            user.setEmail(userDTO.getEmail());
            user.setUserName(userDTO.getUserName());
            user.setAddress(userDTO.getAddress());
            user.setPhoneNumber(userDTO.getPhoneNumber());
            user.setStatus(userDTO.getStatus());
            user.setProfilePicUrl("default-profile-pic-url");
            // Store user data in Firestore
            DocumentReference userDocRef = userRepository.saveUser(user);
            UserModel savedUser = userRepository.getUserById(user.getId());
            if (savedUser == null) {
                throw new RuntimeException("User was not saved to Firestore");
            }

            return "User registered successfully";
            // return savedUser;
        }
        // catch (FirebaseAuthException e) {
        // // Check if the error is related to password requirements
        // if (e.getErrorCode().equals("INVALID_PASSWORD")) {
        // return "Password invalid. Please meet the password requirements.";
        // }

        // }
        // catch (FirebaseAuthException e) {
        // System.out.println("Error creating user: " + e.getMessage());
        // throw new RuntimeException("User registration failed: " + e.getMessage(), e);
        // }
        catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("User registration failed: " + e.getMessage(), e);
        }
    }

    public String loginUser(String idToken) {
        try {
            // Verify the ID token from the client
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();

            // Retrieve user details from Firestore if needed
            UserModel user = userRepository.getUserById(uid);
            if (user != null) {
                return "Login successful for user: " + user.getUserName();
            } else {
                // Log the error internally
                System.out.println("Error: User not found for UID: " + uid);
                // Return a generic error message to the frontend
                return "Login failed. Please try again.";
            }
        } catch (FirebaseAuthException e) {
            // Log the error internally
            System.out.println("FirebaseAuthException: " + e.getMessage());
            // Return a generic error message
            return "Login failed. Please try again.";
        } catch (Exception e) {
            // Log any other exceptions internally
            e.printStackTrace();
            // Return a generic error message
            return "Login failed. Please try again.";
        }
    }

    public UserDetailsDTO getUserByUserId(String userId) {
        UserDetailsDTO userDetailsDTO = new UserDetailsDTO();
        // UserModel poster;

        try {
            // Fetch the user using the provided userId
            UserModel user = userRepository.getUserByUserId(userId);

            // Check if the user exists
            if (user == null) {
                System.out.println("No user found with ID: " + userId);
                return userDetailsDTO; // Return empty DTO instead of null
            }

            // Populate user details
            userDetailsDTO.setId(user.getId());
            userDetailsDTO.setEmail(user.getEmail());
            userDetailsDTO.setUserName(user.getUserName());
            userDetailsDTO.setAddress(user.getAddress());
            userDetailsDTO.setPhoneNumber(user.getPhoneNumber());
            userDetailsDTO.setProfilePicUrl(firebaseService.getSignedUrlFromFileName(user.getProfilePicUrl()));
            userDetailsDTO.setStatus(user.getStatus());
        } catch (Exception e) {
            System.err.println("Error retrieving user details: " + e.getMessage());
            e.printStackTrace();
        }

        return userDetailsDTO; // Return the DTO (could be empty if no user found)
    }

    public String updateUser(UserDetailsUpdateDTO userDetailsUpdateDTO, String userId) {
        // Validate the ID
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("'id' must be a non-empty string");
        }

        UserModel userModel = new UserModel();
        userModel.setUserName(userDetailsUpdateDTO.getUserName());
        userModel.setAddress(userDetailsUpdateDTO.getAddress());
        userModel.setPhoneNumber(userDetailsUpdateDTO.getPhoneNumber());

        // Handle profile picture upload
        String imageURL = "user/" + userDetailsUpdateDTO.getProfilePicUrl().getOriginalFilename();

        try {
            firebaseService.upload(userDetailsUpdateDTO.getProfilePicUrl(), imageURL);
            userModel.setProfilePicUrl(imageURL);
        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add user details due to an unexpected error", e);
        }

        // Update the user in Firestore
        return userRepository.updateUser(userModel, userId); // Call the repository to update Firestore
    }

    public void sendPasswordResetEmail(String email) throws FirebaseAuthException {
        FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();
        String resetPasswordLink = firebaseAuth.generatePasswordResetLink(email);

        // Send the email with the reset password link
        sendEmailWithResetLink(email, resetPasswordLink);
    }

    private void sendEmailWithResetLink(String email, String resetPasswordLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset Request");
        message.setText("To reset your password, click the following link: " + resetPasswordLink);

        mailSender.send(message);
        System.out.println("Reset password link sent to: " + email);
    }

}
