const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// Helper to get patient profile from user ID
const getPatientProfile = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    throw new Error('Patient profile not found for this user');
  }
  return patient;
};

// @desc    Book an appointment
// @route   POST /api/patient/appointments
// @access  Private/Patient
exports.bookAppointment = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user._id);
    const { doctorId, departmentId, date, slot, symptoms } = req.body;

    // Validate fields
    if (!doctorId || !departmentId || !date || !slot || !symptoms) {
      return res.status(400).json({ success: false, error: 'Please provide all booking details' });
    }

    // Set appointment date start of day to avoid time offsets matching issues
    const apptDate = new Date(date);
    apptDate.setUTCHours(0, 0, 0, 0);

    // Double-booking check: Check if doctor already has a booked appointment for this slot on this day
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: apptDate,
      slot: slot,
      status: { $in: ['pending', 'approved', 'completed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        error: 'This time slot has already been booked. Please choose a different slot or date.'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      department: departmentId,
      date: apptDate,
      slot,
      symptoms
    });

    // Notify Doctor (base User)
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (doctor && doctor.user) {
      await Notification.create({
        user: doctor.user._id,
        message: `New appointment requested by ${req.user.name} for ${apptDate.toLocaleDateString()} at ${slot}.`
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Book Appointment',
      details: `Booked appointment with Doctor ID: ${doctorId} on ${apptDate.toLocaleDateString()} (${slot})`
    });

    res.status(210).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get patient appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user._id);
    const appointments = await Appointment.find({ patient: patient._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('department', 'name')
      .sort({ date: -1, slot: 1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get patient medical history & diagnoses
// @route   GET /api/patient/medical-records
// @access  Private/Patient
exports.getPatientMedicalRecords = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user._id);
    const records = await MedicalRecord.find({ patient: patient._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private/Patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user._id);
    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email specialization' }
      })
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Download Prescription PDF
// @route   GET /api/patient/prescriptions/:id/download
// @access  Private
exports.downloadPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('doctor.department')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email gender' }
      });

    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    // Secure checking: Verify patient or doctor owns it, or user is admin
    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (
      userRole === 'patient' &&
      prescription.patient.user._id.toString() !== userId
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to download this prescription' });
    }
    if (
      userRole === 'doctor' &&
      prescription.doctor.user._id.toString() !== userId
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to download this prescription' });
    }

    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.pdf`);

    // Generate PDF and stream it
    generatePrescriptionPDF(prescription, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update Patient profile
// @route   PUT /api/patient/profile
// @access  Private/Patient
exports.updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    const { name, phone, gender, age, bloodGroup, address } = req.body;

    // Update User details
    await User.findByIdAndUpdate(req.user._id, { name, phone, gender });

    // Update Patient details
    const updatedPatient = await Patient.findByIdAndUpdate(patient._id, {
      age,
      bloodGroup,
      address
    }, { new: true })
      .populate('user', 'name email phone gender');

    res.status(200).json({ success: true, data: updatedPatient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current user notifications
// @route   GET /api/patient/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/patient/notifications/:id
// @access  Private
exports.readNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
