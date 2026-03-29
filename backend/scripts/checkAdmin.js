require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log(`Admin Found: ${admin.email}`);
            console.log(`Role: ${admin.role}`);
            console.log(`isAdmin: ${admin.isAdmin}`);
            console.log(`isApproved: ${admin.isApproved}`);
        } else {
            console.log('No Admin Found');
        }
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
