# Hippocrates AI — Pitch Deck

---

## Slide 1 — Cover

# Hippocrates AI
### *Read Once. Recall Always.*

**An AI-powered mastery learning platform** that personalises student learning,
simplifies educator oversight, and gives parents real-time visibility into their child's progress.

---
*Anthony Caleb · Joba Osagie Solutions · Edo State, Nigeria*
*September 2026*

---

## Slide 2 — The Problem

# Students are studying more and retaining less.

The way students learn today is broken — and three groups feel it every day.

---

### 👨‍🎓 Students
> *"I read it. I understood it. But I couldn't answer it in the exam."*

- Passive reading creates an **illusion of understanding**
- Curricula in Nigerian secondary and tertiary institutions are **dense and fast-paced**
- No structured feedback loop tells students what they actually know vs. what they merely skimmed
- General AI chatbots answer questions on demand but **do not build long-term retention**

---

### 👨‍🏫 Educators
> *"I have 40 students. I cannot reach all of them."*

- Teachers cannot track individual comprehension gaps at scale
- Classroom tests are periodic — by the time a teacher knows a student is struggling, weeks have passed
- **No real-time tool exists** to tell an educator which students need intervention today

---

### 👨‍👩‍👧 Parents
> *"I pay for school fees and private lessons. I find out how my child is doing at the end of term."*

- Parents who invest in education have **zero daily visibility** into academic progress
- Private tutoring is expensive and does not scale
- Report cards arrive months after the problem has already developed

---

## Slide 3 — Why Now

# The timing has never been better.

Three forces are converging in 2026:

| Force | What it Means |
|---|---|
| 🤖 **The current power of AI Context** | LLMs can now hold large enough context such that high-quality educational content can be understood and used to guide learning. |
| 📱 **Smartphone penetration in Nigeria** | Students and parents are online and comfortable using apps for daily tasks |
| 🏫 **The EdTech gap in Africa is growing** | Existing solutions (Anki, Quizlet, Mindgrasp) are built for Western curricula, Western pricing, and Western family structures |

The African educational market is large, underserved, and ready.

---

## Slide 4 — The Solution

# Hippocrates AI: A learning system that guarantees mastery.

Hippocrates AI is an AI-based educational technology platform that applies mastery-based learning principles (like Spaced Repetition and interleaved practice) to help students learn faster, more deeply, and more enjoyably. Unlike general-purpose AI chatbots that answer questions on demand, Hippocrates AI is an education-specific system that focuses not just on generating responses but on a structured active learning system that contributes directly to the learning efficiency of the student. 

The typical progression is:
- **Passive reading** (in the library section)
- **Spaced repetition** with contextually developed AI-generated quizzes and flashcards (in the review section)
- **One-on-one conversations with AI** for evaluation and reinforcement (in the viva section)

It is developed to be used by individuals and institutions, and designed such that students, educators, and parents can utilize it together to achieve a single goal: the academic success of the student. The platform tracks daily streaks, mastery counts, and progress across materials, and is designed to eventually expose these metrics to educators and parents in real time, replacing the current reality where parents wait until the end of a school term/semester/session to learn how their child is doing.

---

## Slide 5 — How It Works

# A working product with real users.

Hippocrates AI is a working web application (hippocratesai.netlify.app). 

Students can upload lecture materials (PDFs, DOCX files) to their personal library. The AI platform reads their material and, from any section a student highlights, generates four types of assessment questions: multiple choice, true/false clusters, fill-in-the-gap, and select-all-that-apply. 

Students review pending questions before approving them into their personalised spaced repetition queue. The queue uses a custom algorithm requiring 3 consecutive correct answers to master a card, and reschedules mastered cards at 3-to-5-day intervals for long-term retention. Daily progress streaks and mastery counts are tracked on a personal dashboard.

---

## Slide 6 — The Market Opportunity

# Nigeria's education sector is a ₦2 trillion+ industry.

---

### Target Market

| Segment | Size | Relevance |
|---|---|---|
| **Secondary school students (SS1–SS3)** | ~6 million students nationally | Core underserved segment; WAEC/NECO exam pressure is acute |
| **University students** | ~2 million enrolled annually | Already using AI tools but without structure |
| **Parents of secondary students** | Mirrors student count | The paying customer in the B2C phase |
| **Secondary schools (B2B target)** | ~13,000 approved schools nationwide | The institutional buyer in the B2B phase |

---

### Beachhead Market
We are starting with **university students in Edo State** — our home market — and expanding outward.
---

### Why African Parents Are a Unique Unlock
In Western markets, apps like Anki are student-driven. In the African family structure, parents are **active education investors** — they pay school fees, hire tutors, and want accountability for outcomes. No competitor has built for this reality. Hippocrates AI is designed from the ground up to give parents a dashboard.

---

## Slide 7 — Business Model

# Credit-based B2C today. Institutional B2B tomorrow.

---

### Phase 1 — B2C (Current)

Students and parents purchase **AI credits** directly.

| Package | Price | Credits |
|---|---|---|
| Starter | ₦2,000 | 100 credits |
| *More tiers to be defined* | — | — |

- **1 credit ≈ 1 AI question generation**
- Review sessions and spaced repetition are **free** once cards are generated

---

### Phase 2 — B2B (With Grant Funding)

Schools and departments pay a **per-student subscription** covering all credits for their cohort.

| Model | Payer | Unit |
|---|---|---|
| B2C | Student / Parent | Credit bundle |
| B2B | School / Department / Government | Per-student / per-term subscription |

The B2B transition is enabled by scaling the backend to handle at least 1000+ simultaneous users

---

## Slide 8 — What We Have Built

# A comprehensive learning ecosystem.

---

### Live Features (September 2026)

| Feature | Status |
|---|---|
| Document library (upload DOCX, PDF) | ✅ Live |
| AI question generation (4 types, Google Gemini) | ✅ Live |
| Review mode (approve, edit, regenerate) | ✅ Live |
| Spaced repetition quiz engine | ✅ Live |
| Daily streak tracking | ✅ Live |
| Dashboard with mastery metrics | ✅ Live |
| Web app | ✅ Live |

---

### Technology Stack

| Layer | Technology |
|---|---|
| AI Engine | `gemini-3.1-pro-preview` |
| Backend | Django (Python), PostgreSQL |
| Frontend | React 19, TypeScript, Tailwind CSS |
| Mobile | React Native |
| Infrastructure | AWS (planned scale-up) |

---

### What Is Not Yet Built

| Feature | Why It Matters |
|---|---|
| **Study Hub** | A collaborative environment for students |
| **Conversational AI for Learning** | The "viva" section for one-on-one evaluation and reinforcement |

---

## Slide 9 — Traction & Evidence

# This is not a hypothesis. This is a real problem with real demand.

---

### Evidence 1 — Founder-Market Fit
Anthony Caleb is a founder and a student who personally experienced the problem this product solves. He did not discover this problem through market research. He lived it — cramming for exams, losing information within days, and watching his peers do the same. That lived urgency is why he built this.

---

### Evidence 2 — Market Validation Survey
A targeted Google Form survey was distributed to Nigerian students across secondary and tertiary institutions to gauge demand. 

56% were willing to pay for a structured educational AI, and this percentage of individuals were those who actually used AI for more educational purposes rather than just generic ones. However, much more than the market survey, the user retention from those who have used the application clearly indicates that people want it.

---

## Slide 10 — Competitive Landscape

# We are the only player in this space built for Africa.

---

| | Hippocrates AI | Mindgrasp AI | Anki / Quizlet | ChatGPT / Gemini |
|---|:---:|:---:|:---:|:---:|
| Uploads your course material | ✅ | ✅ | ❌ | ❌ |
| Generates contextual questions | ✅ | ✅ | ❌ | ✅ (unstructured) |
| Spaced repetition with mastery threshold | ✅ | ❌ | ✅ (basic) | ❌ |
| Built for African curricula & pricing | ✅ | ❌ | ❌ | ❌ |
| Parent / educator visibility portal | ✅ (planned) | ❌ | ❌ | ❌ |
| Naira pricing | ✅ | ❌ | ❌ | ❌ |

---

### Our Unfair Advantage
**Mindgrasp AI** is the closest product globally. It is US-based, priced in USD, built for Western family dynamics, and has no parent accountability layer. We win by being deeply local and by involving the parents — the people who are actually paying.

---

## Slide 11 — The Team

# Built from a place of personal need.

---

### Anthony Caleb Osagie
**Founder & Lead Developer**
Anthony is a 600 level medical student of the University of Benin and full-stack engineer. He started Joba Osagie Solutions, under which he built the Hippocrates AI platform. He started learning programming in 2020 during COVID-19 lockdown and is currently a full-stack developer and AWS-Certified AI programmer. He personally experienced the problem as a student navigating a dense university curriculum, bringing a unique perspective to the product's development and design. 

---

### Why He Can Do This
He is not an outsider looking at a market. He is the target user who also built the product. That combination — lived problem + technical capability — is the most reliable predictor of founder-market fit.

---

## Slide 12 — The Ask

# ₦10,000,000 to go from product to platform.

---

### What We Are Asking For
**Total Grant: ₦10,000,000**

| Milestone | Deliverable | Budget | Timeline |
|---|---|---|---|
| **1. AI Credits** | AI APIs (e.g. Gemini and ElevenLabs) provisioning for 1 year | ₦,3,000,000 | 180 days |
| **2. AWS Scaling** | Infrastructure to support 1000+ simultaneous users (EC2, RDS, S3) | ₦3,500,000 | 180 days |
| **3. B2B Infrastructure** |  Partnering with Institutions might mean running pilots to prove its efficiency to schools as well as other miscellaneous | ₦3,500,000 | 180 days |

---

### What Becomes Possible That Is Not Possible Today

Without this grant:
- ❌ AI credit costs limit the number of students who can actively use the platform
- ❌ The server cannot handle a 1000 users at once

With this grant, within 6 months:
- ✅ Hundreds of students can generate and review cards without credit rationing
- ✅ We can sign and serve our first institutional client 
- ✅ We have a proof-of-concept B2B case study to raise the next round

---

## Slide 13 — Vision

# Every student in Africa deserves a personal tutor.

---

Not a chatbot that answers questions on demand.
Not a generic flashcard app.

A **system** that knows what a student knows, what they are forgetting, and what they need to review today — and that gives the people who love them the visibility to support that journey.

That is Hippocrates AI.

---

> *"Read Once. Recall Always."*

**Contact:** jobatony23@gmail.com
**Platform:** Hippocrates AI
**Company:** Joba Osagie Solutions · Edo State, Nigeria

---

*End of Pitch Deck — September 2026*
