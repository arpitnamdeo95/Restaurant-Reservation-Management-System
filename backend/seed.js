require('dotenv').config();
const mongoose = require('mongoose');
const Table = require('./models/Table');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_reservations';

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB for seeding...');

        // Clear existing data
        await Table.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data.');

        // Seed Tables
        const tables = [
            { tableNumber: 1, capacity: 2 },
            { tableNumber: 2, capacity: 2 },
            { tableNumber: 3, capacity: 4 },
            { tableNumber: 4, capacity: 4 },
            { tableNumber: 5, capacity: 6 },
            { tableNumber: 6, capacity: 8 }
        ];
        await Table.insertMany(tables);
        console.log('Seeded tables.');

        // Seed Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });
        
        // Seed Customer User
        const customerPassword = await bcrypt.hash('customer123', salt);
        await User.create({
            name: 'Customer User',
            email: 'customer@example.com',
            password: customerPassword,
            role: 'customer'
        });
        console.log('Seeded users.');

        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();
