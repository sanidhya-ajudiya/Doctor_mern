const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getPatients,
  updatePatient,
  deletePatient,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getActivityLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all admin routes
router.use(protect);

// Dashboard stats
router.get('/dashboard-stats', authorize('admin'), getDashboardStats);

// Doctors Management
router.route('/doctors')
  .get(authorize('admin'), getDoctors)
  .post(authorize('admin'), createDoctor);

router.route('/doctors/:id')
  .put(authorize('admin'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

// Patients Management
router.route('/patients')
  .get(authorize('admin'), getPatients);

router.route('/patients/:id')
  .put(authorize('admin'), updatePatient)
  .delete(authorize('admin'), deletePatient);

// Departments Management (Allow any authenticated user to view list)
router.route('/departments')
  .get(getDepartments)
  .post(authorize('admin'), createDepartment);

router.route('/departments/:id')
  .put(authorize('admin'), updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

// Staff Management
router.route('/staff')
  .get(authorize('admin'), getStaff)
  .post(authorize('admin'), createStaff);

router.route('/staff/:id')
  .put(authorize('admin'), updateStaff)
  .delete(authorize('admin'), deleteStaff);

// Activity Logs
router.get('/activity-logs', authorize('admin'), getActivityLogs);

module.exports = router;
