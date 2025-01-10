package com.sc2006.petcare.models;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.GeoPoint;
import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Data;

@Data
public class MissingPetModel {
    @DocumentId
    private String id;
    private boolean active;
    private Timestamp lastSeenDateTime;
    private Timestamp publishedTime;

    private String lastSeenImage;
    private String lastSeenDescription;
    private GeoPoint lastSeenLocation;

    @JsonIgnore
    private DocumentReference missingPet;
    private DocumentReference owner;
    private List<DocumentReference> sightingList;
}
