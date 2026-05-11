package com.cvplatform.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
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

    /**
     * Runs after the full context is up (DataSource, etc. ready) so failures here
     * don't get swallowed by bean-init ordering issues like @PostConstruct does.
     */
    @Bean
    public ApplicationRunner minioBucketInitializer(MinioClient client) {
        return args -> {
            try {
                boolean exists = client.bucketExists(
                        BucketExistsArgs.builder().bucket(props.getBucket()).build());
                if (exists) {
                    log.info("MinIO bucket already exists: {}", props.getBucket());
                } else {
                    client.makeBucket(MakeBucketArgs.builder().bucket(props.getBucket()).build());
                    log.info("Created MinIO bucket: {}", props.getBucket());
                }
            } catch (Exception ex) {
                log.error("MinIO bucket initialization failed for '{}' at {}: {}",
                        props.getBucket(), props.getEndpoint(), ex.toString(), ex);
            }
        };
    }
}
