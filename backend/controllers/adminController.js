const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard analytics & statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const totalDepartments = await Department.countDocuments();

    // Count pending appointments
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });

    // Calculate revenue (Sum doctor fees for completed appointments)
    const completedAppts = await Appointment.find({ status: 'completed' }).populate('doctor');
    const revenue = completedAppts.reduce((sum, appt) => sum + (appt.doctor?.fees || 0), 0);

    // Activity Logs (limit to last 10)
    const activityLogs = await ActivityLog.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    // Appointment Status distribution for charts
    const statuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    const apptDistribution = [];
    for (const status of statuses) {
      const count = await Appointment.countDocuments({ status });
      apptDistribution.push({ name: status.toUpperCase(), value: count });
    }

    // Patients registered per blood group
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const patientBloodDistribution = [];
    for (const bg of bloodGroups) {
      const count = await Patient.countDocuments({ bloodGroup: bg });
      patientBloodDistribution.push({ name: bg, value: count });
    }

    // Revenue per department
    const departments = await Department.find();
    const departmentStats = [];
    for (const dept of departments) {
      const deptDoctors = await Doctor.find({ department: dept._id });
      const docIds = deptDoctors.map(d => d._id);
      
      const deptApptCount = await Appointment.countDocuments({ doctor: { $in: docIds } });
      const completedDeptAppts = await Appointment.find({ doctor: { $in: docIds }, status: 'completed' }).populate('doctor');
      const deptRevenue = completedDeptAppts.reduce((sum, appt) => sum + (appt.doctor?.fees || 0), 0);

      departmentStats.push({
        department: dept.name,
        appointments: deptApptCount,
        revenue: deptRevenue
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        totalStaff,
        totalDepartments,
        pendingAppointments,
        revenue
      },
      activityLogs,
      charts: {
        apptDistribution,
        patientBloodDistribution,
        departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// DOCTORS CRUD
// ==========================================

// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email phone gender status')
      .populate('department', 'name');
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a doctor
// @route   POST /api/admin/doctors
// @access  Private/Admin
exports.createDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, gender, department, specialization, experience, qualification, fees, biography, slots, days } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // Verify department exists
    const deptExists = await Department.findById(department);
    if (!deptExists) {
      return res.status(400).json({ success: false, error: 'Selected department does not exist' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phone,
      gender,
      status: 'active'
    });

    // Create doctor
    const doctor = await Doctor.create({
      user: user._id,
      department,
      specialization,
      experience,
      qualification,
      fees,
      biography,
      slots,
      days
    });

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Create Doctor',
      details: `Created doctor profile for Dr. ${name}`
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update doctor
// @route   PUT /api/admin/doctors/:id
// @access  Private/Admin
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    const { name, email, phone, gender, status, department, specialization, experience, qualification, fees, biography, slots, days } = req.body;

    // Update base user
    await User.findByIdAndUpdate(doctor.user, {
      name,
      email,
      phone,
      gender,
      status
    }, { new: true, runValidators: true });

    // Update doctor record
    const updatedDoctor = await Doctor.findByIdAndUpdate(req.params.id, {
      department,
      specialization,
      experience,
      qualification,
      fees,
      biography,
      slots,
      days
    }, { new: true, runValidators: true })
      .populate('user', 'name email phone gender status')
      .populate('department', 'name');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Doctor',
      details: `Updated doctor profile for Dr. ${name}`
    });

    res.status(200).json({ success: true, data: updatedDoctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete doctor
// @route   DELETE /api/admin/doctors/:id
// @access  Private/Admin
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Delete base User first
    await User.findByIdAndDelete(doctor.user);
    // Delete Doctor profile
    await Doctor.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Delete Doctor',
      details: `Deleted doctor profile ID: ${req.params.id}`
    });

    res.status(200).json({ success: true, message: 'Doctor successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// PATIENTS CRUD (Admin View)
// ==========================================

// @desc    Get all patients
// @route   GET /api/admin/patients
// @access  Private/Admin
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('user', 'name email phone gender status');
    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update Patient (Admin)
// @route   PUT /api/admin/patients/:id
// @access  Private/Admin
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const { name, email, phone, gender, status, age, bloodGroup, address, medicalHistory } = req.body;

    // Update base user
    await User.findByIdAndUpdate(patient.user, {
      name,
      email,
      phone,
      gender,
      status
    });

    // Update Patient details
    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, {
      age,
      bloodGroup,
      address,
      medicalHistory
    }, { new: true })
      .populate('user', 'name email phone gender status');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Patient',
      details: `Updated patient details for ${name}`
    });

    res.status(200).json({ success: true, data: updatedPatient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete Patient
// @route   DELETE /api/admin/patients/:id
// @access  Private/Admin
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    await User.findByIdAndDelete(patient.user);
    await Patient.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Delete Patient',
      details: `Deleted patient ID: ${req.params.id}`
    });

    res.status(200).json({ success: true, message: 'Patient successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// DEPARTMENTS CRUD
// ==========================================

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private (Allows Patients / Doctors to select departments as well)
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create department
// @route   POST /api/admin/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const deptExists = await Department.findOne({ name });
    if (deptExists) {
      return res.status(400).json({ success: false, error: 'Department already exists' });
    }

    const department = await Department.create({ name, description, status });

    await ActivityLog.create({
      user: req.user._id,
      action: 'Create Department',
      details: `Created department: ${name}`
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Department',
      details: `Updated department: ${department.name}`
    });

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // Check if doctors are assigned
    const docsCount = await Doctor.countDocuments({ department: req.params.id });
    if (docsCount > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete department with assigned doctors' });
    }

    await Department.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'Delete Department',
      details: `Deleted department ID: ${req.params.id}`
    });

    res.status(200).json({ success: true, message: 'Department successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// STAFF CRUD
// ==========================================

// @desc    Get all staff
// @route   GET /api/admin/staff
// @access  Private/Admin
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate('department', 'name');
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create staff member
// @route   POST /api/admin/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, role, department, status } = req.body;

    const emailExists = await Staff.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, error: 'Staff member already exists with this email' });
    }

    const staff = await Staff.create({ name, email, phone, role, department, status });

    await ActivityLog.create({
      user: req.user._id,
      action: 'Create Staff',
      details: `Created staff member: ${name} (${role})`
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update staff member
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('department', 'name');

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Staff',
      details: `Updated staff member: ${staff.name}`
    });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'Delete Staff',
      details: `Deleted staff member ID: ${req.params.id}`
    });

    res.status(200).json({ success: true, message: 'Staff member successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name role email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
