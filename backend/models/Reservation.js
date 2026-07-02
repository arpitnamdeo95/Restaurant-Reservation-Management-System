const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    timeSlot: { type: String, required: true }, // e.g., '18:00-19:00', '19:00-20:00'
    guests: { type: Number, required: true }
}, { timestamps: true });

reservationSchema.index({ table: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Reservation', reservationSchema);
