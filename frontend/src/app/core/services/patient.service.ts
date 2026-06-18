import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/patient';

  bookAppointment(appointment: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments`, appointment);
  }

  getAppointments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/appointments`);
  }

  getMedicalRecords(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/medical-records`);
  }

  getPrescriptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/prescriptions`);
  }

  downloadPrescription(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/prescriptions/${id}/download`, {
      responseType: 'blob'
    });
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profile);
  }

  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/notifications`);
  }

  readNotification(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications/${id}`, {});
  }
}
