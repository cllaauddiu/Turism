package com.licenta.turism.config;

import com.licenta.turism.messaging.TurismEventsRequest;
import com.licenta.turism.messaging.TurismEventsResponse;
import com.licenta.turism.messaging.TurismPlacesRequest;
import com.licenta.turism.messaging.TurismPlacesResponse;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String TURISM_EVENTS_QUEUE  = "turism.events.queue";
    public static final String TURISM_PLACES_QUEUE  = "turism.places.queue";

    @Bean
    public Queue turismEventsQueue() {
        return new Queue(TURISM_EVENTS_QUEUE, true);
    }

    @Bean
    public Queue turismPlacesQueue() {
        return new Queue(TURISM_PLACES_QUEUE, true);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper mapper = new DefaultJackson2JavaTypeMapper();
        mapper.setTrustedPackages("*");
        mapper.setIdClassMapping(Map.of(
            "turism.events.request",  TurismEventsRequest.class,
            "turism.events.response", TurismEventsResponse.class,
            "turism.places.request",  TurismPlacesRequest.class,
            "turism.places.response", TurismPlacesResponse.class
        ));
        converter.setJavaTypeMapper(mapper);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         Jackson2JsonMessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        template.setReplyTimeout(15000);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter messageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        return factory;
    }
}
