---
name: project-setup
description: Guides a new developer through setting up the PCIC project locally. Use when someone asks about installation, setup, running the project, or environment configuration.
---

# PCIC Project Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local install or MongoDB Atlas account)
- Git

## Quick Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd PCIC-Management-System

# 2. Install dependencies
cd client && npm install
cd ../server && npm install

# 3. Configure environment
cd ../server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Create the uploads directory
mkdir uploads

# 5. Seed an admin user (optional)
node src/seed.js

# 6. Run both services
# Terminal 1:
cd server && npm run dev
# Terminal 2:
cd client && npm run dev
```

## Environment Variables (server/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Random string for signing tokens |
| `PORT` | No | Server port (default: 5000) |
| `SMTP_HOST` | No | Email SMTP host |
| `SMTP_PORT` | No | Email SMTP port |
| `SMTP_USER` | No | Email sender address |
| `SMTP_PASS` | No | Email app password |

SMTP variables are optional — emails are skipped if not configured.

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Troubleshooting

- **CORS errors**: The Vite dev server proxies `/api` to port 5000 — make sure the server is running.
- **Auth errors**: Clear `pcic_token` from localStorage and re-login.
- **MongoDB connection**: Ensure your `MONGODB_URI` is correct and MongoDB is running.
