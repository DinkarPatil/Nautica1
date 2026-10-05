# GlimmoraNautica — Maritime Intelligence Platform

**Sovereign-grade AGI-native maritime & logistics intelligence operating system.**

Built with Next.js 14 App Router · TypeScript · Tailwind CSS · Recharts · React Simple Maps

---

## What Is Built

A fully functional multi-user maritime intelligence dashboard with:

- **RBAC authentication** — 6 distinct maritime roles with scoped access
- **6 intelligence pages** — each protected at 3 levels (middleware, page guard, UI gates)
- **Mock data** — 100 vessels, 20 global ports, 15 risk alerts, 10 trade documents, 20 AGI decisions
- **Live-feeling UI** — real-time UTC clock, animated KPIs, scrolling AGI ticker, map
- **Moda Glimmora design system** — ivory/sand/gold palette, Cormorant Garamond + Outfit fonts

---

## Running the App

```bash
cd frontend
npm run dev        # http://localhost:3000
npm run build      # production build
```

The app redirects unauthenticated users to `/login` automatically.

---

## Demo Accounts

All passwords: **`demo`**

| Email | Role | Label | Access Level |
|---|---|---|---|
| `admiral@glimmora.com` | `admiral` | Fleet Admiral | Full access — everything |
| `manager@glimmora.com` | `fleet_manager` | Fleet Manager | All pages, no user management |
| `trader@glimmora.com` | `trade_officer` | Trade Officer | Trade, Fleet (position only), AGI (trade) |
| `analyst@glimmora.com` | `risk_analyst` | Risk Analyst | Risk, AGI, Fleet, Ports (view) |
| `port@glimmora.com` | `port_agent` | Port Agent | Port Operations only |
| `audit@glimmora.com` | `auditor` | Auditor | All pages read-only, no action buttons |

---

## Pages & Access by Role

### `/dashboard` — Executive Bridge
All roles can access this page. Content is filtered by role:

| What | Who sees it |
|---|---|
| Full KPI strip (all 6 cards) | Admiral, Fleet Manager |
| AGI Intelligence Ticker | Admiral, Fleet Manager, Risk Analyst, Trade Officer |
| Risk Snapshot panel | Admiral, Fleet Manager, Risk Analyst |
| Congestion Chart | Admiral, Fleet Manager, Trade Officer, Port Agent, Risk Analyst |
| Fleet Status (hardcoded) | All roles |

---

### `/fleet` — Fleet Intelligence
**Blocked for:** *(all roles can view — but content differs)*

| What | Who sees it |
|---|---|
| Full vessel table with all columns | All roles |
| AGI Recommendation in detail panel | Admiral, Fleet Manager, Risk Analyst, Trade Officer |
| Vessel position/route detail | All roles |

**Blocked at middleware:** Port Agent sees fleet but only assigned vessels in real implementation (mock shows all).

---

### `/ports` — Port Operations
**Blocked for:** none (all roles can view)

| What | Who sees it |
|---|---|
| Throughput chart + port cards | All roles |
| Full congestion + queue data | All roles |

Port Agents are intended to see only their assigned ports in a real backend integration.

---

### `/risk` — Risk & Sanctions
**Blocked at route level for:** `trade_officer`, `port_agent`

| What | Who sees it |
|---|---|
| Sanctions screening tool | Admiral, Fleet Manager, Risk Analyst, Auditor |
| Geopolitical risk map | Admiral, Fleet Manager, Risk Analyst, Auditor |
| All intelligence alerts | Admiral, Fleet Manager, Risk Analyst, Auditor |
| **"Create Alert" button** | Admiral, Fleet Manager, Risk Analyst |
| Auditor | Sees all, no action buttons |

---

### `/trade` — Trade Intelligence
**Blocked at route level for:** `port_agent`

| What | Who sees it |
|---|---|
| Trade document list + smart contract panel | Admiral, Fleet Manager, Trade Officer, Risk Analyst, Auditor |
| **"New Document" button** | Admiral, Fleet Manager, Trade Officer |
| **"Approve Document" button** | Admiral only |
| Auditor | Sees all, no action buttons |

---

### `/agi` — AGI Decision Engine
**Blocked at route level for:** `port_agent`

| What | Who sees it |
|---|---|
| All AGI decision cards | Admiral, Fleet Manager, Trade Officer, Risk Analyst, Auditor |
| Full reasoning expansion | All who can access the page |
| **"Run Analysis" button** | Admiral, Fleet Manager, Risk Analyst |
| Auditor | Sees all, no action buttons |

---

## Permissions per Role

```
admiral:        VIEW_ALL · CREATE · EDIT · DELETE · APPROVE · ESCALATE · MANAGE_USERS · AUDIT_LOG · RUN_AGI
fleet_manager:  VIEW_ALL · CREATE · EDIT · ESCALATE · RUN_AGI
trade_officer:  VIEW_FLEET_POSITION · VIEW_PORTS · CREATE_TRADE · EDIT_TRADE · VIEW_TRADE_AGI
risk_analyst:   VIEW_ALL · CREATE_ALERT · EDIT_ALERT · ESCALATE · RUN_AGI
port_agent:     VIEW_ASSIGNED_PORTS · VIEW_FLEET_ASSIGNED · EDIT_PORT_STATUS
auditor:        VIEW_ALL (read-only — no mutations permitted)
```

---

## Auth Flow

```
1. App loads → AuthContext reads localStorage("glimmora_user")
2. No user → middleware redirects to /login
3. /login → pick demo account pill or enter email + password
4. login() validates against MOCK_USERS → stores user in localStorage + state
5. ClientLayout syncs user to cookie (glimmora_session) for middleware
6. Middleware reads cookie on every request → blocks wrong-role routes
7. ProtectedPage (client) → secondary redirect guard per page
8. RoleGate → hides/shows individual UI elements per permission
9. Logout → clears localStorage + cookie → redirect to /login
```

---

## Protection Layers

Every protected page has **3 layers** of access control:

| Layer | Where | What it does |
|---|---|---|
| **Middleware** | `middleware.ts` (edge) | Blocks wrong-role users at the network level — redirects to `/unauthorized` |
| **ProtectedPage** | Client component on each page | Client-side redirect if user not authenticated or wrong role |
| **RoleGate** | Wraps individual UI sections | Hides action buttons, panels, and features not available to the current role |

---

## Project Structure

```
frontend/
  app/
    context/
      AuthContext.tsx         ← User state, mock users, login/logout
    lib/
      permissions.ts          ← ROLE_PERMISSIONS, canDo(), canSeeNav()
    components/
      auth/
        RoleGate.tsx          ← Conditional render by role/permission
        ProtectedPage.tsx     ← Page-level redirect guard
      layout/
        Sidebar.tsx           ← Role-filtered nav, user profile at bottom
        TopBar.tsx            ← Real user info, role badge, logout dropdown
        StatusBar.tsx         ← System status bar at bottom
      dashboard/
        KPICards.tsx          ← Animated metric cards
        AGIFeed.tsx           ← Scrolling live intelligence ticker
        CongestionChart.tsx   ← Line chart (Recharts)
        RiskSnapshot.tsx      ← Alert summary panel
      map/
        MaritimeMap.tsx       ← World map with vessel markers (react-simple-maps)
    dashboard/page.tsx        ← /dashboard — Executive Bridge
    fleet/page.tsx            ← /fleet — Fleet Intelligence table
    ports/page.tsx            ← /ports — Port grid + throughput chart
    risk/page.tsx             ← /risk — Sanctions screening + alerts
    trade/page.tsx            ← /trade — Trade docs + blockchain panel
    agi/page.tsx              ← /agi — AGI Decision Engine
    login/page.tsx            ← Login with demo account pills
    unauthorized/page.tsx     ← Access denied page
    data/
      vessels.ts              ← 100 mock vessels
      ports.ts                ← 20 global ports
      alerts.ts               ← 15 risk alerts
      trades.ts               ← 10 trade documents
      agi-decisions.ts        ← 20 AGI decisions
    types/index.ts            ← All TypeScript types + ROLE_LABELS + ROLE_COLORS
  middleware.ts               ← Next.js edge middleware — route-level role blocking
```

---

## Design System

**Colors:** Ivory Cream `#FAF8F5` · Sand · Gold Muted `#B89B4A` · Charcoal Deep `#2D2A26` · Maritime Error `#8B5252` · Maritime Success `#4A6347`

**Typography:**
- **Cormorant Garamond** — page titles, KPI numbers, card headings (display)
- **Outfit** — all body text, labels, badges, table data (body)

**Role badge colors:** Admiral = Gold · Fleet Manager = Sapphire · Trade Officer = Green · Risk Analyst = Red · Port Agent = Stone · Auditor = Greige
