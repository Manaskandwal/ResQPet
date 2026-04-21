# ResQPet Project Explanation for Interview

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [5 User Roles Explained](#5-user-roles-explained)
4. [Key Services](#key-services)
5. [Database Models](#database-models)
6. [Features](#features)
7. [How to Explain Your Work](#how-to-explain-your-work)
8. [Interview Talking Points](#interview-talking-points)

---

## Project Overview

**Project Name:** ResQPet (also known as PawSaarthi)
**What it does:** A full-stack animal rescue coordination platform that connects citizens with NGOs, hospitals, and ambulances to save injured animals.

**Why it exists:** 
- People find injured animals but don't know who to call
- NGOs and hospitals work in isolation
- No coordinated system exists in India for animal rescue

**Solution:** A platform where:
1. Citizens report injured animals (pay small fee)
2. NGOs respond first (quick on-spot help)
3. If needed, escalates to hospitals/ambulances
4. Full tracking and wallet system

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime for server |
| **Express** | Web framework for APIs |
| **MongoDB** | Database (document-based) |
| **Mongoose** | MongoDB ORM |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **socket.io** | Real-time updates |
| **node-cron** | Background jobs |
| **Razorpay** | Payment gateway |
| **Cloudinary** | Image/video storage |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React** | UI framework |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router** | Navigation |
| **Axios** | API calls |
| **Leaflet** | Maps |
| **Socket.io-client** | Real-time updates |
| **Recharts** | Charts |

---

## 5 User Roles Explained

### 1. User (Citizen)
- **Who:** Regular people like you and me
- **Can do:** 
  - Register/login
  - Submit rescue request (pay ₹30 fee)
  - Track my rescues
  - Top up wallet
  - Convert case to fundraiser
  - Donate to fundraisers
- **Approval needed?** No (auto-approved)

### 2. NGO
- **Who:** Animal rescue organizations
- **Can do:**
  - See nearby pending cases (50km radius)
  - Accept/reject cases
  - Update case status (on the way, reached, treating)
  - Resolve on spot OR escalate to hospital
- **Approval needed?** Yes (admin approves)

### 3. Hospital
- **Who:** Veterinary hospitals
- **Can do:**
  - See escalated cases within 10km
  - Accept broadcast cases
  - Assign ambulances to transport
  - Update treatment status
- **Approval needed?** Yes (admin approves)

### 4. Ambulance
- **Who:** Ambulance services/vehicles
- **Can do:**
  - Receive pinged rescue requests
  - Accept/reject pings
  - Update transport status (en route, picked up, delivered)
- **Approval needed?** Yes (admin approves)

### 5. Admin
- **Who:** Platform administrators
- **Can do:**
  - Approve NGOs/hospitals/ambulances
  - View analytics
  - Delete users
  - Override rescue status
  - Impersonate any user
- **Approval needed?** No (seeded manually)

---

## Key Services

### 1. AmbulanceDispatchService
**File:** `backend/services/ambulanceDispatchService.js`

**What it does:** Automatically dispatches ambulances when a rescue needs transport

**How it works:**

```
1. Rescue enters "ambulance_pinged" status
2. Service finds nearest available ambulance
3. Pings ambulance via Socket.io
4. Waits for response (20 min timeout)
5. If no response, pings next ambulance
6. After 3 rejects or 30 min, closes case + refunds
```

**Key functions:**
- `onRescueNeedsAmbulance(rescueId)` - Start dispatch
- `pingNearestAmbulance(rescue)` - Find & notify ambulance
- `scheduleRescueChecks(rescueId)` - Monitor timeout
- `handleStalledRescue(rescue)` - Handle failure

**Interview point:** "I implemented event-driven ambulance dispatch instead of polling. Each rescue gets its own timer, so if an ambulance doesn't respond in 20 minutes, it automatically pings the next one."

---

### 2. RescueController
**File:** `backend/controllers/rescueController.js`

**What it does:** Handles all rescue request operations

**Key functions:**

| Function | What it does |
|----------|------------|
| `submitRescue` | Create new rescue, deduct ₹30 fee |
| `getMyRescues` | Get user's rescue history |
| `getRescueById` | Get single rescue details |
| `cancelRescue` | Cancel and refund if possible |
| `makeFundraiser` | Convert to public fundraiser |
| `getImpactFeed` | Get completed rescues (news feed) |
| `toggleImpactLike` | Like completed case |
| `addImpactComment` | Comment on case |

---

### 3. AuthController
**File:** `backend/controllers/authController.js`

**What it does:** Handles authentication

**Key functions:**

| Function | What it does |
|----------|------------|
| `register` | Create new user account |
| `login` | Authenticate user, return JWT |
| `getMe` | Get current user profile |
| `logout` | Invalidate JWT token |
| `impersonateUser` | Admin can act as other user |
| `googleLogin` | Google OAuth login |

---

### 4. Cron Jobs (Background Services)
**File:** `backend/jobs/rescueEscalationScheduler.js`

**What it does:** Automatic background tasks

**Escalation Cron:**
- Checks every minute
- Finds pending rescues older than 5 minutes
- Escalates them to hospital status
- Notifies hospitals within 10km

**Recurring Jobs:**
- Closes unresolved cases after 30 min
- Refunds if no work started
- Handles monthly subscription deductions

---

### 5. Socket Service
**File:** `backend/config/socket.js`

**What it does:** Real-time updates between server and app

**Events:**
- `new_rescue_ping` - Ambulance gets new case
- `rescue_update` - Case status changed
- `new_case_to_ngo` - New case for NGO dashboard
- `notification` - User notification

---

### 6. Payment Service
**File:** `backend/controllers/paymentController.js`

**What it does:** Handles wallet and payments

**Features:**
- Wallet top-up via Razorpay
- ₹30 fee deduction on rescue submit
- Automatic refund on cancellation
- Full transaction history

---

### 7. Notification Service
**File:** `backend/controllers/notificationController.js`

**What it does:** Creates and manages notifications

**Types:**
- Rescue status updates
- Wallet transactions
- Account approvals
- System alerts

---

## Database Models

### User Model
**File:** `backend/models/User.js`

```javascript
{
    name: String,
    email: String (unique),
    password: String (hashed),
    role: ['user', 'ngo', 'hospital', 'ambulance', 'admin'],
    phone: String,
    orgName: String,
    isApproved: Boolean,
    walletBalance: Number,
    location: { lat, lng, address },
    isGovernment: Boolean,  // for hospitals
    isAvailable: Boolean,  // for ambulances
    vehicleNumber: String,
    linkedHospital: ObjectId,
    profileImage: String
}
```

### RescueRequest Model
**File:** `backend/models/RescueRequest.js`

```javascript
{
    user: ObjectId (reporter),
    description: String,
    animalType: ['dog', 'cat', 'other'],
    images: [String],  // up to 5
    video: String,   // up to 1
    location: { lat, lng, address },
    status: String (complex enum),
    assignedNGO: ObjectId,
    assignedHospital: ObjectId,
    assignedAmbulance: ObjectId,
    depositDeducted: Boolean,
    depositRefunded: Boolean,
    isFundraiser: Boolean,
    estimatedCost: Number,
    statusLogs: [{ status, message, images, timestamp }],
    impact: { likes: [ObjectId], comments: [...] }
}
```

### Other Models
- **WalletTransaction** - All credit/debit history
- **Donation** - One-time and subscription donations
- **Notification** - User notifications
- **AuditLog** - Admin action logs
- **TokenBlacklist** - Logged out tokens
- **PaymentOrder** - Razorpay order cache

---

## Features

### 1. Multi-Role System
5 different user roles with specific permissions and dashboards

### 2. Wallet System
- Top up via Razorpay
- Automatic fee deduction/refund
- Full transaction history

### 3. Rescue Pipeline
```
pending → accepted → on_the_way → reached → treating → resolved_on_spot → completed
                                          ↓
                              escalated → hospital_broadcasted → hospital_accepted →
                              ambulance_pinged → ambulance_assigned →
                              en_route → picked_up → delivered → completed
```

### 4. Real-time Updates
- Socket.io for instant notifications
- Live ambulance tracking (rescue room)

### 5. Geolocation
- Find nearby NGOs/hospitals
- Haversine formula for distance calculation

### 6. Escalation System
- Auto-escalate after 5 minutes
- Automatic ambulance dispatch
- Fallback to manual transport

### 7. Fundraisers
- Convert stalled cases to fundraisers
- Public donation page
- Track goal progress

### 8. Impact Feed
- Stories of saved animals
- Before/after photos
- Like and comment

---

## How to Explain Your Work

### 1. Start with the Problem
> "I built an animal rescue coordination platform because in India, there's no centralized system connecting citizens with animal rescue organizations. When people find injured animals, they don't know who to contact."

### 2. Explain Your Solution
> "The platform has 5 user roles - regular citizens who report cases, NGOs who respond first, hospitals for serious cases, ambulances for transport, and admins to manage everything."

### 3. Mention Key Features
> "Key features include:
> - Wallet system with automatic fee deduction
> - Real-time escalation (cases auto-escalate after 5 min if no NGO responds)
> - Event-driven ambulance dispatch with fallback
> - Fundraiser system for expensive treatments"

### 4. Technical Highlights
> "Technically, I used:
> - Node.js/Express for REST APIs
> - MongoDB for flexible data storage
> - JWT for secure authentication
> - Socket.io for real-time updates
> - node-cron for background jobs"

### 5. Security Features
> "Security includes:
> - JWT with 32-char secret
> - Token blacklist for logout
> - Rate limiting on auth/payment
> - Input sanitization (NoSQL injection protection)
> - Server-side media validation"

---

## Interview Talking Points

### Be Ready to Answer:

**1. "Explain your project in 2 minutes"**
- Start with the problem → solution → key features → tech stack

**2. "What was your role in the project?"**
- Full-stack developer
- Designed database models
- Built REST APIs
- Created frontend dashboards

**3. "How does the wallet system work?"**
- User tops up via Razorpay
- ₹30 deducted on rescue submit
- Refunded if cancelled/refused
- All transactions logged

**4. "How does ambulance dispatch work?"**
- Event-driven, not polling
- Each rescue has its own timer
- Pings nearest ambulance
- 20-min timeout per ping
- 3 tries, then fallback

**5. "How do you handle security?"**
- JWT authentication
- Password bcrypt hashing
- Role-based access control
- Rate limiting
- Input sanitization

**6. "What's the hardest part you solved?"**
- Ambulance dispatch timing
- Real-time updates
- Geolocation queries

**7. "Why MongoDB?"**
- Flexible schema for different user roles
- Geospatial queries for "nearby"
- JSON-like (works well with Node.js)

**8. "How do you handle errors?"**
- Try-catch in async functions
- Custom error handler middleware
- Meaningful error messages

---

## Questions to Ask the Interviewer

1. "What's the team size?"
2. "What are the main tech challenges?"
3. "How do you handle deployment?"
4. "What's the security process?"
5. "How do you test the code?"

---

## Key Files Reference

| What to Find | File Path |
|--------------|-----------|
| Server entry | `backend/server.js` |
| User model | `backend/models/User.js` |
| Rescue model | `backend/models/RescueRequest.js` |
| Auth API | `backend/routes/authRoutes.js` |
| Rescue API | `backend/routes/rescueRoutes.js` |
| Ambulance dispatch | `backend/services/ambulanceDispatchService.js` |
| Auth logic | `backend/controllers/authController.js` |
| Rescue logic | `backend/controllers/rescueController.js` |
| Frontend App | `frontend/src/App.jsx` |
| API client | `frontend/src/api/axios.js` |
| Auth context | `frontend/src/context/AuthContext.jsx` |

---

## Next Steps

- Review [4-interview-questions.md](./4-interview-questions.md) - Practice common questions
- Go through the code of key services
- Be ready to explain one feature in detail

---

## Backup: Quick Project Summary

> **ResQPet** is a production-ready animal rescue platform with:
> - 5 user roles (Citizen, NGO, Hospital, Ambulance, Admin)
> - Multi-stage rescue pipeline with auto-escalation
> - Wallet system with Razorpay integration
> - Event-driven ambulance dispatch service
> - Real-time updates via Socket.io
> - Full-stack: Node.js/Express + MongoDB + React

> **My role:** Full-stack developer responsible for:
> - Database architecture
> - REST API development
> - Authentication & authorization
> - Background job implementation
> - Frontend dashboard integration