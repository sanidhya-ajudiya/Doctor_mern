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
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { DoctorService } from '../../../core/services/doctor.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-dashboard',
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
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // States
  appointments: any[] = [];
  patients: any[] = [];
  isLoadingAppointments = true;
  isLoadingPatients = true;

  // Sidenav columns
  appointmentColumns = ['patient', 'date', 'slot', 'symptoms', 'status', 'actions'];

  // Treatment Panel
  selectedAppointment: any = null;
  diagnosis = '';
  treatment = '';
  recordNotes = '';
  prescriptionInstructions = '';
  medications: any[] = [];
  selectedFile: File | null = null;
  uploadFileName = '';
  isSavingTreatment = false;

  // Profile Settings
  profileForm!: FormGroup;
  isSavingProfile = false;
  
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  defaultSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  selectedDays: string[] = [];
  selectedSlots: string[] = [];

  ngOnInit(): void {
    this.loadAppointments();
    this.loadAssignedPatients();
    this.initProfileForm();
  }

  // --- Initializers ---
  initProfileForm(): void {
    const profile = this.authService.currentProfileValue;
    const user = this.authService.currentUserValue;

    this.profileForm = this.fb.group({
      name: [user?.name || '', Validators.required],
      phone: [user?.phone || ''],
      gender: [user?.gender || '', Validators.required],
      specialization: [profile?.specialization || '', Validators.required],
      experience: [profile?.experience || 0, [Validators.required, Validators.min(0)]],
      fees: [profile?.fees || 0, [Validators.required, Validators.min(0)]],
      qualification: [profile?.qualification || '', Validators.required],
      biography: [profile?.biography || '']
    });

    if (profile) {
      this.selectedDays = [...profile.days];
      this.selectedSlots = [...profile.slots];
    }
  }

  // --- Load Data ---
  loadAppointments(): void {
    this.isLoadingAppointments = true;
    this.doctorService.getAppointments().subscribe({
      next: (res) => {
        this.isLoadingAppointments = false;
        if (res.success) {
          this.appointments = res.data;
        }
      },
      error: () => this.isLoadingAppointments = false
    });
  }

  loadAssignedPatients(): void {
    this.isLoadingPatients = true;
    this.doctorService.getPatients().subscribe({
      next: (res) => {
        this.isLoadingPatients = false;
        if (res.success) {
          this.patients = res.data;
        }
      },
      error: () => this.isLoadingPatients = false
    });
  }

  // --- Appointment Statuses Management ---
  updateStatus(id: string, status: string): void {
    this.appointmentService.updateStatus(id, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Appointment status updated to ${status}`, 'Close', { duration: 3000 });
          this.loadAppointments();
        }
      }
    });
  }

  cancelAppointment(id: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Appointment cancelled successfully', 'Close', { duration: 3000 });
            this.loadAppointments();
          }
        }
      });
    }
  }

  // --- Treatment Desk Actions ---
  startTreatment(appt: any): void {
    this.selectedAppointment = appt;
    this.diagnosis = '';
    this.treatment = '';
    this.recordNotes = '';
    this.prescriptionInstructions = '';
    this.selectedFile = null;
    this.uploadFileName = '';
    
    // Add default empty row to start building prescription
    this.medications = [{ name: '', dosage: '', frequency: '', duration: '' }];
  }

  closeTreatmentWorkspace(): void {
    this.selectedAppointment = null;
  }

  addMedicationRow(): void {
    this.medications.push({ name: '', dosage: '', frequency: '', duration: '' });
  }

  removeMedicationRow(index: number): void {
    if (this.medications.length > 1) {
      this.medications.splice(index, 1);
    } else {
      this.medications = [{ name: '', dosage: '', frequency: '', duration: '' }];
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadFileName = file.name;
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.uploadFileName = '';
  }

  saveTreatment(): void {
    if (!this.diagnosis || !this.selectedAppointment) return;

    this.isSavingTreatment = true;
    const patientId = this.selectedAppointment.patient?._id;
    const appointmentId = this.selectedAppointment._id;

    // 1. Save Medical Record (with files)
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('diagnosis', this.diagnosis);
    formData.append('treatment', this.treatment);
    formData.append('notes', this.recordNotes);
    if (this.selectedFile) {
      formData.append('attachments', this.selectedFile);
    }

    this.doctorService.addMedicalRecord(formData).subscribe({
      next: (recordRes) => {
        
        // 2. Save Prescription
        // Filter out completely blank rows in medications
        const validMedications = this.medications.filter(med => med.name && med.dosage);
        
        if (validMedications.length > 0) {
          const prescBody = {
            appointmentId: appointmentId,
            patientId: patientId,
            medications: validMedications,
            instructions: this.prescriptionInstructions
          };

          this.doctorService.addPrescription(prescBody).subscribe({
            next: () => this.finalizeTreatmentSave(),
            error: () => this.finalizeTreatmentSave() // Proceed anyway since medical record succeeded
          });
        } else {
          // If no prescription, manually complete appointment status on the backend
          this.appointmentService.updateStatus(appointmentId, 'completed').subscribe({
            next: () => this.finalizeTreatmentSave(),
            error: () => this.finalizeTreatmentSave()
          });
        }
      },
      error: () => {
        this.isSavingTreatment = false;
      }
    });
  }

  finalizeTreatmentSave(): void {
    this.isSavingTreatment = false;
    this.snackBar.open('Treatment recorded successfully. Appointment closed.', 'Close', { duration: 3000 });
    this.selectedAppointment = null;
    this.loadAppointments();
    this.loadAssignedPatients(); // Refresh history summaries
  }

  // --- Profile Settings Actions ---
  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  toggleDay(day: string): void {
    if (this.selectedDays.includes(day)) {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    } else {
      this.selectedDays.push(day);
    }
  }

  isSlotSelected(slot: string): boolean {
    return this.selectedSlots.includes(slot);
  }

  toggleSlot(slot: string): void {
    if (this.selectedSlots.includes(slot)) {
      this.selectedSlots = this.selectedSlots.filter(s => s !== slot);
    } else {
      this.selectedSlots.push(slot);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile = true;
    const body = {
      ...this.profileForm.value,
      days: this.selectedDays,
      slots: this.selectedSlots
    };

    this.doctorService.updateProfile(body).subscribe({
      next: (res) => {
        this.isSavingProfile = false;
        if (res.success) {
          this.snackBar.open('Profile settings updated successfully', 'Close', { duration: 3000 });
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
