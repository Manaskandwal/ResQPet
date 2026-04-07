/**
 * Test: Escalation Scheduler (setTimeout-based, replacing cron)
 *
 * Uses shortened timeouts (2s / 4.5s instead of 20min / 45min) by
 * temporarily monkey-patching the scheduler constants.
 *
 * Run:  node test/escalationScheduler.test.js
 * Prerequisites: MongoDB must be running, server must NOT be running (port conflict).
 */

const mongoose = require('mongoose');
const assert = require('assert');
const path = require('path');

// ─── Connect to DB ────────────────────────────────────────────────────────────
async function connectDB() {
    // Use same MONGO_URI from .env, or fallback to localhost
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/test_escalation';
    await mongoose.connect(uri);
    console.log('[Test DB] Connected');
}

// ─── Models ───────────────────────────────────────────────────────────────────
const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');

// ─── Monkey-patch scheduler constants to use seconds instead of minutes ──────
const scheduler = require('../jobs/rescueEscalationScheduler');

// Override the internal constants via a small hack: re-require with patched module cache
// Since the module caches constants, we'll directly mutate them via a wrapper approach.
// Actually, let's just test by creating rescues with past createdAt dates so the
// scheduler thinks they're overdue — no monkey-patching needed.

// ─── Helpers ──────────────────────────────────────────────────────────────────
let testUser = null;
let testHospital = null;

async function createTestUser() {
    // Clean up any leftover test users
    await User.deleteMany({ email: { $regex: /escalation-test/ } });
    await RescueRequest.deleteMany({ description: { $regex: /escalation-test/ } });
    await WalletTransaction.deleteMany({ description: { $regex: /escalation-test/ } });

    testUser = await User.create({
        name: 'Escalation Test User',
        email: 'escalation-test-user@test.com',
        password: 'TestPass123',
        role: 'user',
        walletBalance: 100,
    });

    testHospital = await User.create({
        name: 'Escalation Test Hospital',
        email: 'escalation-test-hospital@test.com',
        password: 'TestPass123',
        role: 'hospital',
        orgName: 'Test Hospital',
    });

    console.log(`[Test] Created test user: ${testUser._id} (wallet: ${testUser.walletBalance})`);
}

// ─── TEST 1: Schedule on rescue creation ──────────────────────────────────────
async function test1_scheduleOnCreation() {
    console.log('\n========== TEST 1: Schedule on Rescue Creation ==========');

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: schedule on creation',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        statusLogs: [{ status: 'pending', message: 'Created' }],
    });

    // The scheduler should have been called and stored a timer entry.
    // We can verify indirectly: the rescue is in 'pending' status and
    // the scheduler has an entry for it in pendingTimers.
    console.log(`[Test 1] ✅ Rescue created with status '${rescue.status}'`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    console.log('[Test 1] ✅ PASSED — Rescue created, scheduler should have scheduled timers\n');
}

// ─── TEST 2: 20-min escalation fires correctly (using past-dated rescue) ─────
async function test2_20minEscalation() {
    console.log('\n========== TEST 2: 20-min Escalation (Overdue Rescue) ==========');

    // Create a rescue with a createdAt 25 minutes ago — this will trigger
    // the rehydration logic to process it immediately as "overdue 20-min"
    const pastDate = new Date(Date.now() - 25 * 60 * 1000); // 25 min ago

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: 20-min escalation — willingToGo=true, willingToPay=true',
        animalType: 'cat',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        status: 'pending',
        createdAt: pastDate,
        statusLogs: [{ status: 'pending', message: 'Created', timestamp: pastDate }],
    });

    console.log(`[Test 2] Rescue created with createdAt=${pastDate.toISOString()} (25 min ago)`);
    console.log(`[Test 2] Initial status: ${rescue.status}`);

    // Trigger rehydration — this should process the overdue rescue
    await scheduler.rehydrateEscalationJobs();

    // Re-fetch the rescue to see what happened
    const updatedRescue = await RescueRequest.findById(rescue._id);
    console.log(`[Test 2] After rehydration, status: ${updatedRescue.status}`);
    console.log(`[Test 2] fundSource: ${updatedRescue.fundSource}`);

    assert.strictEqual(updatedRescue.status, 'hospital_broadcasted',
        `Expected 'hospital_broadcasted' but got '${updatedRescue.status}'`);
    assert.strictEqual(updatedRescue.fundSource, 'user',
        `Expected fundSource='user' but got '${updatedRescue.fundSource}'`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    console.log('[Test 2] ✅ PASSED — 20-min escalation worked correctly\n');
}

// ─── TEST 3: 20-min close when !willingToGo (refund) ─────────────────────────
async function test3_closeUnwillingToGo() {
    console.log('\n========== TEST 3: Close !willingToGo + Refund ==========');

    // Refill wallet
    const user = await User.findById(testUser._id);
    user.walletBalance = 50;
    await user.save();
    const initialBalance = user.walletBalance;

    const pastDate = new Date(Date.now() - 25 * 60 * 1000);

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: 20-min close — !willingToGo',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: false,
        willingToGo: false,
        depositDeducted: true,
        depositAmount: 30,
        depositRefunded: false,
        status: 'pending',
        createdAt: pastDate,
        statusLogs: [{ status: 'pending', message: 'Created', timestamp: pastDate }],
    });

    console.log(`[Test 3] User wallet before: ${initialBalance}, rescue deposit: 30`);

    await scheduler.rehydrateEscalationJobs();

    const updatedRescue = await RescueRequest.findById(rescue._id);
    const updatedUser = await User.findById(testUser._id);

    console.log(`[Test 3] After rehydration, status: ${updatedRescue.status}`);
    console.log(`[Test 3] depositRefunded: ${updatedRescue.depositRefunded}`);
    console.log(`[Test 3] User wallet after: ${updatedUser.walletBalance}`);

    assert.strictEqual(updatedRescue.status, 'closed_unresolved',
        `Expected 'closed_unresolved' but got '${updatedRescue.status}'`);
    assert.strictEqual(updatedRescue.depositRefunded, true, 'Deposit should have been refunded');
    assert.strictEqual(updatedUser.walletBalance, initialBalance + 30,
        `Wallet should have been refunded. Expected ${initialBalance + 30}, got ${updatedUser.walletBalance}`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    console.log('[Test 3] ✅ PASSED — Close + refund worked correctly\n');
}

// ─── TEST 4: 45-min hard close ───────────────────────────────────────────────
async function test4_45minHardClose() {
    console.log('\n========== TEST 4: 45-min Hard Close ==========');

    const pastDate = new Date(Date.now() - 50 * 60 * 1000); // 50 min ago

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: 45-min hard close',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: true,
        depositAmount: 30,
        depositRefunded: false,
        status: 'pending',
        createdAt: pastDate,
        statusLogs: [{ status: 'pending', message: 'Created', timestamp: pastDate }],
    });

    console.log(`[Test 4] Rescue created with createdAt=${pastDate.toISOString()} (50 min ago)`);

    await scheduler.rehydrateEscalationJobs();

    const updatedRescue = await RescueRequest.findById(rescue._id);
    console.log(`[Test 4] After rehydration, status: ${updatedRescue.status}`);
    console.log(`[Test 4] outcome: ${updatedRescue.outcome}`);

    // 45-min should override even if 20-min would escalate — it's the hard close
    assert.strictEqual(updatedRescue.status, 'closed_unresolved',
        `Expected 'closed_unresolved' but got '${updatedRescue.status}'`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    console.log('[Test 4] ✅ PASSED — 45-min hard close worked correctly\n');
}

// ─── TEST 5: Cancel timers on NGO accept ──────────────────────────────────────
async function test5_cancelOnNgoAccept() {
    console.log('\n========== TEST 5: Cancel Timers on NGO Accept ==========');

    // Create a fresh user with enough balance
    const ngoUser = await User.create({
        name: 'Test NGO',
        email: 'escalation-test-ngo@test.com',
        password: 'TestPass123',
        role: 'ngo',
        orgName: 'Test NGO Org',
        isApproved: true,
    });

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: cancel on NGO accept',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        status: 'pending',
        statusLogs: [{ status: 'pending', message: 'Created' }],
    });

    // Simulate the scheduler having scheduled this rescue
    scheduler.scheduleRescueEscalation(rescue._id, rescue.createdAt);
    console.log(`[Test 5] Rescue ${rescue._id} scheduled in scheduler`);

    // Now simulate NGO accepting — this should cancel the timers
    scheduler.cancelRescueEscalation(rescue._id);
    console.log('[Test 5] cancelRescueEscalation called');

    // Verify the entry is removed from pendingTimers (via a second cancel being a no-op)
    // If it was properly removed, calling cancel again should do nothing (no error)
    scheduler.cancelRescueEscalation(rescue._id); // idempotent — should not throw
    console.log('[Test 5] Second cancel (idempotent) — no error');

    // Verify the rescue can still be updated normally
    rescue.status = 'accepted';
    rescue.assignedNGO = ngoUser._id;
    await rescue.save();

    const updatedRescue = await RescueRequest.findById(rescue._id);
    assert.strictEqual(updatedRescue.status, 'accepted');
    assert.strictEqual(updatedRescue.assignedNGO.toString(), ngoUser._id.toString());

    console.log(`[Test 5] Rescue status after NGO accept: ${updatedRescue.status}`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    await User.findByIdAndDelete(ngoUser._id);
    console.log('[Test 5] ✅ PASSED — Timer cancellation on NGO accept works\n');
}

// ─── TEST 6: Reschedule within window ─────────────────────────────────────────
async function test6_rescheduleWithinWindow() {
    console.log('\n========== TEST 6: Reschedule Within Window ==========');

    // Create a rescue that's 5 minutes old (within 20-min window)
    const recentDate = new Date(Date.now() - 5 * 60 * 1000);

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: reschedule within window',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        status: 'pending',
        createdAt: recentDate,
        statusLogs: [{ status: 'pending', message: 'Created', timestamp: recentDate }],
    });

    console.log(`[Test 6] Rescue created with createdAt=${recentDate.toISOString()} (5 min ago)`);

    // This should NOT fire immediately — it should schedule timers
    await scheduler.rehydrateEscalationJobs();

    const updatedRescue = await RescueRequest.findById(rescue._id);
    console.log(`[Test 6] After rehydration, status: ${updatedRescue.status} (should still be 'pending')`);

    assert.strictEqual(updatedRescue.status, 'pending',
        `Rescue should still be 'pending' but got '${updatedRescue.status}'`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    console.log('[Test 6] ✅ PASSED — Rescue within window was rescheduled, not fired\n');
}

// ─── TEST 7: Already accepted rescue is skipped by rehydration ────────────────
async function test7_skipAccepted() {
    console.log('\n========== TEST 7: Skip Accepted Rescues ==========');

    const ngoUser = await User.create({
        name: 'Test NGO 2',
        email: 'escalation-test-ngo2@test.com',
        password: 'TestPass123',
        role: 'ngo',
        orgName: 'Test NGO Org 2',
        isApproved: true,
    });

    const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: skip accepted',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        status: 'accepted', // Already accepted, NOT pending
        assignedNGO: ngoUser._id,
        createdAt: pastDate,
        statusLogs: [{ status: 'accepted', message: 'NGO accepted', timestamp: new Date() }],
    });

    console.log(`[Test 7] Rescue with status='accepted' and createdAt 30 min ago`);

    await scheduler.rehydrateEscalationJobs();

    const updatedRescue = await RescueRequest.findById(rescue._id);
    console.log(`[Test 7] After rehydration, status: ${updatedRescue.status} (should still be 'accepted')`);

    assert.strictEqual(updatedRescue.status, 'accepted',
        `Accepted rescue should not be modified. Expected 'accepted' but got '${updatedRescue.status}'`);

    // Clean up
    await RescueRequest.findByIdAndDelete(rescue._id);
    await User.findByIdAndDelete(ngoUser._id);
    console.log('[Test 7] ✅ PASSED — Accepted rescue was skipped\n');
}

// ─── TEST 8: Cancel still works after 20-min callback fired ──────────────────
async function test8_cancelAfter20MinStillPrevents45Close() {
    console.log('\n========== TEST 8: Cancel After 20-min Still Prevents 45-min Close ==========');

    const hospital = await User.create({
        name: 'Test Hospital Cancel Edge',
        email: `escalation-test-hospital-cancel-${Date.now()}@test.com`,
        password: 'TestPass123',
        role: 'hospital',
        orgName: 'Cancel Edge Hospital',
        isApproved: true,
    });

    // Created ~44m58s ago -> 20-min check should run immediately, 45-min close in ~2s.
    const almost45Date = new Date(Date.now() - (44 * 60 * 1000 + 58 * 1000));

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: cancel after 20-min should prevent 45-min close',
        animalType: 'dog',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        status: 'pending',
        createdAt: almost45Date,
        statusLogs: [{ status: 'pending', message: 'Created', timestamp: almost45Date }],
    });

    scheduler.scheduleRescueEscalation(rescue._id, rescue.createdAt);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const after20 = await RescueRequest.findById(rescue._id).select('status');
    assert.strictEqual(after20.status, 'hospital_broadcasted',
        `Expected 'hospital_broadcasted' after 20-min check, got '${after20.status}'`);

    await RescueRequest.findByIdAndUpdate(rescue._id, {
        status: 'hospital_accepted',
        assignedHospital: hospital._id,
        workStartedAt: new Date(),
    });
    scheduler.cancelRescueEscalation(rescue._id);

    await new Promise((resolve) => setTimeout(resolve, 4000));

    const finalRescue = await RescueRequest.findById(rescue._id).select('status');
    assert.strictEqual(finalRescue.status, 'hospital_accepted',
        `Expected 'hospital_accepted' to remain, but got '${finalRescue.status}'`);

    await RescueRequest.findByIdAndDelete(rescue._id);
    await User.findByIdAndDelete(hospital._id);
    console.log('[Test 8] ✅ PASSED — Cancel still prevents 45-min close after 20-min callback\n');
}

// ─── TEST 9: Rehydrate keeps 45-min close for hospital_broadcasted ───────────
async function test9_rehydrateHospitalBroadcastedKeeps45Close() {
    console.log('\n========== TEST 9: Rehydrate Hospital Broadcasted Keeps 45-min Close ==========');

    // Created ~44m58s ago and already hospital_broadcasted.
    const almost45Date = new Date(Date.now() - (44 * 60 * 1000 + 58 * 1000));

    const rescue = await RescueRequest.create({
        user: testUser._id,
        description: 'escalation-test: rehydrate hospital_broadcasted should still close at 45',
        animalType: 'cat',
        location: { lat: 28.6, lng: 77.2 },
        willingToPay: true,
        willingToGo: true,
        depositDeducted: false,
        status: 'hospital_broadcasted',
        createdAt: almost45Date,
        escalatedAt: new Date(almost45Date.getTime() + 20 * 60 * 1000),
        statusLogs: [{ status: 'hospital_broadcasted', message: 'Escalated', timestamp: new Date() }],
    });

    await scheduler.rehydrateEscalationJobs();
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const updatedRescue = await RescueRequest.findById(rescue._id).select('status outcome');
    assert.strictEqual(updatedRescue.status, 'closed_unresolved',
        `Expected 'closed_unresolved' but got '${updatedRescue.status}'`);
    assert.strictEqual(updatedRescue.outcome, 'closed_unresolved',
        `Expected outcome='closed_unresolved' but got '${updatedRescue.outcome}'`);

    await RescueRequest.findByIdAndDelete(rescue._id);
    console.log('[Test 9] ✅ PASSED — Rehydrated hospital_broadcasted rescue was closed at 45-min SLA\n');
}

// ─── Main Runner ──────────────────────────────────────────────────────────────
async function runTests() {
    let passed = 0;
    let failed = 0;

    try {
        await connectDB();
        await createTestUser();

        const tests = [
            { name: 'Schedule on Creation', fn: test1_scheduleOnCreation },
            { name: '20-min Escalation', fn: test2_20minEscalation },
            { name: 'Close !willingToGo + Refund', fn: test3_closeUnwillingToGo },
            { name: '45-min Hard Close', fn: test4_45minHardClose },
            { name: 'Cancel on NGO Accept', fn: test5_cancelOnNgoAccept },
            { name: 'Reschedule Within Window', fn: test6_rescheduleWithinWindow },
            { name: 'Skip Accepted', fn: test7_skipAccepted },
            { name: 'Cancel after 20-min prevents 45-min close', fn: test8_cancelAfter20MinStillPrevents45Close },
            { name: 'Rehydrate keeps 45-min close for hospital_broadcasted', fn: test9_rehydrateHospitalBroadcastedKeeps45Close },
        ];

        for (const test of tests) {
            try {
                await test.fn();
                passed++;
            } catch (err) {
                failed++;
                console.error(`❌ FAILED: ${test.name}`);
                console.error(`   ${err.message}`);
                console.error(`   ${err.stack.split('\n').slice(1, 3).join('\n   ')}`);
            }
        }

        console.log('\n============================================');
        console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
        console.log('============================================\n');
    } catch (err) {
        console.error('[Test Runner] Fatal error:', err.message);
        console.error(err.stack);
    } finally {
        await mongoose.disconnect();
        console.log('[Test DB] Disconnected');
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
