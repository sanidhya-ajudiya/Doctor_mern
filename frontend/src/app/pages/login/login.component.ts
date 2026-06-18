import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // If already logged in, redirect straight to dashboard
    if (this.authService.isLoggedIn()) {
      this.redirectDashboard(this.authService.getUserRole());
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.snackBar.open(`Logged in as ${res.user.name}`, 'Close', { duration: 3000 });
          this.redirectDashboard(res.user.role);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  redirectDashboard(role: string | null): void {
    if (role === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else if (role === 'doctor') {
      this.router.navigate(['/dashboard/doctor']);
    } else {
      this.router.navigate(['/dashboard/patient']);
    }
  }

  quickFill(role: string): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@lifeline.com',
        password: 'admin123'
      });
    } else if (role === 'doctor') {
      this.loginForm.patchValue({
        email: 'robert.chen@lifeline.com',
        password: 'doctor123'
      });
    } else if (role === 'patient') {
      this.loginForm.patchValue({
        email: 'john@gmail.com',
        password: 'patient123'
      });
    }
  }
}
