package com.sc2006.petcare.models;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.annotation.DocumentId;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.cloud.Timestamp;

import lombok.Data;

@Data
public class PetModel {
    @DocumentId
    private String id;
    private String petName;
    private String sex;
    private String breed;
    private double weight;
    private Timestamp dateOfBirth;
    private String medicCondition;
    private String markings;
    private String coatColor;
    @JsonIgnore // Skip serialization for the owner field
    private DocumentReference owner;
    private String petImageUrl;
}