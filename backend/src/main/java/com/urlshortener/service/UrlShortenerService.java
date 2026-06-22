package com.urlshortener.service;

import com.urlshortener.controller.dto.AnalyticsResponse;
import com.urlshortener.controller.dto.UrlResponse;
import com.urlshortener.entity.ClickAnalytics;
import com.urlshortener.entity.UrlMapping;
import com.urlshortener.repository.ClickAnalyticsRepository;
import com.urlshortener.repository.UrlMappingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UrlShortenerService {

    private static final String BASE62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final Random RANDOM = new Random();
    private static final String BASE_URL = "http://localhost:8080/";

    @Autowired
    private UrlMappingRepository urlMappingRepository;

    @Autowired
    private ClickAnalyticsRepository clickAnalyticsRepository;

    @Transactional
    public UrlResponse shortenUrl(String longUrl, String customKey, Integer expirationMinutes) {
        // Clean URL
        longUrl = sanitizeUrl(longUrl);

        String shortKey;
        if (customKey != null && !customKey.trim().isEmpty()) {
            shortKey = customKey.trim();
            if (urlMappingRepository.existsByShortKey(shortKey)) {
                throw new IllegalArgumentException("Custom key '" + shortKey + "' is already in use.");
            }
        } else {
            shortKey = generateUniqueShortKey();
        }

        LocalDateTime createdAt = LocalDateTime.now();
        LocalDateTime expiresAt = null;
        if (expirationMinutes != null && expirationMinutes > 0) {
            expiresAt = createdAt.plusMinutes(expirationMinutes);
        }

        // Fetch page title in background (or quick timeout)
        String title = fetchPageTitle(longUrl);

        UrlMapping urlMapping = new UrlMapping(shortKey, longUrl, title, createdAt, expiresAt);
        urlMapping = urlMappingRepository.save(urlMapping);

        return mapToResponse(urlMapping);
    }

    public List<UrlResponse> getAllUrls() {
        return urlMappingRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public String resolveAndTrack(String shortKey, String ipAddress, String userAgent, String referrer, String country) {
        Optional<UrlMapping> optionalMapping = urlMappingRepository.findByShortKey(shortKey);
        if (optionalMapping.isEmpty()) {
            return null;
        }

        UrlMapping mapping = optionalMapping.get();

        // Expiry check
        if (mapping.getExpiresAt() != null && mapping.getExpiresAt().isBefore(LocalDateTime.now())) {
            return null; // Expired
        }

        // Parse User Agent details
        String browser = parseBrowser(userAgent);
        String os = parseOs(userAgent);
        String referrerSource = parseReferrer(referrer);
        String countryName = country != null ? country : "Unknown";

        // Save Analytics log
        ClickAnalytics analytics = new ClickAnalytics(
                mapping,
                LocalDateTime.now(),
                ipAddress,
                userAgent,
                browser,
                os,
                referrerSource,
                countryName
        );
        clickAnalyticsRepository.save(analytics);

        // Update Click count
        mapping.incrementClicks();
        urlMappingRepository.save(mapping);

        return mapping.getLongUrl();
    }

    public AnalyticsResponse getAnalytics(String shortKey) {
        Optional<UrlMapping> optionalMapping = urlMappingRepository.findByShortKey(shortKey);
        if (optionalMapping.isEmpty()) {
            throw new NoSuchElementException("Short URL not found for key: " + shortKey);
        }

        UrlMapping mapping = optionalMapping.get();
        List<ClickAnalytics> clicks = clickAnalyticsRepository.findByUrlMappingId(mapping.getId());

        int totalClicks = clicks.size();

        // 1. Clicks Over Time (Group by Date)
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Long> clicksByDate = clicks.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getClickTime().format(dateFormatter),
                        TreeMap::new, // Sorted order
                        Collectors.counting()
                ));

        List<AnalyticsResponse.ClickTrend> clicksOverTime = clicksByDate.entrySet().stream()
                .map(e -> new AnalyticsResponse.ClickTrend(e.getKey(), e.getValue().intValue()))
                .collect(Collectors.toList());

        // Fill in today if empty
        if (clicksOverTime.isEmpty()) {
            clicksOverTime.add(new AnalyticsResponse.ClickTrend(LocalDateTime.now().format(dateFormatter), 0));
        }

        // Helper method to convert map to KeyValue list
        List<AnalyticsResponse.KeyValue> browsers = getTopDistribution(
                clicks.stream().map(ClickAnalytics::getBrowser).collect(Collectors.toList())
        );

        List<AnalyticsResponse.KeyValue> operatingSystems = getTopDistribution(
                clicks.stream().map(ClickAnalytics::getOs).collect(Collectors.toList())
        );

        List<AnalyticsResponse.KeyValue> referrers = getTopDistribution(
                clicks.stream().map(ClickAnalytics::getReferrer).collect(Collectors.toList())
        );

        List<AnalyticsResponse.KeyValue> countries = getTopDistribution(
                clicks.stream().map(ClickAnalytics::getCountry).collect(Collectors.toList())
        );

        return new AnalyticsResponse(
                shortKey,
                totalClicks,
                clicksOverTime,
                browsers,
                operatingSystems,
                referrers,
                countries
        );
    }

    @Transactional
    public void deleteUrl(String shortKey) {
        Optional<UrlMapping> optionalMapping = urlMappingRepository.findByShortKey(shortKey);
        if (optionalMapping.isPresent()) {
            UrlMapping mapping = optionalMapping.get();
            // Delete child analytics first
            List<ClickAnalytics> analytics = clickAnalyticsRepository.findByUrlMappingId(mapping.getId());
            clickAnalyticsRepository.deleteAll(analytics);
            urlMappingRepository.delete(mapping);
        } else {
            throw new NoSuchElementException("Short URL not found for key: " + shortKey);
        }
    }

    private String generateUniqueShortKey() {
        for (int i = 0; i < 5; i++) {
            StringBuilder sb = new StringBuilder(6);
            for (int j = 0; j < 6; j++) {
                sb.append(BASE62.charAt(RANDOM.nextInt(BASE62.length())));
            }
            String key = sb.toString();
            if (!urlMappingRepository.existsByShortKey(key)) {
                return key;
            }
        }
        throw new RuntimeException("Failed to generate a unique short key after multiple attempts");
    }

    private String sanitizeUrl(String url) {
        url = url.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        return url;
    }

    private String fetchPageTitle(String urlString) {
        try {
            URI uri = new URI(urlString);
            URL url = uri.toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(1500);
            conn.setReadTimeout(1500);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    StringBuilder html = new StringBuilder();
                    String line;
                    // Read first 10KB to avoid reading giant files
                    while ((line = reader.readLine()) != null && html.length() < 10000) {
                        html.append(line).append("\n");
                    }
                    Pattern titlePattern = Pattern.compile("<title>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                    Matcher matcher = titlePattern.matcher(html.toString());
                    if (matcher.find()) {
                        String title = matcher.group(1).trim();
                        // Unescape HTML entities simple replacement
                        title = title.replaceAll("&amp;", "&")
                                     .replaceAll("&lt;", "<")
                                     .replaceAll("&gt;", ">")
                                     .replaceAll("&quot;", "\"")
                                     .replaceAll("&#39;", "'");
                        if (!title.isEmpty()) {
                            return title;
                        }
                    }
                }
            }
            // Fallback: extract domain
            return uri.getHost();
        } catch (Exception e) {
            try {
                return new URI(urlString).getHost();
            } catch (Exception ex) {
                return "Untitled Link";
            }
        }
    }

    private String parseBrowser(String ua) {
        if (ua == null || ua.isEmpty()) return "Direct/API";
        String lowerUa = ua.toLowerCase();
        if (lowerUa.contains("edg/")) return "Edge";
        if (lowerUa.contains("firefox/")) return "Firefox";
        if (lowerUa.contains("chrome/") && lowerUa.contains("safari/")) return "Chrome";
        if (lowerUa.contains("safari/") && !lowerUa.contains("chrome/")) return "Safari";
        if (lowerUa.contains("opr/") || lowerUa.contains("opera/")) return "Opera";
        return "Other Browser";
    }

    private String parseOs(String ua) {
        if (ua == null || ua.isEmpty()) return "Direct/API";
        String lowerUa = ua.toLowerCase();
        if (lowerUa.contains("windows nt")) return "Windows";
        if (lowerUa.contains("macintosh") || lowerUa.contains("mac os x")) return "macOS";
        if (lowerUa.contains("android")) return "Android";
        if (lowerUa.contains("iphone") || lowerUa.contains("ipad")) return "iOS";
        if (lowerUa.contains("linux")) return "Linux";
        return "Other OS";
    }

    private String parseReferrer(String referrer) {
        if (referrer == null || referrer.isEmpty()) return "Direct";
        try {
            URI uri = new URI(referrer);
            String host = uri.getHost();
            if (host == null) return "Direct";
            host = host.toLowerCase();
            if (host.contains("google.com")) return "Google";
            if (host.contains("t.co") || host.contains("twitter.com")) return "Twitter";
            if (host.contains("facebook.com")) return "Facebook";
            if (host.contains("linkedin.com")) return "LinkedIn";
            if (host.contains("github.com")) return "GitHub";
            if (host.startsWith("www.")) {
                return host.substring(4);
            }
            return host;
        } catch (Exception e) {
            return "Referral Link";
        }
    }

    private List<AnalyticsResponse.KeyValue> getTopDistribution(List<String> rawValues) {
        Map<String, Long> frequencyMap = rawValues.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));

        return frequencyMap.entrySet().stream()
                .map(entry -> new AnalyticsResponse.KeyValue(entry.getKey(), entry.getValue().intValue()))
                .sorted((kv1, kv2) -> Integer.compare(kv2.getValue(), kv1.getValue())) // Descending
                .collect(Collectors.toList());
    }

    private UrlResponse mapToResponse(UrlMapping mapping) {
        return new UrlResponse(
                mapping.getShortKey(),
                mapping.getLongUrl(),
                BASE_URL + mapping.getShortKey(),
                mapping.getTitle(),
                mapping.getCreatedAt(),
                mapping.getExpiresAt(),
                mapping.getClickCount()
        );
    }
}
