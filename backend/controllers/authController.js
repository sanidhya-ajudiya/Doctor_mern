const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hms_secret_token_key_for_development_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register a Patient
// @route   POST /api/auth/register-patient
// @access  Public
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, gender, age, bloodGroup, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // Create base user
    const user = await User.create({
      name,
      email,
      password,
      role: 'patient',
      phone,
      gender,
      status: 'active'
    });

    // Create patient document
    const patient = await Patient.create({
      user: user._id,
      age,
      bloodGroup,
      address
    });

    const token = generateToken(user._id);

    res.status(210).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        status: user.status
      },
      profile: patient
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Register a Doctor
// @route   POST /api/auth/register-doctor
// @access  Public (or Admin protected, let's keep it public so doctors can sign up, and admin approves/manages them)
exports.registerDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, gender, departmentName, specialization, experience, qualification, fees, biography } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // Find or create department
    let dept = await Department.findOne({ name: departmentName });
    if (!dept) {
      dept = await Department.create({ name: departmentName, description: `${departmentName} Department` });
    }

    // Create base user
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phone,
      gender,
      status: 'active'
    });

    // Create doctor document
    const doctor = await Doctor.create({
      user: user._id,
      department: dept._id,
      specialization,
      experience,
      qualification,
      fees,
      biography
    });

    const token = generateToken(user._id);

    res.status(210).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        status: user.status
      },
      profile: doctor
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    User Login (Unified)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check status
    if (user.status === 'inactive') {
      return res.status(401).json({ success: false, error: 'Your account has been deactivated. Please contact support.' });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Get specific profile details based on role
    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id }).populate('department');
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        status: user.status
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id }).populate('department');
    }

    res.status(200).json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
