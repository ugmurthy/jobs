# JobRunner System Architecture

This document provides a series of diagrams illustrating the architecture of the JobRunner system, starting from a high-level overview and then detailing each of the core components.

## 1. High-Level System Overview

This diagram shows the primary components of JobRunner and how they interact with each other and with external systems.

```mermaid
graph TD
    subgraph "External Actors"
        U[User]
        ES[External System]
    end

    subgraph "JobRunner Ecosystem"
        direction LR
        A_FRONTEND[Jobs Client - Frontend]
        A_BACKEND[Backend Service]
        A_HANDLER[Job Handler System]
    end

    subgraph "Shared Infrastructure"
        A_DB[(Database)]
        A_REDIS[Redis / BullMQ]
    end

    U -- "Manages & Monitors Jobs" --> A_FRONTEND
    ES -- "Submits Jobs via API" --> A_BACKEND

    A_FRONTEND -- "REST API & WebSockets" --> A_BACKEND
    A_BACKEND -- "Adds/Updates Jobs" --> A_REDIS
    A_BACKEND -- "Reads/Writes App Data" --> A_DB
    A_HANDLER -- "Picks up & Processes Jobs" --> A_REDIS
```

---

## 2. Backend Service Architecture

This diagram details the internal components of the Backend Service.

```mermaid
graph TD
    subgraph "Inbound Connections"
        B_CLIENT[Jobs Client]
        B_EXTERNAL[External System]
    end

    subgraph "Backend Service"
        direction TB
        B_API[RESTful API]
        B_WS[WebSocket Server]
        B_AUTH[Authentication Middleware <br> JWT & API Key]
        B_FLOW[Job Flow Manager]
        B_SCHEDULER[Job Scheduler]
        B_DASH[Bull Board UI]
    end

    subgraph "Data Stores"
        B_DB[(Database)]
        B_REDIS[Redis / BullMQ]
    end

    B_CLIENT -- "API Calls" --> B_API
    B_CLIENT -- "WebSocket Connection" --> B_WS
    B_EXTERNAL -- "API Calls" --> B_API

    B_API -- "Secure Endpoints" --> B_AUTH
    B_API -- "Manages Data" --> B_DB
    B_API -- "Manages Jobs" --> B_SCHEDULER

    B_SCHEDULER -- "Adds/Schedules Jobs" --> B_REDIS
    B_FLOW -- "Creates Job Chains" --> B_REDIS
    B_DASH -- "Monitors Queues" --> B_REDIS
    B_WS -- "Listens for Job Events" --> B_REDIS
    B_WS -- "Pushes Updates" --> B_CLIENT
```
---

## 3. Job Handler System Architecture

This diagram illustrates the architecture of the standalone Job Handler System.

```mermaid
graph TD
    subgraph "Job Queue"
        H_REDIS[Redis / BullMQ]
    end

    subgraph "Job Handler System"
        direction TB
        H_WORKER[Multi-Queue Worker]
        H_REGISTRY[Handler Registry]
        H_WATCHER[Hot Reloading Watcher]
        H_PLUGIN[Plugin Manager]
        
        subgraph "Job Handlers"
            H_CORE[Core Handlers]
            H_CUSTOM[Custom Handlers]
            H_PLUGIN_HANDLERS[Plugin Handlers]
        end
    end

    
    H_WATCHER -- "Monitors Files for Changes" --> H_REGISTRY

    H_WORKER -- "Fetches Jobs" --> H_REDIS
    H_WORKER -- "Uses Handler" --> H_REGISTRY
    H_REGISTRY -- "Loads" --> H_CORE & H_CUSTOM & H_PLUGIN_HANDLERS

    H_PLUGIN -- "Discovers & Loads Plugins" --> H_PLUGIN_HANDLERS    
```
---

## 4. Jobs Client (Frontend) Architecture

This diagram shows the structure of the Jobs Client.

```mermaid
graph TD
    subgraph "User"
        C_USER[User]
    end

    subgraph "Jobs Client (React Application)"
        direction TB
        C_PAGES[Pages & Routing]
        
        subgraph "Features"
            C_DASH[Dashboard]
            C_JOBS[Job Management]
            C_SCHEDULER[Scheduler]
            C_AUTH[Authentication UI]
        end

        subgraph "Core Client Logic"
            C_API[API Service]
            C_SOCKET[WebSocket Client]
            C_STATE[State Management]
        end
    end

    subgraph "Backend"
        C_BACKEND[Backend Service]
    end

    C_USER -- "Interacts with" --> C_PAGES

    C_PAGES -- "Renders" --> C_DASH & C_JOBS & C_SCHEDULER & C_AUTH
    C_DASH & C_JOBS & C_SCHEDULER -- "Uses" --> C_API & C_SOCKET
    C_AUTH -- "Uses" --> C_API

    C_API -- "HTTP/S Requests" --> C_BACKEND
    C_SOCKET -- "Real-time Connection" --> C_BACKEND
    C_STATE -- "Caches Data for" --> C_PAGES
