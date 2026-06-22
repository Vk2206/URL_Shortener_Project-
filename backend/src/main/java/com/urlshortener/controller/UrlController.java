package com.urlshortener.controller;

import com.urlshortener.controller.dto.AnalyticsResponse;
import com.urlshortener.controller.dto.UrlResponse;
import com.urlshortener.controller.dto.UrlShortenRequest;
import com.urlshortener.service.UrlShortenerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
public class UrlController {

    @Autowired
    private UrlShortenerService urlShortenerService;

    // Root-level Redirection
    @GetMapping("/{shortKey}")
    public ResponseEntity<?> redirectToLongUrl(
            @PathVariable String shortKey,
            HttpServletRequest request) {

        // Exclude common browser resource requests
        if (shortKey.equals("favicon.ico") || shortKey.equals("error")) {
            return ResponseEntity.notFound().build();
        }

        // Get Client Details
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        
        // Handle comma-separated list from proxy
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }

        String userAgent = request.getHeader("User-Agent");
        String referrer = request.getHeader("Referer");
        
        // Retrieve country from request locale
        String country = request.getLocale() != null ? request.getLocale().getDisplayCountry() : "Unknown";
        if (country.isEmpty()) {
            country = "Unknown";
        }

        String longUrl = urlShortenerService.resolveAndTrack(shortKey, ipAddress, userAgent, referrer, country);

        if (longUrl != null) {
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl(longUrl);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", longUrl)
                    .build();
        } else {
            // Render a clean, stylized error page for missing or expired short URLs
            String htmlError = "<html><head><title>URL Not Found</title>" +
                    "<style>body { background: #0f0c1b; color: #fff; font-family: sans-serif; text-align: center; padding-top: 100px; }" +
                    "h1 { color: #ff4a5a; font-size: 48px; }" +
                    "p { font-size: 18px; color: #8c89b4; }" +
                    "a { color: #bd5eff; text-decoration: none; font-weight: bold; border: 1px solid #bd5eff; padding: 10px 20px; border-radius: 5px; margin-top: 20px; display: inline-block; transition: all 0.3s; }" +
                    "a:hover { background: #bd5eff; color: #fff; box-shadow: 0 0 15px rgba(189,94,255,0.4); }" +
                    "</style></head><body>" +
                    "<h1>404 - Link Unavailable</h1>" +
                    "<p>The URL you are trying to reach has either expired, been deleted, or never existed.</p>" +
                    "<a href=\"http://localhost:5173/\">Go to Dashboard</a>" +
                    "</body></html>";
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .header("Content-Type", "text/html")
                    .body(htmlError);
        }
    }

    // Shorten URL Endpoint
    @PostMapping("/api/urls/shorten")
    public ResponseEntity<?> shortenUrl(@RequestBody UrlShortenRequest request) {
        if (request.getLongUrl() == null || request.getLongUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL cannot be empty"));
        }
        try {
            UrlResponse response = urlShortenerService.shortenUrl(
                    request.getLongUrl(),
                    request.getCustomKey(),
                    request.getExpirationMinutes()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    // List all mappings
    @GetMapping("/api/urls")
    public ResponseEntity<List<UrlResponse>> getAllUrls() {
        return ResponseEntity.ok(urlShortenerService.getAllUrls());
    }

    // Get Analytics
    @GetMapping("/api/urls/analytics/{shortKey}")
    public ResponseEntity<?> getAnalytics(@PathVariable String shortKey) {
        try {
            AnalyticsResponse analytics = urlShortenerService.getAnalytics(shortKey);
            return ResponseEntity.ok(analytics);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Delete shortened URL
    @DeleteMapping("/api/urls/{shortKey}")
    public ResponseEntity<?> deleteUrl(@PathVariable String shortKey) {
        try {
            urlShortenerService.deleteUrl(shortKey);
            return ResponseEntity.ok(Map.of("message", "URL mapping deleted successfully"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
