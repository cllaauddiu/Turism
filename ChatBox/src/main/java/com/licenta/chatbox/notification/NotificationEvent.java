package com.licenta.chatbox.notification;

public record NotificationEvent(String type, String title, String message, long timestamp) {}

