/** localStorage key holding the admin secret (sent as x-admin-secret on POST /admin/*). Only a
 *  UI gate — the backend check is the real boundary. */
export const ADMIN_SECRET_STORAGE_KEY = 'adminSecret';

export function hasAdminSecret(): boolean {
  try {
    return typeof localStorage !== 'undefined' && !!localStorage.getItem(ADMIN_SECRET_STORAGE_KEY);
  } catch {
    return false;
  }
}
