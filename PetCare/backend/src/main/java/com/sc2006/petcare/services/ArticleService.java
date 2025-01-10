package com.sc2006.petcare.services;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.sc2006.petcare.DTO.ArticleDetailsDTO;
import com.sc2006.petcare.DTO.ArticleDetailsInputDTO;
import com.sc2006.petcare.DTO.ArticleDetailsUpdateDTO;
import com.sc2006.petcare.models.ArticleModel;
import com.sc2006.petcare.models.UserModel;
import com.sc2006.petcare.repositories.ArticleRepository;
import com.sc2006.petcare.repositories.UserRepository;

@Service
public class ArticleService {
    @Autowired
    private final ArticleRepository articleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirebaseService firebaseService;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    // public List<ArticleDetailsDTO> getAllArticles() {
    // List<ArticleDetailsDTO> articleDetailsDTOs = new ArrayList<>();
    // List<ArticleModel> articleList = new ArrayList<>();
    // UserModel poster;
    // try {
    // articleList = articleRepository.getAllArticles();
    // if (articleList.isEmpty()) {
    // System.out.println("No articles found in Firestore.");
    // }
    // for (ArticleModel article : articleList) {
    // ArticleDetailsDTO articleDetailsDTO = new ArticleDetailsDTO();
    // articleDetailsDTO.setArticleId(article.getId());
    // articleDetailsDTO.setArticleTitle(article.getArticleTitle());
    // articleDetailsDTO.setArticleBody(article.getArticleBody());
    // articleDetailsDTO.setArticleCategory(article.getArticleCategory());

    // // Convert timestamp to date object
    // Timestamp publishedTimestamp = article.getPublishedTime();
    // Date publishedTime = publishedTimestamp != null ? publishedTimestamp.toDate()
    // : null;
    // articleDetailsDTO.setPublishedTime(publishedTime);

    // articleDetailsDTO.setThumbnailImage(firebaseService.getFileAsBase64(article.getThumbnailImage()));

    // // Fetch the poster details
    // try {
    // ApiFuture<DocumentSnapshot> future = article.getPoster().get();
    // DocumentSnapshot document = future.get();
    // if (document.exists()) {
    // poster = document.toObject(UserModel.class);
    // if (poster != null) {
    // String imageUrl = poster.getProfilePicUrl();
    // if (imageUrl != null && !imageUrl.isEmpty()) {
    // String imageBase64 = firebaseService.getFileAsBase64(imageUrl);
    // poster.setProfilePicUrl(imageBase64);
    // }
    // }
    // articleDetailsDTO.setPoster(poster);
    // } else {
    // System.out.println("Poster document does not exist for article ID: " +
    // article.getId());
    // }
    // } catch (Exception e) {
    // System.err.println(
    // "Error fetching poster for article ID: " + article.getId() + " - " +
    // e.getMessage());
    // e.printStackTrace();
    // }

    // articleDetailsDTOs.add(articleDetailsDTO);
    // }
    // } catch (Exception e) {
    // System.err.println("Error retrieving articles: " + e.getMessage());
    // e.printStackTrace();
    // }
    // return articleDetailsDTOs;
    // }

    public List<ArticleDetailsDTO> getAllArticles() {
        List<ArticleDetailsDTO> articleDetailsDTOs = new ArrayList<>();
        List<ArticleModel> articleList = new ArrayList<>();
        try {
            articleList = articleRepository.getAllArticles();
            if (articleList.isEmpty()) {
                System.out.println("No articles found in Firestore.");
            }
            // Process articles in parallel for better performance
            return articleList.parallelStream().map(article -> {
                ArticleDetailsDTO dto = new ArticleDetailsDTO();
                dto.setArticleId(article.getId());
                dto.setArticleTitle(article.getArticleTitle());
                dto.setArticleBody(article.getArticleBody());
                dto.setArticleCategory(article.getArticleCategory());

                // Convert timestamp to date object
                Timestamp publishedTimestamp = article.getPublishedTime();
                Date publishedTime = publishedTimestamp != null ? publishedTimestamp.toDate() : null;
                dto.setPublishedTime(publishedTime);

                // Set thumbnail URL instead of base64
                dto.setThumbnailImage(firebaseService.getSignedUrlFromFileName(article.getThumbnailImage()));

                // Fetch the poster details
                try {
                    ApiFuture<DocumentSnapshot> future = article.getPoster().get();
                    DocumentSnapshot document = future.get();
                    if (document.exists()) {
                        UserModel poster = document.toObject(UserModel.class);
                        if (poster != null && poster.getProfilePicUrl() != null) {
                            // Set URL instead of base64
                            poster.setProfilePicUrl(
                                    firebaseService.getSignedUrlFromFileName(poster.getProfilePicUrl()));
                        }
                        dto.setPoster(poster);
                    } else {
                        System.out.println("Poster document does not exist for article ID: " + article.getId());
                    }
                } catch (Exception e) {
                    System.err.println(
                            "Error fetching poster for article ID: " + article.getId() + " - " + e.getMessage());
                    e.printStackTrace();
                }

                return dto;
            }).collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error retrieving articles: " + e.getMessage());
            e.printStackTrace();
            return articleDetailsDTOs;
        }

    }

    public ArticleDetailsDTO getArticleByArticleId(String articleId) {
        ArticleDetailsDTO articleDetailsDTO = new ArticleDetailsDTO();
        UserModel poster;

        try {
            // Fetch the article using the provided articleId
            ArticleModel article = articleRepository.getArticleByArticleId(articleId);

            // Check if the article exists
            if (article == null) {
                System.out.println("No article found with ID: " + articleId);
                return articleDetailsDTO; // Return empty DTO instead of null
            }

            // Populate article details
            articleDetailsDTO.setArticleId(article.getId());
            articleDetailsDTO.setArticleTitle(article.getArticleTitle());
            articleDetailsDTO.setArticleBody(article.getArticleBody());
            articleDetailsDTO.setArticleCategory(article.getArticleCategory());

            // Convert timestamp to Date object
            Timestamp publishedTimestamp = article.getPublishedTime();
            Date publishedTime = publishedTimestamp != null ? publishedTimestamp.toDate() : null;
            articleDetailsDTO.setPublishedTime(publishedTime);

            // Retrieve thumbnail image as base64
            articleDetailsDTO.setThumbnailImage(firebaseService.getSignedUrlFromFileName(article.getThumbnailImage()));

            // Fetch the poster details
            try {
                ApiFuture<DocumentSnapshot> future = article.getPoster().get();
                DocumentSnapshot document = future.get();
                if (document.exists()) {
                    poster = document.toObject(UserModel.class);
                    if (poster != null) {
                        String imageUrl = poster.getProfilePicUrl();
                        if (imageUrl != null && !imageUrl.isEmpty()) {
                            String image = firebaseService.getSignedUrlFromFileName(imageUrl);
                            poster.setProfilePicUrl(image);
                        }
                    }
                    articleDetailsDTO.setPoster(poster);
                } else {
                    System.out.println("Poster document does not exist for article ID: " + article.getId());
                }
            } catch (Exception e) {
                System.err.println(
                        "Error fetching poster for article ID: " + article.getId() + " - " + e.getMessage());
                e.printStackTrace();
            }

        } catch (Exception e) {
            System.err.println("Error retrieving article: " + e.getMessage());
            e.printStackTrace();
        }

        return articleDetailsDTO; // Return the DTO (could be empty if no article found)
    }

    public List<ArticleDetailsDTO> getArticleByPosterId(String posterId) {
        List<ArticleDetailsDTO> articleDetailsDTOs = new ArrayList<>();
        UserModel poster;

        try {
            // Fetch articles by posterId
            List<ArticleModel> articleList = articleRepository.getArticleByPosterId(posterId);

            // Loop through each article and populate the DTO
            for (ArticleModel article : articleList) {
                ArticleDetailsDTO articleDetailsDTO = new ArticleDetailsDTO();
                articleDetailsDTO.setArticleId(article.getId());
                articleDetailsDTO.setArticleTitle(article.getArticleTitle());
                articleDetailsDTO.setArticleBody(article.getArticleBody());
                articleDetailsDTO.setArticleCategory(article.getArticleCategory());

                // Convert published time to Date
                Timestamp publishedTimestamp = article.getPublishedTime();
                Date publishedTime = publishedTimestamp != null ? publishedTimestamp.toDate() : null;
                articleDetailsDTO.setPublishedTime(publishedTime);

                articleDetailsDTO
                        .setThumbnailImage(firebaseService.getSignedUrlFromFileName(article.getThumbnailImage()));

                // Fetch the poster details
                try {
                    ApiFuture<DocumentSnapshot> future = article.getPoster().get();
                    DocumentSnapshot document = future.get();
                    if (document.exists()) {
                        poster = document.toObject(UserModel.class);
                        if (poster != null) {
                            String imageUrl = poster.getProfilePicUrl();
                            if (imageUrl != null && !imageUrl.isEmpty()) {
                                String image = firebaseService.getSignedUrlFromFileName(imageUrl);
                                poster.setProfilePicUrl(image);
                            }
                        }
                        articleDetailsDTO.setPoster(poster);
                    } else {
                        System.out.println("Poster document does not exist for article ID: " + article.getId());
                    }
                } catch (Exception e) {
                    System.err.println(
                            "Error fetching poster for article ID: " + article.getId() + " - " + e.getMessage());
                    e.printStackTrace();
                }

                // Add the populated DTO to the list
                articleDetailsDTOs.add(articleDetailsDTO);
            }
        } catch (Exception e) {
            System.err.println("Error retrieving articles by poster ID: " + posterId + " - " + e.getMessage());
            e.printStackTrace();
        }

        return articleDetailsDTOs; // Return the list of DTOs (could be empty if no articles found)
    }

    public String addArticle(ArticleDetailsInputDTO articleDetailsInputDTO) {
        ArticleModel articleModel = new ArticleModel();
        articleModel.setArticleTitle(articleDetailsInputDTO.getArticleTitle());
        articleModel.setArticleBody(articleDetailsInputDTO.getArticleBody());
        articleModel.setArticleCategory(articleDetailsInputDTO.getArticleCategory());

        // Convert date object to times
        Timestamp timestamp = Timestamp.of(articleDetailsInputDTO.getPublishedTime());
        articleModel.setPublishedTime(timestamp);

        // Get user doc refer
        DocumentReference userRef = userRepository.getUserDocReferenceByUserId(articleDetailsInputDTO.getPosterId());
        articleModel.setPoster(userRef);

        // upload image to firebase storage
        String imageURL = "article/" + articleDetailsInputDTO.getThumbnailImage().getOriginalFilename();
        articleModel.setThumbnailImage(imageURL);

        try {
            String res = articleRepository.addArticle(articleModel);
            firebaseService.upload(articleDetailsInputDTO.getThumbnailImage(), imageURL);
            return res;
        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add article due to an unexpected error", e);
        }

        // return articleRepository.addArticle(articleModel);
    }

    public String deleteArticle(String articleId) {
        return articleRepository.deleteArticle(articleId);
    }

    public String editArticle(String articleId, ArticleDetailsUpdateDTO articleDetailsUpdateDTO) {
        ArticleModel articleModel = new ArticleModel();
        articleModel.setArticleTitle(articleDetailsUpdateDTO.getArticleTitle());
        articleModel.setArticleBody(articleDetailsUpdateDTO.getArticleBody());
        articleModel.setArticleCategory(articleDetailsUpdateDTO.getArticleCategory());

        // upload image to firebase storage
        String imageURL = "article/" + articleDetailsUpdateDTO.getThumbnailImage().getOriginalFilename();

        try {
            firebaseService.upload(articleDetailsUpdateDTO.getThumbnailImage(), imageURL);
            articleModel.setThumbnailImage(imageURL);
        } catch (Exception e) {
            // Handle other unexpected exceptions
            throw new RuntimeException("Failed to add article due to an unexpected error", e);
        }
        return articleRepository.editArticle(articleModel, articleId);
    }

}
