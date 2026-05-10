# ResQPet Knowledge Graph Report

## God Nodes (Most Connected Concepts)
- **ResQPet Project** - 16 connections
- **withSuspense()** - 14 connections
- **App()** - 12 connections
- **React (Vite)** - 11 connections
- **express** - 9 connections
- **User Model** - 8 connections
- **Role-based Access Control** - 7 connections
- **Rescue Lifecycle** - 6 connections

## Surprising Connections
- User Model connects to RescueRequest Model via shared wallet reference
- React connects to Tailwind CSS via dependency
- Role-based Access Control connects to all 5 roles (user, ngo, hospital, ambulance, admin)
- Wallet System connects to Payment via Razorpay
- Escalation System connects to Rescue Lifecycle

## Suggested Questions
- How does the Rescue Lifecycle interact with the Escalation System?
- What technologies support the Wallet System?
- How do different roles (NGO, Hospital, Ambulance) coordinate in rescues?
- What is the data flow from user submission to NGO acceptance?

---
*Graph built from AST extraction + semantic document analysis*