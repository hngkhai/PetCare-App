package com.sc2006.petcare.DTO;

import lombok.Data;
import java.util.List;

import com.google.cloud.firestore.DocumentReference;

@Data
public class PetcareAmenityResultDTO {
    private String amenityId;
    private String amenityName;
    private boolean openNow;
    private List<PlaceOpeningHoursDTO> openingHours;
    private String contactNumber;
    private String websiteURL;
    private double rating;
    private String photo;
    private DocumentReference location;
}
