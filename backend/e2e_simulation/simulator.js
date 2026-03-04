const axios = require('axios');
const FormData = require('form-data');
const { BotActor } = require('./BotActor');
const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const logFile = fs.createWriteStream('e2e_final.log', { flags: 'w' });

// Override console to write to both stdout and file
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    const msg = args.join(' ');
    logFile.write(msg + '\n');
    originalLog.apply(console, args);
};

console.error = function (...args) {
    const msg = args.join(' ');
    logFile.write('[ERROR] ' + msg + '\n');
    originalError.apply(console, args);
};

const BASE_URL = 'http://localhost:5000/api';

/**
 * NEW: Superadmin Actor matching the requested credentials
 */
const superadmin = new BotActor('Manas (Superadmin)', 'manaskandwal@gmail.com', 'superadmin');
superadmin.password = 'jackey@123.';

const admin = new BotActor(process.env.ADMIN_NAME || 'Super Admin', process.env.ADMIN_EMAIL || 'admin@pawsaarthi.com', 'admin');
admin.password = process.env.ADMIN_PASSWORD || 'Admin@123456';
const user = new BotActor('Reporter Bob', 'bobbot@example.com', 'user', { location: { lat: 28.7, lng: 77.1 } });
const ngo1 = new BotActor('Paws Rescue NGO', 'ngo1bot@example.com', 'ngo', { orgName: 'Paws Rescue', location: { lat: 28.7, lng: 77.1 } });
const ngo2 = new BotActor('Healing Hands NGO', 'ngo2bot@example.com', 'ngo', { orgName: 'Healing Hands', location: { lat: 28.705, lng: 77.105 } });
const hospital = new BotActor('Govt Central Vet', 'hospbot@example.com', 'hospital', { orgName: 'Central Vet', isGovernment: true, regNumber: 'H-123', location: { lat: 28.7, lng: 77.1 } });
const ambulance = new BotActor('Govt Ambulance Unit 1', 'ambbot@example.com', 'ambulance', { vehicleNumber: 'DL1G1111', isGovernment: true, location: { lat: 28.7, lng: 77.1 } });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function prepareSystem() {
    console.log('\n--- 🚀 PHASE 1: SYSTEM PREPARATION & REGISTRATION ---\n');

    // Mongoose cleanup for clean slate (optional, but ensures repeatable tests)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/PawSaarthi');
    await User.deleteMany({ email: { $regex: 'bot' } });

    // Register Admin
    await admin.registerAndLogin();

    const actorsToApprove = [ngo1, ngo2, hospital, ambulance];

    // Register all
    await user.registerAndLogin();
    for (const actor of actorsToApprove) {
        await actor.registerAndLogin();

        // Admin approves them via Mongoose directly for speed in setup
        const dbUser = await User.findOne({ email: actor.email });
        if (dbUser) {
            dbUser.isApproved = true;
            if (actor === ambulance) {
                dbUser.linkedHospital = hospital.userId;
            }
            await dbUser.save();
            admin.log(`Approved ${actor.name}`);
        }

        // Now login will succeed
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: actor.email, password: actor.password });
        actor.token = loginRes.data.token;
        actor.userId = loginRes.data.user._id;
        actor.log(`Successfully logged in (Approved).`);
    }

    // Set user wallet
    const dbNormalUser = await User.findOne({ email: user.email });
    dbNormalUser.walletBalance = 500;
    await dbNormalUser.save();
    user.log(`Wallet topped up to ₹500.`);

    // Connect Sockets sequentially to catch individual errors
    for (const actor of [user, ngo1, ngo2, hospital, ambulance]) {
        try {
            await actor.connectSocket();
        } catch (sockErr) {
            actor.log(`Socket connection crashed: ${sockErr.message}`);
        }
    }
}

async function runScenarioA() {
    console.log('\n--- 🐕 PHASE 2: SCENARIO A (HAPPY NGO PATH) ---\n');

    // 1. User reports
    user.log(`Creating Rescue Report...`);
    const form = new FormData();
    form.append('description', 'Injured stray dog seen bleeding.');
    form.append('lat', '28.7');
    form.append('lng', '77.1');
    form.append('address', 'Sector 5, Main Road');

    const repRes = await axios.post(`${BASE_URL}/rescue`, form, { headers: { ...form.getHeaders(), Authorization: `Bearer ${user.token}` } });
    if (repRes.status !== 201) return user.log(`Failed report: ${repRes.data.message}`);

    const rescueId = repRes.data.rescueRequest._id;
    user.log(`Report created successfully! ID: ${rescueId}`);

    // Wait for Sockets to broadcast
    await sleep(2000);

    // 2. NGO 1 Accepts via new flow (Immediate)
    ngo1.log(`Accepting Rescue ${rescueId} (Immediate)...`);
    const acceptRes = await axios.put(`${BASE_URL}/rescue/${rescueId}/accept-ngo`, { type: 'immediate' }, { headers: { Authorization: `Bearer ${ngo1.token}` } });
    if (acceptRes.status === 200) {
        ngo1.log(`Accepted! State is now: ${acceptRes.data.rescue.status}`);
    }

    await sleep(1500);

    // 3. NGO 1 Progresses Lifecycle
    await ngo1.updateNGOStatus(rescueId, 'on_the_way', 'Moving out with the rescue van!');
    await sleep(1000);
    await ngo1.updateNGOStatus(rescueId, 'reached', 'Arrived at the spot, dog is scared.');
    await sleep(1000);
    await ngo1.updateNGOStatus(rescueId, 'treating', 'Administering basic first aid.');
    await sleep(1500);

    // 4. NGO 1 Resolves
    ngo1.log(`Treatment complete. marking resolved.`);
    const resolveRes = await axios.put(`${BASE_URL}/rescue/${rescueId}/resolve-ngo`, {}, { headers: { Authorization: `Bearer ${ngo1.token}` } });
    if (resolveRes.status === 200) {
        ngo1.log(`Resolved! State is now: ${resolveRes.data.rescue.status}`);
        user.log(`Dashboard shows animal saved!`);
    }
}

async function runScenarioC() {
    console.log('\n--- 💰 PHASE 4: SCENARIO C (SUPERADMIN & FUNDRAISERS) ---\n');

    // 1. Superadmin role switching test
    await superadmin.registerAndLogin();
    // Superadmin starts as superadmin
    await superadmin.switchRole('user');
    await superadmin.switchRole('ngo');
    await superadmin.switchRole('hospital');
    await superadmin.switchRole('ambulance');
    await superadmin.switchRole('admin');
    await superadmin.switchRole('superadmin'); // back to base

    // 2. Emergency Fund Subscription
    await user.subscribeEmergency(100);

    // 3. NGO Payment Config
    ngo1.log(`Updating payment details...`);
    const dbNgo = await User.findOne({ email: ngo1.email });
    dbNgo.paymentDetails = {
        upiId: 'paws@upi',
        accountHolder: 'Paws Rescue',
        bankName: 'HDFC Bank'
    };
    await dbNgo.save();
    ngo1.log(`Payment details updated.`);

    // 4. Verify NGO appears in NGO list for fundraisers
    const ngoListRes = await axios.get(`${BASE_URL}/user/ngos`, { headers: { Authorization: `Bearer ${user.token}` } });
    if (ngoListRes.data.success && ngoListRes.data.ngos.length > 0) {
        user.log(`Found ${ngoListRes.data.ngos.length} NGOs in listing! Verification passed.`);
    }

    console.log('[Info] Waiting 65 seconds to verify recurring deduction...')
    await sleep(65000);
    const dbSubscribedUser = await User.findOne({ email: user.email });
    console.log(`[Validation] User lastDeductedAt: ${dbSubscribedUser.monthlySubscription.lastDeductedAt}`);
}

async function runScenarioB() {
    console.log('\n--- 🚑 PHASE 3: SCENARIO B (ESCALATION TO HOSPITAL & AMBULANCE) ---\n');

    // 1. User reports
    const form = new FormData();
    form.append('description', 'Cat hit by car, highly critical.');
    form.append('lat', '28.7');
    form.append('lng', '77.1');

    const repRes = await axios.post(`${BASE_URL}/rescue`, form, { headers: { ...form.getHeaders(), Authorization: `Bearer ${user.token}` } }).catch(e => e.response);
    const rescueId = repRes.data.rescueRequest._id;
    user.log(`Report created successfully! ID: ${rescueId}`);
    await sleep(2000);

    // 2. NGO 1 Rejects
    ngo1.log(`Too busy, rejecting case...`);
    await axios.put(`${BASE_URL}/rescue/${rescueId}/reject-ngo`, {}, { headers: { Authorization: `Bearer ${ngo1.token}` } }).catch(e => e.response);

    // 3. NGO 2 Rejects
    ngo2.log(`Lacking equipment, rejecting case...`);
    await axios.put(`${BASE_URL}/rescue/${rescueId}/reject-ngo`, {}, { headers: { Authorization: `Bearer ${ngo2.token}` } }).catch(e => e.response);

    // Expected: System escalates to hospital, socket fires 'hospital_broadcast'
    await sleep(2000);

    // 4. Hospital Accepts Broadcast
    hospital.log(`Received emergency broadcast. Accepting...`);
    const hospAccept = await axios.put(`${BASE_URL}/hospital/rescue/${rescueId}/accept-broadcast`, {}, { headers: { Authorization: `Bearer ${hospital.token}` } }).catch(e => e.response);
    if (!hospAccept || hospAccept.status !== 200) {
        return hospital.log(`Failed to accept: ${hospAccept?.data?.message}`);
    }
    if (hospAccept.status === 200) {
        hospital.log(`Accepted case! Auto-pinging ambulance... (State: ${hospAccept.data.rescue.status})`);
    }

    await sleep(2000);

    // 5. Ambulance Accepts
    ambulance.log(`Received dispatch ping! Accepting...`);
    const ambAccept = await axios.put(`${BASE_URL}/ambulance/rescue/${rescueId}/accept-ping`, {}, { headers: { Authorization: `Bearer ${ambulance.token}` } }).catch(e => e.response);
    if (!ambAccept || ambAccept.status !== 200) {
        return ambulance.log(`Failed to accept: ${ambAccept?.data?.message}`);
    }
    if (ambAccept.status === 200) {
        ambulance.log(`Dispatch claimed! State: ${ambAccept.data.rescue.status}`);
    }

    await sleep(1500);

    // 6. Ambulance En Route
    ambulance.log(`Driving to location...`);
    await axios.put(`${BASE_URL}/rescue/${rescueId}/status`, { status: "en_route" }, { headers: { Authorization: `Bearer ${ambulance.token}` } }).catch(e => e.response);

    await sleep(1000);

    // 7. Picked Up
    ambulance.log(`Animal picked up. Returning to hospital...`);
    await axios.put(`${BASE_URL}/rescue/${rescueId}/status`, { status: "picked_up" }, { headers: { Authorization: `Bearer ${ambulance.token}` } }).catch(e => e.response);

    await sleep(1500);

    // 8. Delivered (Auto Completes)
    ambulance.log(`Arrived at hospital. Handing over...`);
    const finalRes = await axios.put(`${BASE_URL}/rescue/${rescueId}/status`, { status: "delivered" }, { headers: { Authorization: `Bearer ${ambulance.token}` } }).catch(e => e.response);

    if (finalRes.data.rescue.status === 'completed') {
        ambulance.log(`Delivery complete. Rescue status is COMPLETED. Deposit refunded.`);
        hospital.log(`Animal admitted successfully.`);
        user.log(`Notification: Animal safely reached the hospital. Refund received!`);
    }
}

async function runSimulation() {
    try {
        await prepareSystem();
        await runScenarioA();
        await runScenarioB();
        await runScenarioC();

        console.log('\n--- 🎉 SIMULATION COMPLETE 🎉 ---\n');
    } catch (e) {
        console.error('\n--- ❌ SIMULATION ENCOUNTERED A FATAL ERROR ❌ ---');
        console.error(e.stack || e);
    } finally {
        [user, ngo1, ngo2, hospital, ambulance, superadmin].forEach(a => a.disconnectSocket());
        mongoose.disconnect();
        logFile.end();
        process.exit(0);
    }
}

// Ensure mongoose warning suppressed
mongoose.set('strictQuery', false);
runSimulation();
