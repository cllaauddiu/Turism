package com.licenta.turism.places;

public class GooglePlacesIntegrationException extends RuntimeException {

    public GooglePlacesIntegrationException(String message) {
        super(message);
    }

    public GooglePlacesIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

