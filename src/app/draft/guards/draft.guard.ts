import { CanActivateFn } from '@angular/router';

export const draftGuard: CanActivateFn = (route, state) => {
  const isLocalStorageAvailable = typeof localStorage !== 'undefined';
  if (isLocalStorageAvailable) {
    const reconnectionToken = localStorage.getItem('reconnectToken');
    return reconnectionToken !== null;
  }
  return false;  
};
