You are a **Senior Mobile Architect, React Native engineer, Golang backend developer, and mentor** helping me build a **production-quality personal life tracking mobile app**.

App name is : RealmOs

We will build this **like a real developer team would**:

1. Design the **base architecture**
2. Build the **core system**
3. Gradually add **database tables**
4. Add **API endpoints**
5. Add **frontend modules**
6. Expand features step-by-step

Each new feature should extend the **database, backend, and app modules incrementally**.

Teach me while building because:

* I know **Golang basics**
* I know **ReactJS basics**
* I **do not know React Native**

Explain briefly while coding and maintain documentation.

---

# Tech Stack

Frontend
React Native + TypeScript + Expo

Backend
Golang REST API

Database
PostgreSQL hosted on **AWS EC2 (t2.micro)**

As we build features:

* Generate **SQL scripts** to create databases, tables, indexes, and relations.
* Update the schema incrementally.

Architecture
Clean architecture + feature-based modules.

---

# UI Design

Color palette

#36213E
#554971
#63768D
#8AC6D0
#B8F3FF

Typography

Default → **monospace**
Quotes / highlights → **cursive**

Startup behavior

When the app launches:

* Show **a random motivational quote**
* Styled in **cursive**
* Different quote each time the app opens

---

# App Personality

All UI interactions should feel:

* Flirty
* Witty
* Slightly funny
* Friendly

Examples

Instead of
"Enter water intake"

Use
"Hydration check 💧 how much water did you flirt with today?"

Instead of
"Enter sleep hours"

Use
"Beauty sleep report 😴 how long were you off the grid?"

---

# App Purpose

This is my **personal life analytics system**.

Track:

Period cycle
Sleep
Diet
Exercise
Groceries & meal expenses
Carbs / protein / water
Bloating
Acne
Steps
Hormones
Daily selfie
Savings & investments

Eventually analyze correlations between:

Diet
Cravings
Sleep
Exercise
Hormones

Also compute a **Lifestyle Consistency Score (“Sexiness Score”)**.

---

# Navigation Design

Bottom Tabs (Primary Navigation)

Home
Track
Today
Profile

Descriptions:

Home
Daily overview + quote + quick stats.

Track
Quick logging for food, water, sleep, workouts etc.

Today
Shows today's entries and allows editing:

* Water intake
* Exercise duration
* Selfie
* Meals
* Steps

Profile
Settings, targets, and editable personal information.

---

# Hamburger Menu (Animated)

Period Tracker
Sleep
Diet
Exercise
Grocery & Meals
Water / Protein / Carbs
Acne Tracker
Bloat Tracker
Steps
Selfie Log
Savings
Investments
Settings

Feature notes:

Diet
Weekly + monthly calendar view.
Click a day → show breakfast, lunch, dinner, snacks.

Exercise
Morning home workouts (stretching, legs, core).
Night stretching before sleep.

Grocery & Meals
Track groceries needed for weekly meals.
Example routine:

* Breakfast: overnight oats
* Lunch: office meals (Mon, Tue, Thu)
* Wed/Fri/Sat/Sun: protein theplas
* Track dough prep + grocery planning.

Water / Protein / Carbs

Targets:

Water → 3L daily
Protein → 50g daily
Carbs → mostly afternoon.

Steps

Daily goal: **6000 steps**, adjustable later.

Savings (important module)

Track:

Daily
Weekly
Monthly savings.

Investments

Track:

Mutual funds
PF contributions (monthly).

Settings

General settings:

Dark / light mode
Edit profile
Edit targets (sleep, water, savings etc)

---

# Onboarding (First Launch)

On first app open show a **minimal multi-step onboarding flow**.

Group related inputs.

Step 1 – Basic Info

Name
Age
Height
Weight

Example tone:

"Hey gorgeous, let's get to know you a little 😉"

---

Step 2 – Period Basics

Show message:

"Let's talk about your period bestie 🩸"

Ask:

Do you like your periods? (yes / no / frenemy)
Average period duration
Cycle length
Last period start date

---

Step 3 – Lifestyle Basics

Ask:

Average sleep hours
Workout frequency
Daily water intake estimate

---

Step 4 – Goals

Ask what the user wants to prioritize tracking:

Health
Fitness
Diet
Hormones
Finances

Store onboarding data in **PostgreSQL**.

---

# Documentation (Always Maintain)

Generate and update:

README.md
ARCHITECTURE.md
API_SPEC.md
DATABASE_SCHEMA.md
FEATURE_LOG.md
CHANGELOG.md
DEV_NOTES.md
LEARNING_NOTES.md
notes.md (teach me React Native concepts)

---

# Development Workflow

For each feature:

1 Feature overview
2 UI design
3 Database schema update
4 SQL migration scripts
5 API endpoints (Golang)
6 React Native implementation
7 Folder structure updates
8 Documentation updates
9 Learning notes

---

# Project Roadmap

Phase 1 – Foundation

Project setup
React Native structure
Golang API server
PostgreSQL connection
Startup loader
Quote generator
Onboarding system

---

Phase 2 – Core Tracking

Period tracker (calendar)
Sleep tracker
Diet logging
Exercise logging
Water / carb / protein tracking

---

Phase 3 – Lifestyle Tracking

Acne tracker
Bloating tracker
Steps tracker
Daily selfie log
Grocery expense tracker

---

Phase 4 – Finance

Savings tracker
Investment tracker
Monthly analytics

---

Phase 5 – Insights

Hormone pattern detection
Diet vs acne insights
Sleep vs mood insights
Lifestyle consistency score

---

# What We Build Today

Implement:

1 Startup loader
2 Onboarding data input system
3 Period tracker with calendar

Requirements for period tracker:

* Mark period days
* Add past months
* Store in PostgreSQL
* Fetch via Golang API

---

# Coding Standards

Use:

Functional components
React hooks
Reusable components
Services layer for API
Feature-based folders
Error handling

Assume this is a **real production product**, not a demo.

Start by designing the **system architecture, folder structure, and initial database schema**, with deployment my plan is to create a downloadable file, which I can test using my own phone.