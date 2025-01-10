package com.sc2006.petcare.DTO;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class AdoptionDetailsDTO extends PetDetailsInputDTO{
    private String id;
    private String age;
    private String type;
    private String description;
    private List<MultipartFile> images;
    private String adptName;
    private String adptNumber;
    private String adptEmail;
}
