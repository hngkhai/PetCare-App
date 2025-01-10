package com.sc2006.petcare.DTO;
import java.util.List;

import lombok.Data;

@Data
public class PlaceDetailsDTO {
    private String id;
    private String name;
    private double rating;
    private String photoBase64;
    private boolean openNow;
    private String vicinity;
    private double latitude;
    private double longitude;
    private String phoneNumber;
    private String website;
    private List<PlaceOpeningHoursDTO> openingHours;

    public PlaceDetailsDTO(String id, String name, double rating, String photoBase64, boolean openNow, String vicinity, double latitude, double longitude, String phoneNumber, String website, List<PlaceOpeningHoursDTO> openingHours) {
        this.id = id;
        this.name = name;
        this.rating = rating;
        this.photoBase64 = photoBase64;
        this.openNow = openNow;
        this.vicinity = vicinity;
        this.latitude = latitude;
        this.longitude = longitude;
        this.phoneNumber = phoneNumber;
        this.website = website;
        this.openingHours = openingHours;
    }
}