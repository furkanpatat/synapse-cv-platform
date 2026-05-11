package com.cvplatform.user;

import com.cvplatform.auth.dto.MeResponse;
import com.cvplatform.user.dto.ProfileUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

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
        return ResponseEntity.ok(new MeResponse(
                managed.getId(), managed.getEmail(), managed.getFirstName(), managed.getLastName(),
                managed.getRole(), managed.getSubscriptionType(), managed.isEmailVerified(),
                managed.getCity(), managed.getTitle(), managed.getBio(),
                managed.getGithubUrl(), managed.getLinkedinUrl()
        ));
    }
}
