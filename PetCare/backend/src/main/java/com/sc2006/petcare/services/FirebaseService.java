package com.sc2006.petcare.services;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.Storage;
import com.google.firebase.cloud.StorageClient;

@Service
public class FirebaseService {
    @Autowired
    private Storage storage; // Inject the Storage bean

    public String upload(MultipartFile imageFile, String fileName) {
        try (InputStream inputStream = imageFile.getInputStream()) {
            String contentType = imageFile.getContentType();
            Bucket bucket = StorageClient.getInstance().bucket();
            bucket.create(fileName, inputStream, contentType);

            // Return the URL of the uploaded file
            return String.format("https://storage.googleapis.com/%s/%s", bucket.getName(), fileName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image to Firebase Storage", e);
        }
    }

    public String getFileAsBase64(String fileName) {
        System.out.println("Attempting to retrieve file from path: " + fileName);
        try {
            Bucket bucket = StorageClient.getInstance().bucket();

            Blob blob = bucket.get(fileName);
            if (blob == null) {
                throw new RuntimeException("File not found: " + fileName);
            }

            byte[] content = blob.getContent();

            return Base64.getEncoder().encodeToString(content);
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve file from Firebase Storage", e);
        }
    }

    public String getSignedUrlFromFileName(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }

        try {
            String bucketName = StorageClient.getInstance().bucket().getName();
            BlobId blobId = BlobId.of(bucketName, fileName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).build();

            return storage.signUrl(
                    blobInfo,
                    7,
                    TimeUnit.DAYS,
                    Storage.SignUrlOption.withV4Signature())
                    .toString();
        } catch (Exception e) {
            System.err.println("Error generating signed URL for " + fileName + ": " + e.getMessage());
            return null;
        }
    }
}
