const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// Get all appointments (admin only)
router.get('/', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ date: 1, time: 1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new appointment
router.post('/', async (req, res) => {
    const appointment = new Appointment({
        name: req.body.name,
        phone: req.body.phone,
        service: req.body.service,
        date: req.body.date,
        time: req.body.time
    });

    try {
        // Check if time slot is available
        const existingAppointment = await Appointment.findOne({
            date: req.body.date,
            time: req.body.time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked' });
        }

        const newAppointment = await appointment.save();
        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update appointment status (admin only)
router.patch('/:id', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (req.body.status) {
            appointment.status = req.body.status;
        }

        const updatedAppointment = await appointment.save();
        res.json(updatedAppointment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get booked times for a specific date
router.get('/available', async (req, res) => {
    try {
        const { date } = req.query;
        
        const appointments = await Appointment.find({
            date: new Date(date),
            status: { $ne: 'cancelled' }
        });

        const bookedTimes = appointments.map(app => app.time);
        res.json(bookedTimes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 