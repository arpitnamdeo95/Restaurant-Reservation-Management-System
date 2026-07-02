const express = require('express');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Get reservations (Admin sees all, Customer sees their own)
router.get('/', protect, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a reservation
router.post('/', protect, async (req, res) => {
    try {
        const { tableId, date, timeSlot, guests } = req.body;
        
        // 1. Verify Table exists and has enough capacity
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        if (table.capacity < guests) {
            return res.status(400).json({ message: `Table capacity (${table.capacity}) is less than number of guests (${guests})` });
        }

        // 2. Prevent overlapping reservations for the same table, date, and timeslot
        const conflict = await Reservation.findOne({
            table: tableId,
            date,
            timeSlot
        });

        if (conflict) {
            return res.status(400).json({ message: 'Table is already reserved for this time slot' });
        }

        // 3. Create Reservation
        const reservation = await Reservation.create({
            user: req.user.id,
            table: tableId,
            date,
            timeSlot,
            guests
        });

        res.status(201).json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel a reservation
router.delete('/:id', protect, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a reservation (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { tableId, date, timeSlot, guests } = req.body;
        const reservation = await Reservation.findById(req.params.id);
        
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Verify capacity and conflict if table/date/time is changed
        if (tableId || date || timeSlot || guests) {
            const checkTableId = tableId || reservation.table;
            const checkDate = date || reservation.date;
            const checkTimeSlot = timeSlot || reservation.timeSlot;
            const checkGuests = guests || reservation.guests;

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

            if (tableId) reservation.table = tableId;
            if (date) reservation.date = date;
            if (timeSlot) reservation.timeSlot = timeSlot;
            if (guests) reservation.guests = guests;
        }

        await reservation.save();
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
