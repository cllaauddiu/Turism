# Turism - Ticketmaster + Places integration

Acest microserviciu expune endpoint-uri pentru evenimente (Ticketmaster) si locuri turistice (SerpApi Google Maps).

## Configurare API key

1. Editeaza fisierul `C:/Users/claud/Desktop/Licenta/.env`.
2. Pune cheile API in variabilele `TICKETMASTER_API_KEY` si `SERPAPI_API_KEY`.

Exemplu:

```dotenv
TICKETMASTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SERPAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`application.properties` este configurat sa citeasca env-ul din root (`spring.config.import=optional:file:../.env[.properties]`).

## Endpoint disponibil

- `GET /api/turism/events`
- `GET /api/turism/places`

Query params optionale:

- `keyword` - text de cautare
- `city` - oras
- `lat` + `lon` - coordonate (trebuie trimise impreuna)
- `radius` - raza in km (default 30)
- `size` - numar rezultate (default 20)

Exemplu request:

```http
GET /api/turism/events?keyword=festival&city=Bucharest&size=10
```

Query params pentru `/api/turism/places`:

- `lat` + `lon` - coordonate (obligatorii)
- `radius` - raza in metri (default 3000)
- `size` - numar rezultate (default 10)
- `keyword` - filtru text
- `type` - tip locatie (ex: `museum`, `tourist_attraction`, `restaurant`)

Exemplu request:

```http
GET /api/turism/places?lat=44.4268&lon=26.1025&radius=3000&type=tourist_attraction&size=6
```


