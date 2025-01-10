package com.sc2006.petcare.DTO;

import java.util.Date;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class MissingPetInputDTO {
    private String id;
    private boolean active;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Date lastSeenDateTime;

    private String lastSeenDescription;
    private MultipartFile lastSeenImage;

    private double latitude; // For latitude
    private double longitude; // For longitude

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Date publishedTime;

    private String petId;
    private String ownerId;
    private List<String> sightingId;
}
