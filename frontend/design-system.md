# GlimmoraNautica — Design System

> **Rule**: Every component must reference this file. No ad-hoc colors, no inline font choices, no shadow values outside this spec.

---

## Brand Identity

**GlimmoraNautica** is a sovereign-grade maritime intelligence platform. The visual language must feel:
- **Commanding** — like a ship's bridge at night, warm brass instruments, deep ocean charts
- **Premium** — luxury editorial, not tech startup
- **Trustworthy** — calm, structured, unhurried

---

## Color Palette

### Neutrals (Foundation)
```
ivory-cream      #FAF8F5   — primary surface/background
ivory-warm       #F5F1EA   — alternate surface, hover states
parchment        #EDE8DF   — table rows, card fills
sand-light       #E5DFD3   — borders, dividers
sand             #D4CBBF   — stronger borders
taupe            #B8AEA0   — disabled states
greige           #9A8F82   — secondary text, labels
stone            #7A7068   — tertiary text
charcoal-warm    #4A453D   — body text
charcoal-deep    #2D2A26   — headlines, primary text
noir             #1A1816   — deepest text, dark backgrounds
```

### Accents
```
gold-soft        #C9A962   — highlights, active indicators, vessel dots
gold-muted       #B89B4A   — primary CTA buttons, chart bars, active nav
gold-deep        #9A7F35   — hover on gold elements
champagne        #E8DCC4   — ticker backgrounds, light gold fills
bronze-whisper   #A8927A   — subtle warm accent

sapphire-mist    #4A5568   — data panels, intelligence UI, badge bg
sapphire-subtle  #5C6B7A   — chart strokes, map land
sapphire-deep    #2C3E50   — smart contract panel, dark data bg
azure-whisper    #E8ECF0   — light sapphire surface
```

### Semantic
```
success          #4A6347   — Processed, Active, Clear
success-soft     #6B8068   — success secondary
warning          #A68B3D   — Pending, Delayed
warning-soft     #C4A35A   — warning secondary
error            #8B5252   — Flagged, Sanctioned, High Risk
error-soft       #A67272   — error secondary
info             #4A5A6A   — informational
info-soft        #6B7A8A   — info secondary
```

### Surfaces
```
surface-base     #FAF8F5
surface-elevated #FFFFFF
surface-sunken   #F0EBE3
surface-overlay  rgba(45, 42, 38, 0.04)
surface-glass    rgba(250, 248, 245, 0.85)
```

### Borders
```
border-subtle    rgba(180, 170, 155, 0.20)
border-default   rgba(180, 170, 155, 0.35)
border-strong    rgba(122, 112, 104, 0.50)
divider          rgba(180, 170, 155, 0.15)
```

---

## Typography

### Fonts
- **Display / Headlines**: `Cormorant Garamond` — Google Fonts, weights 300/400/500/600
- **Body / UI**: `Outfit` — Google Fonts, weights 300/400/500/600

### CSS Variables
```css
--font-display: 'Cormorant Garamond', Georgia, serif;
--font-body: 'Outfit', -apple-system, sans-serif;
```

### Sizing Scale
| Use | Size |
|-----|------|
| Page hero headline | `clamp(3.5rem, 7vw, 6rem)` |
| Section heading | `clamp(2rem, 4vw, 3rem)` |
| Card title (display) | `text-2xl` or `text-3xl` |
| Stat number | `clamp(2.5rem, 5vw, 4.5rem)` |
| Body text | `text-base` |
| Labels | `text-sm` |
| Small caps / tags | `text-[10px] tracking-[0.3em]` |
| Micro badges | `text-[9px] tracking-[0.4em]` |

### Letter Spacing
| Use | Value |
|-----|-------|
| Hero headlines | `-0.03em` |
| Section headings | `-0.02em` |
| Logo / brand | `0.2em` |
| Nav links | `0.12em` |
| Button text | `0.15em` |
| Tag / badge | `0.3em – 0.5em` |

---

## Shadows
```
shadow-sm   0 1px 2px rgba(26, 24, 22, 0.04)
shadow-md   0 4px 12px rgba(26, 24, 22, 0.06)
shadow-lg   0 12px 32px rgba(26, 24, 22, 0.08)
shadow-xl   0 24px 64px rgba(26, 24, 22, 0.12)
shadow-gold 0 0 24px rgba(184, 155, 74, 0.15)
```

---

## Marine UI Patterns

### Navigation Sidebar
- Width: `280px` fixed left
- Background: `charcoal-deep (#2D2A26)` with subtle texture overlay
- Logo: `font-display`, `ivory-cream`, tracking `0.2em`, uppercase
- Nav items: `Outfit text-sm tracking-[0.12em] uppercase`, `greige` default, `ivory-cream` hover
- Active item: left border `4px solid gold-muted`, bg `rgba(184,155,74,0.08)`, text `ivory-cream`
- Section labels: `text-[9px] tracking-[0.5em] uppercase`, `stone` color

### Top Navigation Bar
- Height: `72px`
- Background: `ivory-cream/95 backdrop-blur-sm`
- Bottom border: `border-b border-sand/30`
- Content area starts after `280px` sidebar

### Status Bar (bottom)
- Height: `40px`
- Background: `charcoal-deep`
- Text: `Outfit text-[10px] tracking-[0.2em] uppercase`, `greige`
- Items: uptime indicator (green dot), last data sync, active alerts count

---

## Component Patterns

### KPI / Stat Card
```
bg: white
border: border border-sand/40
border-radius: rounded-xl
padding: p-8
number: font-display, clamp(2.5rem, 4vw, 4rem), charcoal-deep, tracking-[-0.02em]
label: Outfit text-xs tracking-[0.3em] uppercase greige mt-2
accent line: 2px gold-muted, width 32px, bottom of number
hover: shadow-md, -translate-y-0.5, border-gold-soft/40
transition: all 300ms
```

### Data Table Row
```
bg: parchment (odd) / ivory-cream (even)
border-b: divider
hover: bg-ivory-warm, cursor-pointer
font: Outfit text-sm charcoal-warm
selected: bg-champagne/60, border-l-2 border-gold-muted
```

### Port / Intelligence Card
```
bg: white
border: border-sand/30
rounded-2xl
padding: p-6 lg:p-8
shadow-md → shadow-lg on hover
transform: -translate-y-1 on hover
image area: aspect-[16/9], bg-parchment, overflow-hidden
title: font-display text-xl
```

### Status Badges
```
Processed/Active/Clear: bg-success/10 text-success border border-success/20
Pending/Delayed:         bg-warning/10 text-warning border border-warning/20  
Flagged/Sanctioned:      bg-error/10 text-error border border-error/20
Intelligence/Data:       bg-sapphire-mist text-ivory-cream
```

### Luxury Input
```
bg: ivory-cream
border: border border-sand
padding: px-6 py-4
font: Outfit text-base charcoal-deep
placeholder: greige
focus: outline-none border-gold-muted ring-1 ring-gold-muted/30
transition: colors 200ms
border-radius: rounded-none (editorial sharp) or rounded-sm
```

### Primary Button
```
bg: charcoal-deep → hover: noir
text: ivory-cream uppercase text-sm tracking-[0.15em]
padding: px-8 py-4
font: Outfit
transition: all 300ms
border-radius: rounded-none
```

### Gold Button
```
bg: gold-muted → hover: gold-deep
text: noir uppercase text-sm tracking-[0.15em]
padding: px-8 py-4
```

---

## Chart / Data Visualization Colors

| Series | Color |
|--------|-------|
| Primary line/bar | `#B89B4A` (gold-muted) |
| Secondary line | `#4A5568` (sapphire-mist) |
| Tertiary | `#9A8F82` (greige) |
| Alert/Risk | `#8B5252` (error) |
| Success | `#4A6347` (success) |
| Grid lines | `rgba(180, 170, 155, 0.20)` |
| Axis text | `#9A8F82` (greige), Outfit 11px |

---

## Map Styling (react-simple-maps)

```
Ocean fill:      #EDE8DF  (parchment)
Land fill:       #4A5568  (sapphire-mist)
Land stroke:     #2C3E50  (sapphire-deep), 0.5px
Vessel dot:      #C9A962  (gold-soft), r=3
High-risk dot:   #8B5252  (error), r=4 with pulse animation
Port marker:     #B89B4A  (gold-muted), diamond shape
Risk region:     success=#4A6347 / warning=#A68B3D / error=#8B5252
```

---

## Animations

| Element | Animation |
|---------|-----------|
| Page entry | fadeInUp: opacity 0→1, translateY 24px→0, 0.6s ease, staggered 0.1s |
| Stat numbers | count-up on mount, 1.5s |
| High-risk vessel dots | CSS pulse ring, 2s infinite |
| AGI ticker | horizontal marquee, 30s linear infinite |
| Card hover | translateY(-2px), shadow-md→shadow-lg, 300ms |
| Panel slide-in | translateX(100%→0), 400ms cubic-bezier(0.16, 1, 0.3, 1) |
| Chart enter | Recharts built-in, 800ms |

---

## Layout Rhythm

```
Sidebar width:        280px (fixed)
TopBar height:        72px (fixed)
StatusBar height:     40px (fixed)
Page content:         ml-[280px] pt-[72px] pb-[40px]
Section padding:      px-8 lg:px-12 py-10 lg:py-16
Content max-width:    max-w-[1600px]
Grid gap:             gap-6 lg:gap-8
Card grid:            grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

---

## Marine Motifs to Use

- Compass rose as a decorative element in the logo area
- Coordinate / lat-long notation style for vessel positions
- Nautical terminology in labels: "Bearing", "Heading", "ETA", "Port of Call", "Flag State"
- Section dividers as thin gold lines (h-px bg-gold-muted/40, w-16)
- Background texture suggestion: very subtle diagonal line pattern at 2% opacity on sidebar
