package com.cvplatform.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
@RequiredArgsConstructor
@Slf4j
public class StorageConfig {

    private final StorageProperties props;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();
    }

    @PostConstruct
    public void ensureBucket() {
        try {
            MinioClient client = minioClient();
            boolean exists = client.bucketExists(
                    BucketExistsArgs.builder().bucket(props.getBucket()).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(props.getBucket()).build());
                log.info("Created MinIO bucket: {}", props.getBucket());
            }
        } catch (Exception ex) {
            log.warn("Could not ensure MinIO bucket exists: {}", ex.getMessage());
        }
    }
}
