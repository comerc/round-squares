# Project Context

## Purpose
"The Last of Guss" is a browser-based game where players compete by tapping a virtual goose to earn points. It features real-time updates, user rankings, and special game rules.

## Tech Stack
### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Fastify
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Language:** TypeScript (Strict mode)
- **Real-time:** Fastify WebSocket

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **State Management:** Zustand
- **UI Library:** Ant Design
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Language:** TypeScript

### Infrastructure
- **Containerization:** Docker & Docker Compose

## Project Conventions

### Code Style
- **TypeScript:** Strict mode enabled.
- **Frontend Naming:**
  - Components: PascalCase (`UserCard.tsx`)
  - Hooks: camelCase with `use` prefix (`useAuth.ts`)
  - Utils: camelCase (`formatDate.ts`)
  - Pages: PascalCase with `Page` suffix (`IndexPage.tsx`)
  - Layouts: PascalCase with `Layout` suffix (`AppLayout.tsx`)
- **Backend:**
  - Standard Node.js/Fastify patterns.
  - ESM modules (`type: "module"`).

### Architecture Patterns
- **Frontend:**
  - Feature-based folder structure (though `src/` has flat `components`, `pages`, `stores` layout).
  - Optimistic UI updates for tapping interactions.
  - Centralized state via Zustand stores (`authStore`, `roundsStore`, `tapStore`).
- **Backend:**
  - **Stateless Architecture:** JWT in HTTP-only cookies; no server-side sessions.
  - **Concurrency Control:** `SELECT FOR UPDATE` (pessimistic locking) to prevent race conditions during taps.
  - **Multi-Instance Sync:** Uses PostgreSQL `LISTEN/NOTIFY` (Pub/Sub) to broadcast WebSocket events across instances without Redis.
  - Controller/Service/Repository pattern (implied by `routes/`, `db/` structure).
  - WebSocket for real-time events (`round:update`, `user:score`, `round:status`).
- **Database:**
  - Schema management via Drizzle.
  - Migrations for schema changes.

### Testing Strategy
- **Linting:** ESLint configured for frontend.
- **Manual Testing:** Seed scripts provided (`npm run seed`) with pre-configured users (admin, regular players, special roles).

### Git Workflow
- **Issue Tracking:** managed via `bd` (Beads).
- **Spec-Driven:** Workflow follows `OpenSpec` -> `Beads` -> `Code` cycle.
- **Branches:** Feature branches linked to Change IDs (e.g., `2FA-3`).
- **Commits:** Standard git commits; push requires `bd sync`.

## Domain Context
- **Game Mechanics:**
  - 1 tap = 1 point.
  - Every 11th tap = 10 points (bonus).
  - Taps only count during active rounds.
- **Roles:**
  - `admin`: Can create rounds.
  - `player`: Regular participant.
  - Special roles (e.g., "Никита" whose taps count as 0).
- **Entities:**
  - `Round`: A timed competition session.
  - `Tap`: An action performed by a user in a round.
  - `User`: Participant with roles and stats.

## Important Constraints
- **Environment:** Requires Docker for database.
- **Node Version:** 18+ required.
- **Language:** TypeScript is mandatory for both ends.

## External Dependencies
- **PostgreSQL:** Primary data store (v15+ recommended via Docker).
