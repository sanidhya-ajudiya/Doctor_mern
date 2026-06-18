const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Helper to get doctor profile from user ID
const getDoctorProfile = async (userId) => {
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) {
    throw new Error('Doctor profile not found for this user');
  }
  return doctor;
};

// @desc    Get doctor appointments
// @route   GET /api/doctor/appointments
// @access  Private/Doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone gender' }
      })
      .sort({ date: 1, slot: 1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get doctor's assigned patients (unique patients who had appointments)
// @route   GET /api/doctor/patients
// @access  Private/Doctor
exports.getAssignedPatients = async (req, res) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    const appointments = await Appointment.find({ doctor: doctor._id }).select('patient');
    const patientIds = [...new Set(appointments.map(a => a.patient.toString()))];

    const patients = await Patient.find({ _id: { $in: patientIds } })
      .populate('user', 'name email phone gender status');

    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add medical prescription
// @route   POST /api/doctor/prescriptions
// @access  Private/Doctor
exports.addPrescription = async (req, res) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    const { appointmentId, patientId, medications, instructions } = req.body;

    // Verify appointment exists and belongs to this doctor
    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctor._id });
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found for this doctor' });
    }

    // Create prescription
    const prescription = await Prescription.create({
      appointment: appointmentId,
      doctor: doctor._id,
      patient: patientId,
      medications,
      instructions
    });

    // Mark appointment as completed
    appointment.status = 'completed';
    await appointment.save();

    // Notify Patient
    const patient = await Patient.findById(patientId);
    if (patient) {
      await Notification.create({
        user: patient.user,
        message: `Dr. ${req.user.name} has added a new prescription for your visit on ${new Date(appointment.date).toLocaleDateString()}.`
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Write Prescription',
      details: `Wrote prescription for patient ID: ${patientId}`
    });

    res.status(210).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update patient medical records & upload report
// @route   POST /api/doctor/medical-records
// @access  Private/Doctor
exports.addMedicalRecord = async (req, res) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    const { patientId, diagnosis, treatment, notes } = req.body;

    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.file) {
      attachments = [`/uploads/${req.file.filename}`];
    }

    const record = await MedicalRecord.create({
      patient: patientId,
      doctor: doctor._id,
      diagnosis,
      treatment,
      notes,
      attachments
    });

    // Notify Patient
    const patient = await Patient.findById(patientId);
    if (patient) {
      // Append details to patient's history summary
      patient.medicalHistory = `${patient.medicalHistory}\n[${new Date().toLocaleDateString()}] Diagnosis: ${diagnosis}. Treatment: ${treatment}.`;
      await patient.save();

      await Notification.create({
        user: patient.user,
        message: `New medical record added to your profile by Dr. ${req.user.name}.`
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Add Medical Record',
      details: `Added record (Diagnosis: ${diagnosis}) for Patient ID: ${patientId}`
    });

    res.status(210).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update doctor profile settings
// @route   PUT /api/doctor/profile
// @access  Private/Doctor
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    const { name, phone, gender, specialization, experience, qualification, fees, biography, slots, days } = req.body;

    // Update User details
    await User.findByIdAndUpdate(req.user._id, { name, phone, gender });

    // Update Doctor details
    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, {
      specialization,
      experience,
      qualification,
      fees,
      biography,
      slots,
      days
    }, { new: true })
      .populate('user', 'name email phone gender')
      .populate('department', 'name');

    res.status(200).json({ success: true, data: updatedDoctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
