package com.cvplatform.storage;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final MinioClient minioClient;
    private final StorageProperties props;

    public String upload(MultipartFile file, String prefix) throws IOException {
        String ext = extractExtension(file.getOriginalFilename());
        String objectName = prefix + "/" + UUID.randomUUID() + ext;
        try (var in = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(props.getBucket())
                    .object(objectName)
                    .stream(in, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception ex) {
            throw new IOException("MinIO upload failed: " + ex.getMessage(), ex);
        }
        return objectName;
    }

    public String presignedDownloadUrl(String objectName, int expirySeconds) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(props.getBucket())
                    .object(objectName)
                    .expiry(expirySeconds, TimeUnit.SECONDS)
                    .build());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate presigned URL", ex);
        }
    }

    public void delete(String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(props.getBucket())
                    .object(objectName)
                    .build());
        } catch (Exception ex) {
            log.warn("Failed to delete object {}: {}", objectName, ex.getMessage());
        }
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot).toLowerCase() : "";
    }
}
