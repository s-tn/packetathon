# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a hackathon registration and team management system ("BT Hackathon") with two separate frontends:
- **Elm** (`elm/`): Public-facing website pages (landing, sponsors, photos, event info)
- **SolidJS** (`src/`): Registration flow and user dashboard

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (serves both frontends)
npm run build        # Production build
npm run serve        # Preview production build
```

### Elm Frontend
```bash
npm run elm          # Compile Elm to elm.js (from elm/src/Main.elm)
cd elm && elm make src/Main.elm --output=../elm.js  # Manual compilation
```

### Database (Prisma + SQLite)
```bash
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <migration_name>  # Create and apply migration
npx prisma studio    # Open database GUI
```

Database is SQLite stored at `prisma/dev.db`.

## Architecture

### API Layer
All API routes are defined in `vite-plugin-auth.ts` as Express middleware attached to Vite's dev server. This single file handles:
- Authentication (login/logout, sessions via express-session)
- User/team management
- Email verification (SendGrid)
- CSV export for admin

API routes follow the pattern `/api/<endpoint>` and are processed before Vite's static file serving.

The `src/api/` directory exists for `vite-plugin-api-routes` but most actual API logic lives in `vite-plugin-auth.ts`.

### Frontend Routing
- Routes starting with `/signup/dashboard` → `Dashboard.jsx`
- Other `/signup/*` routes → `App.jsx` (registration flow)
- All other routes → Elm app (compiled to `elm.js`, served via `index.html`)

### Database Models (Prisma)
Key models in `prisma/schema.prisma`:
- `User`: Participants with auth, profile info, and parent contacts
- `Team`: Hackathon teams with leader, members, and project info
- `Registration`: Links users to teams with status
- `Request`: Join requests from users to teams
- `School`/`Major`: Configuration for school/major dropdowns
- `Category`: Hackathon project categories

### UI Components
SolidJS components are in `src/components/ui/` using Kobalte primitives with Tailwind CSS. These follow the shadcn/ui pattern adapted for SolidJS.

## Environment

Requires `sendgrid.env` with `SENDGRID_API_KEY` for email functionality.
