package com.cvplatform.user;

import com.cvplatform.auth.dto.MeResponse;
import com.cvplatform.common.ApiException;
import com.cvplatform.storage.StorageService;
import com.cvplatform.user.dto.ProfileUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

    private final UserRepository userRepository;
    private final StorageService storageService;

    @PutMapping("/me/profile")
    public ResponseEntity<MeResponse> updateProfile(@AuthenticationPrincipal User user,
                                                    @Valid @RequestBody ProfileUpdateRequest req) {
        User managed = userRepository.findById(user.getId()).orElseThrow();
        if (req.firstName() != null) managed.setFirstName(req.firstName());
        if (req.lastName() != null) managed.setLastName(req.lastName());
        if (req.city() != null) managed.setCity(req.city());
        if (req.title() != null) managed.setTitle(req.title());
        if (req.bio() != null) managed.setBio(req.bio());
        if (req.githubUrl() != null) managed.setGithubUrl(req.githubUrl());
        if (req.linkedinUrl() != null) managed.setLinkedinUrl(req.linkedinUrl());
        managed = userRepository.save(managed);
        return ResponseEntity.ok(toMe(managed));
    }

    /**
     * Multipart avatar upload. We store the object in MinIO under
     * {@code avatars/<uuid>.<ext>} and persist a presigned download URL
     * on the user. Presigned URLs expire (7 days here) so we regenerate
     * on each call to {@code /v1/auth/me} when we add a refresh step —
     * for now we accept the trade-off: the avatar will need re-upload if
     * the URL expires while the user keeps the same record.
     *
     * Validation:
     *  - mime type must be a known image format
     *  - size <= 5 MB
     *  - filename ignored (we generate our own)
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MeResponse> uploadAvatar(@AuthenticationPrincipal User user,
                                                    @RequestPart("file") MultipartFile file)
            throws IOException {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("AVATAR_EMPTY", "Dosya boş");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_AVATAR_TYPES.contains(contentType.toLowerCase())) {
            throw ApiException.badRequest("AVATAR_BAD_TYPE",
                    "Sadece resim dosyaları (jpg, png, webp, gif) yüklenebilir");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw ApiException.badRequest("AVATAR_TOO_LARGE",
                    "Dosya 5 MB'tan büyük olamaz");
        }

        // Upload to MinIO, get back the stored object name.
        String objectName = storageService.upload(file, "avatars");
        // 7-day presigned URL — long enough for normal sessions, short
        // enough to not be useful as a leaked credential indefinitely.
        String url = storageService.presignedDownloadUrl(objectName, 7 * 24 * 3600);

        User managed = userRepository.findById(user.getId()).orElseThrow();
        managed.setAvatarUrl(url);
        managed = userRepository.save(managed);
        log.info("Avatar updated for user {}", managed.getEmail());
        return ResponseEntity.ok(toMe(managed));
    }

    /** Clear the avatar. */
    @DeleteMapping("/me/avatar")
    public ResponseEntity<MeResponse> removeAvatar(@AuthenticationPrincipal User user) {
        User managed = userRepository.findById(user.getId()).orElseThrow();
        managed.setAvatarUrl(null);
        managed = userRepository.save(managed);
        return ResponseEntity.ok(toMe(managed));
    }

    private static MeResponse toMe(User u) {
        return new MeResponse(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
                u.getRole(), u.getSubscriptionType(), u.isEmailVerified(),
                u.getCity(), u.getTitle(), u.getBio(),
                u.getGithubUrl(), u.getLinkedinUrl(), u.getAvatarUrl()
        );
    }
}
