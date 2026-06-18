require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Connect to DB
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hms';

const seedData = async () => {
  try {
    console.log(`Connecting to database at ${dbURI}...`);
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB. Purging database...');

    // Clear existing data
    await User.deleteMany();
    await Doctor.deleteMany();
    await Patient.deleteMany();
    await Staff.deleteMany();
    await Department.deleteMany();
    await Appointment.deleteMany();
    await Prescription.deleteMany();
    await MedicalRecord.deleteMany();
    await Notification.deleteMany();
    await ActivityLog.deleteMany();

    console.log('Database purged. Seeding departments...');

    // 1. Create Departments
    const depts = [
      { name: 'Cardiology', description: 'Deals with disorders of the heart and cardiovascular system.' },
      { name: 'Pediatrics', description: 'Medical care of infants, children, and adolescents.' },
      { name: 'Neurology', description: 'Deals with disorders of the nervous system and brain.' },
      { name: 'Orthopedics', description: 'Focuses on muscles, joints, ligaments, and bones.' },
      { name: 'General Medicine', description: 'Primary healthcare and internal medicine services.' }
    ];
    const createdDepts = await Department.create(depts);
    console.log(`Seeded ${createdDepts.length} departments.`);

    // 2. Create Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@lifeline.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 555-0100',
      gender: 'Male',
      status: 'active'
    });
    console.log('Seeded Admin account (admin@lifeline.com / admin123).');

    // 3. Create Doctors
    const doctorUsersData = [
      {
        name: 'Dr. Robert Chen',
        email: 'robert.chen@lifeline.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1 555-0201',
        gender: 'Male',
        status: 'active'
      },
      {
        name: 'Dr. Sarah Jenkins',
        email: 'sarah.jenkins@lifeline.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1 555-0202',
        gender: 'Female',
        status: 'active'
      },
      {
        name: 'Dr. Alok Mehta',
        email: 'alok.mehta@lifeline.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1 555-0203',
        gender: 'Male',
        status: 'active'
      },
      {
        name: 'Dr. Lisa Kudrow',
        email: 'lisa.kudrow@lifeline.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1 555-0204',
        gender: 'Female',
        status: 'active'
      }
    ];

    const createdDoctorUsers = [];
    for (const dUser of doctorUsersData) {
      const u = await User.create(dUser);
      createdDoctorUsers.push(u);
    }

    const doctorsData = [
      {
        user: createdDoctorUsers[0]._id,
        department: createdDepts[0]._id, // Cardiology
        specialization: 'Interventional Cardiology',
        experience: 12,
        qualification: 'MD, FACC, Board Certified Cardiologist',
        fees: 150,
        biography: 'Dr. Robert Chen is a leading expert in minimally invasive coronary procedures and cardiovascular wellness.',
        slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
        days: ['Monday', 'Wednesday', 'Friday']
      },
      {
        user: createdDoctorUsers[1]._id,
        department: createdDepts[1]._id, // Pediatrics
        specialization: 'Pediatric Care & Neonatology',
        experience: 8,
        qualification: 'MD, FAAP',
        fees: 100,
        biography: 'Dr. Sarah Jenkins loves working with children and focuses on developmental checkups and childhood asthma treatment.',
        slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
        days: ['Tuesday', 'Wednesday', 'Thursday']
      },
      {
        user: createdDoctorUsers[2]._id,
        department: createdDepts[2]._id, // Neurology
        specialization: 'Clinical Neurology & Epilepsy',
        experience: 15,
        qualification: 'MD, PhD in Neurosciences',
        fees: 200,
        biography: 'Dr. Alok Mehta specializes in electroencephalography (EEG), epilepsy treatment, and cognitive neurological health.',
        slots: ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
        days: ['Monday', 'Tuesday', 'Thursday']
      },
      {
        user: createdDoctorUsers[3]._id,
        department: createdDepts[4]._id, // General Medicine
        specialization: 'Internal Medicine Practitioner',
        experience: 10,
        qualification: 'MD in General Medicine',
        fees: 80,
        biography: 'Dr. Lisa Kudrow has a holistic approach to adult diagnostics, diabetes management, and annual screenings.',
        slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    ];

    const createdDoctors = await Doctor.create(doctorsData);
    console.log(`Seeded ${createdDoctors.length} Doctors.`);

    // 4. Create Patients
    const patientUsersData = [
      {
        name: 'John Doe',
        email: 'john@gmail.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1 555-0301',
        gender: 'Male',
        status: 'active'
      },
      {
        name: 'Sarah Smith',
        email: 'sarah@gmail.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1 555-0302',
        gender: 'Female',
        status: 'active'
      },
      {
        name: 'Emily Watson',
        email: 'emily@gmail.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1 555-0303',
        gender: 'Female',
        status: 'active'
      }
    ];

    const createdPatientUsers = [];
    for (const pUser of patientUsersData) {
      const u = await User.create(pUser);
      createdPatientUsers.push(u);
    }

    const patientsData = [
      {
        user: createdPatientUsers[0]._id,
        age: 35,
        bloodGroup: 'A+',
        address: '456 Elm St, Metro City',
        medicalHistory: 'Mild high blood pressure diagnosed in 2024.'
      },
      {
        user: createdPatientUsers[1]._id,
        age: 28,
        bloodGroup: 'O+',
        address: '789 Oak Ave, Greenfield',
        medicalHistory: 'Allergic to Penicillin. Seasonal hay fever.'
      },
      {
        user: createdPatientUsers[2]._id,
        age: 42,
        bloodGroup: 'B-',
        address: '101 Pine Blvd, North Town',
        medicalHistory: 'History of migraines.'
      }
    ];

    const createdPatients = await Patient.create(patientsData);
    console.log(`Seeded ${createdPatients.length} Patients (e.g. john@gmail.com / patient123).`);

    // 5. Create Staff
    const staffData = [
      {
        name: 'Nurse Jessica Miller',
        email: 'jessica.m@lifeline.com',
        phone: '+1 555-0401',
        role: 'Nurse',
        department: createdDepts[4]._id, // General Medicine
        status: 'active'
      },
      {
        name: 'Receptionist David Vance',
        email: 'david.v@lifeline.com',
        phone: '+1 555-0402',
        role: 'Receptionist',
        department: createdDepts[4]._id,
        status: 'active'
      },
      {
        name: 'Lab Analyst Mark Rayson',
        email: 'mark.r@lifeline.com',
        phone: '+1 555-0403',
        role: 'Lab Technician',
        department: createdDepts[2]._id, // Neurology
        status: 'active'
      }
    ];
    const createdStaff = await Staff.create(staffData);
    console.log(`Seeded ${createdStaff.length} hospital staff members.`);

    // 6. Create Appointments
    // Setup date targets: yesterday, today, tomorrow
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const appts = [
      // Yesterday (Completed)
      {
        patient: createdPatients[0]._id, // John Doe
        doctor: createdDoctors[3]._id, // Dr. Lisa Kudrow (Gen Med)
        department: createdDepts[4]._id,
        date: yesterday,
        slot: '09:00 AM',
        status: 'completed',
        symptoms: 'Mild fever and sore throat for 3 days.',
        notes: 'Seasonal viral flu. Recommended rest and hydration.'
      },
      // Yesterday (Completed)
      {
        patient: createdPatients[1]._id, // Sarah Smith
        doctor: createdDoctors[0]._id, // Dr. Robert Chen (Cardio)
        department: createdDepts[0]._id,
        date: yesterday,
        slot: '10:00 AM',
        status: 'completed',
        symptoms: 'Palpitations after heavy workouts.',
        notes: 'Performed basic ECG. No major abnormalities. Advised to reduce caffeine intake.'
      },
      // Today (Approved)
      {
        patient: createdPatients[2]._id, // Emily Watson
        doctor: createdDoctors[2]._id, // Dr. Alok Mehta (Neuro)
        department: createdDepts[2]._id,
        date: today,
        slot: '02:00 PM',
        status: 'approved',
        symptoms: 'Recurring severe migraine headache on left side.',
        notes: ''
      },
      // Tomorrow (Pending)
      {
        patient: createdPatients[0]._id, // John Doe
        doctor: createdDoctors[1]._id, // Dr. Sarah Jenkins (Pediatrics)
        department: createdDepts[1]._id,
        date: tomorrow,
        slot: '10:00 AM',
        status: 'pending',
        symptoms: 'Booking general checkup slot for son Arthur, age 4, who has a dry cough.',
        notes: ''
      }
    ];

    const createdAppts = await Appointment.create(appts);
    console.log(`Seeded ${createdAppts.length} Appointments.`);

    // 7. Seed Prescriptions (for completed appointments)
    const prescData = [
      {
        appointment: createdAppts[0]._id,
        doctor: createdDoctors[3]._id,
        patient: createdPatients[0]._id,
        medications: [
          { name: 'Paracetamol', dosage: '500mg', frequency: 'Three times a day', duration: '3 days' },
          { name: 'Amoxicillin', dosage: '250mg', frequency: 'Twice a day', duration: '5 days' }
        ],
        instructions: 'Take paracetamol after meals. Finish complete dose of amoxicillin even if symptoms improve.'
      },
      {
        appointment: createdAppts[1]._id,
        doctor: createdDoctors[0]._id,
        patient: createdPatients[1]._id,
        medications: [
          { name: 'Propranolol', dosage: '10mg', frequency: 'Once a day (Morning)', duration: '14 days' }
        ],
        instructions: 'Take in the morning. Stop immediately if blood pressure drops below 90/60.'
      }
    ];
    const createdPrescriptions = await Prescription.create(prescData);
    console.log(`Seeded ${createdPrescriptions.length} Prescriptions.`);

    // 8. Seed Medical Records (for completed appointments)
    const recordsData = [
      {
        patient: createdPatients[0]._id,
        doctor: createdDoctors[3]._id,
        diagnosis: 'Acute Viral Pharyngitis',
        treatment: 'Supportive therapy & antibiotics coverage',
        notes: 'Inflamed throat walls. Lymph nodes slightly swollen. Lungs clear.',
        attachments: []
      },
      {
        patient: createdPatients[1]._id,
        doctor: createdDoctors[0]._id,
        diagnosis: 'Exercise-Induced Sinus Tachycardia',
        treatment: 'Low-dose beta blockers & stress monitoring',
        notes: 'Resting pulse rate 78. Pulse rose to 125 after light treadmill. ECG shows regular rhythm.',
        attachments: []
      }
    ];
    await MedicalRecord.create(recordsData);
    console.log('Seeded Medical Records.');

    // 9. Notifications
    const notifications = [
      {
        user: createdPatientUsers[0]._id,
        message: 'Welcome to Lifeline Hospital Management System! You can view and manage your profile here.'
      },
      {
        user: createdPatientUsers[0]._id,
        message: 'A new prescription has been published by Dr. Lisa Kudrow. Click to review.'
      },
      {
        user: createdDoctorUsers[2]._id,
        message: 'Appointment booking request received from patient Emily Watson.'
      }
    ];
    await Notification.create(notifications);

    // 10. Activity Logs
    const logs = [
      {
        user: adminUser._id,
        action: 'System Seed',
        details: 'Initial database seeding successfully completed.'
      }
    ];
    await ActivityLog.create(logs);

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error.message);
    process.exit(1);
  }
};

seedData();
