package com.sc2006.petcare.DTO;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import lombok.Data;

@Data
public class PetDetailsUpdateDTO {
    private String petId;
    private String petName;
    private String sex;
    private String breed;
    private double weight;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private Date dateOfBirth;
    private String medicCondition;
    private String markings;
    private String coatColor;
    // private MultipartFile petImage;
    private String ownerId;
    private String petImageUrl;
}