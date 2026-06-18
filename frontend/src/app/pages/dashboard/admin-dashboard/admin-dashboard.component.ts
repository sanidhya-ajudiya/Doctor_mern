import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // Stats & Charts
  stats: any = null;
  activityLogs: any[] = [];
  charts: any = null;
  isLoadingStats = true;

  // Active collections
  doctors: any[] = [];
  patients: any[] = [];
  staffList: any[] = [];
  departments: any[] = [];

  // Table Columns
  doctorColumns = ['name', 'email', 'department', 'specialization', 'status', 'actions'];
  patientColumns = ['name', 'email', 'age', 'bloodGroup', 'status', 'actions'];
  staffColumns = ['name', 'email', 'role', 'department', 'status', 'actions'];
  deptColumns = ['name', 'description', 'status', 'actions'];

  // Loader toggles
  isLoadingDoctors = false;
  isLoadingPatients = false;
  isLoadingStaff = false;
  isLoadingDepts = false;

  // Form toggles
  showDoctorForm = false;
  isEditingDoctor = false;
  selectedDoctorId: string | null = null;
  doctorForm!: FormGroup;

  showPatientForm = false;
  selectedPatientId: string | null = null;
  patientForm!: FormGroup;

  showStaffForm = false;
  isEditingStaff = false;
  selectedStaffId: string | null = null;
  staffForm!: FormGroup;

  showDeptForm = false;
  isEditingDept = false;
  selectedDeptId: string | null = null;
  deptForm!: FormGroup;

  ngOnInit(): void {
    this.loadOverviewStats();
    this.loadDoctors();
    this.loadPatients();
    this.loadStaff();
    this.loadDepartments();
    this.initForms();
  }

  // --- Initializers ---
  initForms(): void {
    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Only required on create
      phone: [''],
      gender: ['', Validators.required],
      department: ['', Validators.required],
      specialization: ['', Validators.required],
      experience: [0, [Validators.required, Validators.min(0)]],
      fees: [0, [Validators.required, Validators.min(0)]],
      qualification: ['', Validators.required],
      biography: [''],
      status: ['active']
    });

    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      gender: ['', Validators.required],
      age: [0, [Validators.required, Validators.min(1)]],
      bloodGroup: ['', Validators.required],
      status: ['active'],
      address: [''],
      medicalHistory: ['']
    });

    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['', Validators.required],
      department: ['', Validators.required],
      status: ['active']
    });

    this.deptForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['active']
    });
  }

  // --- Analytics Helper Functions ---
  loadOverviewStats(): void {
    this.isLoadingStats = true;
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.isLoadingStats = false;
        if (res.success) {
          this.stats = res.stats;
          this.activityLogs = res.activityLogs;
          this.charts = res.charts;
        }
      },
      error: () => {
        this.isLoadingStats = false;
      }
    });
  }

  getMaxApptPercent(value: number): number {
    if (!this.charts?.apptDistribution) return 0;
    const maxVal = Math.max(...this.charts.apptDistribution.map((item: any) => item.value), 1);
    return (value / maxVal) * 100;
  }

  getMaxRevenuePercent(value: number): number {
    if (!this.charts?.departmentStats) return 0;
    const maxVal = Math.max(...this.charts.departmentStats.map((item: any) => item.revenue), 1);
    return (value / maxVal) * 100;
  }

  // ==========================================
  // DOCTORS CRUD OPERATIONS
  // ==========================================
  loadDoctors(): void {
    this.isLoadingDoctors = true;
    this.adminService.getDoctors().subscribe({
      next: (res) => {
        this.isLoadingDoctors = false;
        if (res.success) this.doctors = res.data;
      },
      error: () => this.isLoadingDoctors = false
    });
  }

  openAddDoctor(): void {
    this.isEditingDoctor = false;
    this.selectedDoctorId = null;
    this.doctorForm.reset({ status: 'active', experience: 0, fees: 0 });
    this.doctorForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.doctorForm.get('password')?.updateValueAndValidity();
    this.showDoctorForm = true;
  }

  editDoctor(doc: any): void {
    this.isEditingDoctor = true;
    this.selectedDoctorId = doc._id;
    this.doctorForm.patchValue({
      name: doc.user?.name,
      email: doc.user?.email,
      phone: doc.user?.phone,
      gender: doc.user?.gender,
      department: doc.department?._id,
      specialization: doc.specialization,
      experience: doc.experience,
      fees: doc.fees,
      qualification: doc.qualification,
      biography: doc.biography,
      status: doc.user?.status
    });
    this.doctorForm.get('password')?.clearValidators();
    this.doctorForm.get('password')?.updateValueAndValidity();
    this.showDoctorForm = true;
  }

  saveDoctor(): void {
    if (this.doctorForm.invalid) return;

    const body = this.doctorForm.value;
    if (this.isEditingDoctor && this.selectedDoctorId) {
      this.adminService.updateDoctor(this.selectedDoctorId, body).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Doctor profile updated', 'Close', { duration: 3000 });
            this.loadDoctors();
            this.loadOverviewStats();
            this.cancelDoctorForm();
          }
        }
      });
    } else {
      this.adminService.createDoctor(body).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Doctor successfully added', 'Close', { duration: 3000 });
            this.loadDoctors();
            this.loadOverviewStats();
            this.cancelDoctorForm();
          }
        }
      });
    }
  }

  deleteDoctor(id: string): void {
    if (confirm('Are you sure you want to delete this doctor? This will permanently remove their user credentials and profile.')) {
      this.adminService.deleteDoctor(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Doctor successfully deleted', 'Close', { duration: 3000 });
            this.loadDoctors();
            this.loadOverviewStats();
          }
        }
      });
    }
  }

  cancelDoctorForm(): void {
    this.showDoctorForm = false;
    this.isEditingDoctor = false;
    this.selectedDoctorId = null;
  }

  // ==========================================
  // PATIENTS CRUD OPERATIONS
  // ==========================================
  loadPatients(): void {
    this.isLoadingPatients = true;
    this.adminService.getPatients().subscribe({
      next: (res) => {
        this.isLoadingPatients = false;
        if (res.success) this.patients = res.data;
      },
      error: () => this.isLoadingPatients = false
    });
  }

  editPatient(patient: any): void {
    this.selectedPatientId = patient._id;
    this.patientForm.patchValue({
      name: patient.user?.name,
      phone: patient.user?.phone,
      gender: patient.user?.gender,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
      status: patient.user?.status,
      address: patient.address,
      medicalHistory: patient.medicalHistory
    });
    this.showPatientForm = true;
  }

  savePatient(): void {
    if (this.patientForm.invalid || !this.selectedPatientId) return;

    this.adminService.updatePatient(this.selectedPatientId, this.patientForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Patient record updated', 'Close', { duration: 3000 });
          this.loadPatients();
          this.loadOverviewStats();
          this.cancelPatientForm();
        }
      }
    });
  }

  deletePatient(id: string): void {
    if (confirm('Are you sure you want to delete this patient profile?')) {
      this.adminService.deletePatient(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Patient successfully removed', 'Close', { duration: 3000 });
            this.loadPatients();
            this.loadOverviewStats();
          }
        }
      });
    }
  }

  cancelPatientForm(): void {
    this.showPatientForm = false;
    this.selectedPatientId = null;
  }

  // ==========================================
  // STAFF CRUD OPERATIONS
  // ==========================================
  loadStaff(): void {
    this.isLoadingStaff = true;
    this.adminService.getStaff().subscribe({
      next: (res) => {
        this.isLoadingStaff = false;
        if (res.success) this.staffList = res.data;
      },
      error: () => this.isLoadingStaff = false
    });
  }

  openAddStaff(): void {
    this.isEditingStaff = false;
    this.selectedStaffId = null;
    this.staffForm.reset({ status: 'active' });
    this.showStaffForm = true;
  }

  editStaff(staff: any): void {
    this.isEditingStaff = true;
    this.selectedStaffId = staff._id;
    this.staffForm.patchValue({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      department: staff.department?._id,
      status: staff.status
    });
    this.showStaffForm = true;
  }

  saveStaff(): void {
    if (this.staffForm.invalid) return;

    const body = this.staffForm.value;
    if (this.isEditingStaff && this.selectedStaffId) {
      this.adminService.updateStaff(this.selectedStaffId, body).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Staff member profile updated', 'Close', { duration: 3000 });
            this.loadStaff();
            this.loadOverviewStats();
            this.cancelStaffForm();
          }
        }
      });
    } else {
      this.adminService.createStaff(body).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Staff member registered successfully', 'Close', { duration: 3000 });
            this.loadStaff();
            this.loadOverviewStats();
            this.cancelStaffForm();
          }
        }
      });
    }
  }

  deleteStaff(id: string): void {
    if (confirm('Delete this staff member record?')) {
      this.adminService.deleteStaff(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Staff record deleted', 'Close', { duration: 3000 });
            this.loadStaff();
            this.loadOverviewStats();
          }
        }
      });
    }
  }

  cancelStaffForm(): void {
    this.showStaffForm = false;
    this.isEditingStaff = false;
    this.selectedStaffId = null;
  }

  // ==========================================
  // DEPARTMENTS CRUD OPERATIONS
  // ==========================================
  loadDepartments(): void {
    this.isLoadingDepts = true;
    this.adminService.getDepartments().subscribe({
      next: (res) => {
        this.isLoadingDepts = false;
        if (res.success) this.departments = res.data;
      },
      error: () => this.isLoadingDepts = false
    });
  }

  openAddDept(): void {
    this.isEditingDept = false;
    this.selectedDeptId = null;
    this.deptForm.reset({ status: 'active' });
    this.showDeptForm = true;
  }

  editDept(dept: any): void {
    this.isEditingDept = true;
    this.selectedDeptId = dept._id;
    this.deptForm.patchValue({
      name: dept.name,
      description: dept.description,
      status: dept.status
    });
    this.showDeptForm = true;
  }

  saveDept(): void {
    if (this.deptForm.invalid) return;

    const body = this.deptForm.value;
    if (this.isEditingDept && this.selectedDeptId) {
      this.adminService.updateDepartment(this.selectedDeptId, body).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Department details updated', 'Close', { duration: 3000 });
            this.loadDepartments();
            this.loadOverviewStats();
            this.cancelDeptForm();
          }
        }
      });
    } else {
      this.adminService.createDepartment(body).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Department created successfully', 'Close', { duration: 3000 });
            this.loadDepartments();
            this.loadOverviewStats();
            this.cancelDeptForm();
          }
        }
      });
    }
  }

  deleteDept(id: string): void {
    if (confirm('Are you sure you want to delete this department?')) {
      this.adminService.deleteDepartment(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Department successfully deleted', 'Close', { duration: 3000 });
            this.loadDepartments();
            this.loadOverviewStats();
          }
        }
      });
    }
  }

  cancelDeptForm(): void {
    this.showDeptForm = false;
    this.isEditingDept = false;
    this.selectedDeptId = null;
  }
}
