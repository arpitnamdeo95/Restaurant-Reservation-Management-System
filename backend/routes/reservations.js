const express = require('express');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_SLOTS = ["17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"];

// Get reservations (Admin sees all, Customer sees their own)
router.get('/', protect, async (req, res, next) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin') {
            filter.user = req.user.id;
        } else if (req.query.date) {
            filter.date = req.query.date; // Optional filter for admin by date
        }
        
        const reservations = await Reservation.find(filter).populate('table', 'tableNumber capacity').populate('user', 'name email');
        res.json(reservations);
    } catch (error) {
        next(error);
    }
});

// Create a reservation
router.post('/', protect, async (req, res, next) => {
    try {
        const { tableId, date, timeSlot, guests } = req.body;
        
        // Input validation
        if (!tableId) {
            return res.status(400).json({ message: 'Table ID is required' });
        }
        if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
            return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required' });
        }
        if (!timeSlot || !ALLOWED_SLOTS.includes(timeSlot)) {
            return res.status(400).json({ message: 'Invalid or missing time slot' });
        }
        if (guests === undefined || !Number.isInteger(guests) || guests <= 0) {
            return res.status(400).json({ message: 'Guests must be a positive integer' });
        }

        // 1. Verify Table exists and has enough capacity
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        if (table.capacity < guests) {
            return res.status(400).json({ message: `Table capacity (${table.capacity}) is less than number of guests (${guests})` });
        }

        // 2. Prevent overlapping reservations for the same table, date, and timeslot (pre-check)
        const conflict = await Reservation.findOne({
            table: tableId,
            date,
            timeSlot
        });

        if (conflict) {
            return res.status(400).json({ message: 'Table is already reserved for this time slot' });
        }

        // 3. Create Reservation
        try {
            const reservation = await Reservation.create({
                user: req.user.id,
                table: tableId,
                date,
                timeSlot,
                guests
            });
            res.status(201).json(reservation);
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                return res.status(400).json({ message: 'Table is already reserved for this time slot' });
            }
            throw dbErr;
        }
    } catch (error) {
        next(error);
    }
});

// Cancel a reservation
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Only the user who made it or an admin can delete it
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
        }

        await reservation.deleteOne();
        res.json({ message: 'Reservation cancelled' });
    } catch (error) {
        next(error);
    }
});

// Update a reservation (Admin only)
router.put('/:id', protect, adminOnly, async (req, res, next) => {
    try {
        const { tableId, date, timeSlot, guests } = req.body;

        // Validation for values if provided
        if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))) {
            return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required' });
        }
        if (timeSlot !== undefined && !ALLOWED_SLOTS.includes(timeSlot)) {
            return res.status(400).json({ message: 'Invalid time slot' });
        }
        if (guests !== undefined && (!Number.isInteger(guests) || guests <= 0)) {
            return res.status(400).json({ message: 'Guests must be a positive integer' });
        }

        const reservation = await Reservation.findById(req.params.id);
        
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Verify capacity and conflict if table/date/time is changed
        if (tableId !== undefined || date !== undefined || timeSlot !== undefined || guests !== undefined) {
            const checkTableId = tableId !== undefined ? tableId : reservation.table;
            const checkDate = date !== undefined ? date : reservation.date;
            const checkTimeSlot = timeSlot !== undefined ? timeSlot : reservation.timeSlot;
            const checkGuests = guests !== undefined ? guests : reservation.guests;

            const table = await Table.findById(checkTableId);
            if (!table) return res.status(404).json({ message: 'Table not found' });
            if (table.capacity < checkGuests) {
                return res.status(400).json({ message: `Table capacity (${table.capacity}) is less than guests (${checkGuests})` });
            }

            // Conflict check excluding the current reservation
            const conflict = await Reservation.findOne({
                _id: { $ne: reservation._id },
                table: checkTableId,
                date: checkDate,
                timeSlot: checkTimeSlot
            });

            if (conflict) {
                return res.status(400).json({ message: 'Table is already reserved for this time slot' });
            }

            if (tableId !== undefined) reservation.table = tableId;
            if (date !== undefined) reservation.date = date;
            if (timeSlot !== undefined) reservation.timeSlot = timeSlot;
            if (guests !== undefined) reservation.guests = guests;
        }

        try {
            await reservation.save();
            res.json(reservation);
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                return res.status(400).json({ message: 'Table is already reserved for this time slot' });
            }
            throw dbErr;
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
