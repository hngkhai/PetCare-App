package com.sc2006.petcare.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.sc2006.petcare.DTO.SightingDTO;
import com.sc2006.petcare.DTO.SightingInputDTO;
import com.sc2006.petcare.services.SightingService;

@CrossOrigin(origins = "http://10.91.144.154:8080")
@RestController
@RequestMapping(value = "api/sighting")
public class SightingController {
    @Autowired
    SightingService sightingService;

    @RequestMapping(value = "/getAllSightings", method = RequestMethod.GET, produces = "application/json")
    public List<SightingDTO> getAllSightings() {
        return sightingService.getAllSightings();
    }

    @PostMapping(value = "/addSighting", consumes = { "multipart/form-data" })
    public String addSighting(@ModelAttribute SightingInputDTO sightingInputDTO) {
        return sightingService.addSighting(sightingInputDTO);
    }

}
