# Hippocrates AI — Mobile App UI/UX Prototype Prompt for Google Stitch

## Overview
Design a mobile flashcard review app called **Hippocrates AI** using a spaced repetition system (SRS). The app is used by medical students to review questions daily. It has four bottom tab screens: Home, Quiz, Calendar, and Account. The design must be polished, modern, and dark-themed.

---

## Design Language & Style

- **Theme:** Dark mode only
- **Design System:** Material Design 3 (Material You)
- **Font:** Inter (all weights)
- **Corner Radius:** Cards use 12px; buttons use 8px; chips/tags use full/pill radius
- **Overall feel:** Premium, focused, clinical but friendly — like a medical study companion

---

## Color Palette (from existing web frontend — match exactly)

| Role | Hex | Usage |
|---|---|---|
| Background | `#14121c` | App background, screen base |
| Surface | `#14121c` | Same as background |
| Surface Container Low | `#1d1a24` | Subtle card backgrounds |
| Surface Container | `#211e28` | Default card/sheet background |
| Surface Container High | `#2b2833` | Elevated cards, modals |
| Surface Container Highest | `#36333e` | Top-level floating elements |
| Surface Bright | `#3b3743` | Active/hover states |
| Primary | `#cdbdff` | Primary text, icons, active tab indicators |
| Primary Container | `#7c4dff` | Primary action buttons (CTA), filled buttons |
| On-Primary | `#370096` | Text on primary container buttons |
| Secondary | `#cdbdff` | Secondary labels and icons |
| Secondary Container | `#4e3b8c` | Chips, tags, secondary button fills |
| Tertiary | `#ffb688` | Accent highlights, streaks, warm indicators |
| Tertiary Container | `#b55800` | Dark orange accent fill |
| On-Background / On-Surface | `#e6e0ee` | Primary body text |
| On-Surface Variant | `#cac3d8` | Subtext, secondary labels |
| Outline | `#948ea1` | Borders, dividers |
| Outline Variant | `#494455` | Subtle dividers |
| Error | `#ffb4ab` | Wrong answer feedback |
| Error Container | `#93000a` | Wrong answer background flash |
| Surface Tint | `#cdbdff` | Tinted overlays |

---

## Screen 1: Home Tab (Dashboard)

**Layout:** Scrollable vertical screen with bottom tab bar

### Top Section
- Top greeting text: **"Hello, {Name} ??"** — large, bold, color: `#e6e0ee`
- Below it: Today's date and day — e.g., **"Monday, September 8"** — smaller, color: `#cac3d8`

### Daily Progress Card
- Large card with background `#211e28`, rounded corners 16px
- Inside: A **large circular progress ring** (donut chart style)
  - Ring color: `#7c4dff` (filled portion) on `#36333e` (track)
  - Center text: **"84 / 120"** in large bold `#cdbdff`, below it **"reviewed today"** in small `#cac3d8`
- Below the ring: A thin progress bar (same colors) with label "Today's Progress"

### Streak Section
- Row with a flame icon in `#ffb688` (tertiary/orange)
- Large number: current streak count in `#ffb688`, bold
- Label: "Day Streak" in `#cac3d8`
- Small note: "Review 100+ questions to keep your streak" in `#948ea1`

### Last Few Days — Mini Progress Row
- Horizontal row of 5-7 small circular progress indicators (one per day)
- Each circle shows: abbreviated day label (Mon, Tue...) below it
- Circle fill: `#7c4dff` proportional to daily completion
- Completed days: glow or tick in `#cdbdff`
- Missed days: dim `#36333e`

### Start Button
- Large full-width button, background `#7c4dff`, text `#fcf6ff`, bold
- Label: **"Start for Today"** (or **"Continue"** if session in progress)
- Border radius: 12px
- Below it (if in progress): small text showing "32 of 120 completed so far" in `#cac3d8`

### Bottom Tab Bar
- Background: `#1d1a24`
- 4 tabs: Home, Quiz, Calendar, Account
- Active tab: icon + label in `#cdbdff`, with pill indicator above icon in `#7c4dff`
- Inactive tab: icon + label in `#948ea1`

---

## Screen 2: Quiz Tab (Active Review Session)

**Layout:** Full screen, focused, minimal distraction

### Top Bar
- Back/close icon (left)
- Session progress: **"32 / 120"** centered, color `#cac3d8`
- A thin linear progress bar below the top bar — fill color `#7c4dff` on `#36333e` track

### Question Card
- Large card, background `#211e28`, rounded 16px, takes up ~40% of screen height
- Question number label: small, `#948ea1`, e.g., "Question 34"
- Question text: large, `#e6e0ee`, Inter medium weight, well-padded
- Optional: small tag/chip showing topic/category (e.g., "Cardiology") — pill shape, background `#4e3b8c`, text `#cdbdff`

### Answer Options
- 4 answer options displayed as tappable cards stacked vertically
- Default state: background `#2b2833`, text `#e6e0ee`, border `#494455`, radius 12px
- Selected (before confirm): border color `#cdbdff`, background `#211e28`
- Correct answer: background `#4e3b8c` with a checkmark icon, text `#cdbdff`
- Wrong answer: background `#93000a` with an X icon, text `#ffb4ab`
- Options must appear in a **randomized order** each time

### Consecutive Correct Counter
- Small row of 3 dots below the answer options
- Dots represent "correct streak needed": filled dot = `#cdbdff`, empty dot = `#494455`
- Label: "Get it right 3 times to complete" in `#948ea1`, tiny

### Feedback State
- After answering: brief color flash on the selected option
- A "Next" button appears at bottom: background `#7c4dff`, text `#fcf6ff`

---

## Screen 3: Calendar Tab (History View)

**Layout:** Scrollable, calendar at top, daily breakdown below

### Month Calendar
- Background: `#14121c`
- Day cells: color-coded by performance:
  - Green (`#cdbdff` tinted) — 100+ questions reviewed
  - Yellow (`#ffb688`) — 50-99 reviewed
  - Red (`#ffb4ab`) — below 50 or missed
  - Empty/future: `#211e28`
- Selected day: highlighted with `#7c4dff` border

### Selected Day Detail Card
- Card background: `#211e28`, radius 16px
- Shows: date header, total reviewed, accuracy %, streak counted (yes/no)
- Accuracy bar: fill `#cdbdff`, track `#36333e`
- Streak badge: flame icon `#ffb688` if streak counted, grey if not

---

## Screen 4: Account Tab

**Layout:** Simple list/settings style

### Profile Section
- Avatar circle (initials or photo), large, border `#7c4dff`
- Name in large text `#e6e0ee`
- Email in smaller `#cac3d8`

### Stats Summary Row
- 3 small stat cards in a row: Total Reviewed, Current Streak, Best Streak
- Card background: `#211e28`
- Value in `#cdbdff` bold, label in `#948ea1`

### Settings List
- List items on `#1d1a24` background, text `#e6e0ee`
- Dividers in `#494455`
- Items: Notifications, Change Password, Help & Support

### Logout Button
- Full-width, outlined (border `#ffb4ab`, text `#ffb4ab`) or filled with `#93000a`
- Label: "Log Out"

---

## General Design Notes for Stitch

1. **All screens use `#14121c` as the base background.**
2. **Cards are layered** using surface container tokens to create depth without shadows.
3. **Primary interactive elements** (buttons, active rings, selected states) use `#7c4dff`.
4. **Text hierarchy:** Headers `#e6e0ee` ? Subtext `#cac3d8` ? Hints/labels `#948ea1`.
5. **Streak/warm accents** use `#ffb688` (orange-peach) — only for streak, warm highlights.
6. **Error/wrong states** use `#ffb4ab` text on `#93000a` background.
7. **Typography:** Inter across all elements. Bold for numbers and CTAs, Regular for body, Medium for labels.
8. **Bottom tab bar** is always visible except during active quiz — quiz hides it for focus.
9. **Spacing:** 16px margins, 8px inner padding for small elements, 24px for section gaps.
10. **No light mode** — this is a dark-only app.

---

## Component Checklist for Stitch to Design

- [ ] Home dashboard screen (full)
- [ ] Quiz question screen (default state)
- [ ] Quiz question screen (correct answer state)
- [ ] Quiz question screen (wrong answer state)
- [ ] Calendar screen with selected day detail
- [ ] Account/profile screen
- [ ] Bottom tab bar component
- [ ] Circular progress ring component
- [ ] Streak row component
- [ ] Mini daily progress dots row
