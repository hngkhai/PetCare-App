package com.sc2006.petcare.DTO;

import java.util.Date;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class SightingInputDTO {
    private String sightingId;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Date sightingDateTime;
    private String sightingDescription;
    private MultipartFile sightingImage;

    private double latitude; // For latitude
    private double longitude; // For longitude
    // private GeoPoint sightingLocation;

    private String missingId;
    private String reporterId;
}
