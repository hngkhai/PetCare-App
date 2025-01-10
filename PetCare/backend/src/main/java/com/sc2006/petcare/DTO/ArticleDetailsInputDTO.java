package com.sc2006.petcare.DTO;

import java.util.Date;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class ArticleDetailsInputDTO {
    // private String articleId;
    private String articleTitle;
    private String articleBody;
    private String articleCategory;
    private MultipartFile thumbnailImage;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private Date publishedTime;
    private String posterId;
}