# GlimmoraNautica — Data Sources & Implementation Guide

> Complete reference for every data type the platform needs, where to get it, and how to implement it.

---

## Table of Contents

1. [Live Vessel Tracking (AIS)](#1-live-vessel-tracking-ais)
2. [Port Operations & Congestion](#2-port-operations--congestion)
3. [Weather & Route Conditions](#3-weather--route-conditions)
4. [Sanctions & Compliance Lists](#4-sanctions--compliance-lists)
5. [Geopolitical Risk Intelligence](#5-geopolitical-risk-intelligence)
6. [Trade & Cargo Data](#6-trade--cargo-data)
7. [AGI / AI Decision Engine](#7-agi--ai-decision-engine)
8. [Currency & Commodity Prices](#8-currency--commodity-prices)
9. [Maritime Incidents & Piracy Alerts](#9-maritime-incidents--piracy-alerts)
10. [Implementation Priority Matrix](#10-implementation-priority-matrix)

---

## 1. Live Vessel Tracking (AIS)

**What we need:** Real-time latitude/longitude, speed, heading, vessel name, IMO number, flag state, destination, ETA, cargo type for 100+ vessels.

### APIs

| Provider | URL | Free Tier | Cost | Notes |
|---|---|---|---|---|
| **AISstream.io** | https://aisstream.io | Yes — WebSocket, unlimited vessels | Free | Best free option. WebSocket stream, global coverage. |
| **MarineTraffic API** | https://www.marinetraffic.com/en/ais-api-services | No | From $50/mo | Industry standard. REST API. Most reliable. |
| **VesselFinder API** | https://www.vesselfinder.com/api | No | From $30/mo | Good alternative to MarineTraffic. |
| **Spire Maritime** | https://spire.com/maritime | No | Enterprise ($500+/mo) | Satellite AIS, best global coverage including open ocean. |
| **datalastic.com** | https://datalastic.com | 100 calls/day free | $29/mo | REST API, vessel search + position history. |
| **AIS Hub** | https://www.aishub.net | Free (data sharing required) | Free | Free if you share your own AIS receiver data. |
| **OpenSeaMap** | https://www.openseamap.org | Yes | Free | Open source, community AIS. Less reliable but free. |

### Implementation Strategy

```
Phase 1 (Demo/Now):   Mock data with animated position drift — vessels move ~0.01° per 30s tick
Phase 2 (MVP):        AISstream.io WebSocket → replace vessels.ts with live feed
Phase 3 (Production): MarineTraffic or Spire API for guaranteed SLA + historical data
```

**Code approach — Phase 2:**
- Connect WebSocket to `wss://stream.aisstream.io/v0/stream`
- Subscribe to bounding boxes covering your vessel list
- Parse `PositionReport` messages → update vessel store
- Fallback to last known position if stream drops

---

## 2. Port Operations & Congestion

**What we need:** Berth availability, vessel queue length, wait times, TEU throughput, port status (open/closed/restricted).

### APIs & Data Sources

| Provider | URL | Free Tier | Cost | Notes |
|---|---|---|---|---|
| **Portwatch (IMF)** | https://portwatch.imf.org | Yes — public dashboard + data downloads | Free | IMF project. Weekly port call data, congestion index. Download CSV/API. |
| **UN Comtrade** | https://comtradeplus.un.org | Yes — 100 calls/day | Free | Trade flow data by port/country. Not real-time but authoritative. |
| **MarineTraffic Port Calls** | https://www.marinetraffic.com/en/ais-api-services | No | Paid add-on | Port call history, expected arrivals, departures. |
| **Kpler** | https://www.kpler.com | No | Enterprise | Best-in-class port congestion + cargo tracking. Used by banks/hedge funds. |
| **PortEconomics** | https://www.porteconomics.eu | Yes — research data | Free | Academic port throughput datasets. Good for historical. |
| **Individual Port Authority Sites** | Varies | Yes | Free | Rotterdam, Singapore, Shanghai all publish live berth data on their websites. Requires scraping. |

### Web Scraping Targets (Free)

```
Port of Rotterdam:    https://www.portofrotterdam.com/en/shipping/nautical-information
Port of Singapore:    https://www.mpa.gov.sg/port-marine-ops/port-operations
Port of Shanghai:     http://www.shippers.org.cn (Chinese, needs translation)
Port of Hamburg:      https://www.hafen-hamburg.de/en/logistics/port-congestion
Lloyd's List:         https://lloydslist.com/ports (some free articles)
```

### Implementation Strategy

```
Phase 1 (Demo/Now):   Animate congestion % ±5% every hour using setInterval
Phase 2 (MVP):        Portwatch IMF API for weekly congestion index per port
Phase 3 (Production): MarineTraffic Port Calls API + scrape major port authority sites
                       Build a cron job (every 6h) to fetch and cache port data
```

---

## 3. Weather & Route Conditions

**What we need:** Wind speed/direction, wave height, visibility, storm warnings, cyclone tracks along shipping routes.

### APIs

| Provider | URL | Free Tier | Cost | Notes |
|---|---|---|---|---|
| **OpenWeatherMap** | https://openweathermap.org/api | Yes — 1,000 calls/day | Free / $40mo+ | Current weather + 5-day forecast. Marine endpoints available. |
| **Open-Meteo** | https://open-meteo.com | Yes — unlimited | Free | Excellent free weather API. Has wave height, wind at sea. No API key needed. |
| **StormGlass.io** | https://stormglass.io | Yes — 10 calls/day | $29/mo | Purpose-built for maritime. Wave height, swell, sea surface temp, wind at specific coordinates. |
| **Windy API** | https://api.windy.com | Yes — limited | Free tier | Beautiful weather data, good for route visualization. |
| **NOAA NOMADS** | https://nomads.ncep.noaa.gov | Yes — unlimited | Free | US government. GFS global weather model. Raw but free and authoritative. |
| **Copernicus Marine** | https://marine.copernicus.eu | Yes — registration needed | Free | EU funded. Ocean currents, sea state, temperature. Excellent for routing. |

### Implementation Strategy

```
Phase 1 (Demo/Now):   Hardcode weather conditions per route segment
Phase 2 (MVP):        Open-Meteo (free, no key) → fetch weather for each vessel's coordinates
                       Call: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=windspeed_10m,wave_height
Phase 3 (Production): StormGlass.io for marine-specific data + NOAA for storm warnings
                       Overlay weather alerts on the maritime map
```

---

## 4. Sanctions & Compliance Lists

**What we need:** OFAC SDN list, UN Security Council sanctions, EU consolidated list, UK OFSI list — searchable by vessel name, IMO, owner, flag state, country.

### Official Free Sources (Government Published)

| List | URL | Format | Update Frequency |
|---|---|---|---|
| **OFAC SDN List (USA)** | https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists | XML, CSV, JSON | Daily |
| **UN Security Council** | https://scsanctions.un.org/consolidated | XML | Daily |
| **EU Consolidated List** | https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions | XML, CSV | Daily |
| **UK OFSI List** | https://assets.publishing.service.gov.uk/media/financial-sanctions-consolidated-list.csv | CSV | Daily |
| **IMO Ship Sanctions** | https://www.imo.org/en/ourwork/security/pages/maritimesecurity.aspx | PDF/Manual | Irregular |

### APIs (Aggregated, Paid)

| Provider | URL | Notes |
|---|---|---|
| **Comply Advantage** | https://complyadvantage.com | Aggregates all major lists. Real-time. Enterprise pricing. |
| **World-Check (LSEG)** | https://www.lseg.com/en/risk-intelligence/screening-solutions | Industry standard. Very expensive. |
| **OpenSanctions** | https://www.opensanctions.org | **Free & open source.** Aggregates OFAC + UN + EU + 100 more lists into one API. Best free option. |

### Implementation Strategy

```
Phase 1 (Demo/Now):   Hardcoded KNOWN_VESSELS and SANCTIONED_VESSELS arrays (already done)
Phase 2 (MVP):        Download OFAC SDN XML daily via cron → parse → store in local DB
                       Use OpenSanctions API (free) for search: GET https://api.opensanctions.org/match/sanctions
Phase 3 (Production): OpenSanctions self-hosted instance OR ComplyAdvantage API
                       Real-time screening on every vessel, owner, cargo manifest entry
```

**OpenSanctions API example:**
```bash
curl -X POST https://api.opensanctions.org/match/sanctions \
  -H "Content-Type: application/json" \
  -d '{"queries": {"q1": {"schema": "Vessel", "properties": {"name": ["MV AURORA"]}}}}'
```

---

## 5. Geopolitical Risk Intelligence

**What we need:** Risk scores per region/country, conflict zones, piracy hotspots, chokepoint alerts (Suez, Hormuz, Red Sea, Malacca).

### Data Sources

| Provider | URL | Free Tier | Cost | Notes |
|---|---|---|---|---|
| **ACLED** | https://acleddata.com | Yes — research registration | Free | Armed Conflict Location & Event Data. Country-level conflict events updated weekly. API available. |
| **Global Peace Index** | https://www.visionofhumanity.org/maps | Yes — annual download | Free | Country risk scores. Annual, not real-time. |
| **ICC IMB Piracy Reports** | https://icc-ccs.org/index.php/piracy-reporting-centre | Yes — PDF reports | Free | International Maritime Bureau. Monthly piracy + armed robbery reports. Requires PDF scraping. |
| **UNOSAT** | https://unosat.org | Yes | Free | UN satellite analysis. Crisis maps, conflict areas. |
| **ReliefWeb** | https://reliefweb.int/api | Yes | Free | UN OCHA. Crisis alerts API. Easy REST. |
| **UK FCO Travel Advisories** | https://www.gov.uk/foreign-travel-advice | Yes | Free | Country-level risk ratings. Scrapeable. |
| **Crisis24** | https://crisis24.garda.com | No | Enterprise | Real-time intelligence. Used by shipping companies. |

### AI/ML Approach

```
Build a risk scoring model:
  Inputs:  ACLED conflict events (last 30 days) + piracy reports + travel advisories + sanctions density
  Output:  0-100 risk score per region, updated daily
  Method:  Weighted sum → simple rule-based model first, upgrade to ML later
  Model:   Train on historical incident data from ACLED + IMB reports
```

### Implementation Strategy

```
Phase 1 (Demo/Now):   Hardcoded risk zones on geopolitical map (already done)
Phase 2 (MVP):        ACLED API for conflict events → colour-code map regions dynamically
                       IMB reports → scrape monthly PDF → extract hotspot coordinates
Phase 3 (Production): Daily pipeline: ACLED + IMB + ReliefWeb → risk scoring model → live map
```

---

## 6. Trade & Cargo Data

**What we need:** Bill of lading details, cargo manifests, HS codes, trade routes, import/export volumes, commodity prices.

### Data Sources

| Provider | URL | Free Tier | Cost | Notes |
|---|---|---|---|---|
| **UN Comtrade** | https://comtradeplus.un.org | Yes — 100 calls/day | Free | Official UN trade statistics. Bilateral trade flows by commodity. |
| **World Bank Trade** | https://wits.worldbank.org | Yes | Free | Trade flows + tariff data. Downloadable. |
| **PANJIVA / S&P Global** | https://panjiva.com | No | Enterprise ($1000+/mo) | Actual bill of lading data from customs filings. Best source. |
| **ImportYeti** | https://www.importyeti.com | Yes — limited | Free | US import records from customs data. Good for US-bound cargo. |
| **Flexport Market Pulse** | https://www.flexport.com/research | Yes | Free | Freight rate indices, transit times, reliability data. |
| **Freightos Baltic Index** | https://fbx.freightos.com | Yes | Free | Container shipping rate benchmarks. API available. |
| **Drewry WCI** | https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry | Yes — weekly | Free | World Container Index. Spot freight rates. |

### Blockchain / Smart Contracts

```
For trade document authenticity (as shown in the Trade Documents page):
  Platform:   Ethereum / Polygon (cheaper gas fees)
  Standard:   ERC-721 NFT per Bill of Lading OR ERC-1155 for document batches
  Oracle:     Chainlink for off-chain data (vessel arrival confirmation)
  Explorer:   Etherscan API (free) to verify transaction hashes
  Tool:       Hardhat or Foundry for smart contract development
```

### Implementation Strategy

```
Phase 1 (Demo/Now):   Mock trade documents with fake blockchain hashes (already done)
Phase 2 (MVP):        UN Comtrade API for real trade volumes per route
                       ImportYeti scraping for US cargo manifest data
Phase 3 (Production): PANJIVA API for real bill of lading data
                       Deploy smart contracts on Polygon for document verification
```

---

## 7. AGI / AI Decision Engine

**What we need:** Replace hardcoded AGI decisions with real AI-generated recommendations based on live vessel, weather, sanctions, and risk data.

### Implementation Options

| Approach | Tool/Model | Cost | Complexity |
|---|---|---|---|
| **Claude API (Anthropic)** | `claude-opus-4-6` or `claude-sonnet-4-6` | $3–15 per 1M tokens | Low — just API calls |
| **OpenAI GPT-4o** | `gpt-4o` | $5 per 1M input tokens | Low |
| **Local LLM** | Ollama + Llama 3.1 70B | Free (GPU required) | Medium |
| **Fine-tuned model** | HuggingFace + maritime domain data | Free hosting tier | High |
| **Rule-based expert system** | Custom Python | Free | Medium |

### Recommended: Claude API

```typescript
// Example: Generate AGI decision for a vessel
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function generateVesselDecision(vessel: Vessel, context: {
  weather: WeatherData;
  sanctions: SanctionCheck;
  riskScore: number;
  portCongestion: number;
}) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `You are a maritime intelligence AGI for GlimmoraNautica.
      
Vessel: ${vessel.name} (IMO: ${vessel.imo})
Current position: ${vessel.lat}, ${vessel.lon}
Destination: ${vessel.destination}
Cargo: ${vessel.cargo}
Weather ahead: Wind ${context.weather.windSpeed}kn, Wave ${context.weather.waveHeight}m
Regional risk score: ${context.riskScore}/100
Port congestion at destination: ${context.portCongestion}%
Sanctions flag: ${context.sanctions.flagged ? "YES — " + context.sanctions.reason : "Clear"}

Provide a concise operational recommendation (2-3 sentences) with a confidence score (0-100).
Format: { "recommendation": "...", "confidence": 85, "action": "PROCEED|REROUTE|HOLD|INSPECT" }`
    }]
  });
  
  return JSON.parse(response.content[0].text);
}
```

### ML Models to Build In-House

| Model | Purpose | Training Data | Algorithm |
|---|---|---|---|
| **Route Risk Scorer** | Score each route segment 0-100 | ACLED + IMB historical incidents | Gradient Boosted Trees (XGBoost) |
| **Congestion Predictor** | Predict port wait time 48h ahead | Portwatch historical + AIS arrivals | LSTM time series |
| **Anomaly Detector** | Flag vessels behaving unusually (dark ship, route deviation) | AIS historical tracks | Isolation Forest / Autoencoder |
| **ETA Predictor** | Improve vessel ETA accuracy | AIS + weather + port congestion | Random Forest |

### Implementation Strategy

```
Phase 1 (Demo/Now):   Hardcoded AGI decisions (already done)
Phase 2 (MVP):        Claude API — generate decisions on-demand when user clicks "Run Analysis"
                       Cache results for 1 hour to control API costs
Phase 3 (Production): Claude API for reasoning layer + custom ML models for scoring inputs
                       Build a backend pipeline: Live data → ML scores → Claude reasoning → Decision
```

---

## 8. Currency & Commodity Prices

**What we need:** Bunker fuel prices (IFO 380, VLSFO, MGO), freight rates, USD/EUR/CNY exchange rates, commodity spot prices (crude, LNG, iron ore).

### APIs

| Provider | URL | Free Tier | Cost | Notes |
|---|---|---|---|---|
| **ExchangeRate-API** | https://exchangerate-api.com | Yes — 1,500 calls/mo | Free | Simple forex rates. Easy REST. |
| **Open Exchange Rates** | https://openexchangerates.org | Yes — 1,000 calls/mo | Free | Same as above, reliable. |
| **Commodity Price API** | https://commodities-api.com | Yes — limited | Free/Paid | Oil, LNG, metals spot prices. |
| **EIA (US Energy)** | https://www.eia.gov/opendata | Yes — unlimited | Free | US Energy Information Administration. Crude oil, LNG, bunker fuel prices. |
| **Ship & Bunker** | https://shipandbunker.com | Scraping only | Free | Industry standard bunker fuel prices by port. No official API. |
| **Baltic Exchange** | https://www.balticexchange.com | No | Paid | Official freight rate indices (BDI, BCI, etc.). |

### Implementation Strategy

```
Phase 2 (MVP):   EIA API for fuel prices + ExchangeRate-API for forex
                  Scrape Ship & Bunker for port-specific bunker prices (weekly cron)
Phase 3:         Baltic Exchange for freight indices (if budget allows)
```

---

## 9. Maritime Incidents & Piracy Alerts

**What we need:** Real-time alerts for piracy attacks, vessel collisions, groundings, mechanical failures, detentions.

### Sources

| Provider | URL | Free | Notes |
|---|---|---|---|
| **ICC IMB Live Piracy Map** | https://icc-ccs.org/index.php/piracy-reporting-centre/live-piracy-map | Yes | KML/GeoJSON feed of piracy incidents. |
| **UKMTO** | https://www.ukmto.org | Yes | UK Maritime Trade Operations. Incident reports for Gulf of Oman, Red Sea, Indian Ocean. |
| **NATO Shipping Centre** | https://www.shipping.nato.int | Yes | Piracy and security reports. |
| **FleetMon** | https://www.fleetmon.com/maritime-news | Scraping | Free | Maritime incident news feed. Scrapeable. |
| **Lloyd's List Intelligence** | https://lloydslist.com | Partial | Paid | Premium maritime news and incidents. Some free articles. |
| **MarineTraffic Incidents** | https://www.marinetraffic.com | Paid | API add-on | Vessel incidents, detentions, inspections. |

### Implementation Strategy

```
Phase 2 (MVP):   ICC IMB KML feed → parse → add to alerts.ts pipeline
                  UKMTO advisories → scrape weekly → geopolitical risk overlay
Phase 3:         Aggregate all sources → NLP classifier to tag incident type/severity
                  Real-time push to Risk & Sanctions page
```

---

## 10. Implementation Priority Matrix

### What to build first

| Priority | Feature | Data Source | Method | Effort | Cost |
|---|---|---|---|---|---|
| 🔴 **1** | Real sanctions screening | OpenSanctions API | API call | Low | Free |
| 🔴 **2** | Live vessel positions | AISstream.io | WebSocket | Medium | Free |
| 🔴 **3** | AI decision engine | Claude API | API call | Low | ~$20/mo |
| 🟡 **4** | Port congestion index | IMF Portwatch | REST API + CSV | Low | Free |
| 🟡 **5** | Weather on routes | Open-Meteo | REST API | Low | Free |
| 🟡 **6** | Geopolitical risk map | ACLED API | REST API + model | Medium | Free |
| 🟢 **7** | Piracy alerts | ICC IMB KML | Scraping/parse | Medium | Free |
| 🟢 **8** | Freight rate index | Freightos/Drewry | Scraping | Medium | Free |
| 🟢 **9** | Trade volumes | UN Comtrade | REST API | Low | Free |
| ⚪ **10** | Bunker fuel prices | Ship & Bunker | Scraping | Medium | Free |
| ⚪ **11** | Anomaly detection ML | AIS history | Train model | High | GPU cost |
| ⚪ **12** | Smart contracts | Polygon/Ethereum | Blockchain dev | Very High | Gas fees |

---

### Architecture for Phase 2 (MVP Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE                            │
│                                                             │
│  AISstream WebSocket ──────────────────┐                   │
│  Open-Meteo REST (every 30min) ────────┤                   │
│  OpenSanctions API (on-demand) ────────┤──► Node.js/Python │
│  IMF Portwatch (every 6h) ─────────────┤    Backend API    │
│  ACLED API (daily cron) ───────────────┤        │          │
│  ICC IMB KML (daily cron) ─────────────┘        │          │
│                                                  ▼          │
│                                         PostgreSQL / Redis  │
│                                                  │          │
│                                                  ▼          │
│                                         Next.js API Routes  │
│                                                  │          │
│                                                  ▼          │
│                                      GlimmoraNautica Frontend│
└─────────────────────────────────────────────────────────────┘
```

### Estimated Monthly Cost at MVP Scale

| Service | Cost |
|---|---|
| AISstream.io | Free |
| Open-Meteo | Free |
| OpenSanctions | Free |
| IMF Portwatch | Free |
| ACLED | Free |
| Claude API (500 decisions/day) | ~$15/mo |
| Vercel hosting (frontend) | Free tier |
| Railway/Fly.io (backend) | ~$5/mo |
| **Total** | **~$20/month** |

---

*Last updated: April 2026 — GlimmoraNautica Intelligence Platform*
