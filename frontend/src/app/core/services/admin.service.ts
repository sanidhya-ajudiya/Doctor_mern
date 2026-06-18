import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/admin';

  // Statistics
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-stats`);
  }

  // Doctor CRUD
  getDoctors(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/doctors`);
  }

  createDoctor(doctor: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/doctors`, doctor);
  }

  updateDoctor(id: string, doctor: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/doctors/${id}`, doctor);
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/doctors/${id}`);
  }

  // Patient CRUD
  getPatients(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/patients`);
  }

  updatePatient(id: string, patient: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/patients/${id}`, patient);
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/patients/${id}`);
  }

  // Department CRUD
  getDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/departments`);
  }

  createDepartment(department: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/departments`, department);
  }

  updateDepartment(id: string, department: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/departments/${id}`, department);
  }

  deleteDepartment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/departments/${id}`);
  }

  // Staff CRUD
  getStaff(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/staff`);
  }

  createStaff(staff: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/staff`, staff);
  }

  updateStaff(id: string, staff: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/staff/${id}`, staff);
  }

  deleteStaff(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/staff/${id}`);
  }

  // Activity Logs
  getActivityLogs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/activity-logs`);
  }
}
