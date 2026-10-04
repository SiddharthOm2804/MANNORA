# API Reference

**NEURAL CITY — HTTP API Endpoints**

---

## Base URL
- Development: `http://localhost:5000`

---

## 1. System & Health

### `GET /`
Returns service identifier, active phase, and root route index.

**Response:**
```json
{
  "name": "NEURAL CITY API",
  "description": "AI-Driven Multi-Agent Civilization Simulation Engine",
  "phase": "Phase 1 - Foundational Architecture",
  "endpoints": {
    "health": "/api/health"
  },
  "timestamp": "2026-10-03T11:20:00.000Z"
}
```

---

### `GET /api/health`
Monitors server vitality, database connection readiness, uptime, and runtime environment.

**Query Parameters:**
- `strict` (optional, boolean): If `true`, returns HTTP 503 instead of 200 when database is disconnected or degraded.

**Response (Healthy):**
```json
{
  "status": "healthy",
  "message": "NEURAL CITY engine and database are operational.",
  "timestamp": "2026-10-03T11:20:00.000Z",
  "server": {
    "status": "running",
    "uptimeSeconds": 142,
    "environment": "development",
    "nodeVersion": "v20.18.0"
  },
  "database": {
    "status": "connected",
    "isConnected": true,
    "readyState": "connected",
    "host": "127.0.0.1",
    "database": "neural_city",
    "lastError": null
  },
  "engine": {
    "phase": "Phase 1 - Foundational Architecture",
    "version": "0.1.0"
  }
}
```

**Response (Degraded / Database Offline):**
```json
{
  "status": "degraded",
  "message": "Server is running, but database connection is unavailable.",
  "timestamp": "2026-10-03T11:20:00.000Z",
  "server": {
    "status": "running",
    "uptimeSeconds": 14,
    "environment": "development",
    "nodeVersion": "v20.18.0"
  },
  "database": {
    "status": "disconnected",
    "isConnected": false,
    "readyState": "disconnected",
    "host": null,
    "database": null,
    "lastError": "connect ECONNREFUSED 127.0.0.1:27017"
  },
  "engine": {
    "phase": "Phase 3 - World Creation System",
    "version": "0.3.0"
  }
}
```

---

## 2. World Creation & Civilization Management

### `POST /api/worlds`
Creates and persists a new virtual civilization matrix.

**Request Payload:**
```json
{
  "name": "Sector 07 // Neo-Alexandria",
  "description": "High-density civilization matrix.",
  "population": 2500,
  "numberOfCities": 3,
  "biome": "Cybernetic Basin",
  "startingMoney": 650000,
  "industries": [
    "Energy & Clean Fusion",
    "Robotics & Manufacturing",
    "Advanced Cybernetics"
  ],
  "governmentType": "Technocracy",
  "simulationSpeed": 1,
  "startingDate": "2085-01-01T00:00:00.000Z",
  "resources": {
    "energy": 6500,
    "minerals": 3200,
    "water": 5800,
    "agriculture": 4200,
    "technology": 1800
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Civilization world created successfully",
  "data": {
    "_id": "6ac0f16872b7b9006fc9080a",
    "name": "Sector 07 // Neo-Alexandria",
    "population": 2500,
    "cityCount": 3,
    "cities": [
      {
        "name": "Sector 07 Capital Prime",
        "population": 1125,
        "isCapital": true,
        "coordinates": { "x": 50, "y": 50 },
        "specialization": "Government & Financial Hub"
      }
    ],
    "economyConfiguration": {
      "startingMoney": 650000,
      "currencyName": "Neural Credits",
      "currencySymbol": "NC",
      "industries": ["Energy & Clean Fusion", "Robotics & Manufacturing", "Advanced Cybernetics"]
    },
    "governmentConfiguration": {
      "type": "Technocracy",
      "stabilityIndex": 85,
      "corruptionIndex": 10
    },
    "simulationSettings": {
      "speed": 1,
      "tickRate": 10,
      "seed": 99840071,
      "status": "initialized"
    },
    "createdAt": "2026-10-03T12:13:28.672Z"
  }
}
```

---

### `GET /api/worlds`
Retrieves all persisted civilization worlds sorted by creation date.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [ ... ]
}
```

---

### `GET /api/worlds/:id`
Retrieves full configuration details and city layout for a specific world.

---

### `PATCH /api/worlds/:id`
Partially updates configuration parameters (e.g. population, simulation speed).

---

### `DELETE /api/worlds/:id`
Permanently deletes a civilization world from MongoDB.

