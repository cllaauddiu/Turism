package com.licenta.turism;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TurismApplication {

    public static void main(String[] args) {
        SpringApplication.run(TurismApplication.class, args);
    }

}
