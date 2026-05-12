package com.cvplatform.subscription;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.user.User;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfReportService {

    private static final Color BRAND = new Color(0x3b, 0x82, 0xf6);
    private static final Color TEXT = new Color(0x14, 0x15, 0x1a);
    private static final Color MUTED = new Color(0x6b, 0x71, 0x80);

    public byte[] buildAnalysisReport(User user, AnalysisReport report) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 48, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Brand header
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BRAND);
            Paragraph brand = new Paragraph("SYNAPSE", brandFont);
            brand.setSpacingAfter(2);
            doc.add(brand);

            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, MUTED);
            doc.add(new Paragraph("AI Yetkinlik Doğrulama Raporu", subFont));
            doc.add(new Paragraph(" "));

            // Title
            Font h1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, TEXT);
            String name = trim((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                    + (user.getLastName() == null ? "" : user.getLastName()));
            doc.add(new Paragraph(name.isEmpty() ? user.getEmail() : name, h1));

            Font meta = FontFactory.getFont(FontFactory.HELVETICA, 10, MUTED);
            String generated = report.getCreatedAt() == null ? "—" :
                    DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("tr", "TR"))
                            .withZone(ZoneId.systemDefault())
                            .format(report.getCreatedAt());
            doc.add(new Paragraph(user.getEmail() + "  •  " + generated, meta));
            doc.add(new Paragraph(" "));

            // Overall score block
            Font scoreFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 56, BRAND);
            Paragraph score = new Paragraph(
                    (report.getOverallScore() == null ? 0 : report.getOverallScore()) + "/100",
                    scoreFont);
            score.setSpacingBefore(6);
            score.setSpacingAfter(0);
            doc.add(score);

            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);
            doc.add(new Paragraph("GENEL YETKİNLİK SKORU", labelFont));
            doc.add(new Paragraph(" "));

            // GitHub summary
            if (report.getGithub() != null) {
                addSection(doc, "GitHub Profili");
                var g = report.getGithub();
                addKv(doc, "Kullanıcı adı", "@" + report.getGithubUsername());
                addKv(doc, "Public repo", String.valueOf(g.getPublicRepos() == null ? 0 : g.getPublicRepos()));
                addKv(doc, "Toplam yıldız", String.valueOf(g.getTotalStars() == null ? 0 : g.getTotalStars()));
                if (g.getLastActivityAt() != null) {
                    addKv(doc, "Son aktivite", g.getLastActivityAt().substring(0, 10));
                }
                doc.add(new Paragraph(" "));
            }

            // AI summary
            if (report.getSummary() != null && !report.getSummary().isBlank()) {
                addSection(doc, "AI Özeti");
                Font body = FontFactory.getFont(FontFactory.HELVETICA, 11, TEXT);
                Paragraph p = new Paragraph(report.getSummary(), body);
                p.setSpacingAfter(8);
                p.setMultipliedLeading(1.5f);
                doc.add(p);
            }

            // Skills table
            if (report.getSkillScores() != null && !report.getSkillScores().isEmpty()) {
                addSection(doc, "Yetkinlik Dökümü");
                PdfPTable table = new PdfPTable(new float[] { 3, 1, 1.5f });
                table.setWidthPercentage(100);
                table.setSpacingBefore(6);
                table.setSpacingAfter(10);
                addHeaderCell(table, "Yetkinlik");
                addHeaderCell(table, "Skor");
                addHeaderCell(table, "Güven");
                for (var s : report.getSkillScores()) {
                    addBodyCell(table, s.getSkill() == null ? "—" : s.getSkill());
                    addBodyCell(table, String.valueOf(s.getScore() == null ? 0 : s.getScore()));
                    String conf = s.getConfidence() == null ? "—" :
                            switch (s.getConfidence()) {
                                case "HIGH" -> "Yüksek";
                                case "MEDIUM" -> "Orta";
                                default -> "Düşük";
                            };
                    addBodyCell(table, conf);
                }
                doc.add(table);
            }

            // Inconsistencies
            if (report.getInconsistencies() != null && !report.getInconsistencies().isEmpty()) {
                addSection(doc, "Tutarsızlıklar");
                Font body = FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT);
                for (var i : report.getInconsistencies()) {
                    Paragraph p = new Paragraph();
                    Font bold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(0xef, 0x44, 0x44));
                    p.add(new Phrase("[" + safe(i.getSeverity()) + "] " + safe(i.getClaimedSkill()) + ": ", bold));
                    p.add(new Phrase(safe(i.getIssue()), body));
                    p.setSpacingAfter(4);
                    doc.add(p);
                }
            }

            // Footer
            doc.add(new Paragraph(" "));
            Font footer = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, MUTED);
            doc.add(new Paragraph(
                    "Bu rapor Synapse platformu tarafından AI ile üretilmiştir. CV beyanı ve GitHub aktivitesinin karşılaştırmalı analizidir.",
                    footer));

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("PDF generation failed", ex);
        }
    }

    private static void addSection(Document doc, String title) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BRAND);
        Paragraph p = new Paragraph(title.toUpperCase(Locale.ROOT), f);
        p.setSpacingBefore(10);
        p.setSpacingAfter(4);
        doc.add(p);
    }

    private static void addKv(Document doc, String key, String value) {
        Font k = FontFactory.getFont(FontFactory.HELVETICA, 10, MUTED);
        Font v = FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT);
        Paragraph p = new Paragraph();
        p.add(new Phrase(key + ": ", k));
        p.add(new Phrase(value, v));
        p.setSpacingAfter(2);
        doc.add(p);
    }

    private static void addHeaderCell(PdfPTable t, String text) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, MUTED);
        PdfPCell c = new PdfPCell(new Phrase(text.toUpperCase(Locale.ROOT), f));
        c.setBorderColor(new Color(0xe5, 0xe5, 0xe5));
        c.setBorderWidthTop(0);
        c.setBorderWidthLeft(0);
        c.setBorderWidthRight(0);
        c.setBorderWidthBottom(1);
        c.setPadding(8);
        t.addCell(c);
    }

    private static void addBodyCell(PdfPTable t, String text) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT);
        PdfPCell c = new PdfPCell(new Phrase(text, f));
        c.setBorderColor(new Color(0xee, 0xee, 0xee));
        c.setBorderWidthTop(0);
        c.setBorderWidthLeft(0);
        c.setBorderWidthRight(0);
        c.setBorderWidthBottom(0.5f);
        c.setPadding(7);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        t.addCell(c);
    }

    private static String safe(String s) {
        return s == null ? "—" : s;
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }
}
