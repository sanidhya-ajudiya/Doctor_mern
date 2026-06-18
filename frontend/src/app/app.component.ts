import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

// Angular Material Imports
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { PatientService } from './core/services/patient.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private patientService = inject(PatientService);
  private router = inject(Router);

  isMobile = false;
  unreadNotificationCount = 0;
  notifications: any[] = [];
  private notiInterval: any;
  private routerSubscription!: Subscription;

  constructor() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Poll notifications every 30s when logged in
    this.setupNotificationPolling();
    
    // Subscribe to router events to update page titles / handles sidebar closing
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkScreenSize();
    });
  }

  ngOnDestroy(): void {
    if (this.notiInterval) {
      clearInterval(this.notiInterval);
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 960;
  }

  onNavItemClick(): void {
    if (this.isMobile) {
      // Sidenav is toggled off automatically by standard click behavior or binding if needed
    }
  }

  setupNotificationPolling(): void {
    if (this.authService.isLoggedIn()) {
      this.loadNotifications();
    }

    // Check periodically
    this.notiInterval = setInterval(() => {
      if (this.authService.isLoggedIn()) {
        this.loadNotifications();
      }
    }, 30000);
  }

  loadNotifications(): void {
    this.patientService.getNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications = res.data;
          this.unreadNotificationCount = this.notifications.filter(n => !n.isRead).length;
        }
      },
      error: () => {}
    });
  }

  markAsRead(id: string): void {
    this.patientService.readNotification(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadNotifications();
        }
      }
    });
  }

  getToolbarTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard/admin')) return 'Administrative Control Panel';
    if (url.includes('/dashboard/doctor')) return 'Doctor Treatment Panel';
    if (url.includes('/dashboard/patient')) return 'Patient Care Portal';
    if (url.includes('/contact')) return 'HMS Helpline Desk';
    return 'Lifeline General Hospital';
  }

  logout(): void {
    if (this.notiInterval) {
      clearInterval(this.notiInterval);
    }
    this.authService.logout();
  }
}
