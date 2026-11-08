# MANNORA — Simple English Glossary

Welcome to the Simple English Glossary for **MANNORA**.

This document explains technical words in simple, natural Indian English with everyday real-life examples so that college students, teachers, and developers can easily understand and explain the project.

---

## Table of Contents
1. [Artificial Intelligence and Simulation](#1-artificial-intelligence-and-simulation)
2. [Software Development and Architecture](#2-software-development-and-architecture)
3. [Database and Data Management](#3-database-and-data-management)
4. [Simulation and Virtual City Terms](#4-simulation-and-virtual-city-terms)
5. [3D Graphics and Visualization](#5-3d-graphics-and-visualization)
6. [Testing, Deployment and Code Quality](#6-testing-deployment-and-code-quality)

---

## 1. Artificial Intelligence and Simulation

### Artificial Intelligence (AI)
- **Simple Meaning:** A computer program that can think, analyze information, and answer questions like a smart human.
- **What it does in MANNORA:** Acts as an AI City Assistant that looks at city statistics and explains why people are happy, why money decreased, or what government rules to apply.
- **Real-Life Example:** Like asking a knowledgeable city planning officer for advice on how to fix traffic or water shortages.

### Multi-Agent System
- **Simple Meaning:** A system with many independent computer-controlled characters living and interacting together in the same virtual world.
- **What it does in MANNORA:** Hundreds of virtual citizens live in the city at the same time, each with their own job, money, and home.
- **Real-Life Example:** Like a busy market where shopkeepers sell goods, customers buy groceries, and auto-rickshaw drivers offer rides simultaneously.

### Autonomous Agent
- **Simple Meaning:** A computer character that makes its own decisions without a human having to control every single movement.
- **What it does in MANNORA:** Represents a virtual citizen who decides on their own when to sleep, when to go to work, and when to buy food.
- **Real-Life Example:** Like an automated robot vacuum cleaner that navigates your house and decides which room to clean next without being driven with a remote control.

### Agent Behaviour
- **Simple Meaning:** How a virtual person acts and reacts to what happens around them.
- **What it does in MANNORA:** If food prices increase or salaries drop, citizens get worried and reduce their spending.
- **Real-Life Example:** If petrol prices increase in your city, people naturally decide to use public buses or metro trains instead of cars.

### Decision Making
- **Simple Meaning:** Choosing the best possible action among multiple choices.
- **What it does in MANNORA:** The citizen's decision system checks their hunger, tiredness, and wallet balance to pick the most urgent activity.
- **Real-Life Example:** When you feel very hungry during study time, you decide to pause studying and eat snacks first.

### Machine Learning (ML)
- **Simple Meaning:** Teaching a computer to learn patterns from examples instead of writing rigid rules for every scenario.
- **What it does in MANNORA:** Helps the AI assistant understand citizen memories and recommend suitable city policies.
- **Real-Life Example:** Like a music streaming app that figures out what songs you like based on what you listened to previously.

### Simulation
- **Simple Meaning:** A computer model that imitates how a real-world system works over time.
- **What it does in MANNORA:** Imitates a complete city with population, money, jobs, water, electricity, and buildings on a computer.
- **Real-Life Example:** Like flight training software where pilot trainees practice flying an airplane safely on computer screens before flying a real plane.

### Simulation Tick
- **Simple Meaning:** One single step forward in the simulation's digital clock (like one second or one hour passing).
- **What it does in MANNORA:** In every tick, all virtual people move, factories produce goods, electricity is used, and money is updated.
- **Real-Life Example:** Like the tick of a stopwatch or one turn in a board game where everyone takes their turn.

### Random Seed
- **Simple Meaning:** A starting number given to a computer's random number generator so it produces the exact same sequence of events.
- **What it does in MANNORA:** Ensures that if two students start the simulation with Seed `42`, their cities will grow in the exact same way.
- **Real-Life Example:** Like setting the starting radio frequency to the exact same channel so your friend hears the same music.

### Deterministic Execution
- **Simple Meaning:** Running a system such that giving the same inputs will ALWAYS produce the exact same result every single time.
- **What it does in MANNORA:** If you re-run the city from Tick 0 to Tick 100 with the same seed, the population and bank balance will match down to the exact rupee.
- **Real-Life Example:** Adding `5 + 5` always gives `10`. It never randomly becomes `11` on a Sunday.

### State Management
- **Simple Meaning:** Carefully keeping track of all the current data and information about the system in computer memory.
- **What it does in MANNORA:** Keeps track of how much water is left, who is employed, and which buildings are damaged.
- **Real-Life Example:** Like a cricket scoreboard that continuously tracks current runs, wickets fallen, and overs bowled.

### State Transition
- **Simple Meaning:** The change in data from one condition to the next.
- **What it does in MANNORA:** The update from yesterday's city status (e.g., 1000 people) to today's status (e.g., 1005 people after 5 births).
- **Real-Life Example:** A traffic signal changing from Red to Green.

### World State
- **Simple Meaning:** A complete snapshot of everything that exists in the virtual city at one specific moment.
- **What it does in MANNORA:** Contains all citizen details, city bank balance, resource numbers, and active events at that tick.
- **Real-Life Example:** Taking a panoramic photo of a city from a hilltop showing everything happening right at 12:00 PM.

### Event-Driven Architecture
- **Simple Meaning:** A software design where parts of the program talk to each other by announcing events when something happens.
- **What it does in MANNORA:** When a "Water Shortage" happens, the event system announces it, and the resource and economy systems immediately respond.
- **Real-Life Example:** When your door bell rings, you stop watching TV and walk over to open the main door.

---

## 2. Software Development and Architecture

### Frontend
- **Simple Meaning:** The visual part of the website or application that users see and click on their screens.
- **What it does in MANNORA:** The React user interface with navigation buttons, 3D city graphics, charts, and control bars.
- **Real-Life Example:** The dashboard, steering wheel, and speedometer inside a car.

### Backend
- **Simple Meaning:** The behind-the-scenes server that handles calculations, stores data, and answers frontend requests.
- **What it does in MANNORA:** The Node.js and Express server that saves cities to MongoDB and runs simulations.
- **Real-Life Example:** The kitchen inside a restaurant where chefs cook food after the waiter brings your order.

### API (Application Programming Interface)
- **Simple Meaning:** A digital messenger that allows two different computer programs to talk to each other.
- **What it does in MANNORA:** Connects the React website to the Node.js server so buttons can save cities or trigger emergencies.
- **Real-Life Example:** A restaurant menu card and waiter that let you communicate your dish order to the kitchen.

### REST API
- **Simple Meaning:** A clean and standardized way for websites to fetch and send data over the internet using standard actions (GET, POST, PATCH, DELETE).
- **What it does in MANNORA:** Provides clean web addresses like `POST /api/worlds` to create a city or `GET /api/worlds` to list all cities.
- **Real-Life Example:** Standard postal mail envelopes where the address format is fixed so any postman can deliver it.

### Model
- **Simple Meaning:** The blueprint or structure that describes how data must look before saving it into a database.
- **What it does in MANNORA:** The `World.js` and `Agent.js` files that define that a city must have a name, population count, and resources.
- **Real-Life Example:** An official college admission form with specific boxes for your name, roll number, and phone number.

### Controller
- **Simple Meaning:** The manager function in the server that receives a user's request, decides what to do, and sends back the answer.
- **What it does in MANNORA:** When a user clicks "Save City", `worldController.js` takes the form data, checks it, and saves it.
- **Real-Life Example:** A bank teller who checks your withdrawal slip, counts the cash, and gives it to you.

### Service
- **Simple Meaning:** A reusable piece of code that does the heavy work or business logic of an application.
- **What it does in MANNORA:** `simulationBridgeService.js` manages starting, stepping, and pausing the city simulation in memory.
- **Real-Life Example:** The bank's backend computer system that actually verifies account balance and deducts money.

### Middleware
- **Simple Meaning:** A helper program that inspects a web request before it reaches the main controller function.
- **What it does in MANNORA:** Checks if the request is valid and catches errors so the server never crashes unexpectedly.
- **Real-Life Example:** Security guards at a mall entrance checking bags with metal detectors before letting visitors inside.

### Component
- **Simple Meaning:** A small, reusable building block of the user interface.
- **What it does in MANNORA:** `MetricCard.jsx`, `Panel.jsx`, and `TimelineControl.jsx` are used across multiple pages.
- **Real-Life Example:** Standard LEGO bricks used to build houses, cars, and bridges.

### Environment Variable
- **Simple Meaning:** Private settings stored outside the code (such as database URLs and port numbers) that can change between computers.
- **What it does in MANNORA:** Keeps database connection URLs like `MONGO_URI` safe in `.env` files.
- **Real-Life Example:** Storing your house door keys in your pocket instead of pasting them on the front door.

---

## 3. Database and Data Management

### MongoDB
- **Simple Meaning:** A modern database that stores information in flexible, readable JSON-like documents instead of rigid tables.
- **What it does in MANNORA:** Stores all your created cities, saved simulation points, and citizen details.
- **Real-Life Example:** An office filing cabinet filled with neat plastic folders holding patient records.

### Mongoose
- **Simple Meaning:** A helpful library that makes it easy for Node.js programs to talk to and validate data for MongoDB.
- **What it does in MANNORA:** Ensures that you cannot accidentally save a city without a valid population or name.
- **Real-Life Example:** A form checking rule that prevents submitting a form if you leave your phone number blank.

### Persistence
- **Simple Meaning:** Saving information permanently on a hard drive so it stays safe even after you turn off the computer.
- **What it does in MANNORA:** Ensures your virtual cities stay saved in the database even when you restart the computer.
- **Real-Life Example:** Saving your video game progress to a memory card instead of losing it when the console is switched off.

### CRUD (Create, Read, Update, Delete)
- **Simple Meaning:** The four basic things you can do with any saved data: create new, view existing, edit, or remove.
- **What it does in MANNORA:** You can create a new city, view city reports, change tax rates, or delete an old city.
- **Real-Life Example:** Adding a new contact on your phone, searching for a friend's number, editing their address, or deleting an old number.

### Snapshot / Checkpoint
- **Simple Meaning:** An exact copy of the city's data saved at a specific point in time so you can return to it later.
- **What it does in MANNORA:** Lets you save your city at Day 5, try a risky rule, and rewind back to Day 5 if things go wrong.
- **Real-Life Example:** A quick-save point before fighting a difficult boss in a video game.

---

## 4. Simulation and Virtual City Terms

### Citizen (Virtual Person)
- **Simple Meaning:** A computer-generated character living inside the virtual city.
- **What it does in MANNORA:** Has a name, age, job (like engineer, scientist, merchant), bank balance, and home.
- **Real-Life Example:** Any resident living and working in Mumbai, Bengaluru, or Delhi.

### Needs (Basic Needs)
- **Simple Meaning:** The everyday biological and comfort requirements that every person must fulfill to stay healthy and happy.
- **What it does in MANNORA:** Citizens track Hunger, Rest, Safety, Social interaction, and Personal fulfillment.
- **Real-Life Example:** Feeling thirsty after walking in the sun or wanting to sleep after a long workday.

### Goals
- **Simple Meaning:** Specific targets that a citizen wants to achieve in their life.
- **What it does in MANNORA:** Citizens have immediate survival goals (find food, go to sleep) and long-term goals (save money, start a shop).
- **Real-Life Example:** A college student studying hard to get a software job or an entrepreneur saving money to open a cafe.

### Memory
- **Simple Meaning:** A digital diary where a citizen remembers important past events that happened to them.
- **What it does in MANNORA:** If a citizen experienced a water shortage or got promoted at work, they remember it and talk about it with the AI assistant.
- **Real-Life Example:** Remembering the day you bought your first motorcycle or faced heavy rains in monsoon season.

### City Resources
- **Simple Meaning:** The essential materials and utilities needed to run a modern city smoothly.
- **What it does in MANNORA:** Tracks 6 key resources: Drinking Water, Electricity, Food (Agriculture), Minerals, Technology, and Raw Materials.
- **Real-Life Example:** Municipal drinking water pipelines, electricity power grids, and local vegetable supply markets.

### Scarcity (Shortage)
- **Simple Meaning:** When the demand for something is much higher than the amount available.
- **What it does in MANNORA:** If water supply drops below what citizens need, water prices rise and citizen health begins to suffer.
- **Real-Life Example:** Water tanker shortages during hot summer months.

### City Bank Balance (Treasury)
- **Simple Meaning:** The total money available in the city government's bank account.
- **What it does in MANNORA:** Collects taxes from working citizens and spends money on roads, hospitals, schools, and emergency repairs.
- **Real-Life Example:** The municipal corporation's annual city budget.

### Government Rules (Policies)
- **Simple Meaning:** Official guidelines and laws enacted by the city council to organize the city.
- **What it does in MANNORA:** Rules like "Free Healthcare", "Public Bus Network", or "Green Energy Subsidy" that cost money but improve happiness.
- **Real-Life Example:** A city introducing free metro travel or mandatory rainwater harvesting in apartment complexes.

### City Events (Emergencies and Shocks)
- **Simple Meaning:** Unexpected major occurrences that test the city's strength and preparation.
- **What it does in MANNORA:** Events like Water Shortage, Power Grid Breakdown, Stock Market Crash, Disease Outbreak, or Big Tech Discovery.
- **Real-Life Example:** Heavy monsoon flooding or a sudden power grid failure across an entire state.

### Time Machine (Temporal Controls)
- **Simple Meaning:** The feature that lets you pause, fast-forward, jump to another day, or rewind the simulation.
- **What it does in MANNORA:** Lets users travel back in time to inspect past city events or explore alternative decisions.
- **Real-Life Example:** Rewinding or fast-forwarding a cricket match replay on your television.

### Branch Simulation (Creating Another Version)
- **Simple Meaning:** Forking the city at a specific day into two parallel copies to see "what if" a different decision was made.
- **What it does in MANNORA:** Compares what happens if you increase water supply to 130 vs leaving it at 100, without touching the original city.
- **Real-Life Example:** Planning two different career paths in a notebook to see which one works better.

---

## 5. 3D Graphics and Visualization

### Three.js
- **Simple Meaning:** A popular JavaScript software library used to draw 3D graphics inside web browsers without extra plugins.
- **What it does in MANNORA:** Draws the 3D buildings, city roads, moving people, and water bodies in your browser.
- **Real-Life Example:** Like a computer graphic engine used in 3D animated movies.

### React Three Fiber (R3F)
- **Simple Meaning:** A smart tool that lets React developers write Three.js 3D scenes using simple, readable React components.
- **What it does in MANNORA:** Allows writing `<CityScene />` and `<Buildings />` just like standard React tags.
- **Real-Life Example:** Using ready-made construction kits to assemble a miniature model city.

### Rendering
- **Simple Meaning:** The process of a computer drawing 3D shapes, lights, and textures onto your flat 2D screen.
- **What it does in MANNORA:** Renders your 3D city at smooth 60 frames per second so you can rotate and zoom cleanly.
- **Real-Life Example:** An artist painting a realistic 3D picture onto a flat canvas.

### Scene
- **Simple Meaning:** The complete 3D digital stage where all objects, lights, and cameras are placed.
- **What it does in MANNORA:** Contains all the city's district floors, towers, trees, roads, and people markers.
- **Real-Life Example:** The stage in a theatre where actors, props, and spotlights are arranged.

### Camera
- **Simple Meaning:** The virtual eye through which the user looks at the 3D world.
- **What it does in MANNORA:** Lets you zoom in on a single person or zoom out to look at the whole city skyline.
- **Real-Life Example:** A camera drone flying over a football stadium.

### Mesh
- **Simple Meaning:** A 3D digital object made of a geometric shape combined with a surface color or material.
- **What it does in MANNORA:** Every building tower, factory, and road segment is a mesh.
- **Real-Life Example:** A cardboard box painted grey to look like a tall building block.

---

## 6. Testing, Deployment and Code Quality

### Unit Testing
- **Simple Meaning:** Testing one tiny piece of code (like a single math formula) in complete isolation to verify it works correctly.
- **What it does in MANNORA:** Tests that when an agent earns 100 rupees and pays 15% tax, their take-home income is exactly 85 rupees.
- **Real-Life Example:** Testing the brake light of a motorcycle by itself before assembling the whole bike.

### Integration Testing
- **Simple Meaning:** Testing multiple systems working together to make sure they connect and communicate smoothly.
- **What it does in MANNORA:** Verifies that when a water shortage happens in the event engine, the resource and economy systems react accurately together.
- **Real-Life Example:** Testing that pressing the car accelerator pedal actually makes the engine spin the wheels.

### Build (Production Build)
- **Simple Meaning:** Compacting and packaging all your human-written source code into clean, fast files ready for live users.
- **What it does in MANNORA:** The Vite build tool packages React and CSS code into tiny files in the `client/dist/` folder.
- **Real-Life Example:** Compressing and binding loose printed pages into a neat hardcover textbook.

### Regression Testing
- **Simple Meaning:** Running existing tests after making code changes to guarantee that nothing previously working got broken.
- **What it does in MANNORA:** Running all 97 simulation tests to make sure that adding simple English labels did not break simulation calculations.
- **Real-Life Example:** Double-checking your entire bicycle after fixing a flat tyre to ensure the brakes and chain still work perfectly.

