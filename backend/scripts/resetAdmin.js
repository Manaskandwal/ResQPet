require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const deleted = await User.deleteMany({ role: 'admin' });
        console.log(`Deleted ${deleted.deletedCount} old admins`);
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetAdmin();
