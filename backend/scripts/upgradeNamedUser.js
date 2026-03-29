require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const upgradeUserToAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const result = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { $set: { role: 'admin', isAdmin: true, isApproved: true } },
            { new: true }
        );
        
        if (result) {
            console.log(`Successfully upgraded ${email} to admin role with superadmin privileges.`);
        } else {
            console.log(`User ${email} not found.`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const targetEmail = 'manaskandwal@gmail.com'; 
upgradeUserToAdmin(targetEmail);
