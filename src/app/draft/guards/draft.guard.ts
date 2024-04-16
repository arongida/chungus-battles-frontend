import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

export const draftGuard: CanActivateFn = (route, state) => {
  const isLocalStorageAvailable = typeof localStorage !== 'undefined';
  if (isLocalStorageAvailable) {
    const reconnectionToken = localStorage.getItem('reconnectToken');
    if (reconnectionToken !== null) return true;
    const router = inject(Router);
    router.navigate(['/']);
  }   
  return false; 
};
