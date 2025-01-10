package com.sc2006.petcare.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.annotation.DocumentId;
import lombok.Data;

@Data
public class ArticleModel {
    @DocumentId
    private String id;
    private String articleTitle;
    private String articleBody;
    private String articleCategory;
    private String thumbnailImage;
    private Timestamp publishedTime;
    @JsonIgnore // Skip serialization for the poster field
    private DocumentReference poster;
}