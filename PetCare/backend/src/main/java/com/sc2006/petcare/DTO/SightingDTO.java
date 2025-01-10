package com.sc2006.petcare.DTO;

import java.util.Date;

import com.google.cloud.firestore.GeoPoint;
import com.sc2006.petcare.models.UserModel;

import lombok.Data;

@Data
public class SightingDTO {
    private String sightingId;
    private Date sightingDateTime;
    private String sightingDescription;
    private String sightingImage;
    private GeoPoint sightingLocation;

    private UserModel reporterContact;
}
