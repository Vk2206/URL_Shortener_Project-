package com.urlshortener.controller.dto;

import java.time.LocalDateTime;

public class UrlResponse {
    private String shortKey;
    private String longUrl;
    private String shortUrl;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private int clickCount;

    public UrlResponse() {
    }

    public UrlResponse(String shortKey, String longUrl, String shortUrl, String title, LocalDateTime createdAt, LocalDateTime expiresAt, int clickCount) {
        this.shortKey = shortKey;
        this.longUrl = longUrl;
        this.shortUrl = shortUrl;
        this.title = title;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.clickCount = clickCount;
    }

    public String getShortKey() {
        return shortKey;
    }

    public void setShortKey(String shortKey) {
        this.shortKey = shortKey;
    }

    public String getLongUrl() {
        return longUrl;
    }

    public void setLongUrl(String longUrl) {
        this.longUrl = longUrl;
    }

    public String getShortUrl() {
        return shortUrl;
    }

    public void setShortUrl(String shortUrl) {
        this.shortUrl = shortUrl;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public int getClickCount() {
        return clickCount;
    }

    public void setClickCount(int clickCount) {
        this.clickCount = clickCount;
    }
}
