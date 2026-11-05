# Deployment Guide: Project Management Tool on Vercel

This repository contains both the **Frontend** (`pmt-frontend`, built with React + Vite) and the **Backend** (`multi-tenant-pm-backend`, built with Express, MongoDB, and WebSocket collaboration).

---

## Option 1: Vercel Multi-Service Project (Recommended for Vercel)

Vercel supports **Multi-Service Projects** using the root `vercel.json` included in this repository.

### How it works:
1. When you import the repository into Vercel, select the **Services** preset.
2. Vercel reads the root `vercel.json`:
   - Routes `/api/*` and `/socket.io/*` to `multi-tenant-pm-backend`
   - Routes `/*` to `pmt-frontend`
3. Both services deploy as synchronized, atomic units under a single Vercel project URL.

### Environment Variables to Configure in Vercel:

#### For Backend (`multi-tenant-pm-backend`):
- `MONGO_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/pmt?retryWrites=true&w=majority`)
- `JWT_SECRET`: A secure random secret string
- `CLIENT_URL`: Your Vercel deployment URL (e.g. `https://your-project.vercel.app`)
- `STRIPE_SECRET_KEY`: (Optional) Your Stripe Secret Key for card payments
- `STRIPE_WEBHOOK_SECRET`: (Optional) Your Stripe Webhook Signing Secret

#### For Frontend (`pmt-frontend`):
- `VITE_API_URL`: `/api` (uses relative path routed by Vercel rewrites)

---

## Option 2: Standalone Projects (Best for Full Persistent WebSockets)

If your team relies heavily on 24/7 persistent WebSocket streaming for internal team chat and instant updates, the industry-standard architecture is:

1. **Deploy Backend on Render / Railway / Fly.io / DigitalOcean**:
   - Root directory: `multi-tenant-pm-backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`)
   - Provides continuous HTTP server with always-on WebSocket connections.

2. **Deploy Frontend on Vercel**:
   - In Vercel, click **Import single project** next to `pmt-frontend`.
   - Framework Preset: **Vite**
   - Root Directory: `pmt-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend-domain.com/api`

---

## Billing & Pricing Structure

- **Starter Plan**: Up to 5 members included for free.
- **Member Addition**: **$3.00** per added member seat.
- **Platform Join Fee**: **10%** flat platform fee on seat additions.
  - Formula: `Total = (Seats × $3.00) + 10% Platform Join Fee`
  - Example (5 seats): `($15.00) + ($1.50) = $16.50`
