# 🚀 PocketLLM Portal

PocketLLM Portal is a lightweight **local-first LLM chat application** that runs fully on **CPU** using  
**Transformers.js (Xenova)** and a **Hugging Face lightweight model (Qwen1.5-0.5B-Chat)**.  

It includes:
- Multi-turn chat  
- Personas  
- Session history  
- Authentication  
- Admin dashboard  
- Local SQLite database  
- CPU-only inference  

---

# ✨ Features

## 🧠 Chat Interface
- Clean UI with collapsible **conversation history sidebar**
- Multi-turn memory (configurable)
- Personas: **Default**, **Friendly**, **Formal**, **Technical**
- CPU-only inference via `@xenova/transformers`
- Auto-downloads model from Hugging Face Hub

## 🔐 Authentication
- JWT-based login
- Default admin + user accounts
- Role-based access (admin dashboard)

## 🛠 Admin Dashboard
- CPU usage
- RAM usage
- LLM latency
- Cache hit ratio
- Update LLM config (context, response length, model)
- Clear cache

## 💾 SQLite Persistence
- Users  
- Sessions  
- Messages  
- SystemConfig  

---

# 📦 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express |
| Database | SQLite (Prisma ORM) |
| LLM Runtime | Hugging Face model (`Qwen1.5-0.5B-Chat`) via Xenova Transformers.js |

---

# 🗂 Project Structure


pocketllm-portal/
│
├── client/                     # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                     # Backend (Express + Prisma)
│   ├── src/                    # Routes, controllers, LLM engine
│   ├── prisma/                 # Schema, migrations, seed.js
│   ├── .env                    # Environment variables
│   └── package.json
│
└── .gitignore


---

# 🛠 SETUP & INSTALLATION 

1️⃣ Clone the Repository

```bash
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

    



