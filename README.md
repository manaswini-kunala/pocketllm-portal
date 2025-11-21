# PocketLLM Portal

A full-stack chat application with local LLM inference, built with React and Node.js.

## Features

- 💬 Chat with a local AI model (runs on CPU)
- 🔐 User authentication (JWT-based)
- 📝 Session management (save and continue conversations)
- 🎨 Multiple AI personas (Friendly, Professional, Technical)
- ⚡ Response caching for faster replies
- 👤 Admin dashboard for monitoring metrics
- 🗄️ SQLite database for persistence

---

## Tech Stack

**Frontend:**
- React (TypeScript)
- Vite
- Tailwind CSS

**Backend:**
- Node.js (JavaScript)
- Express.js
- Prisma ORM
- SQLite
- Transformers.js (local AI)

---

## Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Git**

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

### 2. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd ../client
npm install
```

### 3. Environment Setup

Create a `.env` file in the `server/` directory:

```bash
cd server
touch .env
```

Add the following to `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="supersecretkey_change_me_in_prod"
PORT=3001
```

### 4. Database Setup

Initialize the database and run migrations:

```bash
cd server
npx prisma migrate dev
```

### 5. Seed Database (Optional)

Seed the database with default users:

```bash
node seed.js
```

This creates two test accounts:
- **Admin**: `admin@pocketllm.com` / `admin123`
- **User**: `user@pocketllm.com` / `user123`

---

## Running the Project

### Start Backend Server

```bash
cd server
npm run dev
```

Server runs on: `http://localhost:3001`

### Start Frontend Client

```bash
cd client
npm run dev
```

Client runs on: `http://localhost:5173`

---

## Usage

### 1. Access the App

Open your browser and go to: `http://localhost:5173`

### 2. Login

Use one of the seeded accounts or register a new one:
- **Admin**: `admin@pocketllm.com` / `admin123`
- **User**: `user@pocketllm.com` / `user123`

### 3. Start Chatting

- Type your message and select a persona (Friendly, Professional, etc.)
- The AI model downloads on first use (~200MB) and then runs locally
- Responses are cached for faster repeated queries

### 4. Admin Dashboard (Admin Only)

Navigate to `/admin` to view:
- CPU and memory usage
- Cache statistics
- Request metrics
- Response times
- Current AI model

---

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Login, Chat, Admin
│   │   └── components/    # Reusable UI components
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/       # API routes (auth, chat, admin)
│   │   ├── services/     # Business logic (LLM, cache, metrics)
│   │   └── middleware/   # Authentication
│   ├── prisma/           # Database schema & migrations
│   ├── index.js          # Main server entry
│   ├── seed.js           # Database seeding script
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Available Scripts

### Server

```bash
npm run dev        # Start development server with nodemon
```

### Client

```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## Database Management

### View Database (Prisma Studio)

```bash
cd server
npx prisma studio
```

Opens a visual database browser at `http://localhost:5555`

### Create a New Admin User

```bash
cd server
node make-admin.js <user-email>
```

### Reset Database

```bash
cd server
rm prisma/dev.db
npx prisma migrate dev
node seed.js
```

---

## How It Works

### Architecture

```
User (Browser)
     ↓
React Frontend (Vite)
     ↓ HTTP/REST
Node.js Backend (Express)
     ↓
Prisma ORM
     ↓
SQLite Database (dev.db)
```

### AI Model

- **Model**: `Xenova/Qwen1.5-0.5B-Chat`
- **Runs**: Locally on CPU (no API keys needed)
- **First Request**: Downloads model (~200MB) and caches it
- **Subsequent Requests**: Uses cached model files

### Caching

- **Type**: LRU (Least Recently Used) in-memory cache
- **Capacity**: 500 responses
- **TTL**: 1 hour
- **Key**: `model:persona:prompt`
- Same question → Instant response from cache

---

## Default Credentials

After running `node seed.js`:

| Email | Password | Role |
|-------|----------|------|
| admin@pocketllm.com | admin123 | admin |
| user@pocketllm.com | user123 | user |

---

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is in use:

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database Issues

```bash
cd server
rm prisma/dev.db
npx prisma migrate dev
node seed.js
```

### Model Download Fails

- Check internet connection
- Model auto-downloads on first chat request
- Files cached in `~/.cache/huggingface/`

### Cache Not Working

- Cache is in-memory only (lost on server restart)
- Exact same prompt + persona + model required for cache hit
- Check server console for "Cache Hit!" or "Cache Miss" logs

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

For issues or questions, please open an issue on GitHub.
