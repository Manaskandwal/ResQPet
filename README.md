# ResQPaw— Animal Rescue Platform 🐾

A production-ready, full-stack animal rescue coordination platform with 5 user roles, automated rescue escalation, wallet system, and beautiful dashboards.

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Backend      | Node.js · Express · MongoDB Atlas · JWT |
| Frontend     | React (Vite) · Tailwind CSS · Headless UI · Heroicons |
| Maps         | Leaflet + OpenStreetMap (no Google Maps) |
| Payments     | Razorpay Test Mode |
| Storage      | Cloudinary |
| Hosting      | Render (backend) · Vercel (frontend) |

---

## Quick Start

### Prerequisites
- Node.js v22+ (via NVM recommended)
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Razorpay account (test mode keys)

### 1. Clone and install

```bash
# Backend
cd backend
cp .env.sample .env        # Fill in your keys
npm install
npm run seed               # Create admin account
npm run dev                # Starts on port 5000

# Frontend (new terminal)
cd frontend
cp .env.sample .env        # Fill in your keys
npm install
npm run dev                # Starts on port 5173
```

### 2. Configure Environment Variables

**`backend/.env`**
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_long_random_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
ADMIN_EMAIL=admin@pawsaarthi.com
ADMIN_PASSWORD=Admin@123456
CLIENT_URL=http://localhost:5173
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### 3. Seed Admin Account

```bash
cd backend
npm run seed
```

Outputs: admin email/password to console. **Change password after first login.**

---

## Roles & Flow

| Role       | Approval Required | Key Actions |
|-----------|:-----------------:|-------------|
| `user`    | ❌                 | Submit rescues, top up wallet |
| `ngo`     | ✅                 | Accept/reject nearby cases |
| `hospital`| ✅                 | Assign ambulances to escalated cases |
| `ambulance`| ✅               | Update dispatch status |
| `admin`   | N/A (seeded)       | Approve accounts, view analytics |

### Rescue Status Pipeline

```
pending
  ├─ (within 5 min)  → ngo_accepted
  └─ (after 5 min)   → hospital_escalated   ← cron job
                           └─ ambulance_assigned
                                 └─ en_route
                                      └─ picked_up
                                           └─ completed  (₹20 refunded)
```

---

## Media Uploads
- **Images**: up to 5 per rescue request (JPEG/PNG/WebP, max 10MB each)
- **Video**: 1 video per request (MP4/MOV/WebM, max 200MB ≈ 2 min at 720p)
- All media stored on Cloudinary free tier

---

## Wallet System
- Users top up via Razorpay (test mode)
- **₹20 deposit** deducted on rescue submission
- **₹20 refunded** automatically when rescue is completed
- Full transaction history stored in `WalletTransactions` collection
- Backend verifies Razorpay HMAC-SHA256 signature before crediting wallet

---

## Escalation Cron Job
- `node-cron` runs every minute
- Rescues with `status=pending` older than 5 minutes → `hospital_escalated`
- Hospitals within 10km are then notified via their dashboard

---

## API Endpoints

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET  | `/api/auth/me` | Authenticated |
| GET/PUT | `/api/user/profile` | User |
| GET  | `/api/user/wallet` | User |
| POST | `/api/payment/create-order` | User |
| POST | `/api/payment/verify` | User |
| POST | `/api/rescue` | User |
| GET  | `/api/rescue/mine` | User |
| GET  | `/api/ngo/nearby` | NGO |
| PUT  | `/api/rescue/:id/accept-ngo` | NGO |
| GET  | `/api/hospital/escalated` | Hospital |
| PUT  | `/api/rescue/:id/assign-ambulance` | Hospital |
| GET  | `/api/ambulance/assigned` | Ambulance |
| PUT  | `/api/rescue/:id/status` | Ambulance |
| GET  | `/api/admin/analytics` | Admin |
| GET  | `/api/admin/users` | Admin |
| PUT  | `/api/admin/approve/:userId` | Admin |

---

## Deployment

### Backend → Render
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, root directory: `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all `.env` variables in Render's Environment tab
6. Set `NODE_ENV=production` and `CLIENT_URL=https://your-vercel-app.vercel.app`

### Frontend → Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Root directory: `frontend/`
3. Framework preset: **Vite**
4. Add env vars: `VITE_API_URL=https://your-render-backend.onrender.com/api`
5. Add `VITE_RAZORPAY_KEY_ID`

---

## Project Structure

```
ResQPet/
├── backend/
│   ├── config/          # DB, Cloudinary, Razorpay
│   ├── controllers/     # Business logic (8 controllers)
│   ├── jobs/            # node-cron escalation
│   ├── middleware/      # Auth, roleGuard, upload, errorHandler
│   ├── models/          # User, RescueRequest, WalletTransaction
│   ├── routes/          # 8 route files
│   ├── seeders/         # Admin account seeder
│   ├── utils/           # Haversine, JWT helper
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── api/         # Axios instance
        ├── components/  # Layout, Navbar, Sidebar, shared UI
        ├── context/     # AuthContext
        └── pages/       # auth/, user/, ngo/, hospital/, ambulance/, admin/
```

---

## License
MIT — Built with ❤️ for animals everywhere.
