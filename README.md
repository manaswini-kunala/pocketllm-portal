🚀 PocketLLM Portal

A lightweight, local-first LLM chat application that runs entirely on CPU using Transformers.js (Xenova) and a compact Hugging Face model.
Includes multi-turn chat, personas, session history, authentication, and an admin dashboard for monitoring & system control.

⸻

✨ Features

🧠 Chat Interface
	•	Clean chat UI with sidebar for conversation history
	•	Multi-turn memory (configurable context window)
	•	Personas: Default, Friendly, Formal, Technical
	•	CPU-only inference using @xenova/transformers
	•	Auto-download of Qwen model on first request

🔐 Authentication
	•	Login system
	•	Default admin and user accounts
	•	Role-based access to admin dashboard

🛠 Admin Dashboard
	•	View CPU & RAM usage
	•	Track LLM latency + cache hits
	•	Change model settings:
	•	Max context messages
	•	Max response length
	•	Model name
	•	Clear cache

💾 Data Persistence

Powered by Prisma + SQLite:
	•	Users
	•	Sessions
	•	Messages
	•	System Config

⸻

📦 Tech Stack

Frontend: React, TypeScript, Vite, Tailwind
Backend: Node.js, Express
Database: SQLite (Prisma ORM)
LLM: Hugging Face model (Qwen1.5-0.5B-Chat) served locally via Xenova Transformers.js
This satisfies both:
	•	Hugging Face requirement
	•	CPU-only requirement
	•	Transformers.js engine requirement


🗂 Project Structure

pocketllm-portal/
│
├── client/                     # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                     # Backend (Express + Prisma)
│   ├── src/                    # API routes, controllers, LLM engine
│   ├── prisma/                 # Schema + migrations + seed
│   ├── .env                    # Environment variables
│   └── package.json
│
└── .gitignore



🛠 Setup & Installation

Anyone cloning the repo can run the project using these steps.


1️⃣ Clone Repository
   git clone https://github.com/manaswini-kunala/pocketllm-portal.git
   cd pocketllm-portal

2️⃣ Backend Setup (server)
   cd server
   npm install

1) Create .env:
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key"
   JWT_SECRET can be any random string — it is used to sign login tokens.

2) Run migrations (creates all tables):
   npx prisma migrate dev --name init

3) Seed default users
   node prisma/seed.js

    This creates:
    Admin:
    Email: admin@pocketllm.com
    Password: admin123
    
    Regular User:
    Email: user@pocketllm.com
    Password: user123

4) Start backend:
   npm start

3️⃣ Frontend Setup (client)

   Open another terminal:
   cd client
   npm install
   npm run dev

🤖 LLM Model (Auto-Download)

   On the first chat request, the backend automatically downloads:
   Xenova/Qwen1.5-0.5B-Chat
    •	No Hugging Face API key needed
  	•	No GPU needed
  	•	Fully CPU-only

    



