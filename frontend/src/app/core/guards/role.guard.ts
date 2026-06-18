import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Get active user info
  const userData = localStorage.getItem('hms_user');
  if (!userData) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userData);
  const expectedRoles = route.data['roles'] as Array<string>;

  if (expectedRoles && expectedRoles.includes(user.role)) {
    return true;
  }

  // Unauthorized role: redirect to correct dashboard
  if (user.role === 'admin') {
    router.navigate(['/dashboard/admin']);
  } else if (user.role === 'doctor') {
    router.navigate(['/dashboard/doctor']);
  } else {
    router.navigate(['/dashboard/patient']);
  }

  return false;
};
