package com.sc2006.petcare.repositories;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.sc2006.petcare.models.ArticleModel;

@Repository
public class ArticleRepository {
    private final Firestore dbFireStore;
    private final CollectionReference articleCollection;

    @Autowired
    public ArticleRepository(Firestore dbFireStore) {
        this.dbFireStore = dbFireStore;
        this.articleCollection = dbFireStore.collection("Article");
    }

    public List<ArticleModel> getAllArticles() throws Exception {
        ApiFuture<QuerySnapshot> future = articleCollection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<ArticleModel> articleList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            ArticleModel article = document.toObject(ArticleModel.class);
            articleList.add(article);
        }
        return articleList;
    }

    public ArticleModel getArticleByArticleId(String articleId) throws ExecutionException, InterruptedException {
        // Get the DocumentReference for the article by its ID
        DocumentReference articleRef = dbFireStore.collection("Article").document(articleId);

        // Fetch the document snapshot
        ApiFuture<DocumentSnapshot> future = articleRef.get();
        DocumentSnapshot document = future.get();

        // If the document exists, return the ArticleModel, otherwise return null
        if (document.exists()) {
            return document.toObject(ArticleModel.class);
        } else {
            System.out.println("Article with ID " + articleId + " does not exist.");
            return null;
        }
    }

    public List<ArticleModel> getArticleByPosterId(String posterId) throws ExecutionException, InterruptedException {
        // Get the DocumentReference for the owner
        DocumentReference posterRef = dbFireStore.collection("User").document(posterId);
        // Query Article collection where the poster field matches the posterRef
        ApiFuture<QuerySnapshot> future = articleCollection.whereEqualTo("poster", posterRef).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<ArticleModel> articleList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            ArticleModel article = document.toObject(ArticleModel.class);
            articleList.add(article);
        }
        return articleList;
    }

    public String addArticle(ArticleModel articleModel) {
        DocumentReference articleRef = dbFireStore.collection("Article").document();
        try {
            ApiFuture<WriteResult> future = articleRef.set(articleModel);
            future.get(); // Throws an exception if the operation fails
            return "Added successfully";
        } catch (Exception e) {
            return "Error adding article: " + e.getMessage();
        }
    }

    public String editArticle(ArticleModel articleModel, String articleId) {
        System.out.println(articleModel);
        // Convert ArticleModel to a Map and remove null fields
        Map<String, Object> updateFields = new HashMap<>();
        // values that changed
        updateFields.put("articleTitle", articleModel.getArticleTitle());

        updateFields.put("articleCategory", articleModel.getArticleCategory());
        updateFields.put("articleBody", articleModel.getArticleBody());
        updateFields.put("thumbnailImage", articleModel.getThumbnailImage());

        // Get Firestore document reference and update fields
        DocumentReference docRef = dbFireStore.collection("Article").document(articleId);
        try {
            docRef.update(updateFields).get();
            return "Article updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update article", e);
        }
    }

    public String deleteArticle(String articleId) {
        try {
            dbFireStore.collection("Article").document(articleId).delete();
            return "Deleted successfully";
        } catch (Exception e) {
            return "Error deleting Article" + e.getMessage();
        }
    }
}
