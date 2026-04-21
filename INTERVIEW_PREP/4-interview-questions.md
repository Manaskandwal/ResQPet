# Common Interview Questions

## Table of Contents
1. [General Project Questions](#general-project-questions)
2. [Technical Questions](#technical-questions)
3. [JavaScript/Node.js Questions](#javascriptnodejs-questions)
4. [Database Questions](#database-questions)
5. [Security Questions](#security-questions)
6. [Scenario-Based Questions](#scenario-based-questions)
7. [Quick Answers Reference](#quick-answers-reference)

---

## General Project Questions

### Q1: Tell me about your project
**Answer (2 min version):**
> "I built ResQPet - a full-stack animal rescue coordination platform. The problem was that when people find injured animals, they don't know who to contact. This platform connects citizens with NGOs, hospitals, and ambulances.
> 
> It has 5 user roles: Citizens report cases (pay ₹30), NGOs respond first, hospitals handle serious cases, ambulances transport, and admins manage everything.
> 
> Key features include automatic escalation (cases auto-escalate after 5 min), event-driven ambulance dispatch, wallet system, and real-time updates via Socket.io."

**Key points to mention:**
- Clear problem statement
- Solution approach
- User roles
- Key features (pick 3-4)
- Tech stack briefly

---

### Q2: What was your role in the project?
**Answer:**
> "I was the sole full-stack developer. I:
> - Designed the database schema
> - Built all REST APIs
> - Implemented authentication
> - Created background jobs
> - Built all frontend dashboards
> - Deployed to Render + Vercel"

---

### Q3: What is the most difficult thing you solved?
**Good answers:**
- **Ambulance dispatch service** - "Instead of cron polling, I implemented event-driven dispatch where each rescue has its own timer. If ambulance doesn't respond in 20 min, it automatically pings the next one."
- **Real-time updates** - "Kept the app live with Socket.io rooms"
- **Geolocation** - "Finding nearby NGOs using Haversine formula"

---

### Q4: Why did you choose this tech stack?
**Answer:**
> "I chose Node.js/Express because it's fast to develop and handles async operations well. MongoDB was chosen for flexible schema (different user roles have different fields) and geospatial queries. React was natural for the frontend. All these are JavaScript-based which made full-stack development easier."

---

## Technical Questions

### Q5: How does authentication work in your project?
**Answer:**
> "We use JWT (JSON Web Token). When user logs in, server generates a signed token containing user ID and role. This token is sent in every request header. The backend middleware validates it before processing. For extra security, we also maintain a token blacklist so logged-out tokens can't be used."

---

### Q6: How does role-based access control work?
**Answer:**
> "We have a roleGuard middleware. Each protected route specifies which roles can access it. For example, only NGO users can access the accept-rescue endpoint. The middleware checks req.user.role against allowed roles."

---

### Q7: Explain the rescue pipeline
**Answer:**
```
User submits → pending
  → NGO accepts → accepted/on_the_way/reached/treating
     → Resolved on spot → completed
     → Escalate → hospital
        → Hospital accepts → ambulance_pinged
           → Ambulance assigned → en_route → picked_up
              → Delivered → completed
```

---

### Q8: How does the wallet system work?
**Answer:**
1. User tops up via Razorpay (test mode)
2. When user submits rescue, ₹30 is deducted
3. If rescue completes, ₹30 is NOT refunded
4. If cancelled before work, full refund
5. If no one responds in 30 min, automatic refund
6. Every transaction is logged in WalletTransaction model

---

### Q9: How does ambulance dispatch work?
**Answer:**
> "It's event-driven, not time-based polling. When a rescue needs an ambulance:
> 1. System finds nearest available ambulance
> 2. Sends real-time ping via Socket.io
> 3. Waits 20 minutes for response
> 4. If no response, pings next ambulance
> 5. After 3 rejects or 30 min total, falls back to manual transport"

---

### Q10: What are the main APIs you built?
**Answer:**
- Auth: register, login, logout, me
- Rescue: submit, get-mine, cancel, fundraiser
- User: profile, wallet, top-up
- NGO: nearby-cases, accept, status-update
- Hospital: escalated, accept-broadcast, assign-ambulance
- Ambulance: pinged, accept-ping, status-update
- Admin: analytics, users, approve, override
- Donation: create-order, verify

---

## JavaScript/Node.js Questions

### Q11: What is the difference between let and const?
**Quick Answer:**
> "let allows reassignment, const doesn't. Use const by default, use let when you need to reassign."

---

### Q12: What is async/await?
**Quick Answer:**
> "It handles asynchronous operations (like database calls) in a cleaner way than callbacks. 'await' waits for the Promise to resolve before continuing."

---

### Q13: What is a Promise?
**Quick Answer:**
> "An object that represents a future value. Can be 'pending', 'fulfilled', or 'rejected'. Used for async operations."

---

### Q14: How do you handle errors in async functions?
**Quick Answer:**
> "Use try-catch blocks. Put your code in 'try', handle errors in 'catch'."

```javascript
try {
    const user = await findUser(id);
} catch (error) {
    res.status(500).json({ error: error.message });
}
```

---

### Q15: What is middleware?
**Quick Answer:**
> "Functions that run before the main route handler. Used for authentication, validation, logging, etc."

---

### Q16: How does module.exports work?
**Quick Answer:**
> "Exports functions/objects from one file to be used in another with require()."

```javascript
// file.js
module.exports = { fn: () => {} };

// another.js
const { fn } = require('./file');
```

---

## Database Questions

### Q17: Why MongoDB?
**Quick Answer:**
- Flexible schema for different user roles
- JSON-like (works well with Node.js)
- Geospatial queries for "nearby" feature
- Easy to scale

---

### Q18: What is Mongoose?
**Quick Answer:**
> "MongoDB ORM. Provides schema definition, validation, and queries."

---

### Q19: How do you query for "nearby" locations?
**Quick Answer:**
> "We store coordinates and use geospatial queries. But in practice, I used the Haversine formula in JavaScript to calculate distance between two lat/lng points."

---

### Q20: What are MongoDB indexes?
**Quick Answer:**
> "Indexes improve query speed. We have indexes on email (unique), role, and commonly queried fields."

---

## Security Questions

### Q21: How do you secure passwords?
**Quick Answer:**
> "We use bcryptjs to hash passwords before storing. Even if database is compromised, actual passwords can't be read."

---

### Q22: What is JWT and how does it work?
**Quick Answer:**
> "JSON Web Token. A signed token containing user info. When you log in, server gives you a token. You send it in future requests. Server verifies the signature to trust it."

---

### Q23: How do you handle CORS?
**Quick Answer:**
> "We use the cors middleware. For development, localhost is allowed. For production, only the Vercel domain is allowed via CLIENT_URL."

---

### Q24: What security measures did you implement?
**Answer:**
> "1. JWT authentication with 32-char secret
> 2. Password hashing with bcrypt
> 3. Token blacklist for logout
> 4. Rate limiting on auth/payment
> 5. Input sanitization (mongo-sanitize, xss-clean)
> 6. Server-side media validation (file-type library)
> 7. Role-based access control"

---

### Q25: How do you prevent SQL/NoSQL injection?
**Quick Answer:**
> "We use mongo-sanitize package to prevent NoSQL injection. It removes $ and other special characters from user input."

---

## Scenario-Based Questions

### Q26: What if too many users submit at once?
**Answer:**
> "We have:
> 1. Rate limiting (express-rate-limit) on sensitive endpoints
> 2. MongoDB can handle concurrent connections
> 3. JWT tokens prevent brute force on login
> 4. In production, would add more scaling"

---

### Q27: What if the ambulance dispatch service crashes?
**Answer:**
> "I implemented initializeActiveDispatches() that runs on server restart. It finds all rescues in 'ambulance_pinged' state from the database and restarts their dispatch timers."

---

### Q28: How do you test your APIs?
**Answer:**
> "Currently manual testing via Postman. The project has test files set up. For production, would add unit tests and integration tests."

---

### Q29: How would you handle payment failures?
**Answer:**
> "1. Server verifies Razorpay signature (HMAC-SHA256)
> 2. Only credit wallet after verification
> 3. Log all transactions in WalletTransaction model
> 4. Have rollback logic if verification fails"

---

### Q30: What would you improve if you had more time?
**Good answers:**
- Add unit tests
- Add real WebSocket handling for live ambulance tracking
- SMS notifications
- Mobile app (Flutter/React Native)
- Video calling for vet consultation

---

## Quick Answers Reference

### Common Status Codes
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

### Key Libraries (from package.json)
| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ORM |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hash |
| socket.io | Real-time |
| node-cron | Background jobs |
| razorpay | Payments |
| cloudinary | File storage |

### API Methods
- GET = read
- POST = create
- PUT = update
- DELETE = delete

### Key Files
- server entry: `backend/server.js`
- models: `backend/models/*.js`
- routes: `backend/routes/*.js`
- controllers: `backend/controllers/*.js`
- services: `backend/services/*.js`

---

## Practice Script

> "My project is ResQPet, an animal rescue coordination platform built with Node.js, Express, MongoDB, and React.
> 
> I designed it to solve the problem where citizens find injured animals but don't know who to call. The platform connects them with NGOs, hospitals, and ambulances through a multi-role system.
> 
> Key features include: wallet system (auto fee/deduction/refund), automatic escalation after 5 minutes, event-driven ambulance dispatch with fallback, and real-time updates.
> 
> Technically, I built REST APIs with JWT authentication, role-based access control, background cron jobs for escalation, and dashboards for each user role.
> 
> The most challenging part was implementing the ambulance dispatch service - instead of polling, each rescue now has its own timer that automatically pings the next ambulance if no response in 20 minutes."

---

## Remember

1. **Keep answers concise** - 1-2 minutes for big questions
2. **Use technical terms** - API, JWT, middleware, endpoint
3. **Show you understand** - Not just what, but why
4. **Be honest** - "I'm not familiar with X, but I would learn it"
5. **Ask questions** - Show interest in their work

---

## Files Checklist

Before interview, review:
- [ ] backend/server.js (entry point)
- [ ] backend/models/User.js (user schema)
- [ ] backend/models/RescueRequest.js (rescue schema)
- [ ] backend/controllers/rescueController.js (main operations)
- [ ] backend/services/ambulanceDispatchService.js (key feature)
- [ ] backend/config/socket.js (real-time)
- [ ] README.md (project overview)