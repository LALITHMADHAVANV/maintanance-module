# TextileCare Pro — Maintenance Management System

A comprehensive maintenance module for the textile & garment industry built with React, Node.js/Express, Supabase, and Socket.io.

## Features

- 📸 **Photo-based issue reporting** — Supervisors capture and send machine issue photos
- 🎯 **Smart specialist matching** — Auto-assigns best technician based on problem type
- 💬 **Real-time messaging** — Socket.io powered communication between supervisors and technicians
- ⏱️ **Time tracking** — Automatic waiting time, fixing time, and downtime calculation
- 📊 **Analytics dashboard** — Downtime charts, cost analysis, performance metrics
- 🔧 **Work order management** — Full lifecycle from creation to completion
- 📦 **Spare parts inventory** — Stock tracking with low-stock alerts
- 🗓️ **Preventive maintenance** — Scheduled maintenance with overdue notifications
- 🔔 **Real-time notifications** — Instant alerts for breakdowns and task assignments

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account (optional for demo mode)

### Frontend (React)

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` with mock data — no backend needed for the demo.

### Backend (Express)

```bash
cd server
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@textilecare.com | admin123 |
| Manager | manager@textilecare.com | manager123 |
| Supervisor | supervisor1@textilecare.com | super123 |
| Technician | tech1@textilecare.com | tech123 |

### Environment Variables

**Client** (`client/.env`):
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```

**Server** (`server/.env`):
```
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:3000
```

### Database Setup

1. Create a Supabase project
2. Run `database/schema.sql` in the SQL Editor
3. Create a Storage bucket named `machine-images` (public)
4. Update environment variables with your Supabase credentials

## Project Structure

```
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # React Context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       └── services/       # API, Supabase, Socket.io
├── server/                 # Express backend
│   ├── config/             # Database & app config
│   ├── middleware/          # Auth, upload, validation
│   ├── routes/             # API route handlers
│   └── socket/             # Socket.io event handlers
└── database/               # SQL schema & migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Recharts, Lucide Icons |
| Backend | Node.js, Express, Socket.io, JWT, bcryptjs |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Real-time | Socket.io |

## License

MIT
