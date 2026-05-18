<div align="center">
  
  <h1>🚀 TechCare AI Platform</h1>
  <p><b>Next-Generation AI-Powered Device Repair & Hardware Diagnostics</b></p>
  
  [![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
  [![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
  [![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
</div>

<br>

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started (Local Development)](#-getting-started-local-development)
- [Deployment (Vercel)](#-deployment-vercel)
- [API Overview](#-api-overview)
- [Project Structure](#-project-structure)

---

## 💡 About the Project

**TechCare AI Platform** is a comprehensive, full-stack application that redefines how users troubleshoot and repair hardware issues. By leveraging the advanced reasoning capabilities of the **Google Gemini AI (1.5 Flash)**, the platform analyzes user-submitted symptoms to generate highly accurate diagnoses, severities, and customized step-by-step repair guides. 

Beyond AI, TechCare functions as a complete e-commerce ecosystem, featuring a fully functional parts marketplace, cart management, simulated payment gateways, and a robust admin analytics dashboard.

---

## ✨ Key Features

### 🧠 AI-Powered Diagnostics
* **Symptom Analysis**: Users input hardware behaviors, and the Gemini API processes the text to identify the root cause.
* **Smart Output**: Generates a confidence score, severity rating (Low/Medium/Critical), and a boolean fixability flag.
* **Auto-Generated Guides**: Instantly creates interactive, step-by-step repair walkthroughs specifically tailored to the diagnosed issue, complete with tool requirements.

### 🛒 Integrated E-Commerce Marketplace
* **Parts Catalog**: Filterable inventory of replacement components categorized by device type.
* **Cart System**: Slide-out drawer cart interface for seamless purchasing.
* **Mock Payment Gateway**: Complete checkout flow generating real order histories and simulated transaction receipts.

### 📊 Administrative Dashboard
* **Real-time Analytics**: Visualizes revenue, diagnostic trends, and user growth using **Recharts**.
* **User Management**: Role-based access control allowing admins to promote users or suspend accounts.
* **Push Notifications**: Dispatch system alerts and email templates directly to users.

### 🎨 Premium UI/UX Design
* **Glassmorphism Aesthetic**: Beautiful, modern translucent cards over vibrant gradient backgrounds (Deep Amethyst & Neon Pink).
* **Micro-Animations**: Smooth hover states, glowing interactive elements, and loading skeletons entirely built in vanilla CSS (No external CSS frameworks used).

---

## 🏗️ System Architecture

This project is built using a **Monorepo Structure**, housing both the client and server applications in a single repository.

* **Frontend**: A Single Page Application (SPA) built with React (Vite). It utilizes an internal `AuthContext` with JWT persistence to manage session states and guard protected routes.
* **Backend**: An Express.js RESTful API handling authentication, database transactions, and proxying requests securely to the Google Generative AI API.
* **Database**: Uses `better-sqlite3` operating in WAL (Write-Ahead Logging) mode for robust, synchronous database operations. 

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router v6 | Component-based UI library & rapid build tool. |
| **Styling** | Vanilla CSS3 | Custom design system using CSS Variables (`var(--neon-pink)`). |
| **Icons & Charts**| Lucide-React, Recharts | Consistent iconography and data visualization. |
| **Backend** | Node.js, Express.js | High-performance asynchronous API server. |
| **Database** | SQLite3 (`better-sqlite3`) | Lightweight, self-contained SQL database engine. |
| **Security** | JWT, bcryptjs, Helmet, CORS | Industry-standard password hashing and token validation. |
| **AI SDK** | `@google/generative-ai` | Direct integration with Google's Gemini language models. |

---

## 🚀 Getting Started (Local Development)

Follow these instructions to run the application perfectly on your local machine.

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **NPM** (v9.0.0 or higher)

### Installation & Execution (Windows Easiest Way)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/techcare.git
   cd techcare
   ```
2. **Launch via Script:**
   Double-click the **`start.bat`** file located in the root directory. This script automates the entire boot process:
   - Cleans up orphaned Node processes.
   - Installs dependencies in both `/frontend` and `/backend`.
   - Launches the API Server in a terminal (`http://localhost:5000`).
   - Launches the Vite Dev Server in a terminal (`http://localhost:5173`).

3. **Log In:**
   The database automatically seeds itself on the first run. Access the platform at `http://localhost:5173` using the seeded admin credentials:
   > **Email:** `admin@techcare.com`  
   > **Password:** `Admin@123`

---

## ☁️ Deployment (Vercel)

The repository is pre-configured with a `vercel.json` and a root `api/index.js` file, allowing you to deploy the entire Monorepo (Express API + React UI) exclusively on Vercel.

1. Push your code to your GitHub repository.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `techcare` repository. Vercel automatically detects the configuration.
4. Expand the **Environment Variables** section and add:
   * `JWT_SECRET` = `(Generate a secure random string)`
   * `JWT_EXPIRES_IN` = `7d`
   * `GEMINI_API_KEY` = `(Your Google Gemini API Key)`
5. Click **Deploy**.

> ⚠️ **Important Architecture Note for Vercel:** Vercel utilizes Serverless Functions with a read-only filesystem. Our code actively detects Vercel (`process.env.VERCEL`) and automatically copies the SQLite database to the `/tmp` folder to allow the app to function. **However, data is ephemeral**. When the serverless function spins down, the `/tmp` database resets. This configuration is intended for **Portfolio Demonstration purposes only**. For persistent production data on Vercel, consider migrating the DB logic to Vercel Postgres or Turso.

---

## 📡 API Overview

The Express backend exposes RESTful endpoints prefixed with `/api/v1/`.

* **Auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
* **Devices**: `GET /devices`, `POST /devices`, `PUT /devices/:id`
* **Diagnoses**: `POST /diagnoses` *(Triggers Gemini AI)*, `GET /diagnoses`
* **Guides**: `GET /guides/:id`, `PUT /guides/:id/step`
* **Marketplace**: `GET /parts`, `POST /orders`, `POST /payments`
* **Admin**: `GET /admin/analytics`, `PUT /admin/accounts/:id`, `POST /admin/notifications`

---

## 📂 Project Structure

```text
/techcare
│
├── /api                 # Vercel Serverless Entrypoint Wrapper
├── /backend             # Server Application
│   ├── /src/config      # DB connections & Environment Setup
│   ├── /src/middleware  # JWT Auth, Validation, & Error Handling
│   ├── /src/routes      # API Endpoints
│   ├── /src/services    # Gemini AI SDK integration
│   └── index.js         # Express App Initialization
│
├── /frontend            # React Client Application
│   ├── /src/api         # Axios instance & Interceptors
│   ├── /src/components  # Reusable UI (Buttons, Modals, Spinners)
│   ├── /src/pages       # Route Views (Dashboard, Diagnoses, Marketplace)
│   ├── /src/styles      # Global Design Tokens & Variables
│   └── main.jsx         # React DOM Mount
│
├── package.json         # Root Dependency Manager (Unified Builds)
├── render.yaml          # Render.com IaC Configuration
├── start.bat            # Local Windows Runner
└── vercel.json          # Vercel Deployment Configuration
```

---
<div align="center">
  <i>Developed with ❤️ for Advanced Hardware Diagnostics</i>
</div>
