import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  // Protected Dashboards
  {
    path: 'dashboard/admin',
    loadComponent: () => import('./pages/dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'dashboard/doctor',
    loadComponent: () => import('./pages/dashboard/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['doctor'] }
  },
  {
    path: 'dashboard/patient',
    loadComponent: () => import('./pages/dashboard/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['patient'] }
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
