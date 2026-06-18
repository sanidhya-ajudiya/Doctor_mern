import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err) => {
      // 401 Unauthorized: Logout and redirect to login
      if (err.status === 401) {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        localStorage.removeItem('hms_profile');
        router.navigate(['/login']);
        snackBar.open('Session expired. Please log in again.', 'Close', { duration: 3000 });
      } else {
        // Show server errors to the user in a snackbar
        const errorMsg = err.error?.error || err.message || 'Something went wrong';
        snackBar.open(errorMsg, 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }

      return throwError(() => err);
    })
  );
};
