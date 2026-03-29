require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const listAllUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const users = await User.find({}).sort({ createdAt: -1 }).limit(20);
        console.log(`Total Recent Users: ${users.length}`);
        users.forEach(u => console.log(` - ${u.email} | ${u.role} | isAdmin: ${u.isAdmin}`));
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listAllUsers();
