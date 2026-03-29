require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const upgradeAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const result = await User.updateMany(
            { role: 'admin' },
            { $set: { isAdmin: true, isApproved: true } }
        );
        console.log(`Upgraded ${result.modifiedCount} admin accounts with superadmin privileges.`);
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

upgradeAdmins();
