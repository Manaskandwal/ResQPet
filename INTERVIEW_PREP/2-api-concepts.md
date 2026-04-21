# Backend API Concepts for Interviews

## Table of Contents
1. [What is an API?](#what-is-an-api)
2. [REST API Fundamentals](#rest-api-fundamentals)
3. [HTTP Methods](#http-methods)
4. [Status Codes](#status-codes)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database Basics](#database-basics)
7. [Your Project API Examples](#your-project-api-examples)

---

## What is an API?

**API = Application Programming Interface**

Think of it as a waiter in a restaurant:
- You (Frontend) = Customer
- Kitchen (Backend) = Server
- Menu (API) = Waiter who takes your order and brings food

```
User's Phone/PC  ──────►  API Server  ──────►  Database
                     (Node.js/Express)   (MongoDB)
                           │
                           ▼
                    Returns response
```

### Example from Your Project

When a user opens the app:
1. Frontend sends: `GET /api/auth/me` with JWT token
2. Backend validates token
3. Backend queries MongoDB for user data
4. Backend returns: `{ success: true, user: {...} }`

---

## REST API Fundamentals

### URL Structure

```
https://api.example.com/api/rescue/mine
│                        │     │
│                        │     └─ Endpoint (what you want)
│                        └─────── /api (表明这是API)
└───────────────────────── Base URL
```

### Query Parameters

```
GET /api/users?role=ngo&isApproved=true
                    │      │
                    │      └─ Filter value
                    └─────── Filter parameter
```

---

## HTTP Methods

### The 4 Main Methods You Need to Know

| Method | Purpose | Example |
|--------|---------|---------|
| **GET** | Read/Fetch data | Get list of rescues |
| **POST** | Create new data | Submit rescue request |
| **PUT** | Update existing data | Update profile |
| **DELETE** | Remove data | Delete user |

### Your Project Examples

```javascript
// GET - Fetch data
GET /api/auth/me          // Get current user
GET /api/rescue/mine      // Get my rescue requests
GET /api/ngo/nearby       // Get nearby NGOs

// POST - Create data
POST /api/auth/register   // Create new account
POST /api/rescue         // Submit new rescue
POST /api/payment/create-order  // Create payment

// PUT - Update data
PUT /api/user/profile      // Update user profile
PUT /api/rescue/:id/accept-ngo   // Accept as NGO
PUT /api/admin/approve/:userId   // Admin approves user

// DELETE - Remove data
DELETE /api/admin/user/:userId   // Delete user
```

---

## Status Codes

### Essential Status Codes

| Code | Meaning | When to Use |
|------|---------|--------------|
| **200** | OK | Successful GET/PUT |
| **201** | Created | Successful POST |
| **400** | Bad Request | Invalid input |
| **401** | Unauthorized | Not logged in |
| **403** | Forbidden | No permission |
| **404** | Not Found | Resource doesn't exist |
| **500** | Server Error | Backend crashed |

### In Your Project Code

```javascript
// backend/controllers/authController.js

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please provide both email and password.' 
        });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password.' 
        });
    }

    // Success!
    res.status(200).json({
        success: true,
        user: { name: user.name, role: user.role }
    });
});
```

---

## Authentication & Authorization

### JWT (JSON Web Token)

**What is JWT?**
Like a digital ID card that's signed securely. When you log in, server gives you a token. You show this token in future requests.

```
┌─────────────────────────────────────────┐
│ JWT Structure                            │
├─────────────────────────────────────────┤
│ Header.Payload.Signature               │
│                                         │
│ Header: { "alg": "HS256", "typ": "JWT" }│
│ Payload: { "userId": 1, "role": "user" }│
│ Signature: [Secret Key]               │
└─────────────────────────────────────────┘
```

### How JWT Works in ResQPet

```javascript
// 1. User logs in
POST /api/auth/login
Body: { email: "test@example.com", password: "123456" }

Response:
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { name: "John", role: "user" }
}

// 2. User stores token (in localStorage or cookies)

// 3. User makes authenticated request
GET /api/rescue/mine
Headers: { Authorization: "Bearer eyJhbGci..." }

// 4. Backend middleware validates token
// backend/middleware/auth.js
const auth = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
};
```

### Role-Based Access Control (RBAC)

```javascript
// backend/middleware/roleGuard.js

const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};

// Usage in routes
router.put('/rescue/:id/accept-ngo', 
    auth, 
    roleGuard('ngo'),  // Only NGOs can access
    ngoController.acceptRescue
);
```

---

## Database Basics

### MongoDB (Used in Your Project)

**What is MongoDB?**
A document-based database. Data is stored in JSON-like documents.

```javascript
// User document in MongoDB
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "walletBalance": 100,
    "isApproved": true,
    "location": {
        "lat": 28.6,
        "lng": 77.2
    }
}
```

### Mongoose (MongoDB ORM)

**Why Mongoose?**
- Defines data structure (Schema)
- Validates data automatically
- Makes queries easier

```javascript
// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['user', 'ngo', 'hospital', 'ambulance', 'admin'],
        default: 'user'
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### Common MongoDB Queries

```javascript
// Find one user
const user = await User.findOne({ email: "john@example.com" });

// Find all NGOs
const ngos = await User.find({ role: 'ngo', isApproved: true });

// Find within distance (using geospatial query)
const nearby = await User.find({
    role: 'ngo',
    location: {
        $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 50000  // 50km
        }
    }
});

// Create new rescue
const rescue = await RescueRequest.create({
    user: userId,
    description: "Injured dog",
    location: { lat: 28.6, lng: 77.2 }
});

// Update wallet balance
await User.findByIdAndUpdate(userId, {
    $inc: { walletBalance: -30 }
});
```

---

## Your Project API Examples

### How the Backend Handles a Request

```javascript
// Flow: User submits a rescue request
// 1. Frontend calls:
POST /api/rescue
Body: {
    description: "Injured dog on road",
    lat: 28.6,
    lng: 77.2,
    animalType: "dog"
}
Headers: { Authorization: "Bearer <token>" }

// 2. Backend route catches it
// backend/routes/rescueRoutes.js
router.post('/', auth, upload.array('images'), rescueController.submitRescue);

// 3. Controller processes it
// backend/controllers/rescueController.js
const submitRescue = async (req, res) => {
    // Check wallet balance
    const user = await User.findById(req.user._id);
    if (user.walletBalance < 30) {
        return res.status(400).json({ 
            success: false, 
            message: 'Insufficient balance' 
        });
    }

    // Deduct fee
    user.walletBalance -= 30;
    await user.save();

    // Create rescue request
    const rescue = await RescueRequest.create({
        user: user._id,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng }
    });

    res.status(201).json({
        success: true,
        rescueRequest: rescue
    });
};
```

### Express Server Setup

```javascript
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rescue', require('./routes/rescueRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Quick Reference

| Term | Meaning |
|------|---------|
| API | Interface for frontend to talk to backend |
| REST | Standard way to design web APIs |
| JWT | Secure token for authentication |
| MongoDB | Document database (JSON-like) |
| Mongoose | MongoDB tool for Node.js |
| Endpoint | URL path for an API |
| Middleware | Code that runs before the handler |

---

## Practice Questions

1. What is the difference between GET and POST?
2. What does a 404 status code mean?
3. How does JWT authentication work?
4. What is the purpose of middleware?
5. How do you filter data in a MongoDB query?

---

## Next Steps

Now that you understand APIs:
- [3-project-explanation.md](./3-project-explanation.md) - Your ResQPet project in detail
- [4-interview-questions.md](./4-interview-questions.md) - Common interview questions