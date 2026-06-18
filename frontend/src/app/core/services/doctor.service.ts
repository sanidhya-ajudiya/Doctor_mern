import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/doctor';

  getAppointments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/appointments`);
  }

  getPatients(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/patients`);
  }

  addPrescription(prescription: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/prescriptions`, prescription);
  }

  // Uses FormData since it supports file uploads
  addMedicalRecord(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/medical-records`, formData);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profile);
  }
}
