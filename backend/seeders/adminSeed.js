require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Admin Seeder Script
 * Creates the default admin account if one doesn't already exist.
 *
 * Run with: npm run seed (from the backend/ directory)
 */
const seedAdmin = async () => {
    try {
        console.log('[Seeder] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('[Seeder] MongoDB connected.');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@pawsaarthi.com';
        const adminName = process.env.ADMIN_NAME || 'PawSaarthi Admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log(`[Seeder] Admin already exists: ${existingAdmin.email}`);
            console.log('[Seeder] Skipping seed. Delete the existing admin to re-seed.');
            process.exit(0);
        }

        // Create admin (password will be hashed by the User model pre-save hook)
        const admin = new User({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isApproved: true,
        });

        await admin.save();

        console.log('');
        console.log('==============================================');
        console.log(' PawSaarthi Admin Account Created!');
        console.log('==============================================');
        console.log(` Name   : ${adminName}`);
        console.log(` Email  : ${adminEmail}`);
        console.log(` Pass   : ${adminPassword}`);
        console.log(` Role   : admin`);
        console.log('==============================================');
        console.log('');
        console.log('[Seeder] IMPORTANT: Change the password after first login!');
        console.log('[Seeder] Admin seed completed successfully.');

        process.exit(0);
    } catch (error) {
        console.error('[Seeder] Error during admin seeding:', error.message);
        process.exit(1);
    }
};

seedAdmin();
