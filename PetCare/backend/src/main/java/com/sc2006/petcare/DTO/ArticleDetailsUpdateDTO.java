package com.sc2006.petcare.DTO;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class ArticleDetailsUpdateDTO {
    // private String articleId;
    private String articleTitle;
    private String articleBody;
    private String articleCategory;
    private MultipartFile thumbnailImage;
    // private String thumbnailImage;
    // @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    // private Date publishedTime;
    // private String posterId;
}