import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = 'http://localhost:5000/api/auth';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private currentProfileSubject = new BehaviorSubject<any>(null);
  public currentProfile$ = this.currentProfileSubject.asObservable();

  constructor() {
    const savedUser = localStorage.getItem('hms_user');
    const savedProfile = localStorage.getItem('hms_profile');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
    if (savedProfile) {
      this.currentProfileSubject.next(JSON.parse(savedProfile));
    }
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  public get currentProfileValue(): any {
    return this.currentProfileSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      map(res => {
        if (res.success && res.token) {
          localStorage.setItem('hms_token', res.token);
          localStorage.setItem('hms_user', JSON.stringify(res.user));
          localStorage.setItem('hms_profile', JSON.stringify(res.profile));
          
          this.currentUserSubject.next(res.user);
          this.currentProfileSubject.next(res.profile);
        }
        return res;
      })
    );
  }

  registerPatient(patientData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register-patient`, patientData).pipe(
      map(res => {
        if (res.success && res.token) {
          localStorage.setItem('hms_token', res.token);
          localStorage.setItem('hms_user', JSON.stringify(res.user));
          localStorage.setItem('hms_profile', JSON.stringify(res.profile));
          
          this.currentUserSubject.next(res.user);
          this.currentProfileSubject.next(res.profile);
        }
        return res;
      })
    );
  }

  registerDoctor(doctorData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register-doctor`, doctorData).pipe(
      map(res => {
        if (res.success && res.token) {
          localStorage.setItem('hms_token', res.token);
          localStorage.setItem('hms_user', JSON.stringify(res.user));
          localStorage.setItem('hms_profile', JSON.stringify(res.profile));
          
          this.currentUserSubject.next(res.user);
          this.currentProfileSubject.next(res.profile);
        }
        return res;
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(res => {
        if (res.success) {
          localStorage.setItem('hms_user', JSON.stringify(res.user));
          localStorage.setItem('hms_profile', JSON.stringify(res.profile));
          
          this.currentUserSubject.next(res.user);
          this.currentProfileSubject.next(res.profile);
        }
        return res;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_profile');
    
    this.currentUserSubject.next(null);
    this.currentProfileSubject.next(null);
    
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('hms_token');
  }

  getUserRole(): string | null {
    const user = this.currentUserValue;
    return user ? user.role : null;
  }
  
  updateLocalProfile(profile: any) {
    localStorage.setItem('hms_profile', JSON.stringify(profile));
    this.currentProfileSubject.next(profile);
  }

  updateLocalUser(user: any) {
    const updated = { ...this.currentUserValue, ...user };
    localStorage.setItem('hms_user', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }
}
