const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ message: 'A valid email is required' });
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role: 'customer' });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
