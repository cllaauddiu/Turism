package com.licenta.aiservice.messaging;

import com.licenta.aiservice.config.RabbitMQConfig;
import com.licenta.aiservice.dto.AiResponse;
import com.licenta.aiservice.dto.PromptRequest;
import com.licenta.aiservice.service.GeminiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class AiRpcListener {

    private static final Logger log = LoggerFactory.getLogger(AiRpcListener.class);

    private final GeminiService geminiService;

    public AiRpcListener(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @RabbitListener(queues = RabbitMQConfig.AI_GENERATE_QUEUE)
    public AiResponse handleGenerate(PromptRequest request) {
        log.info("RabbitMQ: received generate request, prompt length={}", request.getPrompt().length());
        return geminiService.generate(request.getPrompt());
    }
}
