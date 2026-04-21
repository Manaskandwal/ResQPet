# JavaScript Basics for Backend Interviews

## Table of Contents
1. [Variables & Data Types](#variables--data-types)
2. [Functions](#functions)
3. [Arrays & Objects](#arrays--objects)
4. [Async/Await & Promises](#asyncawait--promises)
5. [Common Patterns](#common-patterns)

---

## Variables & Data Types

###Declaring Variables

```javascript
// Modern way (use this)
let name = "John";        // Can be reassigned
const PI = 3.14;          // Cannot be reassigned

// Old way (avoid)
var age = 25;             // Has hoisting issues
```

###Data Types

```javascript
// Primitive Types
let string = "Hello";           // Text
let number = 42;                // Numbers (integers, floats)
let boolean = true;             // true or false
let nothing = null;              // Intentional absence
let notDefined;                 // undefined (not assigned)
let id = Symbol("id");           // Unique identifiers

// Reference Types
let array = [1, 2, 3];         // Lists
let object = { key: "value" };    // Key-value pairs
```

---

## Functions

###Function Declaration

```javascript
// Traditional function
function greet(name) {
    return "Hello " + name;
}

// Arrow function (modern, preferred)
const greet = (name) => {
    return "Hello " + name;
};

// Short arrow function (one line)
const greet = (name) => "Hello " + name;
```

###Function with Default Parameters

```javascript
const createUser = (name, role = "user") => {
    return { name, role };
};

createUser("John");        // { name: "John", role: "user" }
createUser("Jane", "admin"); // { name: "Jane", role: "admin" }
```

---

## Arrays & Objects

###Array Operations

```javascript
const users = ["John", "Jane", "Bob"];

// Adding/removing
users.push("Mike");           // Add to end: ["John", "Jane", "Bob", "Mike"]
users.pop();                 // Remove from end
users.shift();               // Remove from start
users.unshift("Tom");        // Add to start

// Finding
users.find(u => u === "Jane");  // "Jane"
users.filter(u => u.startsWith("J"));  // ["John", "Jane"]
users.map(u => u.toUpperCase());     // ["JOHN", "JANE", "BOB"]
users.reduce((acc, curr) => acc + curr, "");  // "JohnJaneBob"

// Check
users.includes("John");      // true
users.length;               // 3
```

###Object Operations

```javascript
const user = {
    name: "John",
    email: "john@example.com",
    role: "user"
};

// Accessing
user.name;                  // "John"
user["email"];              // "john@example.com"

// Destructuring (very common in Node.js)
const { name, email } = user;
// Creates variables: name = "John", email = "john@example.com"

// Adding/modifying
user.isApproved = true;
user.role = "admin";

// Object methods
Object.keys(user);           // ["name", "email", "role", "isApproved"]
Object.values(user);         // ["John", "john@example.com", "admin", true]
Object.entries(user);       // [["name", "John"], ["email", "john@example.com"], ...]
```

---

## Async/Await & Promises

### Understanding Async Operations

In backend development, operations like database calls take time. We use Promises to handle them.

```javascript
// Simulating a database call
const fetchUser = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({ id: 1, name: "John" });
        }, 1000); // 1 second delay
    });
};

// Using async/await (modern way)
const getUser = async () => {
    try {
        const user = await fetchUser();
        console.log(user);  // { id: 1, name: "John" }
    } catch (error) {
        console.error("Error:", error);
    }
};

// Using .then() (older way)
fetchUser()
    .then(user => console.log(user))
    .catch(error => console.error(error));
```

### Why async/await?
- Cleaner, more readable code
- Easier error handling with try/catch
- Looks like synchronous code

---

## Common Patterns

### Object Schema (like Mongoose models)

```javascript
const userSchema = {
    name: String,
    email: String,
    role: {
        type: String,
        enum: ["user", "ngo", "hospital", "ambulance", "admin"],
        default: "user"
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    walletBalance: {
        type: Number,
        default: 0
    }
};

// Creating an object
const newUser = {
    name: "Jane",
    email: "jane@example.com",
    role: "ngo",
    isApproved: false,
    walletBalance: 100
};
```

### Error Handling

```javascript
// Try-catch block
const createUser = async (data) => {
    try {
        if (!data.email) {
            throw new Error("Email is required");
        }
        // Database operation here
        const user = await saveToDatabase(data);
        return user;
    } catch (error) {
        console.error("Error creating user:", error.message);
        throw error;  // Re-throw to handle elsewhere
    }
};
```

### Module.exports (Node.js Backend)

```javascript
// backend/utils/haversine.js

const calculateDistance = (lat1, lng1, lat2, lng2) => {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const toRad = (deg) => deg * (Math.PI/180);

module.exports = {
    calculateDistance,
    toRad
};

// Using it in another file
const { calculateDistance } = require('./utils/haversine');
const distance = calculateDistance(28.6, 77.2, 28.5, 77.1);
```

---

## Quick Reference

| Concept | Syntax |
|---------|--------|
| Create variable | `let x = 5;` |
| Create constant | `const PI = 3.14;` |
| Arrow function | `const fn = (a) => a * 2;` |
| Array find | `arr.find(x => x > 5)` |
| Object destructuring | `const { name } = user;` |
| Async function | `async () => { await fn(); }` |
| Export module | `module.exports = { fn };` |
| Import module | `const { fn } = require('./file');` |

---

## Next Steps

After understanding these basics, move to:
- [2-api-concepts.md](./2-api-concepts.md) - Understanding REST APIs
- [3-project-explanation.md](./3-project-explanation.md) - Your ResQPet project

---

## Practice Questions

1. What is the difference between `let` and `const`?
2. How do you access the first element of an array?
3. What does `async/await` do in JavaScript?
4. How do you export a function in Node.js?
5. What is destructuring in JavaScript?