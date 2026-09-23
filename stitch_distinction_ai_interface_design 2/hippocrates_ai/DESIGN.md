---
name: Hippocrates AI
colors:
  surface: '#14121c'
  surface-dim: '#14121c'
  surface-bright: '#3a3843'
  surface-container-lowest: '#0f0d17'
  surface-container-low: '#1c1a24'
  surface-container: '#201e29'
  surface-container-high: '#2b2833'
  surface-container-highest: '#36333e'
  on-surface: '#e6e0ef'
  on-surface-variant: '#cac4d0'
  inverse-surface: '#e6e0ef'
  inverse-on-surface: '#312f3a'
  outline: '#938f9a'
  outline-variant: '#48454f'
  surface-tint: '#cdbdff'
  primary: '#e7ddff'
  on-primary: '#34275e'
  primary-container: '#cdbdff'
  on-primary-container: '#574a83'
  inverse-primary: '#635690'
  secondary: '#cdbdff'
  on-secondary: '#370096'
  secondary-container: '#5203d5'
  on-secondary-container: '#c0acff'
  tertiary: '#ffdbc7'
  on-tertiary: '#502402'
  tertiary-container: '#ffb688'
  on-tertiary-container: '#794520'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8deff'
  primary-fixed-dim: '#cdbdff'
  on-primary-fixed: '#1f1048'
  on-primary-fixed-variant: '#4b3e76'
  secondary-fixed: '#e8deff'
  secondary-fixed-dim: '#cdbdff'
  on-secondary-fixed: '#20005f'
  on-secondary-fixed-variant: '#4f00d0'
  tertiary-fixed: '#ffdbc7'
  tertiary-fixed-dim: '#ffb689'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#6c3a16'
  background: '#14121c'
  on-background: '#e6e0ef'
  surface-variant: '#36333e'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  spacing-2xs: 0.25rem
  spacing-xs: 0.5rem
  spacing-sm: 0.75rem
  spacing-md: 1rem
  spacing-lg: 1.25rem
  spacing-xl: 1.5rem
  spacing-2xl: 2rem
  spacing-3xl: 2.5rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  gutter-mobile: 0.75rem
  gutter-tablet: 1rem
---

## Brand & Style

This design system establishes a high-performance, clinical-grade learning environment engineered specifically for medical professionals and students. Drawing inspiration from modern Material Design 3 and technical workspace ergonomics, the aesthetic prioritizes extreme cognitive focus, visual comfort during late-night study sessions, and rapid information digestion.

The visual style blends dark-mode minimalism with purposeful, luminous color accents. Deep slate-violet surfaces establish spatial architecture through subtle tonal shifts rather than heavy lines or light scattering, creating an atmosphere that feels disciplined, sophisticated, and distraction-free. Critical feedback loops—such as Spaced Repetition System (SRS) intervals, memory stability curves, and clinical streak tracking—leverage high-contrast tonal beacons to guide motor reflexes without fatiguing the optic nerve.

## Colors

The palette operates exclusively within a pure dark-mode architecture. The neutral foundation relies on chromatic dark tones tinted with deep violet to reduce circadian disturbance while maintaining clinical legibility.

### Surface Architecture
- **Background / Surface Base:** `#14121c` — Root level application floor.
- **Surface Container Low:** `#1d1a24` — Inactive panels and recessed viewport wells.
- **Surface Container:** `#211e28` — Standard canvas for lists, structural wrappers, and unselected cards.
- **Surface Container High:** `#2b2833` — Interactive active cards, popovers, and dialogs.
- **Surface Container Highest:** `#36333e` — Flashcard front/back faces, elevated sheets, and hover/active states.
- **Surface Bright:** `#3b3743` — Highlighting borders and momentary active surface targets.

### Semantic Accents & Interactivity
- **Primary Accent (`#cdbdff`):** Used for primary typography highlights, key toggle states, and on-dark iconography.
- **Primary Container (`#7c4dff`):** The primary CTA engine (e.g., "Show Answer", "Start Review Session"). Vibrant violet evoking neural pathways and cognitive velocity.
- **On-Primary (`#370096`):** High-contrast dark violet text for elements set against `#cdbdff`.
- **Secondary Container (`#4e3b8c`):** Supporting secondary interactive elements, selected filters, and active tab highlights.
- **Tertiary (`#ffb688`):** Warm flame accent dedicated to streak counters, mastery milestones, and spaced repetition urgency badges.
- **Tertiary Container (`#b55800`):** Grounding container for active retention warnings or streak banners.
- **Outline (`#948ea1`):** Structural borders on elevated interactive inputs.
- **Outline Variant (`#494455`):** Subtle dividers, flashcard split-lines, and unselected component perimeters.
- **Error (`#ffb4ab`) / Error Container (`#93000a`):** Critical clinical alerts, incorrect diagnostic selections, and retention lapses.

## Typography

Inter serves across all typographical levels to ensure neutral, hyper-legible rendering of dense medical terminology, chemical notation, and anatomical definitions. 

### Guidelines
- **Optical Hierarchy:** Primary prompt headlines and front-of-card questions use `headline-sm` to `headline-md` in semi-bold (`600`) to assert clear scanning anchors without overwhelming the review screen.
- **Reading Comfort:** Flashcard explanations, clinical rationales, and case vignettes utilize `body-lg` or `body-md` with strict line-height breathing room (150%) to facilitate high-speed parsing.
- **SRS & Metrics Labels:** Sub-labels, countdown intervals (e.g., "< 1m", "10m", "4d"), and streak counts leverage `label-md` and `label-sm` with widened tracking (`letterSpacing: 0.04em - 0.05em`) to ensure instant numeric legibility on compact tap targets.

## Layout & Spacing

The layout model is mobile-first, prioritizing thumb-zone ergonomic efficiency during active single-handed flashcard study sessions. 

### Spacing Principles
- **Base Grid:** Strict 4px base increment system (`0.25rem`). All paddings, row heights, and layout gaps adhere to this cadence.
- **Viewport Margins:** Mobile viewports strictly maintain a 16px (`1rem`) lateral screen margin to maximize flashcard content density. Tablets and desktop previews expand margins to 24px (`1.5rem`).
- **Review Canvas Architecture:** During active SRS review, the viewport is divided into a fixed 3-tier vertical grid:
  1. Top utility/retention bar (fixed height: 56px, containing deck progress and streak metrics).
  2. Central diagnostic stage (dynamic fluid container housing the flashcard).
  3. Bottom operational tray (fixed height: 80px–104px, hosting high-reach interval buttons).

## Elevation & Depth

This system avoids diffuse drop shadows and realistic skeuomorphism. Instead, spatial hierarchy relies entirely on **Material Design 3 tonal surface stacking** paired with **micro-outlines**.

### Elevation Tiers
- **Level 0 (Floor):** `#14121c` — Screen canvas and global backdrop. No borders.
- **Level 1 (Docked Containers):** `#1d1a24` to `#211e28` — Bottom navigation bars, deck list rows, and static input wells. Border: 1px solid `#494455` (Outline Variant).
- **Level 2 (Interactive Cards / Stacks):** `#2b2833` (Surface Container High) — Flashcard backdrops and expandable drawers. Border: 1px solid rgba(148, 142, 161, 0.15).
- **Level 3 (Focused Learning Elements):** `#36333e` (Surface Container Highest) — Active frontmost flashcard, active popovers, and modal dialogs. Features a micro-highlight border of 1px solid `#3b3743` (Surface Bright) to define edge clarity against lower layers.

## Shapes

The shape vocabulary balances clinical precision with modern tactile warmth. Structural containers feature purposeful corner curves that soften data density, while metadata tokens employ continuous curves for rapid tag differentiation.

### Shape Scales
- **Cards & Modal Sheets:** Standardized at `12px` to `16px` radius (`rounded-lg` / `rounded-xl`). Flashcards utilize an exact `16px` radius to create a distinct, touch-friendly physical card metaphor.
- **Buttons & Operational Triggers:** Standardized at `10px` to `12px` radius (`rounded-md` / `rounded-lg`) to maintain crisp geometric stability and predictable hit targets.
- **Chips, Badges, & Metrics Pills:** Fully pill-shaped (`9999px`) to immediately signal categorical labels, SRS stage tags, and streak trackers.

## Components

### Buttons
- **Primary CTA (SRS "Show Answer"):** Surface filled with `#7c4dff` (Primary Container), text in `#ffffff`, font `label-lg`, height: 52px, border radius: 12px. Subtle scale pulse on active press (`scale: 0.98`).
- **Interval Buttons (SRS Assessment Tray):** A four-column anchored dock comprising:
  - *Again (< 1m):* Background: `#211e28`, Top Accent/Border: `#ffb4ab` (Error), text `#ffb4ab`.
  - *Hard (12m):* Background: `#211e28`, Top Accent/Border: `#ffb688` (Tertiary), text `#ffb688`.
  - *Good (1d):* Background: `#211e28`, Top Accent/Border: `#cdbdff` (Primary), text `#cdbdff`.
  - *Easy (4d):* Background: `#211e28`, Top Accent/Border: `#a8f0cf` (Success), text `#a8f0cf`.
  - Height: 56px, radius: 10px, stacked layout with interval interval text in `label-sm` above difficulty label in `label-md`.

### Flashcards
- Surface: `#36333e` (Surface Container Highest).
- Padding: 20px interior margin.
- Corner Radius: 16px.
- Border: 1px solid `#494455`.
- Header: Houses deck category chip (left) and card index / bookmark icon (right).
- Question Stage: `headline-sm`, high contrast text `#e6e0ee`.
- Answer/Rationale Stage: Separated by a 1px dashed divider `#494455`, answer text in `body-lg` `#cac3d8`.

### Chips & Tags
- Height: 28px, corner radius: 9999px (pill).
- **Category / Specialty Chip:** Background: `#211e28`, Border: 1px solid `#494455`, text: `#cac3d8`, font `label-sm`.
- **Streak & Retention Badge:** Background: `#b55800` (Tertiary Container) at 20% opacity, Border: 1px solid `#ffb688`, text: `#ffb688`, includes flame glyph icon.

### Input Fields (Clinical Search & Query)
- Background: `#1d1a24` (Surface Container Low).
- Corner Radius: 10px.
- Border: 1px solid `#494455`; transitions to 1.5px solid `#cdbdff` on focus.
- Placeholder text: `#948ea1`, Active input text: `#e6e0ee`.
- Padding: 12px horizontal, 14px vertical.

### SRS Progress Bar
- Linear continuous track height: 4px.
- Unfilled Track: `#2b2833`.
- Active Progress Fill: Smooth gradient transition from `#7c4dff` to `#cdbdff`.