package com.sc2006.petcare.models;

import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Data;

@Data
public class LocationModel {
    @DocumentId
    private String locationId;
    private double locationLatitude;
    private double locationLongitude;
    private String locationAddress;
}
