const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getBookedSlots
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Admin only: view all hospital appointments
router.get('/', authorize('admin'), getAllAppointments);

// Doctor or Admin: update appointment status
router.put('/:id/status', authorize('admin', 'doctor'), updateAppointmentStatus);

// Any authenticated: cancel appointment
router.put('/:id/cancel', cancelAppointment);

// Any authenticated: check booked slots for a doctor on a date
router.get('/booked-slots', getBookedSlots);

module.exports = router;
