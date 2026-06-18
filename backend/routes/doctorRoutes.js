const express = require('express');
const router = express.Router();
const {
  getDoctorAppointments,
  getAssignedPatients,
  addPrescription,
  addMedicalRecord,
  updateDoctorProfile
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply protection to all doctor routes
router.use(protect);
router.use(authorize('doctor'));

router.get('/appointments', getDoctorAppointments);
router.get('/patients', getAssignedPatients);
router.post('/prescriptions', addPrescription);

// Route to add medical records, accepting up to 5 file attachments
router.post('/medical-records', upload.array('attachments', 5), addMedicalRecord);

router.put('/profile', updateDoctorProfile);

module.exports = router;
