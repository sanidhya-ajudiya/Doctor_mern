const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all appointments (Admin view)
// @route   GET /api/appointments
// @access  Private/Admin
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone gender' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('department', 'name')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update appointment status (Approve / Reject / Complete)
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor or Admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowedStatuses = ['approved', 'rejected', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user' } });

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Role verification
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (appointment.doctor._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to manage this doctor\'s appointments' });
      }
    }

    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }
    await appointment.save();

    // Notify Patient
    if (appointment.patient && appointment.patient.user) {
      await Notification.create({
        user: appointment.patient.user._id,
        message: `Your appointment with Dr. ${appointment.doctor.user.name} on ${new Date(appointment.date).toLocaleDateString()} has been ${status}.`
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Appointment Status',
      details: `Updated appointment ID: ${req.params.id} to status: ${status}`
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Cancel appointment (Patient or Admin)
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user' } });

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Check permissions
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      if (appointment.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to cancel this appointment' });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Notify Doctor
    if (appointment.doctor && appointment.doctor.user) {
      await Notification.create({
        user: appointment.doctor.user._id,
        message: `Appointment for ${appointment.patient.user.name} on ${new Date(appointment.date).toLocaleDateString()} has been cancelled.`
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Cancel Appointment',
      details: `Cancelled appointment ID: ${req.params.id}`
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get booked slots for a doctor on a specific date
// @route   GET /api/appointments/booked-slots
// @access  Private
exports.getBookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, error: 'Please provide doctorId and date' });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: searchDate,
      status: { $in: ['pending', 'approved', 'completed'] }
    }).select('slot');

    const bookedSlots = appointments.map(a => a.slot);

    res.status(200).json({ success: true, bookedSlots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
