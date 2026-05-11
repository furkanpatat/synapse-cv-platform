package com.cvplatform.cv;

import com.cvplatform.cv.dto.CvResponse;
import com.cvplatform.cv.dto.CvUpdateRequest;
import com.cvplatform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/cv")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class CvController {

    private final CvService cvService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<CvResponse> upload(@AuthenticationPrincipal User user,
                                             @RequestParam("file") MultipartFile file) {
        CvDocument doc = cvService.uploadAndParse(user.getId(), file);
        return ResponseEntity.ok(CvResponse.from(doc, cvService.getDownloadUrl(doc)));
    }

    @GetMapping("/me")
    public ResponseEntity<CvResponse> getMyCv(@AuthenticationPrincipal User user) {
        CvDocument doc = cvService.getMyCv(user.getId());
        return ResponseEntity.ok(CvResponse.from(doc, cvService.getDownloadUrl(doc)));
    }

    @PutMapping("/me")
    public ResponseEntity<CvResponse> updateMyCv(@AuthenticationPrincipal User user,
                                                 @Valid @RequestBody CvUpdateRequest req) {
        CvDocument doc = cvService.updateMyCv(user.getId(), req);
        return ResponseEntity.ok(CvResponse.from(doc, cvService.getDownloadUrl(doc)));
    }
}
