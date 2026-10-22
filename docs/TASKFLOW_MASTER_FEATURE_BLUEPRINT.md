# TaskFlow Master Feature Blueprint (v3.1.0)
*Synthesized and Approved by the Strategic Systems, UI/UX, and Backend Architecture Syndicate*
*Governing Skills: doubt-driven-development, constraint-driven-development, security-and-hardening, ux-writing*
*Zero-Emoji Policy: STRICTLY ENFORCED (Plain ASCII, Vector SVGs, Ant Design Glyphs Only)*

---

## Executive Summary & Syndicate Consensus

TaskFlow is transitioning from a standard CRUD board to a high-throughput, enterprise-grade engineering workspace. Through Doubt-Driven Development and adversarial stress-testing across Agent 1 (UI/UX Architect), Agent 2 (Backend Architect), and Agent 3 (Strategic Systems Lead), the syndicate has formulated and validated **5 Transformative Killer Features**.

Every feature adheres to three non-negotiable architectural axioms:
1. **Deterministic Concurrency & Relational Integrity:** Microsecond SQLite transactions, Optimistic Concurrency Control (OCC), and RFC 9457 error contracts.
2. **High-Density Swiss Utilitarianism:** Zero AI-slop, zero decorative gradients, zero emojis, strict tabular typography, and equal bilingual (LTR English / RTL Arabic) parity.
3. **Resilient Failure-Mode Architecture:** Graceful offline handling, atomic bulk rollbacks, uncorrupted hot backups, and bounded event buffers.

```
+---------------------------------------------------------------------------------------------------+
|                                TASKFLOW ENTERPRISE ARCHITECTURE                                   |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ FRONTEND LAYER: Next.js 16.4 / React 19 / AntD / Tailwind ]                                    |
|  - Omni-Capture Parser (Hotkey C)      - Floating Action Dock (Multi-Select)                      |
|  - Split-Pane Inspector (J/K/H/L)      - Telemetry Ribbon (Tabular Numerals)                      |
|                                                                                                   |
|          | HTTP REST (OCC Mutations)                  ^ SSE Events (/api/projects/:id/events)     |
|          v                                            | (100-event FIFO buffer, 15s keep-alive)   |
|                                                                                                   |
|  [ BACKEND LAYER: Express 4.19 / TypeScript 5 Strict ]                                            |
|  - withTransaction (BEGIN IMMEDIATE + 3x Jittered Retry on SQLITE_BUSY)                           |
|  - OCC Version Enforcement (version = version + 1 -> RFC 9457 HTTP 409 Conflict)                 |
|  - Ephemeral Presence Registry (30s sliding heartbeat lease)                                      |
|  - Cooperative Outbox Worker (10s interval, batch 25, exponential backoff)                        |
|                                                                                                   |
|          | Synchronous Atomic Writes                  | Cooperative Polling                       |
|          v                                            v                                           |
|                                                                                                   |
|  [ PERSISTENCE LAYER: SQLite 3.45 WAL Engine ]                                                    |
|  - tasks (OCC version)       - task_activities (SHA-256 chained audit log)                        |
|  - outbox (SLA events)       - Hot Backup (VACUUM INTO) + Streaming Exporter                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 1. Feature 1: Omni-Capture Natural Language Task Engine

### 1.1 Problem Statement
Task creation via modal forms consumes 12 to 18 seconds per task, breaking developer keyboard flow with modal overlays, manual dropdown selectors, and date picker clicks.

### 1.2 UX/UI Specification
- **Activation:** Hotkey `C` triggers a floating top capture bar; alternatively, an inline `[+ Quick Task]` / `[+ مهمة سريعة]` entry row at the head of the `todo` column.
- **Natural Language Token Syntax:**
  - Standard input: `[Title text] @assignee !priority #tag due:YYYY-MM-DD`
  - Arabic input parity: supports Arabic characters, dates (`اليوم`, `غدا`, `غداً`, `بعد غد`, `الاثنين`), priority tags (`!عاجل`, `!مرتفع`, `!متوسط`), and handles (`@محمد`).
- **Interactive Disassembly & Escaping:**
  - Token extraction dynamically renders high-contrast inline chips.
  - Escaping: Title strings containing literal characters must be escaped with `\@`, `\!`, `\#` or enclosed in double quotes `"..."` (e.g. `"Fix bug in @mentions parser"`).
  - Chip Dissolution: Pressing `Backspace` adjacent to a recognized token chip dissolves it back into raw text without losing keystrokes.
- **Keyboard Trap Defense:**
  - Hotkey `C` is suppressed if `document.activeElement` is an `INPUT`, `TEXTAREA`, or `contentEditable` element.
- **Mobile Touch Parity:**
  - Persistent inline button at top of `todo` column opens full-width auto-focused capture drawer.

### 1.3 Backend & Concurrency Design
- **Endpoint:** `POST /api/projects/:id/tasks`
- **Execution:** Pure in-memory AST lexer (<2ms) parses tokens into validated schema on the client.
- **Atomic Persistence:**
  - Executes inside `withTransaction(BEGIN IMMEDIATE)`.
  - Inserts task with `version = 1`.
  - Appends `TASK_CREATED` audit record.
  - Inserts outbox event `task.created` for downstream notifications.
- **Latency Guarantee:** Optimistic insertion into board state in <16ms; background persistence roundtrip <80ms.

---

## 2. Feature 2: Multi-Card Bulk Triage, Tactile Action Dock & Atomic Reversion

### 2.1 Problem Statement
Sprint planning and backlog triage require moving, updating, or deleting tens of tasks sequentially. Without batch tooling, engineers incur dozens of repetitive roundtrips.

### 2.2 UX/UI Specification
- **Selection Ergonomics:**
  - Desktop: Single click selects; `Cmd`/`Ctrl`+Click toggles; `Shift`+Click selects contiguous range within column; `X` hotkey toggles focused card.
  - Touchscreen / Mobile: Board header includes `[Select]` / `[تحديد]` button toggling visible checkbox targets on all cards.
- **Tactile Floating Action Dock:**
  - Appears smoothly at bottom-center when `selectedCards.length >= 2`.
  - Visuals: Solid elevated surface (`#1B243B` dark / `#FFFFFF` light), 1px crisp border (`#1E293B` / `#E2E8F0`), zero glassmorphism slop.
  - Actions:
    - Status Shift: `[Move to...]` (Hotkeys `1: Todo`, `2: In Progress`, `3: Done`)
    - Priority Override: `[Priority]` (Hotkeys `P` then `H`/`M`/`L`)
    - Assignee Batch Assignment: `[Assign to...]` (Hotkey `A`)
    - Due Date Batch Shift: `[Set Date]` (Hotkey `D`)
    - Batch Delete: `[Delete...]` with confirmation dialog (Hotkey `Backspace`)
- **Drag-and-Drop Conflict Guard:**
  - Dragging any card while multiple cards are selected operates exclusively on the single dragged card; batch selection is cleanly preserved or cleared.
- **6-Second Unified Undo Toast:**
  - Unified notification: `12 tasks moved to In Progress. [Undo (6s)]` / `تم نقل 12 مهمة إلى قيد التنفيذ. [تراجع (6 ثوانٍ)]`.

### 2.3 Backend & Concurrency Design
- **Endpoint:** `PATCH /api/projects/:id/tasks/bulk`
- **Payload:**
  ```json
  {
    "taskIds": ["task-101", "task-102", "task-103"],
    "updates": {
      "status": "in_progress",
      "priority": "high"
    },
    "expectedVersions": {
      "task-101": 2,
      "task-102": 5,
      "task-103": 1
    }
  }
  ```
- **Atomic All-or-Nothing Guarantee:**
  - Pre-validates project access and permissions in memory under read lock.
  - Enters `withTransaction(BEGIN IMMEDIATE)`.
  - Verifies all `expectedVersions`. If ANY version mismatches, aborts transaction completely and returns HTTP 409 Conflict with `{ conflictingTaskIds: [...] }`.
  - Atomically updates all target tasks and appends lean `TASK_BULK_UPDATED` entries to `task_activities`.
  - Emits single consolidated SSE event `tasks_bulk_updated`.
- **Atomic Undo Endpoint:** `POST /api/projects/:id/tasks/bulk-revert` restoring the exact pre-mutation snapshots in a forward-mutating transaction.

---

## 3. Feature 3: Focused Split-Pane Inspector & Linear-Grade Keyboard Traversal

### 3.1 Problem Statement
Full-page modal dialogs or wide sliding drawers break context, obscure adjacent Kanban columns, and prevent rapid sequential review of tasks during standups and reviews.

### 3.2 UX/UI Specification
- **Home-Row Traversal Engine:**
  - `J` / `DownArrow`: Move focus to card below in active column.
  - `K` / `UpArrow`: Move focus to card above in active column.
  - `H` / `LeftArrow` and `L` / `RightArrow`: Move focus laterally across Kanban columns.
  - **RTL Parity Rule:** When `dir="rtl"` is active, `H` and `L` invert visual direction so that left/right keys navigate along natural visual flow.
  - `Space` / `Enter`: Toggle docked Split-Pane Inspector for currently focused card.
  - `Escape`: Close inspector and return high-contrast focus ring to active card.
- **Fluid Viewport Adaptivity:**
  - `Width >= 1600px`: True docked split-pane (70% Kanban canvas, 30% Inspector panel). Zero horizontal clipping.
  - `1024px <= Width < 1600px`: Fluid overlay drawer with responsive canvas push and horizontal track panning.
  - `Width < 1024px`: Full-width tactile sheet drawer with top drag handle and touch-dismiss gesture.
- **Inspector Panel Components:**
  - Inline editable task title and rich markdown description preview/editor.
  - Checklist item progress bar with strict tabular numerals (`font-variant-numeric: tabular-nums`).
  - Chronological audit history feed (who changed status, priority, or assignment, and when).
  - RFC 9457 Mid-Air Collision Resolution Banner: Appears if task was modified concurrently by another user, presenting side-by-side diff buttons: `[Keep Server Version]` vs `[Overwrite]`.

### 3.3 Backend & Concurrency Design
- **Endpoint:** `GET /api/projects/:id/tasks/:taskId/audit`
- Returns chronological list of activity records with author display names and diff payloads.
- **Optimistic Concurrency Control (OCC):**
  - Mutating updates send header `If-Match: "version-<N>"` or JSON payload `{ version: <N> }`.
  - Server executes:
    `UPDATE tasks SET title = ?, ..., version = version + 1 WHERE id = ? AND version = ?;`
  - Zero rows affected triggers RFC 9457 `application/problem+json` with status 409 Conflict.

---

## 4. Feature 4: Real-Time SSE Synchronization & Ephemeral Presence Beacon

### 4.1 Problem Statement
Without real-time multi-user synchronization, team members work on stale board states, causing silent overwrite collisions and blind duplicate assignments.

### 4.2 Architectural Design
- **Transport: Server-Sent Events (SSE):**
  - Route: `GET /api/projects/:id/events`
  - Unidirectional HTTP stream chosen over WebSockets: zero custom protocol overhead, native HTTP/2 multiplexing, standard JWT authorization headers, and automatic browser reconnection via `Last-Event-ID`.
- **Proxy Keep-Alive & Leak Prevention:**
  - Background 15-second heartbeat timer writes comment lines `: ping\n\n` directly to the socket, preventing proxy timeouts (NGINX/Cloudflare).
  - `req.on('close')` immediately removes client stream listener and deregisters user presence from memory.
- **In-Memory 100-Event FIFO Ring Buffer:**
  - Each active project maintains an event ring buffer capped at 100 items.
  - If a disconnected client reconnects with `Last-Event-ID: <seq>` within the buffer, the server streams only missed events.
  - If `<seq>` is older than the oldest buffered event, the server emits `event: sync_required`, prompting a clean background REST refetch.
- **Ephemeral Presence Beacon:**
  - Route: `POST /api/projects/:id/presence` with `{ taskId, action: "viewing" | "editing" }`.
  - Ephemeral 30-second sliding expiration window. If tab closes or misses 2 heartbeats, presence record expires cleanly.
  - Visual Representation: High-contrast monospace initials badge (`TF`, `JM`) rendered on cards and inspector header indicating active collaborators.

---

## 5. Feature 5: Dynamic WIP Limits, Cryptographic Audit Trail & Outbox SLA Dispatcher

### 5.1 Dynamic Work-in-Progress (WIP) Limits & Sprint Telemetry Ribbon
- **WIP Governance:**
  - Configurable soft WIP limits per column stored in project settings (e.g. `wip_limits: { in_progress: 5, review: 3 }`).
  - Visual States:
    - Normal: Monospace fraction counter (`3 / 5`).
    - Exceeded: Amber/Crimson header state, alert badge (`6 / 5 - Limit Exceeded`).
    - Soft by default: User can drop card with an unobtrusive confirmation warning. Hard blockage is strictly opt-in (`strict_wip_enforcement: true`).
- **Sprint Telemetry Ribbon:**
  - High-density header bar displaying 4 concrete, verified metrics:
    1. Scope: Total active cards (`tabular-nums font-mono`).
    2. Active WIP Ratio: Total in-flight tasks vs capacity.
    3. Overdue Rate: Percentage of active tasks past due date.
    4. Lead Time / Cycle Time: Median hours from creation to `done`.
  - Strictly tabular numerals; zero vanity sparklines or decorative gradient fills.

### 5.2 Cryptographically Chained Audit Trail & Time-Travel Reversion
- **Schema: `task_activities`**
  ```sql
  CREATE TABLE IF NOT EXISTS task_activities (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    diff_payload JSON NOT NULL,
    snapshot JSON,
    sequence_number INTEGER NOT NULL,
    prev_hash TEXT,
    current_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
  );
  ```
- **Storage Optimization:**
  - Lean diff storage for routine mutations (`{ "field": "status", "from": "todo", "to": "in_progress" }`).
  - Full `snapshot` stored only on creation and transition to terminal `done`.
- **Tamper Evidence:**
  - `current_hash = SHA256(prev_hash + sequence_number + task_id + action + diff_payload)`.
- **Time-Travel Reversion:**
  - Route: `POST /api/projects/:id/tasks/:taskId/revert/:activityId`
  - Executes atomic forward-mutation restoring historical snapshot with incremented version and new audit record.

### 5.3 Transactional Outbox Pattern & Background SLA Worker
- **Schema: `outbox`**
  ```sql
  CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSON NOT NULL,
    scheduled_for TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    processed_at TEXT,
    created_at TEXT NOT NULL
  );
  ```
- **Cooperative In-Process Worker:**
  - Configured with `PRAGMA wal_autocheckpoint = 1000;`.
  - Runs on 10-second cooperative timer with `unref()`.
  - Processes `LIMIT 25` pending items per batch.
  - Automatically calculates deadline warnings, overdue status flags, and SLA breach events without burdening client mutation requests.

### 5.4 Hot Point-in-Time Backup & Data Sovereignty
- **Online Hot Backup:**
  - Route: `POST /api/admin/backup`
  - Executes SQLite `VACUUM INTO ?;` producing an uncorrupted, fully checkpointed copy of the database file on disk without locking concurrent readers or writers.
- **Streaming Data Exporter:**
  - Route: `GET /api/projects/:id/export?format=json|csv`
  - Streamed response handling thousands of tasks with bounded RAM usage.

---

## 6. Implementation Matrix & Rollout Phases

| Phase | Milestone | Primary Components | Owner Agent | Verification Criteria |
|---|---|---|---|---|
| **Phase 1** | Relational OCC, Audit Schema & Bulk Mutation | `server/src/config/database.ts`, `server/src/controllers/tasksController.ts`, `server/src/routes/tasks.ts` | Agent 2 | Zero lost updates under concurrent load; atomic bulk rollback on version mismatch; SQLite busy timeout < 5000ms. |
| **Phase 2** | Omni-Capture Parser & Natural Language AST | `src/components/kanban/OmniCaptureBar.tsx`, `src/lib/syntaxParser.ts`, `src/components/kanban/KanbanBoard.tsx` | Agent 1 | English & Arabic syntax parsed in <2ms; literal escaping verified; hotkey C disabled during text input. |
| **Phase 3** | Bulk Triage, Action Dock & Multi-Selection | `src/components/kanban/BulkActionDock.tsx`, `src/components/kanban/KanbanCard.tsx`, `src/services/dataStore.ts` | Agent 1 | Shift-click contiguous selection; 6s undo toast; batch atomic commit via single PATCH call. |
| **Phase 4** | Split-Pane Inspector & J/K/H/L Keyboard Traversal | `src/components/kanban/TaskSplitInspector.tsx`, `src/components/kanban/KanbanBoard.tsx` | Agent 1 | Docked on >=1600px; responsive push on 1024-1599px; RTL keyboard mirroring; RFC 9457 diff banner. |
| **Phase 5** | Real-Time SSE Stream & Ephemeral Presence | `server/src/services/eventStream.ts`, `src/hooks/useProjectEvents.ts`, `server/src/routes/events.ts` | Agent 2 | Multi-tab live card sync; 15s keep-alive ping; clean socket teardown on disconnect; presence leases. |
| **Phase 6** | Dynamic WIP Telemetry & Outbox SLA Dispatcher | `server/src/services/outboxWorker.ts`, `src/components/kanban/SprintTelemetryRibbon.tsx` | Agent 2 & Agent 1 | Tabular-nums telemetry ribbon; soft WIP warning indicator; background SLA alert processing without lock contention. |

---

## 7. Quality Standards & Anti-Slop Charter Compliance

- **Zero Emojis:** Confirmed. All status indicators use Ant Design icons (`CheckCircleOutlined`, `ClockCircleOutlined`, `ExclamationCircleOutlined`, `ArrowUpOutlined`) or text badges.
- **Bilingual Parity:** Confirmed. Every feature has full Arabic (RTL) and English (LTR) UX copy, date parser support, and keyboard mirroring.
- **Visual Stance:** Precision Swiss Foundry (`#F8FAFC` porcelain / `#090D16` carbon), 1px hairline borders, monospaced tabular numerals, zero SaaS ambient blurs or purple gradients.
- **Performance:** AST parser <2ms; board mutation optimistic UI <16ms; backend OCC write transaction <15ms; memory footprint bounded.
