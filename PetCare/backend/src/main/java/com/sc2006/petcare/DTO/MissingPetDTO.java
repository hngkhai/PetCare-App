package com.sc2006.petcare.DTO;

import java.util.Date;
import java.util.List;

import com.google.cloud.firestore.GeoPoint;
import com.sc2006.petcare.models.PetModel;
import com.sc2006.petcare.models.SightingModel;
import com.sc2006.petcare.models.UserModel;

import lombok.Data;

@Data
public class MissingPetDTO {
    private String id;
    private boolean active;
    private Date lastSeenDateTime;
    private String lastSeenDescription;
    private GeoPoint lastSeenLocation;
    private String lastSeenImage;

    private Date publishedTime;
    private PetModel missingPet;
    private UserModel owner;
    private List<SightingModel> sightingList;
}
