import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const fightGuard: CanActivateFn = (route, state) => {
  const isLocalStorageAvailable = typeof localStorage !== 'undefined';
  if (isLocalStorageAvailable) {
    const reconnectionToken = localStorage.getItem('reconnectToken');
    if (reconnectionToken !== null) return true;
    const router = inject(Router);
    router.navigate(['/']);
  }   
  return false; 
};
