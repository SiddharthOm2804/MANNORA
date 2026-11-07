# MANNORA — System Architecture & How It Works

> **Virtual City Simulation Platform**  
> *(Formerly Neural City)*

---

## 1. System Overview

**MANNORA** is built using a clean, modern software architecture where each part of the system has one clear job:
- **Client (Frontend)**: Displays the city dashboard, reports, and real-time 3D city view.
- **Server (Backend)**: Provides standard REST APIs and saves city states into MongoDB.
- **Simulation Engine**: Runs the actual city logic step by step (people's needs, factory jobs, market prices).
- **AI Engine**: Answers questions and explains city events in simple language.

```
                              +---------------------------------------+
                              |            MANNORA CLIENT             |
                              |   React 18 + Vite + Tailwind + R3F    |
                              +-------------------+-------------------+
                                                  |
                                              HTTP / REST
                                                  |
                                                  v
                              +---------------------------------------+
                              |         EXPRESS API SERVER            |
                              |  Node.js + Express + Mongoose API     |
                              +---------+-------------------+---------+
                                        |                   |
                                        v                   v
                    +-----------------------+   +-----------------------+
                    |      MONGODB DB       |   |   SIMULATION ENGINE   |
                    |   Permanent Storage   |   |   City Simulation Loop|
                    +-----------------------+   +-----------+-----------+
                                                            |
                                                            v
                                                +-----------------------+
                                                |     AI ASSISTANT      |
                                                |  Simple English Advice|
                                                +-----------------------+
```

---

## 2. Project Packages and Folders

The project is structured as an npm monorepo with 5 core workspaces:

| Folder | Simple Name | What It Does |
| :--- | :--- | :--- |
| `/client` | Frontend UI | The web application with 3D city canvas, citizen inspector, and economy charts. |
| `/server` | Backend API | Node.js and Express server that handles database saving and HTTP requests. |
| `/simulation` | City Simulation Engine | The pure mathematical engine that simulates citizens, markets, jobs, and emergencies. |
| `/ai` | AI City Assistant | Generates simple English summaries, advice, and citizen memory reflections. |
| `/shared` | Shared Code | Common constants, action names, and event schemas used across frontend and backend. |
| `/docs` | Documentation | Guides, API lists, and the Simple English Glossary. |

---

## 3. Core Software Principles in MANNORA

### 1. Repeatable Results (Determinism)
In many games or mock apps, numbers are randomized using `Math.random()`, which produces different results every time. In MANNORA, every calculation uses a **deterministic seed** (`Mulberry32`). If you run the simulation with Seed #100 for 100 days twice, you get the exact same results down to the last citizen.

### 2. Separation of Concerns
The simulation engine does NOT depend on the 3D graphics or MongoDB to do its math. This means:
- The simulation can run in a background Node.js server.
- The 3D graphics simply read the current city state and render it visually.
- If the database disconnects, the simulation in memory continues running safely.

### 3. Real Event Cascade (No Fake Numbers)
When you trigger an emergency event (like a water shortage), the engine doesn't just change a label on the UI. The shortage actually decreases water reserves, which increases water prices, cuts disposable income, lowers health, and changes citizen happiness.

### 4. Time Machine & Saved Snapshots
MANNORA keeps clean snapshot copies of the city state. This allows you to rewind back in time, test new government rules on an alternate branch, and compare the two versions side by side.
