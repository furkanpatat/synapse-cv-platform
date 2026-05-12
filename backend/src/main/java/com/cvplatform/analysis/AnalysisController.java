package com.cvplatform.analysis;

import com.cvplatform.common.ApiException;
import com.cvplatform.subscription.PdfReportService;
import com.cvplatform.subscription.SubscriptionLimits;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/analysis")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final PdfReportService pdfReportService;

    @PostMapping("/start")
    public ResponseEntity<AnalysisReport> start(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analysisService.startAnalysis(user.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<AnalysisReport> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analysisService.getMyLatest(user.getId()));
    }

    @GetMapping(value = "/me/report.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@AuthenticationPrincipal User user) {
        if (!SubscriptionLimits.isPremium(user.getSubscriptionType())) {
            throw new ApiException(
                    org.springframework.http.HttpStatus.PAYMENT_REQUIRED,
                    "QUOTA_EXCEEDED",
                    "PDF rapor indirme PREMIUM özelliğidir. Plan yükseltmen gerekiyor.");
        }
        AnalysisReport report = analysisService.getMyLatest(user.getId());
        byte[] bytes = pdfReportService.buildAnalysisReport(user, report);
        String filename = "synapse-yetkinlik-raporu.pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(bytes);
    }
}
