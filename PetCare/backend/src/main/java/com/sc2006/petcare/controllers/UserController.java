package com.sc2006.petcare.controllers;

import com.sc2006.petcare.DTO.ResetPasswordRequestDTO;
import com.sc2006.petcare.DTO.UserDetailsDTO;
import com.sc2006.petcare.DTO.UserDetailsUpdateDTO;
import com.sc2006.petcare.services.UserService;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserDetailsDTO userDTO) {
        try {
            String message = userService.registerUser(userDTO);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String> loginUser(@RequestBody Map<String, String> loginRequest) {
        String idToken = loginRequest.get("idToken"); // Expecting the client to send the ID token

        // Call the login service method
        String message = userService.loginUser(idToken);
        if (message.startsWith("Login successful")) {
            return ResponseEntity.ok(message); // Success response
        } else {
            return ResponseEntity.badRequest().body(message); // Error response
        }
    }

    @RequestMapping(value = "/getUserByUserId/{userId}", method = RequestMethod.GET, produces = "application/json")
    public UserDetailsDTO getUserByUserId(@PathVariable(value = "userId") String userId) {
        return userService.getUserByUserId(userId);
    }

    @PutMapping(value = "/updateUserDetails/{userId}", consumes = { "multipart/form-data" })
    public String updateUser(@PathVariable String userId,
            @ModelAttribute UserDetailsUpdateDTO articleDetailsUpdateDTO) {
        return userService.updateUser(articleDetailsUpdateDTO, userId);
    }

    // @PutMapping(value = "/updateUserDetails", produces = "application/json")
    // public String updateUser(@RequestBody UserDetailsUpdateDTO
    // userDetailsUpdateDTO) {
    // return userService.updateUser(userDetailsUpdateDTO);
    // }

    @PostMapping("/send-reset-password")
    public ResponseEntity<?> sendResetPasswordEmail(@RequestBody ResetPasswordRequestDTO resetPasswordRequest) {
        try {
            userService.sendPasswordResetEmail(resetPasswordRequest.getEmail());
            return ResponseEntity.ok("Reset password email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error sending reset password email: " + e.getMessage());
        }
    }

}
