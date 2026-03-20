package com.licenta.turism.places;

public class MissingGooglePlacesApiKeyException extends RuntimeException {

    public MissingGooglePlacesApiKeyException() {
        super("Places key is missing. Set SERPAPI_API_KEY (or GOOGLE_PLACES_API_KEY) in C:/Users/claud/Desktop/Licenta/.env.");
    }
}

