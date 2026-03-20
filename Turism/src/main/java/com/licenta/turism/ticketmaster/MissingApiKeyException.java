package com.licenta.turism.ticketmaster;

public class MissingApiKeyException extends RuntimeException {

    public MissingApiKeyException() {
        super("Ticketmaster API key is missing. Set TICKETMASTER_API_KEY in C:/Users/claud/Desktop/Licenta/.env or environment variables.");
    }
}


