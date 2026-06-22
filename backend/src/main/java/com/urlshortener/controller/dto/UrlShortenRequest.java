package com.urlshortener.controller.dto;

public class UrlShortenRequest {
    private String longUrl;
    private String customKey;
    private Integer expirationMinutes;

    public UrlShortenRequest() {
    }

    public UrlShortenRequest(String longUrl, String customKey, Integer expirationMinutes) {
        this.longUrl = longUrl;
        this.customKey = customKey;
        this.expirationMinutes = expirationMinutes;
    }

    public String getLongUrl() {
        return longUrl;
    }

    public void setLongUrl(String longUrl) {
        this.longUrl = longUrl;
    }

    public String getCustomKey() {
        return customKey;
    }

    public void setCustomKey(String customKey) {
        this.customKey = customKey;
    }

    public Integer getExpirationMinutes() {
        return expirationMinutes;
    }

    public void setExpirationMinutes(Integer expirationMinutes) {
        this.expirationMinutes = expirationMinutes;
    }
}
