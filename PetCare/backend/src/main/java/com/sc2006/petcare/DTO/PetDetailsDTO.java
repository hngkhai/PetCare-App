package com.sc2006.petcare.DTO;

import java.util.Date;
import lombok.Data;

@Data
public class PetDetailsDTO {
    private String id;
    private String petName;
    private String sex;
    private String breed;
    private double weight;
    private Date dateOfBirth;
    private String medicCondition;
    private String markings;
    private String coatColor;
    private String petImage;
    private String ownerId;
    private String petImageUrl;
}