import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/appointments';

  getAllAppointments(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  updateStatus(id: string, status: string, notes?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  cancelAppointment(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getBookedSlots(doctorId: string, date: string): Observable<any> {
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('date', date);
    return this.http.get<any>(`${this.apiUrl}/booked-slots`, { params });
  }
}
