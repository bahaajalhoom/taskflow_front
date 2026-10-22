# TaskFlow - Enterprise Project and Task Management System

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Node.js 22](https://img.shields.io/badge/Node.js-22.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![TypeScript 5 Strict](https://img.shields.io/badge/TypeScript-5.x%20Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 3.4](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Ant Design 5](https://img.shields.io/badge/Ant%20Design-5.x-0170FE?style=flat-square&logo=ant-design)](https://ant.design/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Live Application: [taskflow.apps.taqat.academy](https://taskflow.apps.taqat.academy/)  
Engineer Skills Portfolio: [skill-ps.apps.taqat.academy](https://skill-ps.apps.taqat.academy/)

---

## Overview

TaskFlow is a production-grade, bilingual project execution platform designed for software teams that value speed, clarity, and architectural discipline. It combines an ultra-fast Next.js 15 frontend with a dedicated Node.js and SQLite WAL backend to deliver sub-10ms response times without cloud vendor lock-in.

Built with an anti-slop design philosophy, TaskFlow replaces generic SaaS templates with a focused Swiss minimalist aesthetic, tactile micro-interactions, complete keyboard navigation, and genuine role-based access control.

---

## Visual Showcase

### Desktop Workspace and Hero
![TaskFlow Desktop Hero](public/screenshots/hero_desktop.png)

### Obsidian Dark Mode Kanban Board
![TaskFlow Kanban Board](public/screenshots/kanban_board.png)

### Minimalist Authentication and Evaluation Personas
![TaskFlow Login](public/screenshots/login_screen.png)

### Responsive Mobile Interface
<p align="center">
  <img src="public/screenshots/mobile_view.png" alt="TaskFlow Mobile View" width="380" />
</p>

---

## Key Capabilities

### 1. High-Velocity Kanban and Task Management
- Three-column workflow: To Do, In Progress, and Done with smooth drag-and-drop mechanics.
- Real-time task filtering by priority, assignee, status, and search query.
- Monospace task keys (`TF-101`) and hardware-inspired priority signals (Low, Medium, High, Urgent).
- Non-modal slide-over drawer for deep task inspection and inline editing.

### 2. Multi-Tier Role-Based Access Control (RBAC)
- **Owner**: Full workspace authority, member invitation, role assignment, and project deletion.
- **Maintainer**: Elevated team management, task orchestration, and sprint curation.
- **Member**: Create, assign, and update personal workflow items.
- **Viewer**: Read-only oversight with strict mutation guard rails.

### 3. Full Bilingual Parity (Arabic RTL and English LTR)
- Zero-latency layout switching between Arabic (IBM Plex Sans Arabic) and English.
- Complete bidirectional alignment with optical spacing and zero clipped strings.
- Localized date formatting, currency symbols, and status tags.

### 4. Enterprise-Grade Security and Resilience
- 100% parameterized SQL queries protecting against injection vulnerabilities.
- Dual-tier registration rate limiting using encrypted cookies and IP-level escalation.
- Hardened HTTP response headers via Helmet (CSP, HSTS, X-Frame-Options).
- Standardized RFC 9457 Problem Details error responses.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19
- **Typography and Components**: Ant Design 5 + IBM Plex Sans Arabic + Cairo
- **Styling**: Tailwind CSS with custom high-contrast surface tokens (Obsidian and Pearl)
- **State and Cache**: Context API with optimistic updates and session storage caching
- **Interactions**: Emil Kowalski tactile button physics (`active:scale-[0.98]`)

### Backend
- **Runtime**: Node.js 22 LTS
- **Server Framework**: Express with TypeScript 5 (Strict Mode)
- **Database**: SQLite 3 with Write-Ahead Logging (`PRAGMA journal_mode = WAL`)
- **Authentication**: JWT with bcrypt hashing (12 rounds)
- **Validation**: Zod schema validation on all incoming mutations
- **Security**: Helmet, CORS whitelist, Morgan logging, Custom RFC 9457 error boundary

---

## Project Structure

```text
TaskFlow/
├── public/                 # Static assets, icons, screenshots, and OG image
│   ├── favicon.ico
│   ├── og-image.png        # Social sharing banner (WhatsApp / Twitter)
│   └── screenshots/        # High-resolution application screenshots
├── src/                    # Frontend Next.js 15 application
│   ├── app/                # App Router pages and layouts
│   │   ├── dashboard/      # Project overview and metrics
│   │   ├── login/          # Authentication with 1-click evaluation personas
│   │   ├── projects/       # Kanban board, table view, and settings
│   │   ├── register/       # User onboarding with role selection
│   │   ├── globals.css     # Semantic tokens, typography, and scrollbars
│   │   └── layout.tsx      # Root layout, metadata, and Open Graph tags
│   ├── components/         # Modular UI components
│   │   ├── kanban/         # Kanban card, detail drawer, and timeline
│   │   ├── layout/         # Unified navbar and responsive sidebar
│   │   └── ui/             # Command palette, signal badges, and skeletons
│   ├── context/            # Global Auth, Theme, and Language providers
│   ├── lib/                # API client and date utilities
│   ├── services/           # DataStore and Web Notification services
│   └── types/              # Unified TypeScript definitions
├── server/                 # Standalone Express SQL Backend
│   ├── data/               # Persistent SQLite WAL database file
│   └── src/
│       ├── config/         # Database connection and environment config
│       ├── controllers/    # Vertical-slice controllers (Tasks, Projects, Auth)
│       ├── middlewares/    # Security headers, auth verification, error handler
│       ├── routes/         # REST API route endpoints
│       └── validators/     # Zod request validation schemas
└── docs/                   # Architectural documentation and ADRs
```

---

## Architecture Standards: 6-Zone File Layout

Every major frontend and backend file strictly adheres to the 6-Zone File Layout:

1. **Zone 1: Imports** - Organized third-party and internal module imports.
2. **Zone 2: Configuration and Styles** - All editable labels, URLs, and style dictionaries centralized at the top.
3. **Zone 3: Types and Interfaces** - Explicit, readable TypeScript contracts without type gymnastics.
4. **Zone 4: Helper Functions and Hooks** - Pure utilities, date formatters, and custom hooks.
5. **Zone 5: Sub-Components** - Focused, single-purpose presentational components.
6. **Zone 6: Main Component** - High-level layout with early return guard clauses.

---

## REST API Reference

All API routes are prefixed with `/api`. Protected routes require a valid `Bearer <token>` in the `Authorization` header.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service health, SQLite engine, and security status |
| `POST` | `/auth/register` | Public | Account registration with rate-limiting guard |
| `POST` | `/auth/login` | Public | Authenticate user and issue JWT |
| `GET` | `/projects` | Authenticated | List all projects belonging to user (batch-loaded) |
| `POST` | `/projects` | Authenticated | Create a new project workspace |
| `GET` | `/projects/:id` | Authenticated | Fetch project details and member roster |
| `PATCH` | `/projects/:id` | Owner Only | Update project metadata and settings |
| `DELETE` | `/projects/:id` | Owner Only | Delete project and cascade-delete all tasks |
| `POST` | `/projects/:id/members` | Owner / Maintainer | Invite team member by email |
| `PATCH` | `/projects/:id/members/:uid` | Owner / Maintainer | Update member role |
| `DELETE` | `/projects/:id/members/:uid` | Owner Only | Remove member from project |
| `GET` | `/projects/:id/tasks` | Authenticated | Fetch tasks for a project |
| `POST` | `/projects/:id/tasks` | Non-Viewer | Create a new task in the project |
| `PATCH` | `/projects/:id/tasks/:taskId` | Authenticated | Update task attributes or status |
| `DELETE` | `/projects/:id/tasks/:taskId` | Owner / Creator | Delete a task |

---

## Local Setup and Installation

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher

### 1. Clone the Repository
```bash
git clone git@github.com:bahaajalhoom/taskflow_task.git
cd taskflow_task
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api
```

Create `server/.env`:
```env
PORT=5001
JWT_SECRET=your_secure_development_secret_key_minimum_32_characters
NODE_ENV=development
```

### 4. Run the Development Servers
```bash
# Terminal 1: Start the backend service
cd server
npm run dev

# Terminal 2: Start the Next.js frontend
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5001`.

---

## Verification and Quality Checks

To verify code quality and TypeScript compilation without producing production builds:

```bash
# Verify frontend type integrity
npx tsc --noEmit

# Verify backend type integrity
cd server
npx tsc --noEmit
```

---

## Author and Credits

Engineered by Ahmad Jalhoom.  
Portfolio: [skill-ps.apps.taqat.academy](https://skill-ps.apps.taqat.academy/)  
Live Deployment: [taskflow.apps.taqat.academy](https://taskflow.apps.taqat.academy/)
