package com.sc2006.petcare.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.GeoPoint;
import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Data;

@Data
public class SightingModel {
    @DocumentId
    private String id;
    private String sightingDescription;
    private String sightingImage;
    private GeoPoint sightingLocation;
    private Timestamp sightingDateTime;

    @JsonIgnore // Skip serialization for the reporterContact field
    private DocumentReference reporterContact;

    @JsonIgnore // Skip serialization for the reporterContact field
    private DocumentReference missingPet;
}
