package com.sc2006.petcare.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.sc2006.petcare.DTO.PetDetailsDTO;
import com.sc2006.petcare.DTO.PetDetailsInputDTO;
import com.sc2006.petcare.DTO.PetDetailsUpdateDTO;
import com.sc2006.petcare.services.PetService;

@CrossOrigin(origins = "http://10.91.144.154:8080")
@RestController
@RequestMapping(value = "api/pet")
public class PetController {
    @Autowired
    PetService petService;

    @RequestMapping(value = "/getPetsByUserId/{userId}", method = RequestMethod.GET, produces = "application/json")
    public List<PetDetailsDTO> getPetsByUserId(@PathVariable(value = "userId") String userId) {
        return petService.getPetsByUserId(userId);
    }

    @PostMapping(value = "/addPet", consumes = { "multipart/form-data" })
    public String addPet(@ModelAttribute PetDetailsInputDTO petDetailsInputDTO) {
        return petService.addPet(petDetailsInputDTO);
    }

    @RequestMapping(value = "/updatePet", method = RequestMethod.PUT, produces = "application/json")
    public String updatePet(@RequestBody PetDetailsUpdateDTO petDetailsUpdateDTO) {
        System.out.println("controller");
        return petService.updatePet(petDetailsUpdateDTO);
    }

    @RequestMapping(value = "/deletePet/{petId}", method = RequestMethod.DELETE, produces = "application/json")
    public String deletePet(@PathVariable(value = "petId") String petId) {
        return petService.deletePet(petId);
    }
}
