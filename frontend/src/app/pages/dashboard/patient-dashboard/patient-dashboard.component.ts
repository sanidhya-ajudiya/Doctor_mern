import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// Material Imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // States
  activeTab = 0;
  appointments: any[] = [];
  medicalRecords: any[] = [];
  prescriptions: any[] = [];
  
  departments: any[] = [];
  allDoctors: any[] = [];
  filteredDoctors: any[] = [];
  availableSlots: string[] = [];

  isLoadingAppointments = true;
  isLoadingRecords = true;
  isLoadingPrescriptions = true;

  // Table Columns
  apptColumns = ['doctor', 'specialty', 'date', 'slot', 'status', 'actions'];

  // Forms
  bookingForm!: FormGroup;
  profileForm!: FormGroup;
  isBooking = false;
  isSavingProfile = false;

  // Date limit helpers
  minDateString = '';

  constructor() {
    // Set minimum date to today's date
    const today = new Date();
    this.minDateString = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadPatientAppointments();
    this.loadPatientMedicalRecords();
    this.loadPatientPrescriptions();
    this.loadDepartments();
    this.loadDoctors();
    this.initForms();
  }

  // --- Initializers ---
  initForms(): void {
    const user = this.authService.currentUserValue;
    const profile = this.authService.currentProfileValue;

    this.bookingForm = this.fb.group({
      departmentId: ['', Validators.required],
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      slot: ['', Validators.required],
      symptoms: ['', Validators.required]
    });

    this.profileForm = this.fb.group({
      name: [user?.name || '', Validators.required],
      phone: [user?.phone || ''],
      gender: [user?.gender || '', Validators.required],
      age: [profile?.age || '', [Validators.required, Validators.min(1)]],
      bloodGroup: [profile?.bloodGroup || '', Validators.required],
      address: [profile?.address || '']
    });
  }

  // --- Load Collections ---
  loadPatientAppointments(): void {
    this.isLoadingAppointments = true;
    this.patientService.getAppointments().subscribe({
      next: (res) => {
        this.isLoadingAppointments = false;
        if (res.success) this.appointments = res.data;
      },
      error: () => this.isLoadingAppointments = false
    });
  }

  loadPatientMedicalRecords(): void {
    this.isLoadingRecords = true;
    this.patientService.getMedicalRecords().subscribe({
      next: (res) => {
        this.isLoadingRecords = false;
        if (res.success) this.medicalRecords = res.data;
      },
      error: () => this.isLoadingRecords = false
    });
  }

  loadPatientPrescriptions(): void {
    this.isLoadingPrescriptions = true;
    this.patientService.getPrescriptions().subscribe({
      next: (res) => {
        this.isLoadingPrescriptions = false;
        if (res.success) this.prescriptions = res.data;
      },
      error: () => this.isLoadingPrescriptions = false
    });
  }

  loadDepartments(): void {
    this.adminService.getDepartments().subscribe({
      next: (res) => {
        if (res.success) this.departments = res.data;
      }
    });
  }

  loadDoctors(): void {
    this.adminService.getDoctors().subscribe({
      next: (res) => {
        if (res.success) this.allDoctors = res.data;
      }
    });
  }

  // --- Cascading Dropdowns & Slot Logic ---
  onDepartmentChange(deptId: string): void {
    // Reset doctor, date and slot controls
    this.bookingForm.patchValue({ doctorId: '', date: '', slot: '' });
    this.availableSlots = [];
    
    // Filter doctor roster
    this.filteredDoctors = this.allDoctors.filter(doc => doc.department?._id === deptId && doc.user?.status === 'active');
  }

  onDoctorChange(docId: string): void {
    // Reset date and slot controls
    this.bookingForm.patchValue({ date: '', slot: '' });
    this.availableSlots = [];
  }

  onDateChange(): void {
    const doctorId = this.bookingForm.get('doctorId')?.value;
    const date = this.bookingForm.get('date')?.value;

    if (!doctorId || !date) {
      this.availableSlots = [];
      return;
    }

    // Fetch doctor configuration
    const doctor = this.allDoctors.find(d => d._id === doctorId);
    if (!doctor) return;

    // Reset slot control
    this.bookingForm.patchValue({ slot: '' });

    // Fetch booked slots from backend
    this.appointmentService.getBookedSlots(doctorId, date).subscribe({
      next: (res) => {
        if (res.success) {
          // Get doctor's standard slot times config and remove booked ones
          const totalSlots = doctor.slots || [];
          const booked = res.bookedSlots || [];
          this.availableSlots = totalSlots.filter((slot: string) => !booked.includes(slot));

          if (this.availableSlots.length === 0) {
            this.snackBar.open('No slots available for this date. Choose another date.', 'Close', { duration: 3000 });
          }
        }
      }
    });
  }

  // --- Booking Appointment ---
  bookAppointment(): void {
    if (this.bookingForm.invalid) return;

    this.isBooking = true;
    this.patientService.bookAppointment(this.bookingForm.value).subscribe({
      next: (res) => {
        this.isBooking = false;
        if (res.success) {
          this.snackBar.open('Appointment booked successfully! Awaiting approval.', 'Close', { duration: 3000 });
          this.bookingForm.reset();
          this.availableSlots = [];
          this.loadPatientAppointments();
          
          // Switch to Appointments list tab
          this.activeTab = 2;
        }
      },
      error: () => {
        this.isBooking = false;
      }
    });
  }

  cancelAppointment(id: string): void {
    if (confirm('Are you sure you want to cancel this appointment request?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Appointment request cancelled', 'Close', { duration: 3000 });
            this.loadPatientAppointments();
          }
        }
      });
    }
  }

  // --- Prescription PDF Download ---
  downloadPrescription(id: string): void {
    this.patientService.downloadPrescription(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Prescription PDF successfully downloaded', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Could not generate prescription PDF. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  // --- Profile Actions ---
  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile = true;
    this.patientService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.isSavingProfile = false;
        if (res.success) {
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
          this.authService.updateLocalProfile(res.data);
          this.authService.updateLocalUser({
            name: res.data.user.name,
            phone: res.data.user.phone,
            gender: res.data.user.gender
          });
        }
      },
      error: () => {
        this.isSavingProfile = false;
      }
    });
  }
}
