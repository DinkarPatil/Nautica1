# GlimmoraNautica — Roles & Features Guide

All demo accounts use password: **`demo`**

---

## Fleet Admiral
**Login:** `admiral@glimmora.com`
Full unrestricted access to every page, feature, and action in the system.

### Executive Bridge `/dashboard`
The admiral sees the complete command overview. All six KPI cards are visible — Vessels Underway, Global Congestion, Risk Alerts, Trade Volume, CO₂ Saved, and System Uptime. The AGI Intelligence Ticker runs across the top streaming live decisions. The world map shows all 100 vessels with their live positions. The Risk Snapshot panel on the right lists the most critical active alerts. The Congestion Chart shows port load over time. The Fleet Status breakdown shows how many vessels are en route, at port, delayed, flagged, or anchored.

### Fleet Intelligence `/fleet`
Full access to the entire fleet of 100 vessels. The table shows vessel name, IMO number, flag state, status, speed, destination port, risk score, and vessel type. Clicking any row opens the vessel detail panel which includes position coordinates, voyage route, ETA, cargo type, deadweight tonnage, and the AGI Recommendation — a natural language advisory generated for that vessel's current situation. The admiral can sort by any column and filter by vessel status.

### Port Operations `/ports`
Sees all 20 global ports. Each port card shows current status (Operational, Congested, Critical, or Maintenance), congestion percentage with a visual meter, vessel queue count, average wait time in hours, and monthly throughput in TEU. The throughput comparison bar chart at the top ranks the top 10 ports by volume.

### Risk & Sanctions `/risk`
Full access to all risk intelligence. The Sanctions Screening tool lets the admiral search any vessel name, IMO, company, or individual against OFAC SDN, UN Consolidated, EU Autonomous, HMT OFSI, and IMO lists — returning an immediate match or clear result. The Geopolitical Risk Map highlights high-risk countries in red (critical), amber (high), and yellow (medium). The alert feed shows all 15 active intelligence alerts across sanctions, weather, geopolitical, route, and cyber categories. The admiral can expand any alert to read the full description and linked vessel. The **Create Alert** button is visible and active.

### Trade Intelligence `/trade`
Full access to all 10 trade documents. Each document card shows the document type (Bill of Lading, Letter of Credit, Certificate of Origin, etc.), linked vessel, cargo value, loading and discharge ports, issue date, and current status. Selecting a document opens the Smart Contract panel which shows the blockchain network, transaction hash, block height, confirmation count, gas used, contract parties (shipper and consignee), and total trade value. The admiral sees both the **New Document** button and the **Approve Document** button — the only role that can approve documents.

### AGI Decision Engine `/agi`
Full access to all 20 AGI decisions. Each decision card shows the category (Risk Warning, Route Optimization, Trade Opportunity, Port Advisory, Weather Alert, Sanctions Intelligence), priority level, summary, confidence percentage bar, estimated financial impact, and affected vessels or ports. Expanding a card reveals the full AGI reasoning in natural language. The **Run Analysis** button in the header allows triggering a new AGI model run. The admiral can filter decisions by category and priority.

---

## Fleet Manager
**Login:** `manager@glimmora.com`
Operational access across all pages. Cannot approve trade documents or manage users.

### Executive Bridge `/dashboard`
Sees the complete dashboard identical to the admiral — all KPI cards, AGI ticker, world map, risk snapshot, congestion chart, and fleet status.

### Fleet Intelligence `/fleet`
Full access to all 100 vessels, full table with all columns, and vessel detail panels including AGI Recommendations. Can sort and filter across the entire fleet.

### Port Operations `/ports`
Full visibility of all 20 ports — status, congestion, queue data, wait times, throughput chart, and port cards.

### Risk & Sanctions `/risk`
Access to sanctions screening, geopolitical risk map, and the full alert feed. Can use the **Create Alert** button to raise new intelligence alerts.

### Trade Intelligence `/trade`
Can view all trade documents and smart contract details. Can create new documents using the **New Document** button. Cannot approve documents — that button is hidden.

### AGI Decision Engine `/agi`
Full access to all AGI decisions with full reasoning expansion. Can use the **Run Analysis** button to trigger model runs.

---

## Trade Officer
**Login:** `trader@glimmora.com`
Focused on trade and commercial intelligence. Cannot access Risk & Sanctions. Has limited fleet and AGI access.

### Executive Bridge `/dashboard`
Sees the dashboard but only trade-relevant sections. The AGI Ticker is visible (trade decisions stream through). The Risk Snapshot panel and full KPI strip are hidden — only trade-related KPIs are shown.

### Fleet Intelligence `/fleet`
Can view the full vessel list and table. The vessel detail panel shows position, voyage, and route information. The AGI Recommendation section inside the detail panel is visible since trade officers need routing context. Cannot edit vessel records.

### Port Operations `/ports`
Full visibility of all 20 ports — useful for planning trade routes and understanding congestion at loading and discharge ports.

### Risk & Sanctions `/risk`
**Not accessible.** The middleware blocks this route for trade officers. Attempting to navigate here redirects to the Unauthorized page.

### Trade Intelligence `/trade`
This is the trade officer's primary workspace. Full access to all documents. Can create new trade documents using the **New Document** button. Can edit documents in their workflow. The Approve button is hidden — only the admiral can approve.

### AGI Decision Engine `/agi`
Can access AGI decisions but filtered to trade-relevant categories — Trade Opportunity and Route Optimization decisions are most relevant. Can expand full reasoning. Cannot use the Run Analysis button (hidden).

---

## Risk Analyst
**Login:** `analyst@glimmora.com`
Specialises in compliance, sanctions, and geopolitical risk. Full access to risk intelligence and AGI.

### Executive Bridge `/dashboard`
Sees the dashboard with AGI Ticker active and Risk Snapshot panel fully visible. KPI cards relevant to risk (Risk Alerts, Vessels Underway) are shown.

### Fleet Intelligence `/fleet`
Full view of all 100 vessels including the AGI Recommendation in each vessel detail panel — important for identifying vessels with elevated risk profiles. Cannot edit vessel records.

### Port Operations `/ports`
Full visibility of all ports — used for monitoring high-risk port locations and congestion that may relate to sanctions-listed regions.

### Risk & Sanctions `/risk`
This is the risk analyst's primary workspace. Full access to the Sanctions Screening tool to check entities against all major lists. The Geopolitical Risk Map provides a live overview of conflict and sanctions zones. The full alert feed is accessible with expand-to-read capability. The **Create Alert** button is active — risk analysts can raise new intelligence alerts and escalate existing ones.

### Trade Intelligence `/trade`
Can view all trade documents and their blockchain records. Cannot create or approve documents — both buttons are hidden.

### AGI Decision Engine `/agi`
Full access to all AGI decisions. The **Run Analysis** button is active — risk analysts can trigger AGI model runs, particularly for sanctions intelligence and risk warning categories.

---

## Port Agent
**Login:** `port@glimmora.com`
Operational role scoped to port-level work only. The sidebar shows only Port Operations — all other sections are hidden.

### Executive Bridge `/dashboard`
Can access the dashboard but sees a limited view. The AGI Ticker, Risk Snapshot panel, and trade-related KPIs are hidden. Only port-relevant metrics and the fleet status breakdown are shown.

### Fleet Intelligence `/fleet`
Can view the vessel list. In a live system this would be scoped to vessels assigned to their managed ports. The AGI Recommendation inside vessel detail panels is hidden. No edit access.

### Port Operations `/ports`
This is the port agent's primary workspace. Full visibility of all 20 ports — status indicators, congestion meters, vessel queue counts, average wait hours, and monthly throughput. The throughput chart is visible. Port agents can update port status in a live backend integration.

### Risk & Sanctions `/risk`
**Not accessible.** Blocked by middleware. Redirects to Unauthorized.

### Trade Intelligence `/trade`
**Not accessible.** Blocked by middleware. Redirects to Unauthorized.

### AGI Decision Engine `/agi`
**Not accessible.** Blocked by middleware. Redirects to Unauthorized.

---

## Auditor
**Login:** `audit@glimmora.com`
Read-only access across all pages. The topbar shows a **Read-Only Mode** badge. Every action button (Create Alert, New Document, Approve, Run Analysis) is hidden. The sidebar shows all navigation sections.

### Executive Bridge `/dashboard`
Full visibility of the complete dashboard — all KPI cards, AGI ticker, world map, risk snapshot, congestion chart, and fleet status. Cannot interact with any actionable elements.

### Fleet Intelligence `/fleet`
Can browse the full vessel table and open any vessel detail panel. All information is visible including position, voyage, cargo, and risk score. The AGI Recommendation is hidden (reserved for operational roles). No sort or filter restrictions.

### Port Operations `/ports`
Full read access to all 20 port cards, status indicators, congestion data, queue counts, wait times, and throughput chart.

### Risk & Sanctions `/risk`
Full read access to the sanctions screening tool, geopolitical risk map, and all intelligence alerts. Can expand alerts to read full descriptions. The Create Alert button is hidden.

### Trade Intelligence `/trade`
Full read access to all trade documents and smart contract blockchain records. The New Document and Approve Document buttons are both hidden.

### AGI Decision Engine `/agi`
Full read access to all 20 AGI decisions with complete reasoning expansion. The Run Analysis button is hidden.

---

## Access Summary Table

| Page | Admiral | Fleet Manager | Trade Officer | Risk Analyst | Port Agent | Auditor |
|---|---|---|---|---|---|---|
| `/dashboard` | Full | Full | Partial | Partial | Partial | Read-only |
| `/fleet` | Full + AGI | Full + AGI | View + AGI | View + AGI | View only | Read-only |
| `/ports` | Full | Full | Full | Full | Full | Read-only |
| `/risk` | Full + Create | Full + Create | **Blocked** | Full + Create | **Blocked** | Read-only |
| `/trade` | Full + Approve | View + Create | Full + Create | View only | **Blocked** | Read-only |
| `/agi` | Full + Run | Full + Run | View only | Full + Run | **Blocked** | Read-only |
