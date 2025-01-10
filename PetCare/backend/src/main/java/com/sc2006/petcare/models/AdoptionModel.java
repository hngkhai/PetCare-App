package com.sc2006.petcare.models;

import com.google.cloud.firestore.annotation.DocumentId;

import java.util.List;
import lombok.Data;

@Data
public class AdoptionModel extends PetModel{
    @DocumentId
    private String adpPetId;
    private String age;
    private String type;
    private String description;
    private List<String> imagesList;
    private String adptName;
    private String adptNumber;
    private String adptEmail;
  
}
