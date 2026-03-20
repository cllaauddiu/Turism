# ChatBox

ChatBox este un microserviciu Spring Boot care expune un endpoint de chat si forwardeaza mesajele catre `AIService`.

## Endpointuri

- `GET /chatbox/health`
- `POST /chatbox/messages`

Exemplu request:

```http
POST /chatbox/messages
Content-Type: application/json

{
  "message": "Salut!"
}
```

Exemplu raspuns:

```json
{
  "answer": "Salut! Cu ce te pot ajuta?",
  "model": "gemini-2.5-flash-lite",
  "prompt": "Salut!"
}
```

## Configurare

In `application.properties`:

- `server.port=8086`
- `ai.service.url=${AI_SERVICE_URL:http://ai-service:8083}`

In Docker Compose, ChatBox foloseste:

- `AI_SERVICE_URL=http://ai-service:8083`

