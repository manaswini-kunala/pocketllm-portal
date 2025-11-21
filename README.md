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


# 🛠 SETUP & INSTALLATION

## 1️⃣ Clone the Repository

1. Run the following:

   **git clone https://github.com/manaswini-kunala/pocketllm-portal.git**  
   **cd pocketllm-portal**

---

## 2️⃣ Backend Setup (server)

1. Navigate to the backend folder:

   **cd server**  
   **npm install**

---

### ✅ 1) Create `.env` file

Create a file named `.env` inside the `server` folder with the following content:

> `JWT_SECRET` can be **any random string** — used for signing login tokens.

---

### ✅ 2) Run Prisma migrations (creates all tables)

Run:

**npx prisma migrate dev --name init**

---

### ✅ 3) Seed default users

Run:

**node prisma/seed.js**

This will create:

#### Admin User  
- Email: **admin@pocketllm.com**  
- Password: **admin123**

#### Regular User  
- Email: **user@pocketllm.com**  
- Password: **user123**

---

### ✅ 4) Start backend server

Run:

**npm start**

Backend runs at → http://localhost:3001

---

## 3️⃣ Frontend Setup (client)

1. Open another terminal  
2. Navigate to client folder:

   **cd client**

3. Install dependencies:

   **npm install**

4. Start the frontend:

   **npm run dev**

Frontend runs at → http://localhost:5177

---

## 🤖 LLM Model (Auto-Download)

On the **first chat request**, the backend automatically downloads:

**Xenova/Qwen1.5-0.5B-Chat**

- ✔ No Hugging Face API key needed  
- ✔ No GPU required  
- ✔ Fully CPU-only  
- ✔ Model cached locally after first run  



    



