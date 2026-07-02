const express = require('express');
const Table = require('../models/Table');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// GET all tables
router.get('/', async (req, res) => {
    try {
        const tables = await Table.find({});
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST a new table (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { tableNumber, capacity } = req.body;
        const table = await Table.create({ tableNumber, capacity });
        res.status(201).json(table);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Table number already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
