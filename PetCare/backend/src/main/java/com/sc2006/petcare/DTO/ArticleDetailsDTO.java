package com.sc2006.petcare.DTO;

import com.sc2006.petcare.models.UserModel;
import java.util.Date;
import lombok.Data;

@Data
public class ArticleDetailsDTO {
    private String articleId;
    private String articleTitle;
    private String articleBody;
    private String articleCategory;
    private String thumbnailImage;
    private Date publishedTime;
    private UserModel poster;
}