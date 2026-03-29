require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const findSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const superUsers = await User.find({ role: 'superadmin' });
        console.log(`Found ${superUsers.length} users with role superadmin`);
        superUsers.forEach(u => console.log(` - ${u.email}`));
        
        const allAdmins = await User.find({ role: 'admin' });
        console.log(`Found ${allAdmins.length} users with role admin`);
        allAdmins.forEach(u => console.log(` - ${u.email} (isAdmin: ${u.isAdmin})`));
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

findSuperAdmin();
