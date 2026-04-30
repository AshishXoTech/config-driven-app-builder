# 🧠 SchemaForge 
### A fault-tolerant, config-driven system for generating full-stack applications

> Builds dynamic UI, APIs, and database behavior from JSON — and **does not break when the config is imperfect**

---

## 🔥 Overview

This project is not a traditional CRUD app.

It is a **dynamic application runtime** that:
- Reads structured JSON configuration
- Generates UI, backend APIs, and database interactions
- Handles incomplete, inconsistent, or invalid configurations **gracefully**

---

## ⚠️ The Problem

In real-world systems, configurations are rarely perfect.

They are:
- incomplete
- inconsistent
- partially incorrect

Most systems:
- crash ❌
- fail silently ❌
- require manual fixes ❌

---

## ✅ The Solution

This system is designed with **resilience as a core principle**.

It:
- detects invalid configurations
- activates fallback behavior (Safe Mode)
- isolates failures
- continues running without crashing

---

## 🏗️ Architecture
    JSON Config
         ↓

        ┌──────────────────────┐
│  Config Validator    │
└──────────────────────┘
↓
Safe Mode System
↓
┌──────────────────────┐
│  Route Generator     │ → Dynamic APIs
└──────────────────────┘
↓
Prisma / Database
↓
┌──────────────────────┐
│ Frontend Renderer    │ → Forms / Tables / UI
└──────────────────────┘


---

## ⚙️ Key Features

### 🧩 Dynamic Application Runtime
- Generates UI, APIs, and DB interactions from config
- No hardcoded models

---

### 🛡️ Safe Mode (Core Feature)
- Detects invalid config
- Prevents system crashes
- Enables graceful fallback

---

### 🔀 Error Isolation
- One broken model does not affect others
- Partial system continues to function

---

### ⚠️ Unknown Field Handling
- Unsupported field types do not break UI
- Rendered with safe fallback components

---

### 📥 CSV Import System
- Upload → validate → store
- Supports partial success
- Reports row-level errors

---

### 🔐 Authentication System
- Email/password login
- OTP-based login
- Secure session handling

---

### 🔔 Notification System
- Event-based notifications (e.g. record creation, CSV import)
- User-scoped data

---

## 🧪 Edge Case Handling

The system is explicitly designed to handle:

- Invalid field types (`"type": "magic"`)
- Missing schema definitions
- Broken model configurations
- Partial CSV failures
- Unexpected input structures

> The system does not assume correctness — it expects failure.

---

## ⚖️ Tradeoffs

| Decision | Tradeoff |
|--------|---------|
| Dynamic runtime | Less compile-time safety |
| Runtime validation | Slight performance overhead |
| Fault tolerance priority | Reduced strict schema enforcement |

---

## 🔌 Extensibility

The system is designed to evolve without rewriting core logic.

Example:
```ts
renderers = {
  text: TextField,
  number: NumberField,
  // Add new components easily
}

🚀 Live Demo
🔗 https://config-driven-app-builder.vercel.app/

🎥 Demo Video
https://www.loom.com/share/a3b4deac04a5489e98fbee7b703f9057?t=573

📂 Tech Stack

Frontend

* Next.js
* Tailwind CSS

Backend

* Node.js (TypeScript)
* Express

Database

* PostgreSQL
* Prisma ORM

🛠️ Setup

1. Clone repo
git clone https://github.com/AshishXoTech/config-driven-app-builder.git

2. Install dependencies
npm install

3. Setup environment
DATABASE_URL=...
JWT_SECRET=...
ENABLE_SAFE_MODE=true

4. Run project
npm run dev

🎯 Design Philosophy

“Failure is not an exception — it is expected.”

This system is built for:

* real-world uncertainty
* imperfect inputs
* evolving configurations

⸻

📌 Final Note

This project focuses on:

* resilience over perfection
* systems thinking over UI
* real-world robustness over ideal scenarios

⸻

👨‍💻 Author

Ashish
