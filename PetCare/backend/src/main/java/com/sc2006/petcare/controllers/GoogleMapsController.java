package com.sc2006.petcare.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sc2006.petcare.DTO.PlaceDetailsDTO;
import com.sc2006.petcare.services.GoogleMapsService;

@CrossOrigin(origins = "http://10.91.144.154:8081")
@RestController
@RequestMapping(value = "api/googlemaps")
public class GoogleMapsController {
    @Autowired
    private GoogleMapsService googleMapsService;

    @RequestMapping(value = "/getNearbyByTypes", method = RequestMethod.GET, produces = "application/json")
    public List<PlaceDetailsDTO> getNearbyPetCareByTypes(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "1000") int radius,
            @RequestParam(defaultValue = "veterinary_care") List<String> type) {
        try {
            return googleMapsService.searchNearbyPetCare(latitude, longitude, radius, type);
        } catch (Exception e) {
            System.err.println("Error occurred while fetching nearby pet care: " + e.getMessage());
            return new ArrayList<>(); // Return empty list in case of error
        }
    }

    @RequestMapping(value = "/filterLocations", method = RequestMethod.GET, produces = "application/json")
    public List<String> filterLocations(
            @RequestParam List<String> placeIds,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String openNow) {
        try {
            return googleMapsService.filterLocations(placeIds, minRating, openNow);
        } catch (Exception e) {
            System.err.println("Error occurred while filtering nearby pet care: " + e.getMessage());
            return new ArrayList<>(); // Return empty list in case of error
        }
    }

    @RequestMapping(value = "/searchLocationByKeyword", method = RequestMethod.GET, produces = "application/json")
    public List<PlaceDetailsDTO> searchLocationByKeyword(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "50000") int radius,
            @RequestParam String keyword,
            @RequestParam List<String> types) {
        try {
            return googleMapsService.searchLocationByKeyword(latitude, longitude, radius, keyword, types);
        } catch (Exception e) {
            System.err.println("Error occurred while searching for a location: " + e.getMessage());
            return new ArrayList<>(); // Return empty list in case of error
        }
    }
}
