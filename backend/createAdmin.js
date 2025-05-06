const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const adminUser = new User({
            username: 'admin',
            password: 'admin123', // Можете да промените паролата
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.disconnect();
    }
};

createAdmin(); 