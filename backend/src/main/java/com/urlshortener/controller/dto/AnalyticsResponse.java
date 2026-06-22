package com.urlshortener.controller.dto;

import java.util.List;

public class AnalyticsResponse {
    private String shortKey;
    private int totalClicks;
    private List<ClickTrend> clicksOverTime;
    private List<KeyValue> browsers;
    private List<KeyValue> operatingSystems;
    private List<KeyValue> referrers;
    private List<KeyValue> countries;

    public AnalyticsResponse() {
    }

    public AnalyticsResponse(String shortKey, int totalClicks, List<ClickTrend> clicksOverTime,
                             List<KeyValue> browsers, List<KeyValue> operatingSystems,
                             List<KeyValue> referrers, List<KeyValue> countries) {
        this.shortKey = shortKey;
        this.totalClicks = totalClicks;
        this.clicksOverTime = clicksOverTime;
        this.browsers = browsers;
        this.operatingSystems = operatingSystems;
        this.referrers = referrers;
        this.countries = countries;
    }

    public String getShortKey() {
        return shortKey;
    }

    public void setShortKey(String shortKey) {
        this.shortKey = shortKey;
    }

    public int getTotalClicks() {
        return totalClicks;
    }

    public void setTotalClicks(int totalClicks) {
        this.totalClicks = totalClicks;
    }

    public List<ClickTrend> getClicksOverTime() {
        return clicksOverTime;
    }

    public void setClicksOverTime(List<ClickTrend> clicksOverTime) {
        this.clicksOverTime = clicksOverTime;
    }

    public List<KeyValue> getBrowsers() {
        return browsers;
    }

    public void setBrowsers(List<KeyValue> browsers) {
        this.browsers = browsers;
    }

    public List<KeyValue> getOperatingSystems() {
        return operatingSystems;
    }

    public void setOperatingSystems(List<KeyValue> operatingSystems) {
        this.operatingSystems = operatingSystems;
    }

    public List<KeyValue> getReferrers() {
        return referrers;
    }

    public void setReferrers(List<KeyValue> referrers) {
        this.referrers = referrers;
    }

    public List<KeyValue> getCountries() {
        return countries;
    }

    public void setCountries(List<KeyValue> countries) {
        this.countries = countries;
    }

    public static class ClickTrend {
        private String date;
        private int clicks;

        public ClickTrend() {
        }

        public ClickTrend(String date, int clicks) {
            this.date = date;
            this.clicks = clicks;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public int getClicks() {
            return clicks;
        }

        public void setClicks(int clicks) {
            this.clicks = clicks;
        }
    }

    public static class KeyValue {
        private String name;
        private int value;

        public KeyValue() {
        }

        public KeyValue(String name, int value) {
            this.name = name;
            this.value = value;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getValue() {
            return value;
        }

        public void setValue(int value) {
            this.value = value;
        }
    }
}
