const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getPatientAppointments,
  getPatientMedicalRecords,
  getPatientPrescriptions,
  downloadPrescription,
  updatePatientProfile,
  getNotifications,
  readNotification
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all patient routes
router.use(protect);

// Specific Patient only actions
router.post('/appointments', authorize('patient'), bookAppointment);
router.get('/appointments', authorize('patient'), getPatientAppointments);
router.get('/medical-records', authorize('patient'), getPatientMedicalRecords);
router.get('/prescriptions', authorize('patient'), getPatientPrescriptions);
router.put('/profile', authorize('patient'), updatePatientProfile);

// Common authenticated actions (e.g. notifications can apply to anyone)
router.get('/notifications', getNotifications);
router.put('/notifications/:id', readNotification);

// Prescription download (can be patient or doctor)
router.get('/prescriptions/:id/download', downloadPrescription);

module.exports = router;
