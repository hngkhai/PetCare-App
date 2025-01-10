package com.sc2006.petcare.models;

import lombok.Data;
import java.util.List;
import java.util.Date;

import com.google.cloud.firestore.DocumentReference;

import com.sc2006.petcare.DTO.PlaceOpeningHoursDTO;

@Data
public class PetcareAmenityModel {
    private String amenityId;
    private String amenityName;
    private boolean openNow;
    private List<PlaceOpeningHoursDTO> openingHours;
    private String contactNumber;
    private String websiteURL;
    private double rating;
    private String photo;
    private DocumentReference location;
    private Date timestamp;
}