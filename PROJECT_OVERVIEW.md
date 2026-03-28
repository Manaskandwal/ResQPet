# ResQPet / PawSaarthi Project Brief

Below is a complete, structured, “share-with-team” technical and workflow brief of this project, based on the actual code in this repo. Each section uses a heading followed by points, as requested. Important mismatches and gaps are called out near the end so your team can align before extending.

## Project Identity
- Project root: `ResQPet/`
- Backend product name in code: “PawSaarthi” (log messages, UI copy)
- Frontend app name is not hard-coded but uses PawSaarthi strings in UI
- Primary mission: coordinate animal rescue with multi‑role routing, escalation, wallet fee/refund, and dashboards

## Core Goals
- Provide a multi‑role rescue coordination platform with SLA‑style escalation
- Allow citizens to submit rescue requests with media, location, and deposit fee
- Route to NGOs first, then hospitals, then ambulances with fallback and refunds
- Support fundraisers and donations for costly cases
- Enable admin governance, approvals, analytics, and impersonation

## Tech Stack
- Backend: Node.js + Express, MongoDB + Mongoose, JWT, bcrypt, node-cron
- Frontend: React (Vite), Tailwind CSS, Headless UI, Heroicons
- Maps: Leaflet + OpenStreetMap
- Payments: Razorpay (test mode) + mock top-up route
- Storage: Cloudinary for images/videos
- Realtime: Socket.io (backend + frontend)
- Charts: Recharts for analytics dashboards
- Auth (OAuth): Google OAuth via `google-auth-library`
- Hosting targets in README: Render (backend) + Vercel (frontend)

## Architecture Overview
- Monorepo with `backend/` and `frontend/`
- REST API + JWT auth + role guard on backend
- React single‑page app with role‑based routes and shared layout
- Background cron jobs for rescue escalation, ambulance dispatch pinging, and recurring wallet deductions
- Socket.io for ambulance ping + live location rooms

## Backend Entry & Bootstrapping
- App entry: `backend/server.js`
- Connects MongoDB via `backend/config/db.js`
- Configures Cloudinary via `backend/config/cloudinary.js`
- Initializes Socket.io via `backend/config/socket.js`
- Starts cron jobs: `backend/jobs/escalationCron.js`, `backend/jobs/ambulanceDispatchCron.js`, `backend/jobs/recurringJobs.js`
- CORS behavior: localhost allowed in dev, `CLIENT_URL` enforced in prod

## Backend Structure
- Config: `backend/config/` (db, cloudinary, razorpay, socket)
- Controllers: `backend/controllers/`
- Jobs (cron): `backend/jobs/`
- Middleware: `backend/middleware/` (auth, role guard, upload, error handler)
- Models: `backend/models/`
- Routes: `backend/routes/`
- Seeders: `backend/seeders/adminSeed.js`
- Utils: `backend/utils/` (JWT helper, haversine)
- Tests/diagrams: `backend/tests/drawio_scenarios/` and `Draw.io/`

## Frontend Structure
- App routes: `frontend/src/App.jsx`
- Context: `frontend/src/context/AuthContext.jsx`
- API client: `frontend/src/api/axios.js`
- Socket client: `frontend/src/socket.js`
- Shared layout: `frontend/src/components/Layout.jsx`, `Navbar.jsx`, `Sidebar.jsx`
- Role dashboards: `frontend/src/pages/user/`, `frontend/src/pages/ngo/`, `frontend/src/pages/hospital/`, `frontend/src/pages/ambulance/`, `frontend/src/pages/admin/`
- Public pages: `frontend/src/pages/Home.jsx`, `Impact.jsx`, `Fundraisers.jsx`
- UI mode toggle: `VITE_UI_DESIGN` toggles “new” landing experience

## Data Model: User
- File: `backend/models/User.js`
- Roles: `user`, `ngo`, `hospital`, `ambulance`, `admin`
- Approval flow: NGOs/hospitals/ambulances need admin approval (`isApproved`)
- Admin impersonation support: `isAdmin` + JWT impersonation payload
- Wallet fields: `walletBalance`, transaction history in separate collection
- Location fields: `location.lat`, `location.lng`, `address`
- Org fields: `orgName`, `regNumber`, `address`
- Ambulance fields: `linkedHospital`, `vehicleNumber`, `isAvailable`
- Government/private routing: `isGovernment`
- NGO/hospital capacity: `capacity`
- Subscription fields: `monthlySubscription` object for recurring emergency fund

## Data Model: RescueRequest
- File: `backend/models/RescueRequest.js`
- Ownership: `user` (reporter), `assignedNGO`, `assignedHospital`, `assignedAmbulance`
- Location: `location.lat`, `location.lng`, `address`
- Media: `images[]` (max 5), `video` (max 1)
- Status list includes: `pending`, `accepted`, `scheduled`, `on_the_way`, `reached`, `treating`, `ngo_accepted`, `hospital_escalated`, `hospital_broadcasted`, `hospital_accepted`, `ambulance_pinged`, `ambulance_assigned`, `en_route`, `picked_up`, `delivered`, `resolved_on_spot`, `completed`, `cancelled`, `closed_unresolved`, `fundraiser_active`, `refunded`
- SLA timestamps: acceptedAt, escalatedAt, ambulanceAssignedAt, enRouteAt, pickedUpAt, deliveredAt, completedAt, closedAt, workStartedAt
- Deposits: `depositDeducted`, `depositRefunded`
- Follow‑ups: `followUps[]`
- Impact: `impact.likes[]`, `impact.comments[]`
- Status log history: `statusLogs[]`

## Data Model: WalletTransaction
- File: `backend/models/WalletTransaction.js`
- Tracks credit/debit/refund with `balanceAfter`
- Optional Razorpay IDs and linked rescue request

## Data Model: Donation
- File: `backend/models/Donation.js`
- Supports one‑time and subscription donations
- Links to rescue fundraiser (`rescueRequest`) or general donations
- Stores Razorpay order/subscription IDs and statuses

## Data Model: Notification
- File: `backend/models/Notification.js`
- Fields: `recipient`, `title`, `message`, `type`, `isRead`, `rescueRequest`, `transaction`
- Types include rescue, wallet, approval, and system

## Data Model: Commission
- File: `backend/models/Commission.js`
- Phase‑2 ready for paid services (not active in phase‑1)

## Authentication & Security
- JWT generation: `backend/utils/generateToken.js`
- JWT validation middleware: `backend/middleware/auth.js`
- Password hashing: `bcrypt` pre‑save hook in `backend/models/User.js`
- Role gating: `backend/middleware/roleGuard.js`
- Admin impersonation: `/api/auth/impersonate` with JWT payload override
- Google login: `/api/auth/google` using `GOOGLE_WEB_CLIENT_ID`

## Rescue Lifecycle (Actual Code Logic)
- `pending` on submission by user
- NGO can accept: `accepted` or `scheduled` based on NGO choice
- NGO can update: `on_the_way`, `reached`, `treating`
- NGO can resolve on spot: `resolved_on_spot` then `completed`
- NGO can escalate to hospital: `hospital_broadcasted`
- System escalation after 5 minutes: `hospital_broadcasted` via cron
- Hospitals accept broadcast: `hospital_accepted`, then `ambulance_pinged`
- Ambulance accepts ping: `ambulance_assigned`
- Ambulance status chain: `en_route` -> `picked_up` -> `delivered` (auto‑sets `completed`)
- Terminal statuses: `completed`, `cancelled`, `closed_unresolved`
- Unresolved auto‑close after 30 minutes in cron

## User Workflow
- Register/login and top‑up wallet
- Submit rescue request with media + location, deposit deducted
- Track case in dashboard and view detail timeline
- Convert case to fundraiser and share
- View wallet transactions and payment history
- Support emergency fund via monthly wallet subscription

## NGO Workflow
- Complete profile with location to see nearby cases
- Accept or reject pending cases within 50 km
- Update case status with media uploads
- Resolve on spot or escalate to hospital
- Track analytics and case history

## Hospital Workflow
- Set base location in profile (required for escalations)
- See broadcasted cases within 10 km
- Govt hospitals can see immediately; private hospitals see after 5‑minute delay
- Accept case and trigger ambulance dispatch
- Assign linked ambulances directly if needed

## Ambulance Workflow
- Accept or reject pinged cases
- Update transport statuses: `en_route`, `picked_up`, `delivered`
- Stream live location via Socket.io rooms
- Availability auto‑toggles when task completes

## Admin Workflow
- Seed admin via `backend/seeders/adminSeed.js`
- Approve NGOs/hospitals/ambulances
- View analytics, user list, rescue list
- Override rescue status
- Set base location for org users
- Impersonate any user from UI

## Payment & Wallet Flow
- Wallet top‑up via Razorpay order + HMAC‑SHA256 verification
- Test mode mock top‑up route: `/api/payment/mock-topup`
- Service fee deducted on rescue submit
- Service fee refunded on cancellation before work starts
- Unresolved cases can trigger refund via cron

## Donations & Fundraisers
- One‑time donation order creation and verification
- Subscription donation creation via Razorpay plan
- Public fundraiser list endpoint
- Fundraiser goal reaching can push to ambulance dispatch if status is `fundraiser_active`

## Notifications
- Stored in MongoDB and fetched via `/api/notifications`
- Used in admin approval alerts and some wallet refunds
- Notification modal and page in frontend uses filters and read/unread state

## Realtime & Maps
- Socket.io rooms by userId, role, and rescue room
- Ambulance ping event: `new_rescue_ping`
- Live ambulance location updates to `rescue_<id>` rooms
- Leaflet maps for location capture and display

## Cron Jobs
- Escalation cron: `backend/jobs/escalationCron.js`
- Auto‑escalate pending cases to hospitals after 5 minutes
- Auto‑close unresolved cases after 30 minutes, refund service fee if no work started
- Ambulance dispatch cron: `backend/jobs/ambulanceDispatchCron.js`
- Staggered ambulance pinging every 10 minutes, ping expires after 20 minutes
- Auto‑close and refund after 3 rejects or 30 minutes
- Recurring emergency fund deductions: `backend/jobs/recurringJobs.js`

## API Surface (Actual Routes)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/impersonate`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `GET /api/user/wallet`
- `GET /api/user/ngos`
- `POST /api/user/subscribe-emergency`
- `GET /api/user/payment-history`
- `POST /api/user/subscription/pause`
- `POST /api/user/subscription/resume`
- `POST /api/user/subscription/cancel`
- `PUT /api/user/subscription/amount`
- `POST /api/payment/mock-topup`
- `POST /api/payment/create-order`
- `POST /api/payment/verify`
- `POST /api/rescue`
- `GET /api/rescue/mine`
- `GET /api/rescue/impact/feed`
- `GET /api/rescue/:id`
- `PUT /api/rescue/:id/cancel`
- `PUT /api/rescue/:id/accept-ngo`
- `PUT /api/rescue/:id/reject-ngo`
- `PUT /api/rescue/:id/resolve-ngo`
- `PUT /api/rescue/:id/escalate-ngo`
- `PUT /api/rescue/:id/ngo-status`
- `PUT /api/rescue/:id/complete-ngo`
- `POST /api/rescue/:id/followup`
- `PUT /api/rescue/:id/assign-ambulance`
- `PUT /api/rescue/:id/status`
- `PUT /api/rescue/:id/fundraiser`
- `POST /api/rescue/:id/impact/like`
- `POST /api/rescue/:id/impact/comment`
- `GET /api/ngo/analytics`
- `GET /api/ngo/nearby`
- `GET /api/ngo/my-cases`
- `GET /api/hospital/escalated`
- `GET /api/hospital/ambulances`
- `GET /api/hospital/my-cases`
- `PUT /api/hospital/rescue/:id/accept-broadcast`
- `PUT /api/hospital/rescue/:id/reject-broadcast`
- `GET /api/ambulance/assigned`
- `GET /api/ambulance/history`
- `GET /api/ambulance/pinged`
- `PUT /api/ambulance/rescue/:id/accept-ping`
- `PUT /api/ambulance/rescue/:id/reject-ping`
- `GET /api/admin/analytics`
- `GET /api/admin/users`
- `GET /api/admin/pending-approvals`
- `PUT /api/admin/approve/:userId`
- `DELETE /api/admin/user/:userId`
- `GET /api/admin/rescue-requests`
- `PUT /api/admin/rescue/:id/override`
- `PUT /api/admin/users/:userId/location`
- `GET /api/donation/fundraisers`
- `POST /api/donation/create-order`
- `POST /api/donation/verify`
- `POST /api/donation/subscribe`
- `POST /api/donation/verify-subscription`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `GET /api/public/stats`

## Frontend Routes & Pages
- Public pages: `/` (Home or new landing UI), `/login`, `/register`
- Shared: `/notifications`, `/impact`, `/fundraisers`
- User: `/user/dashboard`, `/user/submit-rescue`, `/user/rescue/:id`, `/user/payments`, `/user/reports`
- NGO: `/ngo/dashboard`
- Hospital: `/hospital/dashboard`
- Ambulance: `/ambulance/dashboard`
- Admin: `/admin/dashboard`, `/admin/notifications`

## Environment Variables (Backend)
- Core: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Admin seed: `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- CORS: `CLIENT_URL`
- Google OAuth: `GOOGLE_WEB_CLIENT_ID`
- Support email in sample: `SUPPORT_EMAIL`

## Environment Variables (Frontend)
- API base: `VITE_API_URL`
- Razorpay public key: `VITE_RAZORPAY_KEY_ID`
- Optional UI toggle: `VITE_UI_DESIGN=new`

## Deployment Assumptions
- Backend: Render service pointing to `backend/`
- Frontend: Vercel project pointing to `frontend/`
- Ensure `CLIENT_URL` matches deployed frontend URL
- Ensure Razorpay keys are test keys in test environments

## Non‑Technical Flow (How the Org Operates)
- Citizens report incidents with location + media
- NGOs respond first, aiming for quick on‑spot resolution
- Hospitals intervene only if NGO cannot complete or case escalates
- Ambulances are dispatched by hospitals or via system pinging
- Admins oversee compliance, approvals, and analytics
- Community funds can be raised via public fundraisers

## Known Gaps / Mismatches to Align
- Service fee amount mismatch: code uses Rs 30 in `backend/controllers/rescueController.js` and `backend/jobs/escalationCron.js`, README mentions Rs 20
- Ambulance dispatch refund uses `rescue.depositAmount` but no such field exists in `RescueRequest` schema
- Recurring job creates notifications with field `user` and types `warning`/`success`, but schema expects `recipient` and a limited enum; this will throw validation errors
- README status flow is outdated vs actual status list and transitions in code
- `fundraiser_active` status exists, but `makeFundraiser` does not set it; public fundraiser fetch expects status `fundraiser_active`
- Notifications are not emitted for most status transitions (no generic notifier for rescue updates)
- `google-auth-library` is listed in frontend dependencies but not used directly in frontend code

