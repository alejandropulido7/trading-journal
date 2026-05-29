# Project Context: Trading Journal

This document provides a comprehensive overview of the `trading-journal` project, designed to give AI agents and developers full context of the architecture, tech stack, business logic, and coding standards.

---

## 1. Project Overview
A full-stack application for traders to journal their trades, track performance across multiple accounts (Prop Firms/Personal), and manage trading strategies and ideas. It synchronizes trades from MetaTrader 5 (MT5) via a VPS.

## 2. Tech Stack

### Backend
- **Language:** Python 3.x
- **Framework:** FastAPI
- **ORM:** SQLAlchemy (PostgreSQL)
- **Validation:** Pydantic
- **Security:** Custom encryption for account passwords (`cryptography`).
- **Storage:** Local filesystem for uploaded evidence images (`/uploads`).

### Frontend
- **Framework:** Next.js (App Router, React 19)
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **API Client:** Axios
- **State Management:** React Hooks (native)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Database:** PostgreSQL 15
- **External Integration:** MT5 VPS API for trade synchronization.

---

## 3. Architecture & Coding Patterns

### Backend Structure
Following a **Controller-Service-Repository** pattern:
- `main.py`: Entry point, app initialization, and global routes/middleware.
- `controller/`: API Route definitions (e.g., `account_controller.py`).
- `services/`: Business logic layer (e.g., `account_service.py`).
- `repositories/`: Data access layer (e.g., `account_repository_postgress.py`).
- `models/`: Domain models (SQLAlchemy).
- `schemas/`: Pydantic models for request/response validation.

### Frontend Structure
- `app/`: Next.js App Router pages.
- `app/[feature]/page.tsx`: Main page for a feature.
- `app/[feature]/components/`: Feature-specific components.
- `components/ui/`: Base shadcn/ui components.
- `lib/`: Utility functions (e.g., `utils.ts` for Tailwind merge).

---

## 4. Business Logic & Entities

### Accounts (`Account`)
- Manages connection to MT5 (login, server, password).
- Tracks financial data: `initial_balance`, `current_balance`, `target_percent`.
- Risk Management: `daily_drawdown_limit`, `max_drawdown_limit`, `risk_per_trade`.
- Outcome tracking: `Phase 1`, `Phase 2`, `Funded`, `Lost`.

### Trades (`Trade`)
- Synchronized from MT5.
- Journaling fields: `emotion`, `mistake`, `notes`.
- Linked to a `Strategy` and a `TradeIdea`.

### Strategies (`Strategy`)
- Definition of a trading system.
- Contains `StrategyItem` (conditions like "RSI < 30" with specific weights).

### Trade Ideas (`TradeIdea`)
- Pre-trade analysis.
- **Checklist:** Uses `StrategyItem` to verify if the plan is met.
- **Evidence:** `TimeframeEvidence` stores notes and images per timeframe (e.g., 1H, 15M).
- **Status:** `DRAFT`, `EXECUTED`, `DISCARDED`.

---

## 5. Database Schema (Table Relationships)

- **Account 1:N Trade:** An account has multiple trades.
- **Server:** Simple lookup for MT5 server names/aliases.
- **Strategy 1:N StrategyItem:** A strategy is composed of multiple conditions.
- **TradeIdea 1:1 Strategy:** An idea is based on a specific strategy.
- **TradeIdea 1:N TradeIdeaItem:** Tracks the checklist status for an idea.
- **TradeIdea 1:N TimeframeEvidence:** Stores analysis images/notes.
- **Trade N:1 Emotion/Mistake/Strategy/TradeIdea:** Trades are categorized by these entities for analysis.

---

## 6. Design System (Colors & UI)

The project uses **Tailwind CSS 4** with the **OKLCH** color space for better perceptual uniformity.

### Core Palette (from `globals.css`):
- **Background:** White (`oklch(1 0 0)`) / Dark Gray (`oklch(0.147 0.004 49.25)`)
- **Primary:** Dark Blue/Blackish (`oklch(0.216 0.006 56.043)`)
- **Destructive:** Red (`oklch(0.577 0.245 27.325)`)
- **Radius:** `0.625rem`

### Components
- Uses **shadcn/ui** for high-quality, accessible primitives.
- Dark mode is supported via the `.dark` class.

---

## 7. Operational Notes
- **Seeding:** The backend automatically seeds default `Emotions` and `Mistakes` on startup if the tables are empty.
- **Environment Variables:**
    - `DATABASE_URL`: Connection string for Postgres.
    - `VPS_MT5_URL`: API endpoint for trade syncing.
    - `VPS_API_KEY`: Authentication for the VPS API.
- **Static Files:** Analysis images are served from the `/uploads` directory via FastAPI `StaticFiles`.

---

## 8. Coding Standards
- **Naming:** CamelCase for frontend components, snake_case for backend functions/variables.
- **Types:** Strict TypeScript on frontend; Pydantic/Type Hints on backend.
- **Modularity:** Keep business logic in `services`, not in controllers or models.
- **Error Handling:** Use custom exceptions (e.g., `BusinessLogicError`) to return consistent error responses.
